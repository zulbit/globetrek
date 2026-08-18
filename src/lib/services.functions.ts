import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ServiceType = "visa" | "insurance" | "tickets";

const TABLES: Record<ServiceType, "visa_services" | "insurance_plans" | "ticket_services"> = {
  visa: "visa_services",
  insurance: "insurance_plans",
  tickets: "ticket_services",
};

/* ============ Save (upsert) ============ */

export const saveServiceListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    serviceType: ServiceType;
    id?: string;
    data: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    const table = TABLES[data.serviceType];
    if (!table) throw new Error("Invalid service type");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const targetVendorId = (data.data.vendor_id as string) || context.userId;

    const isActive = Boolean(data.data.is_active);
    if (isActive && !isAdmin) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("vendor_status")
        .eq("id", targetVendorId)
        .maybeSingle();

      const isApproved = profile?.vendor_status === "approved";
      if (!isApproved) {
        throw new Error(
          "Agency Verification Required: Unverified accounts can only save listings as Draft in Setup Mode. Please complete KYC verification to publish live."
        );
      }
    }

    const client = isAdmin ? supabaseAdmin : context.supabase;
    const { enforceVendorLimits } = await import("@/lib/vendors.functions");
    await enforceVendorLimits(client, targetVendorId, isActive);

    const payload = { ...data.data, vendor_id: targetVendorId };
    if (data.id) {
      const { error } = await client
        .from(table).update(payload as never).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id, mode: "update" as const };
    }
    const { data: inserted, error } = await client
      .from(table).insert(payload as never).select("id").single();
    if (error) throw new Error(error.message);
    return { id: (inserted as { id: string }).id, mode: "insert" as const };
  });

/* ============ Toggle active ============ */

export const toggleServiceActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { serviceType: ServiceType; id: string; is_active: boolean; targetVendorId?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const targetVendorId = data.targetVendorId || context.userId;

    if (data.is_active && !isAdmin) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("vendor_status")
        .eq("id", targetVendorId)
        .maybeSingle();

      const isApproved = profile?.vendor_status === "approved";
      if (!isApproved) {
        throw new Error(
          "Agency Verification Required: You must complete KYC verification and receive Admin approval before publishing live listings."
        );
      }
    }

    const client = isAdmin ? supabaseAdmin : context.supabase;
    const { enforceVendorLimits } = await import("@/lib/vendors.functions");
    await enforceVendorLimits(client, targetVendorId, data.is_active);

    const table = TABLES[data.serviceType];
    const { error } = await client
      .from(table).update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Delete ============ */

export const deleteServiceListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { serviceType: ServiceType; id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const client = isAdmin ? supabaseAdmin : context.supabase;

    const table = TABLES[data.serviceType];
    const { error } = await client.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Update vendor's offered services ============ */

const VALID_SERVICES = ["tours", "visa", "insurance", "tickets"] as const;

export const updateVendorServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { services: string[]; targetVendorId?: string }) => {
    const cleaned = Array.from(new Set(d.services)).filter((s) =>
      (VALID_SERVICES as readonly string[]).includes(s),
    );
    if (cleaned.length === 0) throw new Error("Select at least one service type.");
    return { services: cleaned, targetVendorId: d.targetVendorId };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const targetVendorId = data.targetVendorId || context.userId;
    const client = isAdmin ? supabaseAdmin : context.supabase;

    const { error } = await client
      .from("profiles")
      .update({ vendor_services: data.services as never })
      .eq("id", targetVendorId);
    if (error) throw new Error(error.message);
    return { ok: true, services: data.services };
  });
