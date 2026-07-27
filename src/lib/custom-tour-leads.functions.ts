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
  has_pending_payment: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

// -------- Get all custom tour leads for the vendor marketplace --------
export const getMarketplaceLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomTourLead[]> => {
    const vendorId = context.userId;

    // Fetch all verified leads that have not reached max unlocks limit
    const { data: leads, error: leadsErr } = await context.supabase
      .from("custom_tour_leads")
      .select("*")
      .in("status", ["verified", "pending"]) // support legacy 'pending' as verified
      .order("created_at", { ascending: false });

    if (leadsErr) throw new Error(leadsErr.message);
    if (!leads) return [];

    // Filter leads where unlocked_count < max_unlocks (default 3)
    const availableLeads = leads.filter((l: any) => (l.unlocked_count ?? 0) < (l.max_unlocks ?? 3));
    if (availableLeads.length === 0) return [];

    // Fetch leads unlocked by this vendor
    const { data: purchased, error: purErr } = await context.supabase
      .from("vendor_lead_purchases")
      .select("lead_id")
      .eq("vendor_id", vendorId);

    if (purErr) throw new Error(purErr.message);

    // Fetch leads with a pending (initiated but unverified) payment by this vendor
    const { data: pendingPayments } = await context.supabase
      .from("lead_unlock_payments")
      .select("lead_id")
      .eq("vendor_id", vendorId)
      .eq("status", "pending");

    const purchasedIds = new Set((purchased ?? []).map((p) => p.lead_id));
    const pendingIds = new Set((pendingPayments ?? []).map((p) => p.lead_id));

    // Map through leads. If unlocked, include contact details. Otherwise, omit/hide.
    return availableLeads.map((lead: any) => {
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
        has_pending_payment: !isUnlocked && pendingIds.has(lead.id),
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
      throw new Error("You have already unlocked this lead.");
    }

    // Check for an existing PENDING payment — reuse its checkout URL instead of creating a duplicate
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pendingRows } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("payment_intent_id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (pendingRows?.[0]?.payment_intent_id) {
      const env2 = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
      const base2 = env2 === "production" || env2 === "live"
        ? "https://api.getsafepay.com"
        : "https://sandbox.api.getsafepay.com";
      const existingUrl = `${base2}/io/quick-link?ql=${pendingRows[0].payment_intent_id}`;
      return { ok: true, checkoutUrl: existingUrl, trackerToken: pendingRows[0].payment_intent_id };
    }

    // Get lead details (to check max unlocks and destination)
    const { data: lead } = await context.supabase
      .from("custom_tour_leads")
      .select("destination, status, unlocked_count, max_unlocks")
      .eq("id", data.leadId)
      .single();

    if (!lead) throw new Error("Lead not found");

    if (lead.status === "unverified") {
      throw new Error("This lead is pending admin verification");
    }

    if (lead.status === "accepted" || lead.status === "closed") {
      throw new Error("This lead is no longer active");
    }

    if ((lead.unlocked_count ?? 0) >= (lead.max_unlocks ?? 3)) {
      throw new Error("Maximum vendor unlock limit reached for this lead (3/3)");
    }

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

    // 1. Fetch most recent pending payment record (handles duplicate payments gracefully)
    const { data: payments, error: payErr } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("id, lead_id, vendor_id, payment_intent_id, status, created_at")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (payErr) throw new Error(payErr.message);
    const payment = payments?.[0] ?? null;

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

    // 2. Fetch QuickLink status from Safepay Invoice API
    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";
    const secretKey = process.env.SAFEPAY_SECRET_KEY;
    if (!secretKey) throw new Error("SafePay secret key not configured");

    // QuickLink status endpoint: GET /invoice/quick-links/v2/{id}
    const url = `${baseUrl}/invoice/quick-links/v2/${payment.payment_intent_id}`;
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

    // SafePay QuickLink GET response structure:
    // { "data": { "link": { "id": "link_...", "status": "PAID", ... } } }
    const sfJson = (await sfRes.json()) as Record<string, unknown>;
    const sfLink =
      ((sfJson.data as Record<string, unknown> | undefined)?.link as Record<string, unknown> | undefined) ??
      (sfJson.data as Record<string, unknown> | undefined) ??
      sfJson;

    const rawState =
      (sfLink.status as string) ||
      (sfLink.state as string) ||
      ((sfLink.payments as Array<{ state?: string; status?: string }> | undefined)?.[0]?.state) ||
      ((sfLink.payments as Array<{ state?: string; status?: string }> | undefined)?.[0]?.status) ||
      "";

    console.log("[verifyLeadUnlockPayment] sfLink:", JSON.stringify(sfLink).slice(0, 300));
    console.log("[verifyLeadUnlockPayment] Detected rawState:", rawState);

    const state = rawState.toUpperCase().replace(/\./g, "_");
    const successStates = new Set([
      "PAYMENT_COMPLETED", "PAYMENT_AUTHORIZED", "PAYMENT_SUCCEEDED",
      "TRACKER_COMPLETED", "COMPLETED", "PAID", "SUCCEEDED",
      "PAYMENT.COMPLETED", "PAYMENT.AUTHORIZED", "PAYMENT.SUCCEEDED",
    ]);

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

      // Increment unlocked_count on the lead
      const { data: currentLead } = await supabaseAdmin
        .from("custom_tour_leads")
        .select("unlocked_count")
        .eq("id", payment.lead_id)
        .single();

      const newCount = (currentLead?.unlocked_count ?? 0) + 1;
      await supabaseAdmin
        .from("custom_tour_leads")
        .update({ unlocked_count: newCount })
        .eq("id", payment.lead_id);

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
      return { ok: true, unlocked: false, message: `Payment status is: ${rawState || "unknown"} (raw: ${JSON.stringify(sfLink).slice(0, 200)})` };
    }
  });

// -------- Vendor: Submit Quotation for an Unlocked Lead --------
export const submitLeadQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: {
    leadId: string;
    quoteAmount: number;
    itinerarySummary: string;
    inclusions?: string[];
    pdfUrl?: string;
    validUntil?: string;
  }) => {
    if (!input.leadId) throw new Error("Lead ID required");
    if (!input.quoteAmount || input.quoteAmount <= 0) throw new Error("Valid price required");
    if (!input.itinerarySummary?.trim()) throw new Error("Itinerary summary required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const vendorId = context.userId;

    // Verify vendor has unlocked this lead
    const { data: purchase } = await context.supabase
      .from("vendor_lead_purchases")
      .select("id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (!purchase) {
      throw new Error("You must unlock this lead before submitting a quotation.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: quoteErr } = await supabaseAdmin.from("lead_quotes").upsert(
      {
        lead_id: data.leadId,
        vendor_id: vendorId,
        quote_amount: data.quoteAmount,
        itinerary_summary: data.itinerarySummary,
        inclusions: data.inclusions ?? [],
        pdf_url: data.pdfUrl ?? null,
        valid_until: data.validUntil ?? null,
        status: "submitted",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id,vendor_id" }
    );

    if (quoteErr) throw new Error(quoteErr.message);

    // Send WhatsApp notification to traveler about new quote ready
    try {
      const { data: lead } = await supabaseAdmin
        .from("custom_tour_leads")
        .select("contact_phone, contact_name, destination, access_token")
        .eq("id", data.leadId)
        .single();

      if (lead) {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const quoteUrl = `https://tour.testbench.shop/customer/quotes?token=${lead.access_token}`;
        const msg = `*GlobeTrek PK — New Quote Received!* ✈️\n\nDear *${lead.contact_name}*,\n\nA verified vendor has submitted a proposal of *Rs ${data.quoteAmount.toLocaleString()}* for your custom tour to *${lead.destination}*.\n\nReview & compare your quotes online here:\n${quoteUrl}`;
        await sendWhatsAppMessage({
          data: { phone: lead.contact_phone, message: msg, skipDeduplication: true }
        });
      }
    } catch (err) {
      console.error("Quote WhatsApp notification failed:", err);
    }

    return { ok: true, message: "Quotation submitted successfully!" };
  });

// -------- Admin: Verify & Publish Lead to Marketplace --------
export const verifyAndPublishLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string; adminNotes?: string }) => {
    if (!input.leadId) throw new Error("Lead ID required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("custom_tour_leads")
      .update({
        status: "verified",
        admin_notes: data.adminNotes ?? "Verified by admin",
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);

    if (error) throw new Error(error.message);

    return { ok: true, message: "Lead verified & published to Marketplace!" };
  });

// -------- Traveler: Accept a Quote & Close Lead --------
export const acceptLeadQuote = createServerFn({ method: "POST" })
  .validator((input: { quoteId: string; token: string }) => {
    if (!input.quoteId || !input.token) throw new Error("Quote ID and access token required");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch quote and verify access token
    const { data: quote, error: qErr } = await supabaseAdmin
      .from("lead_quotes")
      .select("id, lead_id, vendor_id, quote_amount, custom_tour_leads!inner(id, access_token, destination, contact_name, contact_phone)")
      .eq("id", data.quoteId)
      .single();

    if (qErr || !quote) throw new Error("Quote not found");
    const lead = quote.custom_tour_leads as any;

    if (lead.access_token !== data.token) {
      throw new Error("Invalid access token");
    }

    // Mark quote as accepted
    await supabaseAdmin
      .from("lead_quotes")
      .update({ status: "accepted" })
      .eq("id", data.quoteId);

    // Mark other quotes as declined
    await supabaseAdmin
      .from("lead_quotes")
      .update({ status: "declined" })
      .eq("lead_id", quote.lead_id)
      .neq("id", data.quoteId);

    // Update lead status to 'accepted' (removes it from vendor marketplace)
    await supabaseAdmin
      .from("custom_tour_leads")
      .update({ status: "accepted" })
      .eq("id", quote.lead_id);

    // Notify winning vendor via WhatsApp
    try {
      const { data: vendorProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", quote.vendor_id)
        .single();

      const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
      const winMsg = `🎉 *CONGRATULATIONS! Quote Accepted!* 🎉\n\nTraveler *${lead.contact_name}* (${lead.contact_phone}) has ACCEPTED your proposal of *Rs ${quote.quoteAmount.toLocaleString()}* for custom tour to *${lead.destination}*.\n\nLead has been reserved for you! Please reach out to complete booking.`;
      
      await sendWhatsAppMessage({
        data: { phone: lead.contact_phone, message: winMsg, skipDeduplication: true }
      });
    } catch (err) {
      console.error("Winning quote WhatsApp alert error:", err);
    }

    return { ok: true, message: "Quote accepted! Lead is reserved for your chosen vendor." };
  });

// -------- Public Customer: Get Quotes & Lead by Token --------
export const getCustomerQuotesByToken = createServerFn({ method: "GET" })
  .validator((input: { token: string }) => {
    if (!input.token) throw new Error("Token required");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch lead details by access token
    const { data: lead, error: lErr } = await supabaseAdmin
      .from("custom_tour_leads")
      .select("*")
      .eq("access_token", data.token)
      .single();

    if (lErr || !lead) throw new Error("Invalid or expired quote access link");

    // Fetch quotes with vendor profile info
    const { data: quotes } = await supabaseAdmin
      .from("lead_quotes")
      .select("id, quote_amount, valid_until, itinerary_summary, inclusions, pdf_url, status, created_at, vendor_id, profiles(full_name, email)")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });

    return { lead, quotes: quotes ?? [] };
  });

