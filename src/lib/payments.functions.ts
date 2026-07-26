import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// -------- Public: read gateway settings --------
export const getGatewaySettings = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nk5WJj0qOmSimrFmwh7ZWQ_teiVWYtE";
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://rcldabxkcwfemnigwutk.supabase.co";
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabase
    .from("payment_gateway_settings")
    .select("provider, enabled");
  if (error) throw new Error(error.message);
  return (data ?? []) as { provider: string; enabled: boolean }[];
});

// -------- Admin: toggle gateway enabled --------
export const setGatewayEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; enabled: boolean }) => {
    if (!input.provider) throw new Error("provider required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert(
        { provider: data.provider, enabled: data.enabled, updated_at: new Date().toISOString() },
        { onConflict: "provider" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Customer: create SafePay checkout link --------
type CheckoutInput = {
  tourId: string;
  guests: number;
  amountPKR: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  tourTitle: string;
};

export const createSafepayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CheckoutInput) => {
    if (!input.tourId || !input.amountPKR || input.amountPKR <= 0) throw new Error("Invalid input");
    if (!input.guestName || !input.guestEmail || !input.guestPhone) throw new Error("Missing guest info");
    return input;
  })
  .handler(async ({ data, context }) => {
    // Check gateway enabled
    const { data: setting } = await context.supabase
      .from("payment_gateway_settings")
      .select("enabled")
      .eq("provider", "safepay")
      .maybeSingle();
    if (!setting?.enabled) throw new Error("SafePay is currently disabled by the admin.");

    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";
    const secretKey = process.env.SAFEPAY_SECRET_KEY;
    if (!secretKey) throw new Error("SafePay secret key not configured");

    // Clean phone → +92
    const digits = data.guestPhone.replace(/\D/g, "").replace(/^0+/, "");
    const phone = digits.startsWith("92") ? `+${digits}` : `+92${digits}`;
    const [firstName, ...rest] = data.guestName.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    // Create QuickLink
    const qlRes = await fetch(`${baseUrl}/invoice/quick-links/v2/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": secretKey,
      },
      body: JSON.stringify({
        amount: Math.round(data.amountPKR),
        currency: "PKR",
        note: `Booking – ${data.tourTitle}`,
        workflow: "MANUAL",
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: data.guestEmail,
          phone_number: phone,
        },
      }),
    });
    if (!qlRes.ok) {
      const txt = await qlRes.text();
      throw new Error(`SafePay checkout failed: ${qlRes.status} ${txt.slice(0, 200)}`);
    }
    const qlJson = (await qlRes.json()) as {
      data?: { id?: string; metadata?: { recipient_view_url?: string }[] };
    };
    const trackerId = qlJson.data?.id;
    const recipientUrl = qlJson.data?.metadata?.[0]?.recipient_view_url;
    if (!trackerId || !recipientUrl) throw new Error("Invalid SafePay response");

    const url = new URL(recipientUrl);
    url.searchParams.set("email", data.guestEmail);
    url.searchParams.set("first_name", firstName);
    url.searchParams.set("last_name", lastName);
    url.searchParams.set("phone", phone);
    const checkoutUrl = url.toString();

    // Create pending booking + payment record
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        tour_id: data.tourId,
        customer_id: context.userId,
        guests: data.guests,
        total_pkr: Math.round(data.amountPKR),
        status: "pending",
      })
      .select("id")
      .single();
    if (bkErr) throw new Error(bkErr.message);

    const { error: payErr } = await supabaseAdmin.from("payments").insert({
      booking_id: booking.id,
      owner_id: context.userId,
      amount: Math.round(data.amountPKR),
      currency: "PKR",
      method: "safepay",
      status: "pending",
      reference: trackerId,
      metadata: { env, tour_id: data.tourId },
    });
    if (payErr) throw new Error(payErr.message);

    return { ok: true, checkoutUrl, trackerToken: trackerId };
  });
