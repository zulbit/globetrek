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
    url.searchParams.set("name", `${firstName} ${lastName}`);
    url.searchParams.set("phone", phone);
    url.searchParams.set("phone_number", phone);
    url.searchParams.set("city", "Karachi");
    url.searchParams.set("street", "Shahrah-e-Faisal");
    url.searchParams.set("street_address", "Shahrah-e-Faisal");
    url.searchParams.set("address", "Shahrah-e-Faisal");
    url.searchParams.set("country", "Pakistan");
    url.searchParams.set("country_code", "PK");
    url.searchParams.set("postal_code", "74000");
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

// -------- Admin & Public: get subscription & placement plans --------
export const getSubscriptionPlans = createServerFn({ method: "GET" })
  .validator((input?: { includeDisabled?: boolean }) => input ?? {})
  .handler(async ({ data }) => {
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

    // 1. Try payment_gateway_settings table first (guaranteed to exist on remote DB)
    const { data: gatewayData } = await supabase
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "subscription_plans")
      .maybeSingle();

    if (gatewayData?.config && Array.isArray(gatewayData.config) && gatewayData.config.length > 0) {
      const allPlans = gatewayData.config as any[];
      if (data?.includeDisabled) return allPlans;
      return allPlans.filter((p) => p.is_enabled !== false);
    }

    // 2. Fallback to public.subscription_plans table if present
    try {
      let query = supabase.from("subscription_plans").select("*").order("display_order", { ascending: true });
      if (!data?.includeDisabled) {
        query = query.eq("is_enabled", true);
      }
      const { data: plans } = await query;
      if (plans && plans.length > 0) return plans;
    } catch {
      // Table doesn't exist
    }

    return null;
  });

// -------- Admin: toggle subscription or placement plan enabled/disabled --------
export const togglePlanEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { planId: string; isEnabled: boolean }) => {
    if (!input.planId) throw new Error("Plan ID required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing config from payment_gateway_settings
    const { data: existing } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "subscription_plans")
      .maybeSingle();

    let plansList: any[] = (existing?.config as any[]) || [];

    if (plansList.length > 0) {
      plansList = plansList.map((p) => (p.id === data.planId ? { ...p, is_enabled: data.isEnabled } : p));
    }

    const { error: gwErr } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert(
        { provider: "subscription_plans", config: plansList, enabled: true, updated_at: new Date().toISOString() },
        { onConflict: "provider" }
      );

    if (gwErr) throw new Error(gwErr.message);

    // Also attempt update on subscription_plans table silently
    try {
      await supabaseAdmin
        .from("subscription_plans")
        .update({ is_enabled: data.isEnabled, updated_at: new Date().toISOString() })
        .eq("id", data.planId);
    } catch {
      // Ignore if table missing
    }

    return { ok: true };
  });

// -------- Admin: save / update dynamic subscription plans --------
export const saveSubscriptionPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let plansToSave: any[] = [];

    if (Array.isArray(data)) {
      plansToSave = data;
    } else {
      // Single plan creation
      const { data: existing } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "subscription_plans")
        .maybeSingle();

      const existingPlans: any[] = (existing?.config as any[]) || [];
      const newPlan = {
        id: data.id || `custom_${Date.now()}`,
        name: data.name,
        plan_type: data.plan_type || "base",
        price_pkr: Number(data.price_pkr || 0),
        billing_period: data.billing_period || "monthly",
        tagline: data.tagline || "",
        archetype: data.archetype || "",
        icon_name: data.icon_name || "Sparkles",
        accent: data.accent || "primary",
        covers: data.covers || ["tours"],
        features: data.features || [],
        limits: data.limits || {},
        is_enabled: data.is_enabled !== undefined ? Boolean(data.is_enabled) : true,
        display_order: Number(data.display_order || existingPlans.length + 1),
        updated_at: new Date().toISOString(),
      };

      const existingIndex = existingPlans.findIndex((p) => p.id === newPlan.id);
      if (existingIndex >= 0) {
        existingPlans[existingIndex] = newPlan;
      } else {
        existingPlans.push(newPlan);
      }
      plansToSave = existingPlans;
    }

    // Always save to payment_gateway_settings (guaranteed working)
    const { error: gwErr } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert(
        { provider: "subscription_plans", config: plansToSave, enabled: true, updated_at: new Date().toISOString() },
        { onConflict: "provider" }
      );

    if (gwErr) throw new Error(gwErr.message);

    // Try subscription_plans table silently
    try {
      await supabaseAdmin.from("subscription_plans").upsert(plansToSave, { onConflict: "id" });
    } catch {
      // Ignore if table missing
    }

    return { ok: true, plans: plansToSave };
  });

// -------- Vendor: activate / purchase addon subscription --------
export const activateVendorAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { addonId: string; addonTitle: string; amountPKR: number; billingPeriod: string }) => {
    if (!input.addonId || !input.addonTitle) throw new Error("Addon details required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const durationDays = data.billingPeriod === "weekly" ? 7 : 30;
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Save to vendor_addon_subscriptions table
    try {
      await supabaseAdmin.from("vendor_addon_subscriptions").insert({
        vendor_id: context.userId,
        addon_id: data.addonId,
        addon_title: data.addonTitle,
        amount_pkr: Number(data.amountPKR || 0),
        billing_period: data.billingPeriod || "monthly",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      });
    } catch {
      // Table fallback handled below
    }

    // 2. Save to payment_gateway_settings as vendor_active_addons fallback
    const { data: existing } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "vendor_active_addons")
      .maybeSingle();

    const currentList: any[] = (existing?.config as any[]) || [];
    const newAddonRecord = {
      id: `addon_sub_${Date.now()}`,
      vendor_id: context.userId,
      addon_id: data.addonId,
      addon_title: data.addonTitle,
      amount_pkr: Number(data.amountPKR || 0),
      billing_period: data.billingPeriod || "monthly",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
    };

    currentList.unshift(newAddonRecord);

    await supabaseAdmin.from("payment_gateway_settings").upsert(
      { provider: "vendor_active_addons", config: currentList, enabled: true, updated_at: new Date().toISOString() },
      { onConflict: "provider" }
    );

    return { ok: true, activeAddon: newAddonRecord };
  });

// -------- Vendor: get active addon subscriptions --------
export const getVendorActiveAddons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nk5WJj0qOmSimrFmwh7ZWQ_teiVWYtE";
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://rcldabxkcwfemnigwutk.supabase.co";
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: gatewayData } = await supabase
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "vendor_active_addons")
      .maybeSingle();

    if (gatewayData?.config && Array.isArray(gatewayData.config)) {
      const vendorAddons = (gatewayData.config as any[]).filter(
        (a) => a.vendor_id === context.userId && new Date(a.expires_at) > new Date()
      );
      return vendorAddons;
    }

    return [];
  });
