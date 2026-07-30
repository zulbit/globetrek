import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

export type EmbassyFeeLookupInput = {
  country: string;
  visa_type: string;
};

const FeeSchema = z.object({
  fee_pkr: z.number().nullable(),
  fee_original: z.string().nullable(),
  source_note: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  last_known_update: z.string().nullable(),
});

export const lookupEmbassyFeeServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: EmbassyFeeLookupInput) => data)
  .handler(async ({ data, context }) => {
    // Tier gate — AI lookups for Pro/Agency only.
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = ((profile as { subscription_tier?: string } | null)?.subscription_tier ?? "free") as
      | "free" | "starter" | "pro" | "agency";
    if (tier === "free" || tier === "starter") {
      throw new Error("AI embassy fee lookup is a Pro feature. Upgrade to unlock.");
    }

    // Use web-search grounded model for real-time fee data
    const { openRouterOnlineModel } = await import("@/integrations/openrouter/openrouter.server");
    const model = openRouterOnlineModel();

    try {
      const { text } = await generateText({
        model,
        prompt: `You are a Pakistani travel-industry researcher with access to the live internet. A Lahore-based travel agency needs the CURRENT official EMBASSY / VISA-CENTRE fee (government fee only, not the agent's service fee) for Pakistani passport holders applying from Pakistan.

Country destination: ${data.country}
Visa type: ${data.visa_type}
Applicant origin: Pakistan (cities: Lahore, Karachi, Islamabad)

SEARCH THE WEB RIGHT NOW for the current fee from these authoritative sources (in order of preference):
1. Official embassy or consulate website for ${data.country} in Pakistan
2. VFS Global Pakistan (vfsglobal.com) fee schedule for ${data.country} visas
3. Gerrys Visa (gerrys.com) fee schedule
4. TLScontact Pakistan (tlscontact.com) if applicable for ${data.country}
5. Pakistan news coverage or travel forums from 2024-2025

Convert the fee to Pakistani Rupees using the CURRENT exchange rate you find on the web. Round to the nearest 500 PKR.

Return ONLY a valid JSON object (no markdown, no preamble) with this exact structure:
{
  "fee_pkr": <number or null>,
  "fee_original": "<e.g. USD 185, EUR 90, GBP 127, or PKR 12000 if already in PKR>",
  "source_note": "<ONE sentence: name the exact source found (e.g. 'VFS Global Pakistan fee schedule updated May 2025') and state the exchange rate used if conversion was needed. Add a note to verify before quoting the client.>",
  "confidence": "<low|medium|high — use high only if you found official source, medium for semi-official, low for estimate>",
  "last_known_update": "<e.g. 'May 2025' or 'Q1 2026'>"
}`,
      });

      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      // Extract JSON if embedded in text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      const parsed = JSON.parse(jsonMatch[0]);
      const output = FeeSchema.parse(parsed);

      // Log usage against the "description" bucket
      await context.supabase
        .from("ai_usage_events")
        .insert({ user_id: context.userId, kind: "description" });

      return {
        fee_pkr: output.fee_pkr === null ? null : Math.max(0, Math.round(Number(output.fee_pkr))),
        fee_original: output.fee_original,
        source_note: String(output.source_note ?? "").slice(0, 300),
        confidence: output.confidence,
        last_known_update: output.last_known_update,
        disclaimer: "Live web lookup result. Always verify with the embassy, VFS, or Gerrys before quoting the client — fees can change without notice.",
      };
    } catch (error) {
      console.error("AI Visa Fee Error:", error);
      throw new Error("Couldn't fetch a reliable real-time estimate. Please check VFS Global Pakistan or the embassy website directly.");
    }
  });

