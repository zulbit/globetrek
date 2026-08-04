import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface VendorProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  city?: string | null;
  vendor_status: string;
  subscription_tier: string;
  lead_credits_balance: number;
  created_at?: string;
  kycDetails?: Record<string, any>;
}

export const getAdminVendors = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // 1. Fetch all vendor user IDs from user_roles via admin service key
    const { data: rolesData, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "vendor");

    if (rolesErr) {
      console.error("[getAdminVendors Roles Error]:", rolesErr);
    }

    const vendorUserIds = new Set((rolesData ?? []).map((r: any) => r.user_id));

    // 2. Fetch all profiles via admin service key (selecting only actual table columns)
    const { data: profilesData, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, company_name, vendor_status, subscription_tier, lead_credits_balance, created_at, city")
      .order("created_at", { ascending: false });

    if (profilesErr) {
      console.error("[getAdminVendors Profiles Error]:", profilesErr);
      throw new Error(profilesErr.message);
    }

    // 3. Fetch all submitted KYC details from payment_gateway_settings
    const { data: kycRecords } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("provider, settings")
      .like("provider", "vendor_kyc_%");

    const kycMap = new Map<string, any>();
    (kycRecords ?? []).forEach((r) => {
      const uId = r.provider.replace("vendor_kyc_", "");
      try {
        const parsed = typeof r.settings === "string" ? JSON.parse(r.settings) : r.settings;
        if (parsed?.fields) kycMap.set(uId, parsed.fields);
      } catch {}
    });

    // 4. Filter and enhance vendor profiles with KYC data
    const vendors = (profilesData ?? [])
      .filter((p: any) => {
        if (vendorUserIds.has(p.id)) return true;
        if (p.company_name) return true;
        if (p.vendor_status === "pending") return true;
        if (p.email && p.email.toLowerCase().includes("vendor")) return true;
        return false;
      })
      .map((p: any) => {
        const kycFields = kycMap.get(p.id) || {};
        return {
          ...p,
          phone: kycFields.phone || p.phone || null,
          kycDetails: kycFields,
        };
      });

    return vendors as VendorProfile[];
  } catch (err: any) {
    console.error("[getAdminVendors Exception]:", err);
    throw new Error(err.message || "Failed to fetch vendors");
  }
});

export const updateAdminVendorStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: "approved" | "banned" | "pending" }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ vendor_status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateAdminVendorCredits = createServerFn({ method: "POST" })
  .validator((data: { id: string; next: number }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ lead_credits_balance: Math.max(0, data.next) })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateAdminVendorTier = createServerFn({ method: "POST" })
  .validator((data: { id: string; tier: "free" | "starter" | "pro" | "agency" }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ subscription_tier: data.tier })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
