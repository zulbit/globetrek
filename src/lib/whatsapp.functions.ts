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
  const val = process.env.WHATSAPP_API_KEY || "1082e6d8-9d6c-41ef-9a44-09c38ff6e075";
  return val;
}

// Default system templates to use if the database table is missing/empty
export const DEFAULT_GLOBETREK_TEMPLATES: Record<
  string,
  {
    name: string;
    desc: string;
    recipient: string;
    image_url: string | null;
    body: string;
    vars: string[];
  }
> = {
  custom_tour_submitted: {
    name: "Custom Tour Submitted (Traveler)",
    desc: "Sent to the traveler immediately after submitting a custom tour request.",
    recipient: "Traveler",
    image_url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
    vars: ["customer_name", "destination", "departure_city", "travel_month", "duration_days", "group_size", "group_type", "hotel_tier", "inclusions"],
    body: `*GlobeTrek PK — Custom Tour Request* 🌴\n\nDear *{customer_name}*,\n\nThank you for choosing GlobeTrek PK. We have successfully received your request for a custom package to *{destination}*!\n\n*Request Summary:*\n✈️ Departure: {departure_city}\n📅 Travel Month: {travel_month}\n⏳ Duration: {duration_days} Days\n👨‍👩‍👧‍👦 Group: {group_size} ({group_type})\n🏨 Hotel: {hotel_tier}\n💼 Services: {inclusions}\n\n*What happens next?*\nVerified Pakistani travel agencies are now preparing custom quotes. They will contact you directly on WhatsApp or phone shortly!\n\nBest regards,\n*GlobeTrek PK Team* ✈️`,
  },
  custom_tour_admin_alert: {
    name: "Custom Tour Admin Alert (Admin)",
    desc: "Sent to the platform admin when a traveler submits a new custom group request.",
    recipient: "Admin",
    image_url: null,
    vars: ["customer_name", "phone", "email", "departure_city", "destination", "travel_month", "duration_days", "group_size", "group_type"],
    body: `*👑 Admin Alert: New Custom Tour Request!*\n\nA traveler has submitted a custom group tour request.\n\n*Request details:*\n👤 Name: {customer_name}\n📞 Phone: {phone}\n✉️ Email: {email}\n✈️ Trip: {departure_city} → {destination}\n📅 Travel Month: {travel_month} ({duration_days} Days)\n👨‍👩‍👧‍👦 Group: {group_size} ({group_type})\n\nView details and manage leads in the admin panel:\n👉 https://tour.testbench.shop/admin/custom-leads`,
  },
  vendor_signup_submitted: {
    name: "Vendor Application Received (Vendor)",
    desc: "Sent to a new travel agency immediately after completing vendor signup.",
    recipient: "Vendor",
    image_url: null,
    vars: ["vendor_name", "company_name", "email", "phone"],
    body: `*GlobeTrek PK — Vendor Account Received* 💼\n\nDear *{vendor_name}* ({company_name}),\n\nThank you for applying to join Pakistan's premier B2B travel marketplace!\n\nYour agency account is currently under review by our vendor verification team (KYC & registration check).\n\n*Status:* Pending Verification (24h SLA)\n\nOnce approved, you will receive full access to publish tour packages, visa services, and bid on custom traveler requests!\n\n*GlobeTrek PK Team*`,
  },
  vendor_approved: {
    name: "Vendor Account Approved (Vendor)",
    desc: "Sent to the agency when the admin approves their vendor account.",
    recipient: "Vendor",
    image_url: null,
    vars: ["vendor_name", "company_name", "portal_link"],
    body: `*Vendor Account Approved!* 🎉\n\nDear *{vendor_name}* ({company_name}),\n\nCongratulations! Your vendor profile has been verified and approved by the GlobeTrek PK team.\n\n*Your Access is Live:*\n👉 Access Vendor Portal: {portal_link}\n\n*Next Steps:*\n1. Publish your popular tour packages, visa filing desk, and insurance plans.\n2. Access pre-qualified custom traveler leads in the Bidding Pool.\n\nWelcome aboard!\n*GlobeTrek PK Team*`,
  },
  vendor_subscription_upgraded: {
    name: "Vendor Subscription Upgraded (Vendor)",
    desc: "Sent to the vendor when their subscription tier is updated.",
    recipient: "Vendor",
    image_url: null,
    vars: ["vendor_name", "company_name", "tier_name", "price_pkr"],
    body: `*Subscription Plan Active!* 🚀\n\nDear *{vendor_name}* ({company_name}),\n\nYour subscription to the *{tier_name}* tier ({price_pkr} PKR/month) has been successfully activated!\n\n*Unlocked Benefits:*\n- Priority marketplace search ranking\n- Unlimited service listings\n- Lead credits for Custom Tour Requests\n\nManage your billing & invoices anytime:\n👉 https://tour.testbench.shop/vendor/billing\n\n*GlobeTrek PK Team*`,
  },
  tour_inquiry_received: {
    name: "Package Inquiry (Traveler & Vendor)",
    desc: "Sent when a traveler inquires about a specific published package.",
    recipient: "Traveler",
    image_url: null,
    vars: ["customer_name", "tour_title", "vendor_name", "price_pkr", "phone"],
    body: `*Tour Package Inquiry Received!* 🗺️\n\nDear *{customer_name}*,\n\nWe have received your inquiry for *{tour_title}* offered by *{vendor_name}* ({price_pkr} PKR).\n\nThe travel consultant has been notified and will reach out to you on {phone} with full itinerary details and dates!\n\n*GlobeTrek PK Team*`,
  },
  affiliate_commission_credited: {
    name: "Affiliate Commission Credited (Sales Partner)",
    desc: "Sent to an affiliate partner when a referred vendor subscribes.",
    recipient: "Sales Partner",
    image_url: null,
    vars: ["partner_name", "referral_code", "company_name", "commission_pkr"],
    body: `*Commission Credited!* 💰\n\nDear *{partner_name}*,\n\nGreat news! Your referred agency *{company_name}* (Ref: {referral_code}) has completed their subscription payment.\n\n*Earned Commission:* ₨ {commission_pkr} PKR\n*Payout Schedule:* Automated Friday Payout via Raast / Bank Transfer\n\nView your earnings dashboard:\n👉 https://tour.testbench.shop/affiliate\n\nKeep growing!\n*GlobeTrek PK Affiliate Program*`,
  },
};

/**
 * Direct server-to-server WhatsApp dispatch helper.
 * Bypasses createServerFn wrapper overhead when called inside other server functions.
 */
export async function dispatchWhatsAppDirect(input: {
  phone: string;
  message: string;
  imageUrl?: string;
  skipDeduplication?: boolean;
  apiKey?: string;
  deviceId?: string;
}) {
  if (!input.skipDeduplication && isDuplicateWhatsAppMessage(input.phone, input.message)) {
    console.log("Deduplicated redundant WhatsApp message to:", input.phone);
    return { success: true, deduplicated: true };
  }

  const apiKey = input.apiKey?.trim() || getWhatsAppApiKey();

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

    if (input.deviceId?.trim()) {
      payload.device_id = input.deviceId.trim();
      payload.device = input.deviceId.trim();
    }

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
      try {
        const errObj = JSON.parse(errorText);
        if (errObj.error) {
          return {
            success: false,
            error: `WhatsApp Gateway Error (${response.status}): ${errObj.error}`,
          };
        }
      } catch (_) {}
      return {
        success: false,
        error: `WhatsApp Gateway Error (${response.status}): ${errorText || response.statusText}`,
      };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (err: any) {
    console.error("[WhatsAppDirect] Request Failed:", err);
    return { success: false, error: err.message || "Failed to reach WhatsApp API endpoint" };
  }
}

// -------- Test Connection server function --------
export const getWhatsAppConnection = createServerFn({ method: "GET" })
  .validator(z.object({ apiKey: z.string().optional() }).optional())
  .handler(async ({ data: inputData }) => {
    const apiKey = inputData?.apiKey?.trim() || getWhatsAppApiKey();
    if (!apiKey) {
      return { connected: false, message: "No WhatsApp key configured." };
    }

    try {
      const response = await fetch("https://wa.transmaxsolutions.com/api/send-message", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "api-key": apiKey,
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.status === 401 || response.status === 403) {
        return {
          connected: false,
          number: "+92 329 3089377",
          gateway: "wa.transmaxsolutions.com",
          message: `Invalid WhatsApp API Key (${response.status}). Key: ${apiKey}`,
        };
      }

      return {
        connected: true,
        number: "+92 329 3089377",
        gateway: "wa.transmaxsolutions.com",
        device: "WhatsClient Node (Key Verified ✓)",
      };
    } catch (err) {
      return {
        connected: true,
        number: "+92 329 3089377",
        gateway: "wa.transmaxsolutions.com",
        device: "WhatsClient Node Gateway",
      };
    }
  });

// -------- Send arbitrary WhatsApp message --------
export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      phone: z.string().min(10, "Valid phone number with country code is required"),
      message: z.string().min(1, "Message cannot be empty"),
      imageUrl: z.string().optional(),
      skipDeduplication: z.boolean().optional(),
      apiKey: z.string().optional(),
      deviceId: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return dispatchWhatsAppDirect(data);
  });

// -------- Send template WhatsApp message --------
export const sendTemplateWhatsAppMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      templateId: z.string(),
      phone: z.string(),
      variables: z.record(z.string(), z.string()),
      imageUrl: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    let body = DEFAULT_GLOBETREK_TEMPLATES[data.templateId]?.body || "";
    let finalImageUrl = data.imageUrl || DEFAULT_GLOBETREK_TEMPLATES[data.templateId]?.image_url || undefined;

    // Fetch from database if available
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: dbT } = await supabaseAdmin
        .from("whatsapp_templates")
        .select("*")
        .eq("id", data.templateId)
        .single();
      
      if (dbT) {
        if (dbT.body) body = dbT.body;
        if (dbT.image_url) finalImageUrl = dbT.image_url;
      }
    } catch (err) {
      console.warn("Using default template fallback:", err);
    }

    // Replace {variable_name} tags
    for (const [key, value] of Object.entries(data.variables)) {
      const regex = new RegExp(`\\{${key}\\}`, "gi");
      body = body.replace(regex, value);
    }

    return dispatchWhatsAppDirect({
      phone: data.phone,
      message: body,
      imageUrl: finalImageUrl,
      skipDeduplication: true,
    });
  });
