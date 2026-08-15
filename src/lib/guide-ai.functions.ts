import { createServerFn } from "@tanstack/react-start";
import { openRouterModel, generateTextWithFallback as generateText } from "@/integrations/openrouter/openrouter.server";

export type AskGuideAIInput = {
  question: string;
};

export const askVendorGuideAIServer = createServerFn({ method: "POST" })
  .validator((data: AskGuideAIInput) => data)
  .handler(async ({ data }) => {
    if (!data.question || data.question.trim().length === 0) {
      throw new Error("Question text cannot be empty.");
    }

    let activeModel = "qwen-turbo";
    let customApiKey: string | undefined = undefined;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: aiSetting } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "openrouter_config")
        .maybeSingle();

      if (aiSetting?.config) {
        const parsed = typeof aiSetting.config === "string" ? JSON.parse(aiSetting.config) : (aiSetting.config as any);
        if (parsed.vendor_guide_model || parsed.active_model) {
          activeModel = String(parsed.vendor_guide_model || parsed.active_model);
        }
        if (parsed.custom_api_key) customApiKey = String(parsed.custom_api_key).trim();
      }
    } catch {}

    const model = openRouterModel(activeModel, customApiKey);

    const systemPrompt = `You are the official GlobeTrek PK AI Partner Assistant.
Your job is to answer questions from tour operators, travel agents, visa consultants, insurance brokers, and ticketing desks regarding GlobeTrek PK marketplace operations.

Core Marketplace Rules to Reference:
1. Vendor Onboarding Lifecycle & Setup Mode:
   - Newly registered vendors start in 'Setup Mode' (status: 'pending').
   - In Setup Mode, vendors have full access to explore the dashboard, use the AI Trip Planner, and prepare/save unlimited draft tours, visa packages, insurance plans, and flight routes.
   - Live marketplace publishing ('is_active: true') and unlocking customer leads are strictly locked during Setup Mode to protect travelers and maintain platform safety.
2. KYC Verification & Portal (/vendor/kyc):
   - Mandatory credentials required: Agency Legal Name, Official WhatsApp Number, Department of Tourist Services (DTS) License Number, FBR NTN Tax Number, Business Owner CNIC (13 digits), and Physical Commercial Office Address. Bank IBAN is recommended for SafePay payout settlements.
   - Once submitted, status updates to '⏳ KYC Submitted & Under Review'.
   - GlobeTrek PK Admins verify DTS licenses and WhatsApp numbers within a 24-hour SLA.
   - Upon approval, status becomes '✅ Verified Agency Partner', unlocking live marketplace publishing, Verified Partner Gold badge, and direct lead unlocking/bidding.
3. Custom Lead Bidding:
   - Tour Leads: Admin verifies traveler budget and travel dates first. Each custom group tour lead has a Max 3 Vendor Unlock Limit (₨ 5,000 via SafePay).
   - Visa Leads: High-converting consultation inquiries with 5-vendor unlock cap (₨ 750 via SafePay).
4. Quotation & WhatsApp Delivery:
   - Unlocked vendors submit online structured proposals. Submitting a quote sends an instant automated WhatsApp alert to the traveler with an interactive comparison link.
5. Subscription Tiers:
   - Free/Starter: Standard listings and pay-as-you-go lead unlocking.
   - Pro: Priority placement in search, Verified Gold Partner badge, and inclusive AI tools quota.
6. AI Tools:
   - Bilingual AI Travel Concierge (English & Roman Urdu), AI Trip Planner (day-by-day itinerary creator), AI Embassy Fee Lookup, and AI Partner Operational Assistant.

Formatting Rules:
- Keep responses professional, authoritative, and encouraging.
- Structure your answer with a clear bold **Heading** first, followed by a bulleted **Detail** breakdown.
- If asked in Roman Urdu, respond in Roman Urdu. Otherwise respond in English.`;

    const startTime = Date.now();
    const { text, usage } = await generateText({
      model,
      system: systemPrompt,
      prompt: data.question,
    });

    try {
      const { recordAIInvocationServer } = await import("@/lib/ai-admin.functions");
      const promptTok = (usage as any)?.promptTokens ?? Math.round((systemPrompt.length + data.question.length) / 3.5);
      const compTok = (usage as any)?.completionTokens ?? Math.round(text.length / 3.5);
      await recordAIInvocationServer({
        created_at: new Date().toISOString(),
        feature: "Vendor Guide Operational Assistant",
        model: activeModel,
        prompt_tokens: promptTok,
        completion_tokens: compTok,
        total_tokens: promptTok + compTok,
        estimated_cost_usd: activeModel.includes("free") || activeModel.startsWith("qwen") ? 0 : 0.00003,
        latency_ms: Date.now() - startTime,
        status: "success",
      });
    } catch {}

    return { answer: text };
  });

export type GenerateDemoAIInput = {
  destination: string;
  duration_days: number;
};

export type DemoItineraryDay = {
  day: number;
  title: string;
  detail: string;
};

export type DemoItineraryStructure = {
  title: string;
  destination: string;
  duration_days: number;
  highlights: string[];
  days: DemoItineraryDay[];
  budget_pkr: string;
};

export const generateEnterpriseDemoAIServer = createServerFn({ method: "POST" })
  .validator((data: GenerateDemoAIInput) => data)
  .handler(async ({ data }) => {
    const model = openRouterModel();

    const promptText = `Design a realistic, marketing-optimized day-by-day tour itinerary for ${data.destination} for ${data.duration_days} days.
You MUST return your response as a valid, parsable JSON object matching this exact structure:
{
  "title": "${data.destination} ${data.duration_days}-Day Signature Experience",
  "destination": "${data.destination}",
  "duration_days": ${data.duration_days},
  "highlights": ["3-4 bullet points highlighting key sights and experiences"],
  "days": [
    {
      "day": 1,
      "title": "Evocative Day Title (e.g. Arrival & Bosphorus Sunset Cruise)",
      "detail": "2-3 sentences describing arrival, transfers, sights, and dinner."
    }
  ],
  "budget_pkr": "Rs 150,000 - Rs 350,000 PKR per person"
}

Make sure there are exactly ${data.duration_days} days in the "days" array. Do not include markdown code block backticks inside JSON strings.`;

    try {
      const { text } = await generateText({
        model,
        prompt: promptText,
        responseFormat: "json",
      });

      let cleaned = text.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed: DemoItineraryStructure = JSON.parse(cleaned);
      return { itinerary: parsed };
    } catch (err: any) {
      // Fallback structured data if parsing fails
      return {
        itinerary: {
          title: `${data.destination} ${data.duration_days}-Day Premium Tour`,
          destination: data.destination,
          duration_days: data.duration_days,
          highlights: [
            `Guided tour of iconic historical landmarks and local culture in ${data.destination}.`,
            "Scenic transfers and 4-star boutique hotel accommodation.",
            "Authentic local dining and leisure time for shopping.",
          ],
          days: Array.from({ length: data.duration_days }, (_, i) => ({
            day: i + 1,
            title: i === 0 ? "Arrival & Welcome Dinner" : i === data.duration_days - 1 ? "Departure & Return Flight" : `Explore ${data.destination} Highlights Part ${i}`,
            detail: `Detailed day ${i + 1} itinerary activities including guided sightseeing, local meals, and panoramic photography stops.`,
          })),
          budget_pkr: "Rs 180,000 - Rs 350,000 PKR per person",
        },
      };
    }
  });
