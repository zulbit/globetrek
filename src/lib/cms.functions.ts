import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type LandingCMSSettings = {
  featured_tours_limit: number; // 4, 8, 12, 16
  featured_tours_layout: "grid_4" | "grid_3" | "carousel";
  featured_tours_heading: string;
  featured_tours_subheading: string;
  hero_title: string;
  hero_subtitle: string;
};

const DEFAULT_SETTINGS: LandingCMSSettings = {
  featured_tours_limit: 8,
  featured_tours_layout: "grid_4",
  featured_tours_heading: "Trending international departures",
  featured_tours_subheading: "Hand-picked experiences from verified Pakistani travel vendors — priced in PKR.",
  hero_title: "Compare & Book Travel Packages Across Pakistan",
  hero_subtitle: "Verified Pakistani travel operators, visa desks, and insurance providers in one transparent marketplace.",
};

const CMS_STORAGE_KEY = "landing_cms_settings";

function getAnonClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nk5WJj0qOmSimrFmwh7ZWQ_teiVWYtE";
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://rcldabxkcwfemnigwutk.supabase.co";
  return createClient<Database>(url, key, {
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
}

// -------- Public: read landing page CMS settings --------
export const getLandingCMSSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getAnonClient();
    const { data } = await supabase
      .from("payment_gateway_settings")
      .select("enabled")
      .eq("provider", CMS_STORAGE_KEY)
      .maybeSingle();

    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse((data as any).enabled ?? "{}") as Partial<LandingCMSSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

// -------- Admin: save landing page CMS settings --------
export const saveLandingCMSSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: LandingCMSSettings) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const jsonPayload = JSON.stringify(data);

    const { error } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert(
        { provider: CMS_STORAGE_KEY, enabled: jsonPayload as any, updated_at: new Date().toISOString() },
        { onConflict: "provider" }
      );

    if (error) throw new Error(error.message);
    return { ok: true, settings: data };
  });
