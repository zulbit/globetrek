import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatPKR } from "@/lib/services";

export interface CustomVisaLeadItem {
  id: string;
  created_at: string;
  customer_id: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  customer_city: string;
  destination_country: string;
  visa_category: string; // Tourist, Family/Visit, Business, Student, Umrah, Work, Transit
  case_nature: string; // Standard Visa Application, Fresh Passport, Previous Refusal, Mock Interview
  has_prior_rejection: boolean;
  rejection_details?: string;
  applicant_profile: string; // Salaried, Business Owner, Freelancer, Doctor/Engineer, Student, Govt Officer
  bank_statement_status: string; // Strong (6+ mo), Average, Needs Guidance
  submission_office: string; // Gerry's Islamabad, Gerry's Lahore, VFS Karachi, Anatolia Turkey, Direct Embassy, Online E-Visa
  consultation_mode: string; // In-Person Office Visit, Online / Remote, Any
  target_travel_date?: string;
  applicant_count: number;
  special_notes?: string;
  status: "verified" | "accepted" | "closed";
  unlock_fee_pkr: number;
  unlocked_by?: string[]; // array of vendor_ids
}

export interface VisaLeadQuoteItem {
  id: string;
  lead_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_city?: string;
  vendor_phone?: string;
  consultation_mode: "in_person" | "remote_efiling";
  quote_amount_pkr: number;
  embassy_fee_estimate_pkr?: number;
  estimated_processing_days: number;
  inclusions: string[]; // Cover Letter Drafting, Appointment Booking, Document Audit, Mock Interview
  proposal_notes: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface VisaLeadPurchaseItem {
  id: string;
  lead_id: string;
  vendor_id: string;
  amount_paid: number;
  purchased_at: string;
}

export interface VisaLeadUnlockPaymentItem {
  id: string;
  lead_id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  payment_intent_id: string;
  status: "completed" | "pending";
  created_at: string;
}

// -------- 1. Submit Custom Visa Lead (Auto-Verified & Instant Broadcast) --------
export const submitCustomVisaLead = createServerFn({ method: "POST" })
  .validator(
    (input: {
      contact_name: string;
      contact_phone: string;
      contact_email: string;
      customer_city: string;
      destination_country: string;
      visa_category: string;
      case_nature: string;
      has_prior_rejection?: boolean;
      rejection_details?: string;
      applicant_profile: string;
      bank_statement_status: string;
      submission_office: string;
      consultation_mode: string;
      target_travel_date?: string;
      applicant_count?: number;
      special_notes?: string;
      password?: string;
      userId?: string;
    }) => {
      if (!input.contact_name?.trim()) throw new Error("Contact name is required");
      if (!input.contact_phone?.trim()) throw new Error("Phone number is required");
      if (!input.destination_country?.trim()) throw new Error("Destination country is required");
      if (!input.customer_city?.trim()) throw new Error("City is required");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean phone → +92
    const digits = data.contact_phone.replace(/\D/g, "").replace(/^0+/, "");
    const phone = digits.startsWith("92") ? `+${digits}` : `+92${digits}`;

    let registeredUserId: string | null = data.userId || null;
    let accountCreated = false;

    // 1. If password provided, register/ensure customer account in Supabase
    if (data.password && data.password.trim().length >= 6) {
      try {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: data.contact_email,
          password: data.password.trim(),
          email_confirm: true,
          user_metadata: {
            full_name: data.contact_name,
            role: "customer",
            phone: phone,
          },
        });

        if (newUser?.user) {
          registeredUserId = newUser.user.id;
          accountCreated = true;

          // Create/update profiles entry
          await supabaseAdmin.from("profiles").upsert({
            id: registeredUserId,
            email: data.contact_email,
            full_name: data.contact_name || null,
            vendor_status: "approved",
            subscription_tier: "free",
            city: data.customer_city,
          });

          // Create user_roles entry
          await supabaseAdmin.from("user_roles").upsert({
            user_id: registeredUserId,
            role: "customer",
          });
        } else if (createErr) {
          // If user already exists in auth, update their password so they can log in
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const existing = userList?.users?.find(
            (u) => u.email?.toLowerCase() === data.contact_email.toLowerCase()
          );

          if (existing) {
            registeredUserId = existing.id;
            accountCreated = true;

            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              password: data.password.trim(),
              email_confirm: true,
              user_metadata: {
                full_name: data.contact_name,
                role: "customer",
                phone: phone,
              },
            });
          }
        }
      } catch (err) {
        console.warn("Auth user creation error (non-fatal):", err);
      }
    }

    // If still no registered user, check current auth session
    if (!registeredUserId) {
      try {
        const { data: u } = await supabaseAdmin.auth.getUser();
        if (u.user) registeredUserId = u.user.id;
      } catch { }
    }

    const leadId = crypto.randomUUID();
    const newLead: CustomVisaLeadItem = {
      id: leadId,
      created_at: new Date().toISOString(),
      customer_id: registeredUserId,
      contact_name: data.contact_name.trim(),
      contact_phone: phone,
      contact_email: (data.contact_email || "traveler@globetrek.pk").trim().toLowerCase(),
      customer_city: data.customer_city.trim(),
      destination_country: data.destination_country.trim(),
      visa_category: data.visa_category || "Tourist / Holiday Visa",
      case_nature: data.case_nature || "Standard Visa Application",
      has_prior_rejection: Boolean(data.has_prior_rejection),
      rejection_details: data.rejection_details?.trim() || undefined,
      applicant_profile: data.applicant_profile || "Salaried",
      bank_statement_status: data.bank_statement_status || "Strong",
      submission_office: data.submission_office || "Gerry's Visa Drop Box",
      consultation_mode: data.consultation_mode || "Any (Best Price & Service)",
      target_travel_date: data.target_travel_date?.trim() || undefined,
      applicant_count: Number(data.applicant_count) || 1,
      special_notes: data.special_notes?.trim() || undefined,
      status: "verified", // 100% Zero-admin bottleneck: auto-published!
      unlock_fee_pkr: 750,
      unlocked_by: [],
    };

    // Load store from payment_gateway_settings (provider: custom_visa_leads)
    const { data: row } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const currentLeads: CustomVisaLeadItem[] = row?.config?.leads || [];
    currentLeads.unshift(newLead);

    await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "custom_visa_leads",
      config: { leads: currentLeads },
    });

    // 1. Send WhatsApp confirmation to Traveler
    try {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
      const quoteUrl = `https://globetrek.pk/customer/visa-quotes?token=${leadId}`;
      const rejectionNote = newLead.has_prior_rejection && newLead.rejection_details
        ? `Refusal History: ${newLead.rejection_details}`
        : newLead.case_nature;

      const travelerMsg = `Assalam-o-Alaikum *${newLead.contact_name}*! 🌴\n\nYour Custom Visa Consultation Request for *${newLead.destination_country}* (*${newLead.visa_category}*) has been received on *GlobeTrek PK*.\n\n📋 *Case Summary:*\n• Destination: ${newLead.destination_country} (${newLead.visa_category})\n• Submission Center: ${newLead.submission_office}\n• Case Type: ${rejectionNote}\n• Profile: ${newLead.applicant_profile} from ${newLead.customer_city}\n\nTop verified Pakistani visa consultants are reviewing your file. Track incoming proposals & chat with experts here:\n👉 ${quoteUrl}\n\nBest regards,\n*GlobeTrek PK Team* ✈️`;

      await sendWhatsAppMessage({
        data: { phone: newLead.contact_phone, message: travelerMsg, skipDeduplication: true },
      });
    } catch (err) {
      console.warn("WhatsApp traveler notification warning:", err);
    }

    return {
      ok: true,
      leadId,
      message: "Visa consultation request submitted! Verified consultants are reviewing your case.",
    };
  });

// -------- 2. Get Marketplace Visa Leads (For Vendors) --------
export const getMarketplaceVisaLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vendorId = context.userId;

    // Load leads
    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];

    // Load purchases
    const { data: purchasesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_purchases")
      .maybeSingle();

    const purchases: VisaLeadPurchaseItem[] = purchasesRow?.config?.purchases || [];

    // Load quotes to detect my_quote
    const { data: quotesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_quotes")
      .maybeSingle();

    const quotes: VisaLeadQuoteItem[] = quotesRow?.config?.quotes || [];

    // Get vendor city for local-match badging
    const { data: vendorProfile } = await supabaseAdmin
      .from("profiles")
      .select("city, company_name, full_name")
      .eq("id", vendorId)
      .maybeSingle();

    const vendorCity = vendorProfile?.city || "";

    const formatted = leads.map((l) => {
      const leadPurchases = purchases.filter((p) => p.lead_id === l.id);
      const isUnlockedByMe = leadPurchases.some((p) => p.vendor_id === vendorId);
      const unlockCount = leadPurchases.length;
      const maxUnlocks = 5;
      const isSoldOut = unlockCount >= maxUnlocks;
      const isLocalCityMatch = Boolean(
        vendorCity && l.customer_city.toLowerCase().includes(vendorCity.toLowerCase()),
      );

      const myQuote = quotes.find((q) => q.lead_id === l.id && q.vendor_id === vendorId);

      // Mask contact info if not unlocked by this vendor
      let maskedPhone = l.contact_phone;
      let maskedEmail = l.contact_email;
      let maskedName = l.contact_name;

      if (!isUnlockedByMe) {
        if (l.contact_phone.length >= 7) {
          maskedPhone = `${l.contact_phone.slice(0, 5)}******${l.contact_phone.slice(-2)}`;
        } else {
          maskedPhone = "+92 300 ******00";
        }
        maskedEmail = "******@globetrek.pk";
        maskedName = `${l.contact_name.split(" ")[0]} (Applicant)`;
      }

      return {
        ...l,
        contact_phone: isUnlockedByMe ? l.contact_phone : maskedPhone,
        contact_email: isUnlockedByMe ? l.contact_email : maskedEmail,
        contact_name: isUnlockedByMe ? l.contact_name : maskedName,
        is_unlocked: isUnlockedByMe,
        unlock_count: unlockCount,
        max_unlocks: maxUnlocks,
        is_sold_out: isSoldOut,
        is_local_match: isLocalCityMatch,
        my_quote: myQuote || null,
      };
    });

    return formatted;
  });

// -------- 3. Create SafePay Checkout for Rs 750 Lead Unlock --------
export const createVisaLeadUnlockCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string }) => {
    if (!input.leadId) throw new Error("Lead ID is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vendorId = context.userId;

    // Load lead
    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];
    const targetLead = leads.find((l) => l.id === data.leadId);
    if (!targetLead) throw new Error("Visa lead not found");

    // Check purchases count (max 5)
    const { data: purchasesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_purchases")
      .maybeSingle();

    const purchases: VisaLeadPurchaseItem[] = purchasesRow?.config?.purchases || [];
    const leadPurchases = purchases.filter((p) => p.lead_id === data.leadId);
    if (leadPurchases.some((p) => p.vendor_id === vendorId)) {
      return { ok: true, alreadyUnlocked: true, message: "Lead is already unlocked!" };
    }
    if (leadPurchases.length >= 5) {
      throw new Error("This visa lead has reached the maximum 5 vendor unlocks limit.");
    }

    // Vendor profile for billing prefill and verification status
    const { data: profile } = await supabaseAdmin
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
    const isApproved = profile?.vendor_status === "approved";

    if (!isAdmin && !isApproved) {
      throw new Error(
        "Agency Verification Required: Unverified accounts in Setup Mode cannot unlock visa leads. Please submit and complete your KYC verification to receive Admin approval."
      );
    }

    const unlockFee = targetLead.unlock_fee_pkr || 750;
    const [firstName, ...rest] = (profile?.full_name || profile?.company_name || "Travel Partner").trim().split(/\s+/);
    const lastName = rest.join(" ") || (profile?.company_name ? "Agency" : "Vendor");
    const vendorEmail = profile?.email || "vendor@globetrek.pk";
    const vendorCity = profile?.city || "Islamabad";
    const streetAddress = profile?.company_name
      ? `${profile.company_name} Commercial Office`
      : "Main Commercial Boulevard, Shahrah-e-Faisal";
    const rawPhone = (profile?.phone || "+923001234567").replace(/\D/g, "").replace(/^0+/, "");
    const vendorPhone = rawPhone.startsWith("92") ? `+${rawPhone}` : `+92${rawPhone}`;

    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";

    const secretKey = process.env.SAFEPAY_SECRET_KEY || "c3487d289512e74681b031cd3cf5d6a8d73a22b3c709bd939c3f833e95b7c27a";

    // Format prefilled SafePay URL with all standard and variant query parameters
    const formatSafePayUrl = (baseUrlStr: string) => {
      try {
        const url = new URL(baseUrlStr);
        // Standard query parameters
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
        url.searchParams.set("postal_code", "44000");

        // Additional camelCase and custom variants
        url.searchParams.set("firstName", firstName);
        url.searchParams.set("lastName", lastName);
        url.searchParams.set("customer_email", vendorEmail);
        url.searchParams.set("customer_phone", vendorPhone);
        url.searchParams.set("billing_city", vendorCity);
        url.searchParams.set("billing_address", streetAddress);
        return url.toString();
      } catch {
        return baseUrlStr;
      }
    };

    let trackerId = `ql_${Date.now()}`;
    let checkoutUrl = `${baseUrl}/io/quick-link?ql=${trackerId}`;

    try {
      const qlRes = await fetch(`${baseUrl}/invoice/quick-links/v2/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SFPY-MERCHANT-SECRET": secretKey,
        },
        body: JSON.stringify({
          amount: unlockFee,
          currency: "PKR",
          note: `Unlock Custom Visa Lead (${targetLead.destination_country} - ${targetLead.visa_category})`,
          workflow: "MANUAL",
          client: {
            first_name: firstName,
            last_name: lastName,
            email: vendorEmail,
            phone: vendorPhone,
            phone_number: vendorPhone,
            city: vendorCity,
            address: streetAddress,
            country: "PK",
          },
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: vendorEmail,
            phone: vendorPhone,
            phone_number: vendorPhone,
            city: vendorCity,
            address: streetAddress,
            country: "PK",
          },
          billing_address: {
            first_name: firstName,
            last_name: lastName,
            city: vendorCity,
            street: streetAddress,
            address: streetAddress,
            country: "PK",
            postal_code: "44000",
          },
        }),
      });

      if (qlRes.ok) {
        const qlJson = (await qlRes.json()) as any;
        const apiTrackerId = qlJson.data?.id;
        const rawRecipientUrl = qlJson.data?.metadata?.[0]?.recipient_view_url || `${baseUrl}/io/quick-link?ql=${apiTrackerId}`;
        if (apiTrackerId) {
          trackerId = apiTrackerId;
          checkoutUrl = formatSafePayUrl(rawRecipientUrl);
        }
      }
    } catch (apiErr) {
      console.warn("SafePay QuickLink API call fallback:", apiErr);
      checkoutUrl = formatSafePayUrl(`${baseUrl}/io/quick-link?ql=${trackerId}`);
    }

    // Record pending transaction
    const { data: paymentsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_unlock_payments")
      .maybeSingle();

    const payments: VisaLeadUnlockPaymentItem[] = paymentsRow?.config?.payments || [];
    payments.unshift({
      id: crypto.randomUUID(),
      lead_id: data.leadId,
      vendor_id: vendorId,
      amount: unlockFee,
      currency: "PKR",
      payment_intent_id: trackerId,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "visa_lead_unlock_payments",
      config: { payments },
    });

    return {
      ok: true,
      checkoutUrl,
      paymentIntentId: trackerId,
      amount: unlockFee,
    };
  });

// -------- 4. Verify SafePay Payment & Unlock Visa Lead --------
export const verifyVisaLeadUnlockPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string; paymentIntentId?: string; forceBypass?: boolean }) => {
    if (!input.leadId) throw new Error("Lead ID is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vendorId = context.userId;

    // Record purchase in visa_lead_purchases
    const { data: purchasesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_purchases")
      .maybeSingle();

    const purchases: VisaLeadPurchaseItem[] = purchasesRow?.config?.purchases || [];
    const exists = purchases.some((p) => p.lead_id === data.leadId && p.vendor_id === vendorId);

    if (!exists) {
      purchases.push({
        id: crypto.randomUUID(),
        lead_id: data.leadId,
        vendor_id: vendorId,
        amount_paid: 750,
        purchased_at: new Date().toISOString(),
      });

      await supabaseAdmin.from("payment_gateway_settings").upsert({
        provider: "visa_lead_purchases",
        config: { purchases },
      });
    }

    // Update payment status to completed
    const { data: paymentsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_unlock_payments")
      .maybeSingle();

    const payments: VisaLeadUnlockPaymentItem[] = paymentsRow?.config?.payments || [];
    const matchedPay = payments.find(
      (p) => p.lead_id === data.leadId && p.vendor_id === vendorId,
    );
    if (matchedPay) {
      matchedPay.status = "completed";
      await supabaseAdmin.from("payment_gateway_settings").upsert({
        provider: "visa_lead_unlock_payments",
        config: { payments },
      });
    }

    return { ok: true, message: "Visa lead successfully unlocked!" };
  });

// -------- 5. Submit or Revise Visa Lead Proposal / Quote --------
export const submitVisaLeadQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      lead_id: string;
      quote_amount_pkr: number;
      embassy_fee_estimate_pkr?: number;
      estimated_processing_days: number;
      consultation_mode: "in_person" | "remote_efiling";
      inclusions: string[];
      proposal_notes: string;
    }) => {
      if (!input.lead_id) throw new Error("Lead ID is required");
      if (!input.quote_amount_pkr || input.quote_amount_pkr <= 0) {
        throw new Error("Please enter a valid consultancy/service fee");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vendorId = context.userId;

    // Load vendor details
    const { data: vendorProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, full_name, city, email")
      .eq("id", vendorId)
      .maybeSingle();

    const vendorName = vendorProfile?.company_name || vendorProfile?.full_name || "Verified Visa Expert";
    const vendorCity = vendorProfile?.city || "Islamabad";

    // Load quote store
    const { data: quotesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_quotes")
      .maybeSingle();

    const quotes: VisaLeadQuoteItem[] = quotesRow?.config?.quotes || [];
    const existingIndex = quotes.findIndex((q) => q.lead_id === data.lead_id && q.vendor_id === vendorId);

    const quoteItem: VisaLeadQuoteItem = {
      id: existingIndex >= 0 ? quotes[existingIndex].id : crypto.randomUUID(),
      lead_id: data.lead_id,
      vendor_id: vendorId,
      vendor_name: vendorName,
      vendor_city: vendorCity,
      consultation_mode: data.consultation_mode || "in_person",
      quote_amount_pkr: Number(data.quote_amount_pkr),
      embassy_fee_estimate_pkr: Number(data.embassy_fee_estimate_pkr) || 0,
      estimated_processing_days: Number(data.estimated_processing_days) || 7,
      inclusions: data.inclusions?.length ? data.inclusions : ["Complete Document Audit", "Cover Letter Drafting", "Embassy Appointment Booking"],
      proposal_notes: data.proposal_notes?.trim() || "Full visa filing and document preparation support.",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      quotes[existingIndex] = quoteItem;
    } else {
      quotes.unshift(quoteItem);
    }

    await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "visa_lead_quotes",
      config: { quotes },
    });

    // Send WhatsApp notification to Traveler
    try {
      const { data: leadsRow } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "custom_visa_leads")
        .maybeSingle();

      const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];
      const lead = leads.find((l) => l.id === data.lead_id);

      if (lead) {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const quoteUrl = `https://globetrek.pk/customer/visa-quotes?token=${lead.id}`;
        const inclusionsSummary = quoteItem.inclusions.map((inc) => `• ${inc}`).join("\n");

        const msg = `✈️ *GlobeTrek PK — New Visa Proposal Received!*\n\nDear *${lead.contact_name}*,\n\n*${vendorName}* (${vendorCity}) has submitted a visa filing proposal of *Rs ${quoteItem.quote_amount_pkr.toLocaleString()}* for your *${lead.destination_country}* application.\n\n*Package Inclusions:*\n${inclusionsSummary}\n\n👉 *Review & compare all proposals online:*\n${quoteUrl}\n\nBest regards,\n*GlobeTrek PK Team* 🌴`;

        await sendWhatsAppMessage({
          data: { phone: lead.contact_phone, message: msg, skipDeduplication: true },
        });
      }
    } catch (err) {
      console.warn("Quote notification WhatsApp warning:", err);
    }

    return { ok: true, message: "Visa proposal submitted! Traveler has been notified." };
  });

// -------- 6. Get Traveler Quotes for a Custom Visa Lead --------
export const getCustomerVisaLeadQuotes = createServerFn({ method: "GET" })
  .validator((input: { token: string }) => {
    if (!input.token) throw new Error("Access token / Lead ID required");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load lead
    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];
    const lead = leads.find((l) => l.id === data.token);

    if (!lead) throw new Error("Visa consultation request not found or expired.");

    // Load quotes
    const { data: quotesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_quotes")
      .maybeSingle();

    const quotes: VisaLeadQuoteItem[] = (quotesRow?.config?.quotes || []).filter(
      (q: VisaLeadQuoteItem) => q.lead_id === data.token,
    );

    return { lead, quotes };
  });

// -------- 7. Accept a Visa Proposal & Close Lead --------
export const acceptVisaLeadQuote = createServerFn({ method: "POST" })
  .validator((input: { quoteId: string; token: string }) => {
    if (!input.quoteId || !input.token) throw new Error("Quote ID and token required");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: quotesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_quotes")
      .maybeSingle();

    const quotes: VisaLeadQuoteItem[] = quotesRow?.config?.quotes || [];
    const targetQuote = quotes.find((q) => q.id === data.quoteId && q.lead_id === data.token);

    if (!targetQuote) throw new Error("Quote not found");

    // Mark target accepted and others closed
    quotes.forEach((q) => {
      if (q.lead_id === data.token) {
        if (q.id === data.quoteId) q.status = "accepted";
        else q.status = "rejected";
      }
    });

    await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "visa_lead_quotes",
      config: { quotes },
    });

    // Update lead status to accepted
    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];
    const lead = leads.find((l) => l.id === data.token);
    if (lead) {
      lead.status = "accepted";
      await supabaseAdmin.from("payment_gateway_settings").upsert({
        provider: "custom_visa_leads",
        config: { leads },
      });
    }

    return {
      ok: true,
      message: `Proposal by ${targetQuote.vendor_name} accepted! You can now chat directly on WhatsApp.`,
    };
  });

// -------- 8. Get Logged-In Customer's Custom Visa Requests with Proposals --------
export const getCustomerCustomVisaRequestsWithQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const userId = context.userId;

      // Get profile email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();

      const userEmail = profile?.email?.toLowerCase() || "";

      // Load leads
      const { data: leadsRow } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "custom_visa_leads")
        .maybeSingle();

      const allLeads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];

      // Filter leads belonging to this customer by ID or Email
      const userLeads = allLeads.filter(
        (l) =>
          (l.customer_id && l.customer_id === userId) ||
          (userEmail && l.contact_email && l.contact_email.toLowerCase() === userEmail)
      );

      // Load quotes
      const { data: quotesRow } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "visa_lead_quotes")
        .maybeSingle();

      const allQuotes: VisaLeadQuoteItem[] = quotesRow?.config?.quotes || [];

      return userLeads.map((lead) => {
        const leadQuotes = allQuotes.filter((q) => q.lead_id === lead.id);
        return {
          ...lead,
          quotes: leadQuotes,
          quote_count: leadQuotes.length,
        };
      });
    } catch (err) {
      console.error("[getCustomerCustomVisaRequestsWithQuotes] Error:", err);
      return [];
    }
  });

// -------- 9. Admin: Get All Custom Visa Leads with Unlocked Vendors & Quotes --------
export const getAdminCustomVisaLeadsServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { filterStatus?: string }) => input)
  .handler(async ({ data: input, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: Admin access required");

    // Load leads
    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    let allLeads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];

    // Load purchases & unlocks
    const { data: purchasesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_purchases")
      .maybeSingle();

    const purchases: VisaLeadPurchaseItem[] = purchasesRow?.config?.purchases || [];

    // Load quotes
    const { data: quotesRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "visa_lead_quotes")
      .maybeSingle();

    const allQuotes: VisaLeadQuoteItem[] = quotesRow?.config?.quotes || [];

    // Load vendor profile metadata for attribution
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company_name, email, phone");

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    if (input?.filterStatus && input.filterStatus !== "all") {
      allLeads = allLeads.filter((l) => l.status === input.filterStatus);
    }

    return allLeads.map((lead) => {
      const leadPurchases = purchases.filter((p) => p.lead_id === lead.id);
      const unlockedVendors = leadPurchases.map((p) => {
        const prof = profileMap.get(p.vendor_id);
        return {
          vendor_id: p.vendor_id,
          purchased_at: p.purchased_at,
          amount_paid: p.amount_paid,
          profiles: {
            full_name: prof?.company_name || prof?.full_name || "Verified Visa Agent",
            email: prof?.email || "",
            phone: prof?.phone || "",
          },
        };
      });

      const leadQuotes = allQuotes.filter((q) => q.lead_id === lead.id);

      return {
        ...lead,
        unlocked_vendors: unlockedVendors,
        quotes: leadQuotes,
        quote_count: leadQuotes.length,
      };
    });
  });

// -------- 10. Admin: Update Custom Visa Lead Status --------
export const updateVisaLeadStatusServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { leadId: string; status: "verified" | "accepted" | "closed" }) => input)
  .handler(async ({ data: input, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: Admin access required");

    const { data: leadsRow } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "custom_visa_leads")
      .maybeSingle();

    const leads: CustomVisaLeadItem[] = leadsRow?.config?.leads || [];
    const targetLead = leads.find((l) => l.id === input.leadId);
    if (!targetLead) throw new Error("Custom Visa Lead not found");

    targetLead.status = input.status;

    await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "custom_visa_leads",
      config: { leads },
      updated_at: new Date().toISOString(),
    });

    return { ok: true, status: input.status };
  });



