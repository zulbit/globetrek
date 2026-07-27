import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export interface CustomTourLead {
  id: string;
  departure_city: string;
  destination: string;
  travel_month: string;
  duration_days: number;
  group_size: number;
  group_type: string;
  hotel_tier: string;
  visa_needed: boolean;
  insurance_needed: boolean;
  flight_class: string;
  special_requests: string | null;
  status: string;
  created_at: string;
  is_unlocked: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

// -------- Get all custom tour leads for the vendor marketplace --------
export const getMarketplaceLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomTourLead[]> => {
    const vendorId = context.userId;

    // Fetch all pending leads
    const { data: leads, error: leadsErr } = await context.supabase
      .from("custom_tour_leads")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (leadsErr) throw new Error(leadsErr.message);
    if (!leads) return [];

    // Fetch leads unlocked by this vendor
    const { data: purchased, error: purErr } = await context.supabase
      .from("vendor_lead_purchases")
      .select("lead_id")
      .eq("vendor_id", vendorId);

    if (purErr) throw new Error(purErr.message);

    const purchasedIds = new Set((purchased ?? []).map((p) => p.lead_id));

    // Map through leads. If unlocked, include contact details. Otherwise, omit/hide.
    return leads.map((lead: any) => {
      const isUnlocked = purchasedIds.has(lead.id);
      return {
        id: lead.id,
        departure_city: lead.departure_city,
        destination: lead.destination,
        travel_month: lead.travel_month,
        duration_days: lead.duration_days,
        group_size: lead.group_size,
        group_type: lead.group_type,
        hotel_tier: lead.hotel_tier,
        visa_needed: lead.visa_needed,
        insurance_needed: lead.insurance_needed,
        flight_class: lead.flight_class,
        special_requests: lead.special_requests,
        status: lead.status,
        created_at: lead.created_at,
        is_unlocked: isUnlocked,
        ...(isUnlocked
          ? {
              contact_name: lead.contact_name,
              contact_email: lead.contact_email,
              contact_phone: lead.contact_phone,
            }
          : {}),
      };
    });
  });

// -------- Create SafePay checkout session to unlock a lead for ₨ 5,000 --------
export const createLeadUnlockCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string }) => {
    if (!input.leadId) throw new Error("Lead ID required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const vendorId = context.userId;

    // Verify if already unlocked
    const { data: existing } = await context.supabase
      .from("vendor_lead_purchases")
      .select("id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (existing) {
      throw new Error("You have already unlocked this lead");
    }

    // Get lead details (to show in invoice / metadata)
    const { data: lead } = await context.supabase
      .from("custom_tour_leads")
      .select("destination")
      .eq("id", data.leadId)
      .single();

    if (!lead) throw new Error("Lead not found");

    // Fetch vendor profile for invoicing info
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", vendorId)
      .single();

    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl =
      env === "production" || env === "live"
        ? "https://api.getsafepay.com"
        : "https://sandbox.api.getsafepay.com";
    const secretKey = process.env.SAFEPAY_SECRET_KEY;
    if (!secretKey) throw new Error("SafePay secret key not configured");

    const amount = 5000; // Rs 5,000 per lead unlock
    const name = profile?.full_name || "Vendor";
    const email = profile?.email || "vendor@globetrek.pk";
    const phone = "+923000000000"; // Fallback phone for invoice records

    // Clean phone
    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    const formattedPhone = digits.startsWith("92") ? `+${digits}` : `+92${digits}`;
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    // Create QuickLink via SafePay invoice API
    const qlRes = await fetch(`${baseUrl}/invoice/quick-links/v2/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": secretKey,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "PKR",
        note: `Lead Unlock: ${lead.destination}`,
        workflow: "MANUAL",
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: formattedPhone,
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
    url.searchParams.set("email", "vendor@globetrek.pk");
    url.searchParams.set("first_name", firstName);
    url.searchParams.set("last_name", lastName);
    url.searchParams.set("phone", formattedPhone);
    const checkoutUrl = url.toString();

    // Create a pending lead unlock payment record using admin client (bypasses RLS limits)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: payErr } = await supabaseAdmin.from("lead_unlock_payments").insert({
      lead_id: data.leadId,
      vendor_id: vendorId,
      amount: amount,
      currency: "PKR",
      payment_intent_id: trackerId,
      status: "pending",
    });

    if (payErr) throw new Error(payErr.message);

    return { ok: true, checkoutUrl, trackerToken: trackerId };
  });

export const verifyLeadUnlockPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string }) => {
    if (!input.leadId) throw new Error("leadId required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { loadEnv } = await import("@/lib/env.server");
    loadEnv();
    const vendorId = context.userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch pending payment record
    const { data: payment, error: payErr } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("id, lead_id, vendor_id, payment_intent_id, status")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .eq("status", "pending")
      .maybeSingle();

    if (payErr) throw new Error(payErr.message);
    if (!payment) {
      // Check if already unlocked
      const { data: purchase } = await supabaseAdmin
        .from("vendor_lead_purchases")
        .select("purchased_at")
        .eq("lead_id", data.leadId)
        .eq("vendor_id", vendorId)
        .maybeSingle();
      if (purchase) {
        return { ok: true, unlocked: true, message: "Lead is already unlocked!" };
      }
      throw new Error("No pending payment found for this lead.");
    }

    // 2. Fetch status from Safepay API
    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";
    const secretKey = process.env.SAFEPAY_SECRET_KEY;
    if (!secretKey) throw new Error("SafePay secret key not configured");

    const url = `${baseUrl}/v1/payments/track_${payment.payment_intent_id}`;
    const sfRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-SFPY-MERCHANT-SECRET": secretKey,
      }
    });

    if (!sfRes.ok) {
      const txt = await sfRes.text();
      throw new Error(`SafePay tracker lookup failed: ${sfRes.status} ${txt.slice(0, 100)}`);
    }

    const sfJson = (await sfRes.json()) as {
      ok?: boolean;
      data?: { state?: string };
    };

    const state = sfJson.data?.state?.toUpperCase();
    const successStates = new Set(["PAYMENT.COMPLETED", "TRACKER_COMPLETED", "COMPLETED", "PAID", "SUCCEEDED"]);

    if (state && successStates.has(state)) {
      // 3. Mark as completed and unlock
      await supabaseAdmin
        .from("lead_unlock_payments")
        .update({ status: "completed" })
        .eq("id", payment.id);

      await supabaseAdmin
        .from("vendor_lead_purchases")
        .upsert(
          { lead_id: payment.lead_id, vendor_id: payment.vendor_id },
          { onConflict: "lead_id,vendor_id" }
        );

      // Trigger WhatsApp notifications
      try {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const [leadRes] = await Promise.all([
          supabaseAdmin
            .from("custom_tour_leads")
            .select("contact_name, contact_phone, destination")
            .eq("id", payment.lead_id)
            .single()
        ]);

        if (leadRes.data) {
          const lead = leadRes.data;
          const vendorName = "a verified travel agent";

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
        console.error("Manual verification notification error:", waErr);
      }

      return { ok: true, unlocked: true, message: "Lead unlocked successfully!" };
    } else {
      return { ok: true, unlocked: false, message: `Payment status is: ${state || "unknown"}` };
    }
  });
