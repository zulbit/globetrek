import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output, NoObjectGeneratedError } from "ai";
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

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured yet.");

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const provider = createLovableAiGatewayProvider(apiKey);
    const model = provider("google/gemini-2.5-flash");

    try {
      const { output } = await generateText({
        model,
        prompt: `You are a Pakistani travel-industry researcher. A Lahore-based agency needs the current EMBASSY / VISA-CENTRE fee (government fee only, not agent service fee) for filing a visa application from Pakistan.

Country: ${data.country}
Visa type: ${data.visa_type}

Return your best estimate based on the most recent publicly known embassy or VFS/TLS fee schedule you remember. Convert to Pakistani Rupees using a recent typical rate (roughly PKR 280/USD, PKR 300/EUR). Round to the nearest 500.

Rules:
- fee_pkr: integer PKR, or null if you truly have no basis.
- fee_original: the original currency amount you converted from (e.g. "USD 185", "EUR 90", "GBP 127") or null.
- source_note: ONE short sentence naming the source type (e.g. "Turkish e-Visa portal", "VFS Global Schengen fee for Pakistan", "UK gov.uk visa fee schedule") and any caveat.
- confidence: low | medium | high — be honest; embassy fees change frequently.
- last_known_update: rough date you last recall this fee changing (e.g. "2024 Q2"), or null.

Never invent a specific URL. Always caveat that the vendor must verify with the embassy before quoting the client.`,
        output: Output.object({ schema: FeeSchema }),
      });

      // Log usage against the "description" bucket (existing enum) since this
      // is a lightweight text-generation call.
      await context.supabase
        .from("ai_usage_events")
        .insert({ user_id: context.userId, kind: "description" });

      return {
        fee_pkr: output.fee_pkr === null ? null : Math.max(0, Math.round(Number(output.fee_pkr))),
        fee_original: output.fee_original,
        source_note: String(output.source_note ?? "").slice(0, 240),
        confidence: output.confidence,
        last_known_update: output.last_known_update,
        disclaimer: "AI estimate based on last-known public fee schedules. Verify with the embassy or VFS/TLS centre before quoting the client — embassy fees change frequently.",
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI couldn't produce a reliable estimate. Please look it up manually.");
      }
      throw error;
    }
  });
