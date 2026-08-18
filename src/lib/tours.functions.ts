import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateItinerary, wrapItinerary } from "@/lib/tour-admin-utils";
import type { ItineraryDay, TourRequirement, TourAccommodation } from "@/lib/tours";


export type TourInput = {
  id?: string;
  vendor_id: string;
  title: string;
  description: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string;
  is_active: boolean;
  itinerary: ItineraryDay[];
  requirements?: TourRequirement[];
  accommodation?: TourAccommodation;
  extra_notes?: string;
};

function validateTour(t: TourInput): string | null {
  if (!t.vendor_id) return "Vendor is required.";
  if (!t.title.trim()) return "Title is required.";
  if (t.title.trim().length > 160) return "Title must be 160 characters or fewer.";
  if (!t.destination_country) return "Destination is required.";
  if (!t.departure_city) return "Departure city is required.";
  if (!Number.isFinite(t.duration_days) || t.duration_days < 1) return "Duration must be at least 1 day.";
  if (t.duration_days > 60) return "Duration cannot exceed 60 days.";
  if (!Number.isFinite(t.price_pkr) || t.price_pkr < 0) return "Price must be ≥ 0.";
  if (t.price_pkr > 100_000_000) return "Price is unrealistically high.";
  if (!Number.isFinite(t.total_seats) || t.total_seats < 1) return "Total seats must be ≥ 1.";
  if (t.image_url && !/^https?:\/\//i.test(t.image_url)) return "Image URL must start with http(s)://.";
  const iv = validateItinerary(t.itinerary, {
    durationDays: Number(t.duration_days) || 1,
    requireForPublish: t.is_active,
  });
  return iv.error ?? null;
}

function cleanRequirements(items?: TourRequirement[]) {
  if (!items) return null;
  const out = items
    .map((r) => ({
      item: (r.item ?? "").trim(),
      required: Boolean(r.required),
      note: r.note?.trim() || undefined,
    }))
    .filter((r) => r.item);
  return out.length ? out : null;
}

function cleanAccommodation(acc?: TourAccommodation) {
  if (!acc) return null;
  const std = acc.standard?.trim();
  const premDesc = acc.premium?.description?.trim();
  const premAdd = Number(acc.premium?.additional_pkr ?? 0);
  const out: Record<string, unknown> = {};
  if (std) out.standard = std;
  if (premDesc) out.premium = { description: premDesc, additional_pkr: Number.isFinite(premAdd) ? premAdd : 0 };
  if (acc.return_tickets_included !== undefined) out.return_tickets_included = Boolean(acc.return_tickets_included);
  if (acc.visa_included !== undefined) out.visa_included = Boolean(acc.visa_included);
  if (acc.insurance_included !== undefined) out.insurance_included = Boolean(acc.insurance_included);
  if (acc.hotel_breakfast !== undefined) out.hotel_breakfast = Boolean(acc.hotel_breakfast);
  if (acc.hotel_wifi !== undefined) out.hotel_wifi = Boolean(acc.hotel_wifi);
  if (acc.departure_date) out.departure_date = acc.departure_date;
  if (acc.return_date) out.return_date = acc.return_date;
  if (acc.booking_deadline) out.booking_deadline = acc.booking_deadline;
  if (acc.valid_until) out.valid_until = acc.valid_until;
  return Object.keys(out).length ? out : null;
}

export const saveTourServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: TourInput) => data)
  .handler(async ({ data, context }) => {
    const err = validateTour(data);
    if (err) throw new Error(err);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const targetVendorId = data.vendor_id || context.userId;

    // Enforce KYC verification for live publishing
    if (data.is_active && !isAdmin) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("vendor_status")
        .eq("id", targetVendorId)
        .maybeSingle();

      const isApproved = profile?.vendor_status === "approved";
      if (!isApproved) {
        throw new Error(
          "Agency Verification Required: Unverified accounts can only save listings as Draft in Setup Mode. Submit and complete your KYC verification to publish live on GlobeTrek PK."
        );
      }
    }

    const client = isAdmin ? supabaseAdmin : context.supabase;
    const { enforceVendorLimits } = await import("@/lib/vendors.functions");
    await enforceVendorLimits(client, targetVendorId, data.is_active);

    const payload = {
      vendor_id: targetVendorId,
      title: data.title.trim(),
      description: data.description,
      destination_country: data.destination_country,
      departure_city: data.departure_city,
      duration_days: Number(data.duration_days),
      price_pkr: Number(data.price_pkr),
      total_seats: Number(data.total_seats),
      image_url: data.image_url.trim() || null,
      is_active: data.is_active,
      itinerary: wrapItinerary(data.itinerary),
      requirements: cleanRequirements(data.requirements),
      accommodation: cleanAccommodation(data.accommodation),
      extra_notes: data.extra_notes?.trim() || null,
    };

    if (data.id) {
      const { error } = await client.from("tours").update(payload as never).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id, mode: "update" as const };
    }
    const { data: inserted, error } = await client
      .from("tours")
      .insert(payload as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, mode: "insert" as const };
  });

export const setTourPublishedServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; is_active: boolean; targetVendorId?: string }) => data)
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
          "Agency Verification Required: You must complete KYC verification and receive Admin approval before publishing live tour packages."
        );
      }
    }

    const client = isAdmin ? supabaseAdmin : context.supabase;
    const { enforceVendorLimits } = await import("@/lib/vendors.functions");
    await enforceVendorLimits(client, targetVendorId, data.is_active);

    const { error } = await client
      .from("tours")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
