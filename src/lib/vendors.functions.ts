import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface VendorProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  vendor_status: string;
  subscription_tier: string;
  lead_credits_balance: number;
  created_at?: string;
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

    // 2. Fetch all profiles via admin service key
    const { data: profilesData, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, company_name, phone, vendor_status, subscription_tier, lead_credits_balance, created_at")
      .order("created_at", { ascending: false });

    if (profilesErr) {
      console.error("[getAdminVendors Profiles Error]:", profilesErr);
      throw new Error(profilesErr.message);
    }

    // 3. Filter profiles that have vendor role, company_name, or pending vendor_status
    const vendors = (profilesData ?? []).filter((p: any) => {
      if (vendorUserIds.has(p.id)) return true;
      if (p.company_name) return true;
      if (p.vendor_status === "pending") return true;
      if (p.email && p.email.toLowerCase().includes("vendor")) return true;
      return false;
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
  .validator((data: { id: string; tier: "free" | "pro" }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ subscription_tier: data.tier })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
