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

                // Notify traveler
                const travelerMsg = `*GlobeTrek PK — Travel Partner Found!* 🎉\n\nDear *${lead.contact_name}*,\n\nGreat news! A verified travel partner (*${vendorName}*) has unlocked your custom tour request to *${lead.destination}*.\n\nThey will reach out to you on this number shortly with options and quotes!`;
                await sendWhatsAppMessage({
                  data: {
                    phone: lead.contact_phone,
                    message: travelerMsg,
                    skipDeduplication: true
                  }
                });
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
            return Response.json({ ok: true, failed_lead: leadPayment.id });
          }
          return Response.json({ ok: true, lead_state: state });
        }

        // 2. Try matching with regular booking payments
        let { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, booking_id, status")
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
            .select("id, booking_id, status")
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
          if (payment.booking_id) {
            await supabaseAdmin
              .from("bookings")
              .update({ status: "confirmed" })
              .eq("id", payment.booking_id);
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
