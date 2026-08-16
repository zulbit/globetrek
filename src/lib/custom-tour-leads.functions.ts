import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  my_quote?: LeadQuoteItem;
}

export interface LeadQuoteItem {
  id: string;
  lead_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email?: string;
  vendor_company?: string;
  quote_amount: number;
  currency?: string;
  valid_until?: string | null;
  itinerary_summary: string;
  hotel_details?: string | null;
  flight_details?: string | null;
  inclusions: string[];
  exclusions: string[];
  terms_and_conditions?: string | null;
  perks: string[];
  advance_deposit_percent: number;
  pdf_url?: string | null;
  status: "submitted" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

// -------- Get all custom tour leads for the vendor marketplace --------
export const getMarketplaceLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomTourLead[]> => {
    const vendorId = context.userId;

    // 1. Fetch leads unlocked by this vendor
    const { data: purchased, error: purErr } = await context.supabase
      .from("vendor_lead_purchases")
      .select("lead_id")
      .eq("vendor_id", vendorId);

    if (purErr) throw new Error(purErr.message);

    // 2. Fetch leads with a pending (initiated but unverified) payment by this vendor
    const { data: pendingPayments } = await context.supabase
      .from("lead_unlock_payments")
      .select("lead_id")
      .eq("vendor_id", vendorId)
      .eq("status", "pending");

    const purchasedIds = new Set((purchased ?? []).map((p) => p.lead_id));
    const pendingIds = new Set((pendingPayments ?? []).map((p) => p.lead_id));

    // 3. Fetch quote store to attach my_quote if this vendor already submitted a proposal
    const { data: settingRow } = await context.supabase
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "lead_quotes")
      .maybeSingle();

    const allQuotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];
    const myQuotesMap = new Map<string, LeadQuoteItem>();
    allQuotes.forEach((q) => {
      if (q.vendor_id === vendorId) {
        myQuotesMap.set(q.lead_id, q);
      }
    });

    // 4. Fetch ONLY verified leads from custom_tour_leads table (admin approved)
    const { data: verifiedLeads, error: leadsErr } = await context.supabase
      .from("custom_tour_leads")
      .select("id, departure_city, destination, travel_month, duration_days, group_size, group_type, hotel_tier, visa_needed, insurance_needed, flight_class, special_requests, status, created_at")
      .eq("status", "verified")
      .order("created_at", { ascending: false });

    if (leadsErr) throw new Error(leadsErr.message);

    // If the vendor has purchased any lead that might have a different status (e.g. accepted), include those too
    let combinedLeads = verifiedLeads || [];
    if (purchasedIds.size > 0) {
      const { data: myPurchasedRows } = await context.supabase
        .from("custom_tour_leads")
        .select("id, departure_city, destination, travel_month, duration_days, group_size, group_type, hotel_tier, visa_needed, insurance_needed, flight_class, special_requests, status, created_at, contact_name, contact_email, contact_phone")
        .in("id", Array.from(purchasedIds));

      if (myPurchasedRows) {
        const idSet = new Set(combinedLeads.map((l: any) => l.id));
        for (const pl of myPurchasedRows) {
          if (!idSet.has(pl.id)) {
            combinedLeads.push(pl);
          }
        }
      }
    }

    // Map through leads. If unlocked, include contact details. Otherwise, omit/hide.
    return combinedLeads.map((lead: any) => {
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
        my_quote: myQuotesMap.get(lead.id),
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify if already unlocked
    const { data: existing } = await supabaseAdmin
      .from("vendor_lead_purchases")
      .select("id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (existing) {
      throw new Error("You have already unlocked this lead.");
    }

    // 2. Check for an existing PENDING payment — reuse its checkout URL if available
    const { data: pendingRows } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("payment_intent_id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";

    // Get vendor details for customer billing and verification status
    const { data: vendorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company_name, email, phone, city, vendor_status")
      .eq("id", vendorId)
      .maybeSingle();

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", vendorId)
      .maybeSingle();

    const isAdmin = roleRow?.role === "admin";
    const isApproved = vendorProfile?.vendor_status === "approved";

    if (!isAdmin && !isApproved) {
      throw new Error(
        "Agency Verification Required: Unverified accounts in Setup Mode cannot unlock traveler leads. Please submit and complete your KYC verification to receive Admin approval."
      );
    }

    const [firstName, ...rest] = (vendorProfile?.full_name || vendorProfile?.company_name || "Travel Partner").trim().split(/\s+/);
    const lastName = rest.join(" ") || (vendorProfile?.company_name ? "Agency" : "Vendor");
    const vendorEmail = vendorProfile?.email || "vendor@globetrek.pk";
    const rawPhone = (vendorProfile?.phone || "+923001234567").replace(/\D/g, "").replace(/^0+/, "");
    const vendorPhone = rawPhone.startsWith("92") ? `+${rawPhone}` : `+92${rawPhone}`;
    const vendorCity = vendorProfile?.city || "Karachi";
    const streetAddress = vendorProfile?.company_name
      ? `${vendorProfile.company_name} Commercial Office`
      : "Main Commercial Boulevard, Shahrah-e-Faisal";

    // Helper to format full pre-filled SafePay QuickLink URL with all query parameters
    const formatSafePayUrl = (baseUrlStr: string) => {
      try {
        const url = new URL(baseUrlStr);
        url.searchParams.set("first_name", firstName);
        url.searchParams.set("last_name", lastName);
        url.searchParams.set("name", `${firstName} ${lastName}`);
        url.searchParams.set("email", vendorEmail);
        url.searchParams.set("phone", vendorPhone);
        url.searchParams.set("phone_number", vendorPhone);
        url.searchParams.set("city", vendorCity);
        url.searchParams.set("street", streetAddress);
        url.searchParams.set("street_address", streetAddress);
        url.searchParams.set("address", streetAddress);
        url.searchParams.set("country", "Pakistan");
        url.searchParams.set("country_code", "PK");
        url.searchParams.set("postal_code", "74000");
        return url.toString();
      } catch {
        return baseUrlStr;
      }
    };

    if (pendingRows?.[0]?.payment_intent_id) {
      const existingUrl = formatSafePayUrl(`${baseUrl}/io/quick-link?ql=${pendingRows[0].payment_intent_id}`);
      return { ok: true, checkoutUrl: existingUrl, trackerToken: pendingRows[0].payment_intent_id };
    }

    // 4. Create SafePay QuickLink v2
    const secretKey = process.env.SAFEPAY_SECRET_KEY || "c3487d289512e74681b031cd3cf5d6a8d73a22b3c709bd939c3f833e95b7c27a";

    const qlRes = await fetch(`${baseUrl}/invoice/quick-links/v2/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": secretKey,
      },
      body: JSON.stringify({
        amount: 5000,
        currency: "PKR",
        note: `Unlock Custom Tour Lead – ${lead.destination}`,
        workflow: "MANUAL",
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: vendorEmail,
          phone_number: vendorPhone,
          city: vendorCity,
          address: streetAddress,
          country: "PK",
        },
        billing_address: {
          city: vendorCity,
          street: streetAddress,
          country: "PK",
        },
      }),
    });

    if (!qlRes.ok) {
      const errTxt = await qlRes.text();
      console.error("[createLeadUnlockCheckout] SafePay QuickLink error:", errTxt);
      throw new Error(`SafePay checkout error: ${errTxt.slice(0, 150)}`);
    }

    const qlJson = (await qlRes.json()) as {
      data?: {
        id?: string;
        metadata?: { recipient_view_url?: string }[];
      };
    };

    const trackerId = qlJson.data?.id;
    const rawRecipientUrl = qlJson.data?.metadata?.[0]?.recipient_view_url || `${baseUrl}/io/quick-link?ql=${trackerId}`;

    if (!trackerId) {
      throw new Error("Invalid SafePay QuickLink response");
    }

    const checkoutUrl = formatSafePayUrl(rawRecipientUrl);

    // 5. Record pending payment in DB
    await supabaseAdmin.from("lead_unlock_payments").insert({
      lead_id: data.leadId,
      vendor_id: vendorId,
      amount: 5000,
      currency: "PKR",
      payment_intent_id: trackerId,
      status: "pending",
    });

    return {
      ok: true,
      checkoutUrl: checkoutUrl,
      trackerToken: trackerId,
    };
  });

// -------- Manually Verify / Check a Lead Unlock Payment Status --------
export const verifyLeadUnlockPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string }) => {
    if (!input.leadId) throw new Error("Lead ID required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const vendorId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch latest payment for this vendor and lead
    const { data: payments } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("*")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(1);

    const payment = payments?.[0];
    if (!payment) {
      throw new Error("No payment session found for this lead.");
    }

    if (payment.status === "completed") {
      return { ok: true, unlocked: true, message: "Lead is already unlocked!" };
    }

    // 2. Poll SafePay API for quick-link status
    const secretKey = process.env.SAFEPAY_SECRET_KEY || "c3487d289512e74681b031cd3cf5d6a8d73a22b3c709bd939c3f833e95b7c27a";
    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";

    const verifyRes = await fetch(`${baseUrl}/invoice/quick-links/v2/${payment.payment_intent_id}`, {
      headers: {
        "X-SFPY-MERCHANT-SECRET": secretKey,
      },
    });

    let rawState = "";
    let isPaid = false;
    if (verifyRes.ok) {
      const qlData = await verifyRes.json();
      rawState = qlData?.data?.status || "";
      const paymentItem = qlData?.data?.payment?.[0];
      if (paymentItem?.is_paid || rawState === "PAID" || rawState === "COMPLETED") {
        isPaid = true;
      }
    }

    if (isPaid || rawState.toUpperCase() === "PAID" || rawState.toUpperCase() === "COMPLETED") {
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

      // Trigger WhatsApp notification to traveler
      try {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const leadRes = await supabaseAdmin
          .from("custom_tour_leads")
          .select("contact_name, contact_phone, destination")
          .eq("id", payment.lead_id)
          .single();

        if (leadRes.data) {
          const lead = leadRes.data;
          const travelerMsg = `*GlobeTrek PK — Travel Partner Found!* 🎉\n\nDear *${lead.contact_name}*,\n\nGreat news! A verified travel agency has unlocked your custom tour request to *${lead.destination}*.\n\nThey will reach out to you on WhatsApp shortly with options and quotes!`;
          await sendWhatsAppMessage({
            data: {
              phone: lead.contact_phone,
              message: travelerMsg,
              skipDeduplication: true,
            },
          });
        }
      } catch (waErr) {
        console.error("Manual verification notification error:", waErr);
      }

      return { ok: true, unlocked: true, message: "Lead unlocked successfully!" };
    } else {
      return { ok: true, unlocked: false, message: `Payment status is: ${rawState || "pending"}` };
    }
  });

// -------- Vendor: Submit Detailed Quotation for an Unlocked Lead --------
export const submitLeadQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: {
    leadId: string;
    quoteAmount: number;
    itinerarySummary: string;
    hotelDetails?: string;
    flightDetails?: string;
    inclusions?: string[];
    exclusions?: string[];
    termsAndConditions?: string;
    perks?: string[];
    advanceDepositPercent?: number;
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify vendor has unlocked this lead
    const { data: purchase } = await supabaseAdmin
      .from("vendor_lead_purchases")
      .select("id")
      .eq("lead_id", data.leadId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (!purchase) {
      throw new Error("You must unlock this lead before submitting a quotation.");
    }

    // Get vendor profile details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, company_name")
      .eq("id", vendorId)
      .maybeSingle();

    const vendorName = profile?.company_name || profile?.full_name || "Verified Travel Agency";
    const vendorEmail = profile?.email || "";

    // 1. Fetch current quote store from payment_gateway_settings
    const { data: settingRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "lead_quotes")
      .maybeSingle();

    const existingQuotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];

    const newQuote: LeadQuoteItem = {
      id: "quote_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      lead_id: data.leadId,
      vendor_id: vendorId,
      vendor_name: vendorName,
      vendor_email: vendorEmail,
      vendor_company: profile?.company_name || undefined,
      quote_amount: data.quoteAmount,
      currency: "PKR",
      valid_until: data.validUntil ?? null,
      itinerary_summary: data.itinerarySummary,
      hotel_details: data.hotelDetails ?? null,
      flight_details: data.flightDetails ?? null,
      inclusions: data.inclusions ?? [],
      exclusions: data.exclusions ?? [],
      terms_and_conditions: data.termsAndConditions ?? null,
      perks: data.perks ?? [],
      advance_deposit_percent: data.advanceDepositPercent ?? 30,
      pdf_url: data.pdfUrl ?? null,
      status: "submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update quote for { lead_id, vendor_id } if previously submitted, otherwise append
    const filteredQuotes = existingQuotes.filter(
      (q) => !(q.lead_id === data.leadId && q.vendor_id === vendorId)
    );
    filteredQuotes.push(newQuote);

    // Save back to payment_gateway_settings
    const { error: saveErr } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert({
        provider: "lead_quotes",
        enabled: true,
        config: { quotes: filteredQuotes },
        updated_at: new Date().toISOString(),
      });

    if (saveErr) {
      console.error("[submitLeadQuote] Error saving quote:", saveErr);
      throw new Error(saveErr.message || "Failed to save quotation.");
    }

    // Send WhatsApp notification to traveler about new quote ready
    try {
      const { data: lead } = await supabaseAdmin
        .from("custom_tour_leads")
        .select("contact_phone, contact_name, destination, id")
        .eq("id", data.leadId)
        .single();

      if (lead) {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const quoteUrl = `https://globetrek.pk/customer/quotes?token=${lead.id}`;
        const msg = `*GlobeTrek PK — New Quote Received!* ✈️\n\nDear *${lead.contact_name}*,\n\n*${vendorName}* has submitted a proposal of *Rs ${data.quoteAmount.toLocaleString()}* for your custom tour to *${lead.destination}*.\n\n👉 *Review & compare your quotes online:*\n${quoteUrl}\n\n*Package Highlights:*\n${data.itinerarySummary.slice(0, 150)}...\n\nBest regards,\n*GlobeTrek PK Team* 🌴`;

        await sendWhatsAppMessage({
          data: { phone: lead.contact_phone, message: msg, skipDeduplication: true },
        });
      }
    } catch (err) {
      console.error("Quote WhatsApp notification failed:", err);
    }

    return { ok: true, message: "Quotation submitted successfully! Traveler notified via WhatsApp." };
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
        special_requests: data.adminNotes ? data.adminNotes : undefined,
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

    // Fetch quote store from payment_gateway_settings
    const { data: settingRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "lead_quotes")
      .maybeSingle();

    const quotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];
    const targetQuote = quotes.find((q) => q.id === data.quoteId);

    if (!targetQuote) throw new Error("Quote not found");

    // Fetch lead
    const { data: lead, error: lErr } = await supabaseAdmin
      .from("custom_tour_leads")
      .select("*")
      .eq("id", targetQuote.lead_id)
      .single();

    if (lErr || !lead) throw new Error("Lead not found");

    // Verify token matches lead.id
    if (lead.id !== data.token) {
      throw new Error("Invalid access token");
    }

    // Update statuses
    const updatedQuotes = quotes.map((q) => {
      if (q.lead_id === targetQuote.lead_id) {
        if (q.id === data.quoteId) {
          return { ...q, status: "accepted" as const, updated_at: new Date().toISOString() };
        } else {
          return { ...q, status: "declined" as const, updated_at: new Date().toISOString() };
        }
      }
      return q;
    });

    await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert({
        provider: "lead_quotes",
        enabled: true,
        config: { quotes: updatedQuotes },
        updated_at: new Date().toISOString(),
      });

    // Update lead status to 'accepted'
    await supabaseAdmin
      .from("custom_tour_leads")
      .update({ status: "accepted" })
      .eq("id", targetQuote.lead_id);

    // Notify winning vendor via WhatsApp
    try {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
      const winMsg = `🎉 *CONGRATULATIONS! Quote Accepted!* 🎉\n\nTraveler *${lead.contact_name}* (${lead.contact_phone}) has ACCEPTED your proposal of *Rs ${targetQuote.quote_amount.toLocaleString()}* for custom tour to *${lead.destination}*.\n\nLead has been reserved for you! Please reach out to complete booking.`;

      await sendWhatsAppMessage({
        data: { phone: lead.contact_phone, message: winMsg, skipDeduplication: true },
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

    // Fetch lead details by ID
    const { data: lead, error: lErr } = await supabaseAdmin
      .from("custom_tour_leads")
      .select("*")
      .eq("id", data.token)
      .maybeSingle();

    if (lErr || !lead) throw new Error("Invalid or expired quote access link");

    // Fetch quotes from payment_gateway_settings
    const { data: settingRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "lead_quotes")
      .maybeSingle();

    const allQuotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];
    const leadQuotes = allQuotes.filter((q) => q.lead_id === lead.id);

    return { lead, quotes: leadQuotes };
  });

// -------- Update lead status by admin --------
export const updateLeadStatusServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string; status: string }) => {
    if (!input.leadId) throw new Error("Lead ID required");
    if (!input.status) throw new Error("Status required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("custom_tour_leads")
      .update({ status: data.status })
      .eq("id", data.leadId);

    if (error) throw new Error(error.message);
    return { ok: true, message: `Lead status updated to ${data.status}` };
  });

// -------- Admin: Get all custom tour leads with full unlocked vendor history --------
export const getAdminCustomLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { filterStatus?: string }) => input)
  .handler(async ({ data: inputData }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("custom_tour_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (inputData?.filterStatus && inputData.filterStatus !== "all") {
      query = query.eq("status", inputData.filterStatus);
    }

    const { data: leads, error: leadErr } = await query;
    if (leadErr) throw new Error(leadErr.message);

    const leadList = leads || [];
    if (leadList.length === 0) return [];

    const leadIds = leadList.map((l) => l.id);

    // Fetch unlock purchases using supabaseAdmin (bypasses RLS)
    const { data: unlocks, error: unlockErr } = await supabaseAdmin
      .from("vendor_lead_purchases")
      .select("lead_id, vendor_id, purchased_at, profiles(full_name, company_name, email)")
      .in("lead_id", leadIds);

    if (unlockErr) {
      console.error("[getAdminCustomLeads] unlock query error:", unlockErr);
    }

    const unlockMap: Record<string, any[]> = {};
    (unlocks ?? []).forEach((u: any) => {
      if (!unlockMap[u.lead_id]) unlockMap[u.lead_id] = [];
      unlockMap[u.lead_id].push({
        vendor_id: u.vendor_id,
        purchased_at: u.purchased_at,
        profiles: {
          full_name: u.profiles?.company_name || u.profiles?.full_name || "Travel Partner",
          email: u.profiles?.email || "",
        },
      });
    });

    return leadList.map((l: any) => ({
      ...l,
      unlocked_vendors: unlockMap[l.id] || [],
    }));
  });

export interface CustomerCustomRequestItem {
  id: string;
  destination: string;
  departure_city: string;
  travel_month: string;
  duration_days: number;
  group_size: number;
  group_type: string;
  hotel_tier: string;
  visa_needed: boolean;
  insurance_needed: boolean;
  flight_class: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  special_requests: string | null;
  status: string;
  created_at: string;
  quotes_count: number;
  lowest_quote_amount: number | null;
  quotes: LeadQuoteItem[];
}

// -------- Get customer's custom tour requests enriched with received vendor quotes --------
export const getCustomerCustomRequestsWithQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerCustomRequestItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Get profile email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const userEmail = profile?.email || context.email || "";

    let query = supabaseAdmin
      .from("custom_tour_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail) {
      query = query.ilike("contact_email", userEmail);
    }

    const { data: leads, error } = await query;
    if (error) {
      console.error("[getCustomerCustomRequestsWithQuotes] error:", error);
      return [];
    }

    const leadList = leads || [];
    if (leadList.length === 0) return [];

    // Fetch quotes store
    const { data: settingRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "lead_quotes")
      .maybeSingle();

    const allQuotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];

    return leadList.map((lead: any) => {
      const quotes = allQuotes.filter((q) => q.lead_id === lead.id);
      const minPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.quote_amount)) : null;

      return {
        ...lead,
        quotes_count: quotes.length,
        lowest_quote_amount: minPrice,
        quotes,
      };
    });
  });

const { data: profile } = await supabaseAdmin
  .from("profiles")
  .select("email")
  .eq("id", userId)
  .maybeSingle();

const userEmail = profile?.email || context.email || "";

let query = supabaseAdmin
  .from("custom_tour_leads")
  .select("*")
  .order("created_at", { ascending: false });

if (userEmail) {
  query = query.ilike("contact_email", userEmail);
}

const { data: leads, error } = await query;
if (error) {
  console.error("[getCustomerCustomRequestsWithQuotes] error:", error);
  return [];
}

const leadList = leads || [];
if (leadList.length === 0) return [];

// Fetch quotes store
const { data: settingRow } = await supabaseAdmin
  .from("payment_gateway_settings")
  .select("config")
  .eq("provider", "lead_quotes")
  .maybeSingle();

const allQuotes: LeadQuoteItem[] = settingRow?.config?.quotes || [];

return leadList.map((lead: any) => {
  const quotes = allQuotes.filter((q) => q.lead_id === lead.id);
  const minPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.quote_amount)) : null;

  return {
    ...lead,
    quotes_count: quotes.length,
    lowest_quote_amount: minPrice,
    quotes,
  };
});
  });

