import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateTextWithFallback as generateText } from "@/integrations/openrouter/openrouter.server";
import { recordAIInvocationServer } from "@/lib/ai-admin.functions";
import { z } from "zod";

type Mode = "description" | "plan";

export type TourAIInput = {
  mode: Mode;
  title: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  description?: string;
};

const ActivityItemSchema = z.union([
  z.object({
    time: z.string().optional().default("09:00"),
    title: z.string().optional().default("Day Activity"),
  }),
  z.string().transform((str) => ({ time: "09:00", title: str })),
]);

const DayItemSchema = z.object({
  day: z.union([z.number(), z.string()]).optional().transform((v) => Number(v) || 1),
  title: z.string().optional().default("Day Exploration"),
  detail: z.string().optional().default(""),
  activities: z.array(ActivityItemSchema).optional().default([]),
});

const PlanSchema = z.object({
  description: z.string().optional().default(""),
  itinerary: z.array(DayItemSchema).optional().default([]),
});

export const generateTourAIServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: TourAIInput) => data)
  .handler(async ({ data, context }) => {
    // Tier gate + monthly quota enforcement.
    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    const tier = ((profile as { subscription_tier?: string } | null)?.subscription_tier ?? "free") as
      | "free"
      | "starter"
      | "pro"
      | "agency";

    const AI_LIMITS: Record<typeof tier, Record<Mode, number | null>> = {
      free: { description: 0, plan: 0 },
      starter: { description: 10, plan: 0 },
      pro: { description: null, plan: 50 },
      agency: { description: null, plan: null },
    };
    const limit = AI_LIMITS[tier][data.mode];

    if (limit === 0) {
      const feature = data.mode === "plan" ? "AI full-trip plans" : "AI descriptions";
      throw new Error(`${feature} are not included on the ${tier} plan. Upgrade to unlock this feature.`);
    }

    if (limit !== null) {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const { count, error: cErr } = await context.supabase
        .from("ai_usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("kind", data.mode)
        .gte("created_at", monthStart.toISOString());
      if (cErr) throw new Error(cErr.message);
      if ((count ?? 0) >= limit) {
        const feature = data.mode === "plan" ? "AI full-trip plans" : "AI descriptions";
        throw new Error(
          `Monthly limit reached (${limit} ${feature} on the ${tier} plan). Upgrade or wait until next month.`,
        );
      }
    }

    let activeModel = "qwen-turbo";
    let customApiKey: string | undefined = undefined;

    try {
      const { data: aiSetting } = await context.supabase
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "openrouter_config")
        .maybeSingle();

      if (aiSetting?.config) {
        const parsed = typeof aiSetting.config === "string" ? JSON.parse(aiSetting.config) : (aiSetting.config as any);
        if (parsed.active_model) activeModel = String(parsed.active_model);
        if (parsed.custom_api_key) customApiKey = String(parsed.custom_api_key).trim();
      }
    } catch {}

    const { openRouterModel } = await import("@/integrations/openrouter/openrouter.server");
    const model = openRouterModel(activeModel, customApiKey);

    const titleText = (data.title || "").trim();
    // If destination_country was defaulted or title mentions distinct countries, guide the AI explicitly
    const ctxLine = [
      `Tour Title: ${titleText || "(untitled)"}`,
      `Selected Destination Country/Region: ${data.destination_country || "(Not specified)"}`,
      `Departure city: ${data.departure_city || "Karachi"} (Pakistan)`,
      `Duration: ${data.duration_days} days`,
      `Price per person: PKR ${Number(data.price_pkr).toLocaleString("en-PK")}`,
      data.description ? `Existing description: ${data.description}` : "",
      "\nIMPORTANT INSTRUCTION ON DESTINATION:",
      titleText
        ? `Always strictly prioritize and match the destination countries/cities mentioned in the Tour Title ("${titleText}") over any generic prefilled destination.`
        : `Base the itinerary and sights strictly on "${data.destination_country}".`,
    ]
      .filter(Boolean)
      .join("\n");

    const startTime = Date.now();

    if (data.mode === "description") {
      const { text } = await generateText({
        model,
        prompt: `You write short marketing descriptions for international tour packages sold to Pakistani travelers by a Lahore-based agency (GlobeTrek PK). Prices are in PKR.

Write ONE punchy paragraph (~55-75 words, plain text, no markdown, no headings, no emojis) that highlights what makes this trip special — top sights, vibe, and a hook.
Do not repeat the price or duration verbatim; sell the experience.
Make sure the description strictly matches the countries/places named in the Tour Title.

Tour context:
${ctxLine}`,
      });

      try {
        await recordAIInvocationServer({
          created_at: new Date().toISOString(),
          feature: "Tour AI Generator",
          model: activeModel,
          prompt_tokens: 350,
          completion_tokens: 90,
          total_tokens: 440,
          estimated_cost_usd: 0,
          latency_ms: Date.now() - startTime,
          status: "success",
        });
      } catch {}

      await context.supabase.from("ai_usage_events").insert({ user_id: context.userId, kind: "description" });
      return { description: text.trim() };
    }

    // mode === "plan"
    try {
      const { text } = await generateText({
        model,
        prompt: `You are a senior tour planner for GlobeTrek PK, a Pakistani travel marketplace selling international packages priced in PKR.

Design a realistic day-by-day itinerary for the tour below. Return exactly ${data.duration_days} days (day numbering 1..${data.duration_days}).
Strictly prioritize and feature the countries/places named in the Tour Title ("${titleText || data.destination_country}").
${(data.destination_country.toLowerCase().includes("europe") || titleText.toLowerCase().includes("europe")) ? "\n- Since the destination is Europe, design a multi-country tour! Do not limit the itinerary to a single country. Include transition details between popular European countries (e.g. France, Switzerland, Italy, Germany) and show border crossings/trains.\n" : ""}
You MUST return your response as a valid, parsable JSON object matching this structure:
{
  "description": "one crisp marketing paragraph (~60 words, plain text, no markdown)",
  "itinerary": [
    {
      "day": 1,
      "title": "short evocative title (e.g. 'Arrival & Hotel Check-in')",
      "detail": "1-2 sentences summarising the day (transfers, meals, main sights)",
      "activities": [
        { "time": "09:00", "title": "Airport pickup & transfer to hotel" }
      ]
    }
  ]
}

Day 1 must begin with departure from ${data.departure_city} and arrival at the destination airport. The final day must include the return flight home to ${data.departure_city}.

Tour context:
${ctxLine}`,
      });

      let cleaned = text.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      let parsed: any = {};
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          const sanitized = jsonMatch[0].replace(/[\u0000-\u001F]+/g, " ");
          parsed = JSON.parse(sanitized);
        }
      } else {
        parsed = JSON.parse(cleaned);
      }

      const output = PlanSchema.parse(parsed);

      const days = Math.max(1, Math.min(60, Number(data.duration_days) || 1));
      const rawItinerary = output.itinerary && output.itinerary.length > 0 ? output.itinerary : [];

      const itinerary = rawItinerary.slice(0, days).map((d: any, i: number) => {
        const actList = (d.activities ?? []).slice(0, 8).map((a: any) => ({
          time: String(a.time ?? "09:00").slice(0, 8),
          title: String(a.title ?? "Activity").slice(0, 160),
        }));

        const dayNum = i + 1;
        let dayTitle = String(d.title ?? "").trim();
        if (!dayTitle || dayTitle === "Day Exploration") {
          dayTitle = actList[0]?.title ? `Day ${dayNum}: ${actList[0].title}` : `Day ${dayNum} in ${data.destination_country}`;
        }

        let dayDetail = String(d.detail ?? "").trim();
        if (!dayDetail && actList.length > 0) {
          dayDetail = actList.map((a: any) => a.title).join(". ") + ".";
        }

        return {
          day: dayNum,
          title: dayTitle.slice(0, 160),
          detail: dayDetail.slice(0, 800),
          activities: actList,
        };
      });

      while (itinerary.length < days) {
        const nextDay = itinerary.length + 1;
        itinerary.push({
          day: nextDay,
          title: nextDay === days ? `Day ${nextDay}: Return Flight to ${data.departure_city}` : `Day ${nextDay}: Sightseeing & Leisure in ${data.destination_country}`,
          detail: nextDay === days ? `Pack bags, check out from hotel, and transfer to airport for scheduled flight back to ${data.departure_city}.` : `Full day for city tours, shopping, and experiencing local attractions in ${data.destination_country}.`,
          activities: [
            { time: "10:00", title: nextDay === days ? "Hotel check-out & airport transfer" : "City tour & local sights" },
          ],
        });
      }

      try {
        await recordAIInvocationServer({
          created_at: new Date().toISOString(),
          feature: "Tour AI Generator",
          model: activeModel,
          prompt_tokens: 650,
          completion_tokens: 450,
          total_tokens: 1100,
          estimated_cost_usd: 0,
          latency_ms: Date.now() - startTime,
          status: "success",
        });
      } catch {}

      await context.supabase.from("ai_usage_events").insert({ user_id: context.userId, kind: "plan" });
      return {
        description: (output.description ?? "").trim() || `Experience an unforgettable ${days}-day journey to ${data.destination_country} departing from ${data.departure_city}.`,
        itinerary,
      };

    } catch (error) {
      console.error("AI Plan Error:", error);
      throw new Error("AI couldn't produce a valid plan this time — try again.");
    }
  });
