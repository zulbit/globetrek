import { createFileRoute } from "@tanstack/react-router";

const SUCCESS_STATES = new Set([
  "TRACKER_COMPLETED",
  "COMPLETED",
  "PAID",
  "PAYMENT.SUCCEEDED",
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

export const Route = createFileRoute("/api/public/safepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        // Match payment by reference; fallback to recent pending safepay row
        let { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, booking_id, status")
          .eq("reference", token)
          .maybeSingle();

        if (!payment) {
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
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
