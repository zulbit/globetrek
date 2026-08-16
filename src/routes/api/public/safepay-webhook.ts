import { createFileRoute } from "@tanstack/react-router";

const SUCCESS_STATES = new Set([
  "TRACKER_COMPLETED",
  "COMPLETED",
  "PAID",
  "PAYMENT.SUCCEEDED",
  "PAYMENT.COMPLETED",
  "SUCCEEDED",
]);
const FAILED_STATES = new Set([
  "TRACKER_FAILED",
  "FAILED",
  "PAYMENT.FAILED",
  "CANCELLED",
  "TRACKER_CANCELLED",
]);

function pickToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const candidates = ["sp_tracker", "tracker", "token", "beacon", "quick_link_id", "id"];
  for (const key of candidates) {
    const val = p[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  const data = p.data as Record<string, unknown> | undefined;
  if (data) {
    for (const key of candidates) {
      const val = data[key];
      if (typeof val === "string" && val.length > 0) return val;
    }
  }
  return null;
}

function pickState(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const keys = ["state", "status", "event", "type"];
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "string") return v.toUpperCase();
  }
  const data = p.data as Record<string, unknown> | undefined;
  if (data) {
    for (const k of keys) {
      const v = data[k];
      if (typeof v === "string") return v.toUpperCase();
    }
  }
  return null;
}

import { loadEnv } from "@/lib/env.server";

export const Route = createFileRoute("/api/public/safepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        loadEnv();
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const token = pickToken(payload);
        const state = pickState(payload);
        if (!token || !state) {
          return Response.json({ ok: true, ignored: "missing token/state" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Try matching with custom tour lead unlock payments
        let { data: leadPayment } = await supabaseAdmin
          .from("lead_unlock_payments")
          .select("id, lead_id, vendor_id, status")
          .eq("payment_intent_id", token)
          .maybeSingle();

        if (leadPayment) {
          if (SUCCESS_STATES.has(state)) {
            await supabaseAdmin
              .from("lead_unlock_payments")
              .update({ status: "completed", payment_intent_id: token })
              .eq("id", leadPayment.id);

            await supabaseAdmin
              .from("vendor_lead_purchases")
              .upsert(
                { lead_id: leadPayment.lead_id, vendor_id: leadPayment.vendor_id },
                { onConflict: "lead_id,vendor_id" }
              );

            // Send WhatsApp notifications asynchronously
            try {
              const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");

              // Fetch traveler and vendor details
              const [leadRes, vendorRes] = await Promise.all([
                supabaseAdmin
                  .from("custom_tour_leads")
                  .select("contact_name, contact_phone, destination")
                  .eq("id", leadPayment.lead_id)
                  .single(),
                supabaseAdmin
                  .from("profiles")
                  .select("full_name, email")
                  .eq("id", leadPayment.vendor_id)
                  .single()
              ]);

              if (leadRes.data) {
                const lead = leadRes.data;
                const vendorName = vendorRes.data?.full_name || "a verified travel agent";

                // 1. Notify traveler
                const travelerMsg = `*GlobeTrek PK — Travel Partner Found!* 🎉\n\nDear *${lead.contact_name}*,\n\nGreat news! A verified travel partner (*${vendorName}*) has unlocked your custom tour request to *${lead.destination}*.\n\nThey will reach out to you on this number shortly with options and quotes!`;
                await sendWhatsAppMessage({
                  data: {
                    phone: lead.contact_phone,
                    message: travelerMsg,
                    skipDeduplication: true
                  }
                });

                // 2. Notify vendor with payment receipt & unlocked traveler details
                if (vendorRes.data && (vendorRes.data as any).phone) {
                  const vendorPhone = (vendorRes.data as any).phone;
                  const vendorMsg = `💳 *GlobeTrek PK — Lead Unlock Receipt* ✅\n\nDear *${vendorName}*,\n\nYour payment of *Rs 5,000 PKR* was successful!\n\nUnlocked Traveler Details:\n📍 Destination: *${lead.destination}*\n👤 Traveler: *${lead.contact_name}* (${lead.contact_phone})\n\nSubmit your online quotation directly in your dashboard:\nhttps://globetrek.pk/vendor/leads`;
                  await sendWhatsAppMessage({
                    data: {
                      phone: vendorPhone,
                      message: vendorMsg,
                      skipDeduplication: true
                    }
                  });
                }
              }
            } catch (waErr) {
              console.error("Webhook notification error:", waErr);
            }

            return Response.json({ ok: true, fulfilled_lead: leadPayment.id });
          }
          if (FAILED_STATES.has(state)) {
            await supabaseAdmin
              .from("lead_unlock_payments")
              .update({ status: "failed", payment_intent_id: token })
              .eq("id", leadPayment.id);

            // Send payment failure WhatsApp alert to vendor
            try {
              const { data: vProfile } = await supabaseAdmin
                .from("profiles")
                .select("full_name, phone")
                .eq("id", leadPayment.vendor_id)
                .single();

              if (vProfile?.phone) {
                const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
                const failMsg = `⚠️ *GlobeTrek PK — Payment Unsuccessful*\n\nDear *${vProfile.full_name || "Vendor"}*,\n\nYour payment attempt of *Rs 5,000 PKR* to unlock a custom tour lead was not completed (Status: *${state}*).\n\nNo amount was charged. You can retry unlocking the lead anytime from your dashboard:\nhttps://globetrek.pk/vendor/leads`;
                await sendWhatsAppMessage({
                  data: { phone: vProfile.phone, message: failMsg, skipDeduplication: true }
                });
              }
            } catch (fErr) {
              console.error("Failure alert error:", fErr);
            }

            return Response.json({ ok: true, failed_lead: leadPayment.id });
          }
          return Response.json({ ok: true, lead_state: state });
        }

        // 2. Try matching with regular payments (bookings, subscriptions, addons)
        let { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, booking_id, status, owner_id, amount, metadata")
          .eq("reference", token)
          .maybeSingle();

        if (!payment) {
          // Check if there is a recent pending lead payment that might have missed the reference mapping
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          const { data: recentLead } = await supabaseAdmin
            .from("lead_unlock_payments")
            .select("id, lead_id, vendor_id, status")
            .eq("status", "pending")
            .gte("created_at", thirtyMinAgo)
            .order("created_at", { ascending: false })
            .limit(1);

          if (recentLead?.[0]) {
            leadPayment = recentLead[0];
            if (SUCCESS_STATES.has(state)) {
              await supabaseAdmin
                .from("lead_unlock_payments")
                .update({ status: "completed", payment_intent_id: token })
                .eq("id", leadPayment.id);

              await supabaseAdmin
                .from("vendor_lead_purchases")
                .upsert(
                  { lead_id: leadPayment.lead_id, vendor_id: leadPayment.vendor_id },
                  { onConflict: "lead_id,vendor_id" }
                );

              return Response.json({ ok: true, fulfilled_lead: leadPayment.id });
            }
            if (FAILED_STATES.has(state)) {
              await supabaseAdmin
                .from("lead_unlock_payments")
                .update({ status: "failed", payment_intent_id: token })
                .eq("id", leadPayment.id);
              return Response.json({ ok: true, failed_lead: leadPayment.id });
            }
          }

          // Fallback to recent pending standard payment
          const { data: recent } = await supabaseAdmin
            .from("payments")
            .select("id, booking_id, status, owner_id, amount, metadata")
            .eq("method", "safepay")
            .eq("status", "pending")
            .gte("created_at", thirtyMinAgo)
            .order("created_at", { ascending: false })
            .limit(1);
          payment = recent?.[0] ?? null;
        }

        if (!payment) return Response.json({ ok: true, ignored: "no matching payment" });

        if (SUCCESS_STATES.has(state)) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "paid", reference: token })
            .eq("id", payment.id);

          const meta = payment.metadata as any;

          if (meta?.type === "subscription" && meta.tier && payment.owner_id) {
            // Fulfill subscription
            await supabaseAdmin
              .from("profiles")
              .update({ subscription_tier: meta.tier as never, pending_downgrade_tier: null } as any)
              .eq("id", payment.owner_id);
              
            try {
              const { data: profile } = await supabaseAdmin.from("profiles").select("phone, full_name").eq("id", payment.owner_id).single();
              if (profile?.phone) {
                const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
                const msg = `💳 *GlobeTrek PK — Subscription Upgraded!* 🎉\n\nDear *${profile.full_name || "Vendor"}*,\n\nYour payment of *Rs ${payment.amount}* via SafePay was successful! You have been upgraded to the *${meta.tier.toUpperCase()} Plan*!\n\nManage your subscription:\nhttps://globetrek.pk/vendor/billing`;
                await sendWhatsAppMessage({ data: { phone: profile.phone, message: msg, skipDeduplication: true } });
              }
            } catch (waErr) {
              console.error("Subscription upgrade WhatsApp alert error:", waErr);
            }
          } else if (meta?.type === "addon" && meta.addonId && payment.owner_id) {
            // Fulfill addon
            const startsAt = new Date();
            const expiresAt = new Date();
            let durationDays = 30;
            if (meta.billingPeriod?.includes("week") || meta.billingPeriod?.includes("7")) durationDays = 7;
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            const { data: existing } = await supabaseAdmin
              .from("payment_gateway_settings")
              .select("config")
              .eq("provider", "vendor_active_addons")
              .maybeSingle();

            const currentList: any[] = (existing?.config as any[]) || [];
            currentList.unshift({
              id: `addon_sub_${Date.now()}`,
              vendor_id: payment.owner_id,
              addon_id: meta.addonId,
              addon_title: meta.addonTitle,
              amount_pkr: payment.amount,
              billing_period: meta.billingPeriod || "monthly",
              starts_at: startsAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              status: "active",
            });

            await supabaseAdmin.from("payment_gateway_settings").upsert(
              { provider: "vendor_active_addons", config: currentList, enabled: true, updated_at: new Date().toISOString() },
              { onConflict: "provider" }
            );
          } else if (payment.booking_id) {
            // Fulfill booking
            await supabaseAdmin
              .from("bookings")
              .update({ status: "confirmed" })
              .eq("id", payment.booking_id);
          }

          // Trigger affiliate commission for subscription payments
          try {
            const { data: booking } = await supabaseAdmin
              .from("bookings")
              .select("vendor_id, service_type, total_amount")
              .eq("id", payment.booking_id)
              .maybeSingle();
            if (booking?.vendor_id) {
              const { triggerAffiliateCommission } = await import("@/lib/affiliate.functions");
              await triggerAffiliateCommission({
                vendorUserId: booking.vendor_id,
                planName: booking.service_type ?? "subscription",
                planAmountPkr: booking.total_amount ?? 0,
                paymentRef: token,
                isUpgrade: false,
              });
            }
          } catch (affErr) {
            console.error("[Affiliate commission trigger error]", affErr);
          }

          return Response.json({ ok: true, fulfilled: payment.id });
        }
        if (FAILED_STATES.has(state)) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", reference: token })
            .eq("id", payment.id);
          return Response.json({ ok: true, failed: payment.id });
        }
        return Response.json({ ok: true, state });
      },
    },
  },
});
