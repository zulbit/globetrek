import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Output } from "ai";
import { generateTextWithFallback as generateText } from "@/integrations/openrouter/openrouter.server";
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

const PlanSchema = z.object({
  description: z.string(),
  itinerary: z.array(
    z.object({
      day: z.number(),
      title: z.string(),
      detail: z.string(),
      activities: z.array(z.object({ time: z.string(), title: z.string() })),
    }),
  ),
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

    // null = unlimited, 0 = not included in tier
    const AI_LIMITS: Record<typeof tier, { description: number | null; plan: number | null }> = {
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


    const { openRouterModel } = await import("@/integrations/openrouter/openrouter.server");
    const model = openRouterModel();

    const ctxLine = [
      `Title: ${data.title || "(untitled)"}`,
      `Destination: ${data.destination_country}`,
      `Departure city: ${data.departure_city} (Pakistan)`,
      `Duration: ${data.duration_days} days`,
      `Price per person: PKR ${Number(data.price_pkr).toLocaleString("en-PK")}`,
      data.description ? `Existing description: ${data.description}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (data.mode === "description") {
      const { text } = await generateText({
        model,
        prompt: `You write short marketing descriptions for international tour packages sold to Pakistani travelers by a Lahore-based agency (GlobeTrek PK). Prices are in PKR.

Write ONE punchy paragraph (~55-75 words, plain text, no markdown, no headings, no emojis) that highlights what makes this trip special — top sights, vibe, and a hook. Do not repeat the price or duration verbatim; sell the experience.

Tour context:
${ctxLine}`,
      });
      await context.supabase.from("ai_usage_events").insert({ user_id: context.userId, kind: "description" });
      return { description: text.trim() };
    }


    // mode === "plan"
    try {
      const { text } = await generateText({
        model,
        prompt: `You are a senior tour planner for GlobeTrek PK, a Pakistani travel marketplace selling international packages priced in PKR.

Design a realistic day-by-day itinerary for the tour below. Return exactly ${data.duration_days} days (day numbering 1..${data.duration_days}).
${data.destination_country.toLowerCase().includes("europe") ? "\n- Since the destination is Europe, design a multi-country tour! Do not limit the itinerary to a single country. Include transition details between popular European countries (e.g. France, Switzerland, Italy, Germany) and show border crossings/trains.\n" : ""}
You MUST return your response as a valid, parsable JSON object matching this structure:
{
  "description": "one crisp marketing paragraph (~60 words, plain text, no markdown)",
  "itinerary": [
    {
      "day": number,
      "title": "short evocative title (e.g. 'Istanbul arrival & Bosphorus cruise')",
      "detail": "1-2 sentences summarising the day (transfers, meals, main sights)",
      "activities": [
        { "time": "HH:MM", "title": "short action (e.g. 'Airport pickup & hotel check-in')" }
      ]
    }
  ]
}

Day 1 must begin with departure from ${data.departure_city} and arrival at the destination airport. The final day must include the return flight home to ${data.departure_city}.

Tour context:
${ctxLine}`,
        responseFormat: "json",
      });

      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      const parsed = JSON.parse(cleaned.trim());
      const output = PlanSchema.parse(parsed);

      // Clamp/normalize in code
      const days = Math.max(1, Math.min(60, Number(data.duration_days) || 1));
      const itinerary = (output.itinerary ?? [])
        .slice(0, days)
        .map((d, i) => ({
          day: i + 1,
          title: String(d.title ?? "").slice(0, 160),
          detail: String(d.detail ?? "").slice(0, 800),
          activities: (d.activities ?? []).slice(0, 8).map((a) => ({
            time: String(a.time ?? "").slice(0, 8),
            title: String(a.title ?? "").slice(0, 160),
          })),
        }));

      await context.supabase.from("ai_usage_events").insert({ user_id: context.userId, kind: "plan" });
      return {
        description: (output.description ?? "").trim(),
        itinerary,
      };

    } catch (error) {
      console.error("AI Plan Error:", error);
      throw new Error("AI couldn't produce a valid plan this time — try again.");
    }
  });
