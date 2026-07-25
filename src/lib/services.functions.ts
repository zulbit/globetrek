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
  .inputValidator((d: {
    serviceType: ServiceType;
    id?: string;
    data: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    const table = TABLES[data.serviceType];
    if (!table) throw new Error("Invalid service type");

    const payload = { ...data.data, vendor_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase
        .from(table).update(payload as never).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id, mode: "update" as const };
    }
    const { data: inserted, error } = await context.supabase
      .from(table).insert(payload as never).select("id").single();
    if (error) throw new Error(error.message);
    return { id: (inserted as { id: string }).id, mode: "insert" as const };
  });

/* ============ Toggle active ============ */

export const toggleServiceActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceType: ServiceType; id: string; is_active: boolean }) => d)
  .handler(async ({ data, context }) => {
    const table = TABLES[data.serviceType];
    const { error } = await context.supabase
      .from(table).update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Delete ============ */

export const deleteServiceListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceType: ServiceType; id: string }) => d)
  .handler(async ({ data, context }) => {
    const table = TABLES[data.serviceType];
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Update vendor's offered services ============ */

const VALID_SERVICES = ["tours", "visa", "insurance", "tickets"] as const;

export const updateVendorServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { services: string[] }) => {
    const cleaned = Array.from(new Set(d.services)).filter((s) =>
      (VALID_SERVICES as readonly string[]).includes(s),
    );
    if (cleaned.length === 0) throw new Error("Select at least one service type.");
    return { services: cleaned };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ vendor_services: data.services as never })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, services: data.services };
  });
