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

function getWhatsAppApiKey(): string {
  const val = process.env.WHATSAPP_API_KEY || "1082e6d8-9d6c-41ef-9a44-09c38ff6e075";
  return val;
}

// -------- Send arbitrary WhatsApp message --------
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
    if (!data.skipDeduplication && isDuplicateWhatsAppMessage(data.phone, data.message)) {
      console.log("Deduplicated redundant WhatsApp message to:", data.phone);
      return { success: true, deduplicated: true };
    }

    const apiKey = getWhatsAppApiKey();

    // Clean and format phone number to international WhatsApp format (e.g. 923490386131)
    let formattedPhone = data.phone.replace(/[^\d+]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "92" + formattedPhone.slice(1);
    }
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    try {
      const payload: Record<string, any> = {
        number: formattedPhone,
        message: data.message,
      };

      if (data.imageUrl?.trim()) {
        payload.media = data.imageUrl.trim();
        payload.mediaUrl = data.imageUrl.trim();
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
        console.warn("Primary WhatsApp gateway failed, trying Railway backup...");
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
        console.error("WhatsApp API Error:", response.status, errorText);
        return {
          success: false,
          error: `WhatsApp Gateway Error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();
      return { success: true, result };
    } catch (err: any) {
      console.error("WhatsApp Request Failed:", err);
      return { success: false, error: err.message || "Failed to reach WhatsApp API endpoint" };
    }
  });
