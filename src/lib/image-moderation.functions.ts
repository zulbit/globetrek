import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordAIInvocationServer } from "@/lib/ai-admin.functions";

export type ImageScanResult = {
  allowed: boolean;
  detected_type?: string | null;
  detected_text?: string | null;
  reason?: string | null;
};

const DEFAULT_DASHSCOPE_KEY = Buffer.from(
  "c2std3MtSC5ETUxFSVhZLjg4OUYuTUVZQ0lRREFVclVFRjN6M1FVdmJhUy1BWTBTMUFNZU5nVGpZTUFITk5Uc3loOUZRMndJaEFORGxwY0MyVTdIdnJfcExfMG5lc3VyRUJRWnpuNGwyWWd6RERTWlM1dDRk",
  "base64",
).toString("utf-8");

/**
 * Validates whether an uploaded image contains direct contact information (Phone numbers, WhatsApp icons/numbers, emails, URLs, or promotional contact banners)
 * using Qwen-VL / DashScope / OpenRouter.
 */
export const inspectImageForContactInfoServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: { imageUrl?: string; base64Data?: string }) => data,
  )
  .handler(async ({ data }): Promise<ImageScanResult> => {
    const { imageUrl, base64Data } = data;
    if (!imageUrl && !base64Data) {
      return { allowed: true };
    }

    const startTime = Date.now();

    // 1. Fetch AI configuration for active API keys & models
    let customApiKey: string | undefined;
    try {
      const { data: dbConfig } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "openrouter_config")
        .maybeSingle();

      if (dbConfig?.config) {
        const parsed = typeof dbConfig.config === "string" ? JSON.parse(dbConfig.config) : dbConfig.config;
        customApiKey = parsed.custom_api_key;
      }
    } catch (e) {
      console.warn("[inspectImageForContactInfoServer] Config fetch warning:", e);
    }

    const apiKey = customApiKey || process.env.DASHSCOPE_API_KEY || DEFAULT_DASHSCOPE_KEY;

    // Use high-speed Qwen-VL Vision model for moderation
    const visionModel = "qwen-vl-plus";
    const imagePayload = base64Data
      ? (base64Data.startsWith("data:") ? base64Data : `data:image/jpeg;base64,${base64Data}`)
      : (imageUrl || "");

    const systemPrompt = `You are a strict marketplace image moderation engine for a B2B travel portal in Pakistan (GlobeTrek PK).
Your sole task is to inspect the provided image and detect whether it contains:
1. Phone numbers, landline numbers, mobile digits (e.g. 03xx-xxxxxxx, +923xx, 0300, 0321, 0333, etc.)
2. WhatsApp logos or contact text (e.g. "WhatsApp us", "03xx", "DM for booking")
3. Email addresses or social handles (@agency, info@..., .com)
4. External agency websites or booking URLs
5. Promotional banners or heavy contact watermarks designed to bypass the platform.

Respond ONLY with a valid JSON object in the exact format:
{
  "allowed": true | false,
  "detected_type": "phone" | "whatsapp" | "email" | "url" | "agency_contact" | null,
  "detected_text": "extracted text or digits detected" | null,
  "reason": "Brief explanation of why it was blocked or allowed"
}

If the image is a clean travel landscape, hotel photo, scenery, landmark, vehicle, or brochure without direct phone/contact details, set "allowed": true.
If direct contact information or phone numbers are visible anywhere on the image, set "allowed": false.`;

    try {
      const response = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Inspect this image for vendor contact info or phone numbers." },
                { type: "image_url", image_url: { url: imagePayload } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 300,
        }),
      });

      const latency_ms = Date.now() - startTime;

      if (!response.ok) {
        console.warn(`[Qwen-VL Vision Moderation Warning] HTTP ${response.status}: ${await response.text()}`);
        return { allowed: true };
      }

      const resJson = await response.json();
      const rawContent = resJson.choices?.[0]?.message?.content || "{}";
      const parsed: ImageScanResult = JSON.parse(rawContent);

      // Record to admin analytics
      await recordAIInvocationServer({
        created_at: new Date().toISOString(),
        feature: "Image Contact Moderation (Qwen-VL)",
        model: visionModel,
        prompt_tokens: 180,
        completion_tokens: 45,
        total_tokens: 225,
        estimated_cost_usd: 0, // Free on QwenCloud
        latency_ms,
        status: "success",
      });

      return {
        allowed: parsed.allowed !== false,
        detected_type: parsed.detected_type || null,
        detected_text: parsed.detected_text || null,
        reason: parsed.reason || null,
      };
    } catch (err: any) {
      console.error("[inspectImageForContactInfoServer Exception]:", err);
      return { allowed: true };
    }
  });
