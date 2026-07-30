import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sentMessageDeduper = new Map<string, number>();

function isDuplicateWhatsAppMessage(phone: string, text: string): boolean {
  const key = `${phone.replace(/[^\d]/g, "")}:${text.slice(0, 60)}`;
  const now = Date.now();
  const lastSent = sentMessageDeduper.get(key);
  if (lastSent && now - lastSent < 60000) {
    return true; // Skip duplicate message within 60 seconds
  }
  sentMessageDeduper.set(key, now);
  if (sentMessageDeduper.size > 300) {
    for (const [k, time] of sentMessageDeduper.entries()) {
      if (now - time > 120000) sentMessageDeduper.delete(k);
    }
  }
  return false;
}

export function getWhatsAppApiKey(): string {
  return process.env.WHATSAPP_API_KEY || "1082e6d8-9d6c-41ef-9a44-09c38ff6e075";
}

/**
 * Direct server-to-server WhatsApp dispatch helper.
 * Bypasses createServerFn wrapper overhead when called inside other server functions.
 */
export async function dispatchWhatsAppDirect(input: {
  phone: string;
  message: string;
  imageUrl?: string;
  skipDeduplication?: boolean;
}) {
  if (!input.skipDeduplication && isDuplicateWhatsAppMessage(input.phone, input.message)) {
    console.log("Deduplicated redundant WhatsApp message to:", input.phone);
    return { success: true, deduplicated: true };
  }

  const apiKey = getWhatsAppApiKey();

  // Clean and format phone number to international WhatsApp format (e.g. 923490386131)
  let formattedPhone = input.phone.replace(/[^\d+]/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "92" + formattedPhone.slice(1);
  }
  if (formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.slice(1);
  }

  try {
    const payload: Record<string, any> = {
      number: formattedPhone,
      message: input.message,
    };

    if (input.imageUrl?.trim()) {
      payload.media = input.imageUrl.trim();
      payload.mediaUrl = input.imageUrl.trim();
    }

    let response = await fetch("https://wa.transmaxsolutions.com/api/send-message", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "api-key": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("[WhatsAppDirect] Primary gateway failed, trying Railway backup...");
      response = await fetch("https://primary-production-4ff5.up.railway.app/webhook/send-message", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WhatsAppDirect] API Error:", response.status, errorText);
      return {
        success: false,
        error: `WhatsApp Gateway Error (${response.status}): ${errorText}`,
      };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (err: any) {
    console.error("[WhatsAppDirect] Request Failed:", err);
    return { success: false, error: err.message || "Failed to reach WhatsApp API endpoint" };
  }
}

// -------- Send arbitrary WhatsApp message (RPC endpoint for client callers) --------
export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      phone: z.string().min(10, "Valid phone number with country code is required"),
      message: z.string().min(1, "Message cannot be empty"),
      imageUrl: z.string().optional(),
      skipDeduplication: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    return dispatchWhatsAppDirect(data);
  });
