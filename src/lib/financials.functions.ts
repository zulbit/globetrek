import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TIER_PRICES: Record<string, number> = {
  free: 0,
  starter: 4000,
  pro: 10000,
  agency: 25000,
};

const LEAD_UNLOCK_FEE_PKR = 5000;

export const getAdminFinancialMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { period: "30d" | "90d" | "all" }) => input)
  .handler(async ({ data: inputData }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch vendor profiles with supabaseAdmin
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company_name, email, subscription_tier, updated_at, created_at");

    if (pErr) console.error("[getAdminFinancialMetrics] profiles error:", pErr);

    // 2. Fetch completed lead unlocks, real SafePay payments, and refund records
    const [lpRes, payRes, dbPlansRes, addonGatewayData, visaLeadPurchasesRes, refundStoreRes] = await Promise.all([
      supabaseAdmin
        .from("lead_unlock_payments")
        .select("id, lead_id, vendor_id, amount, created_at, status, payment_intent_id, profiles(full_name, company_name, email)")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("payments")
        .select("id, owner_id, amount, created_at, status, metadata, profiles(full_name, company_name, email)")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "subscription_plans")
        .maybeSingle(),
      supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "vendor_active_addons")
        .maybeSingle(),
      supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "visa_lead_purchases")
        .maybeSingle(),
      supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "refund_records_store")
        .maybeSingle(),
    ]);

    if (lpRes.error) console.error("[getAdminFinancialMetrics] leadPurchases error:", lpRes.error);
    if (payRes.error) console.error("[getAdminFinancialMetrics] payments error:", payRes.error);

    let refundRecords: any[] = [];
    if (refundStoreRes.data?.config) {
      const parsed = typeof refundStoreRes.data.config === "string" ? JSON.parse(refundStoreRes.data.config) : refundStoreRes.data.config;
      if (Array.isArray(parsed)) refundRecords = parsed;
    }
    const refundMap = new Map(refundRecords.map((r) => [r.payment_id, r]));

    const allLeadsRaw = lpRes.data ?? [];
    const validLeads = allLeadsRaw.filter((l) => l.status === "completed" || l.status === "refunded");
    
    // Merge visa lead purchases into validLeads
    let visaPurchases: any[] = [];
    if (visaLeadPurchasesRes.data?.config) {
      const parsed = typeof visaLeadPurchasesRes.data.config === "string" ? JSON.parse(visaLeadPurchasesRes.data.config) : visaLeadPurchasesRes.data.config;
      if (Array.isArray(parsed.purchases)) {
        visaPurchases = parsed.purchases;
      }
    }
    
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    
    visaPurchases.forEach(vp => {
      const vProfile = profileMap.get(vp.vendor_id);
      validLeads.push({
        id: vp.id || `visa-${vp.lead_id}-${vp.vendor_id}`,
        lead_id: vp.lead_id,
        vendor_id: vp.vendor_id,
        amount: vp.amount_paid || 750,
        created_at: vp.purchased_at || new Date().toISOString(),
        status: vp.status || "completed",
        payment_intent_id: vp.payment_intent_id || vp.tracker_id,
        profiles: vProfile
      } as any);
    });

    const realPayments = (payRes.data ?? []).filter((p) => p.status === "paid" || p.status === "refunded");

    const realSubPayments = realPayments.filter((p) => (p.metadata as any)?.type === "subscription");
    const realAddonPayments = realPayments.filter((p) => (p.metadata as any)?.type === "addon");

    // 3. Compute subscription collections (MRR Projection)
    let proCount = 0;
    let starterCount = 0;
    let agencyCount = 0;
    let freeCount = 0;

    const vendorsList = profiles ?? [];
    vendorsList.forEach((v) => {
      const tier = (v.subscription_tier || "free").toLowerCase();
      if (tier === "pro") proCount++;
      else if (tier === "starter") starterCount++;
      else if (tier === "agency") agencyCount++;
      else freeCount++;
    });

    const dbPlans = dbPlansRes.data?.config || [];
    const dynamicPrices: Record<string, number> = {
      starter: 4000,
      pro: 7500,
      agency: 12000,
      ...TIER_PRICES, // Fallback base structure
    };
    if (Array.isArray(dbPlans)) {
      dbPlans.forEach((p: any) => {
        if (p.id && p.price_pkr !== undefined) dynamicPrices[p.id] = Number(p.price_pkr) || 0;
      });
    }

    const mrrSubscriptions =
      proCount * (dynamicPrices.pro || 10000) +
      starterCount * (dynamicPrices.starter || 4000) +
      agencyCount * (dynamicPrices.agency || 25000);

    // 4. Compute Custom Lead Unlocks collections
    const settledLeads = validLeads.filter((l) => l.status === "completed");
    const totalLeadUnlocks = settledLeads.length;
    const totalLeadUnlockRevenue = settledLeads.reduce(
      (acc: number, item: any) => acc + (item.amount || LEAD_UNLOCK_FEE_PKR),
      0
    );

    // 5. Compute real Addon Revenue and Subscription Revenue
    const allAddonsList: any[] = (addonGatewayData.data?.config as any[]) || [];
    const totalAddonRevenue = realAddonPayments.filter((p) => p.status === "paid").reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalSubRevenue = realSubPayments.filter((p) => p.status === "paid").reduce((acc, p) => acc + (p.amount || 0), 0);

    // Total gross collections (ACTUAL settled cash)
    const totalGrossCollections = totalSubRevenue + totalLeadUnlockRevenue + totalAddonRevenue;

    // Compute total refunds
    const totalRefundedAmount = refundRecords.reduce((acc, r) => acc + (Number(r.refund_amount_pkr) || 0), 0);
    const totalRefundsCount = refundRecords.length;
    const netCollections = Math.max(0, totalGrossCollections - totalRefundedAmount);

    // 6. Generate daily collections chart data (ACTUAL)
    const dailyMap: Record<string, { date: string; subscriptions: number; leadUnlocks: number; total: number }> = {};
    const daysCount = inputData.period === "30d" ? 30 : inputData.period === "90d" ? 90 : 180;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = {
        date: key,
        subscriptions: 0,
        leadUnlocks: 0,
        total: 0,
      };
    }

    settledLeads.forEach((lp) => {
      const dateKey = new Date(lp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const unlockAmt = lp.amount || LEAD_UNLOCK_FEE_PKR;
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].leadUnlocks += unlockAmt;
        dailyMap[dateKey].total += unlockAmt;
      }
    });

    realSubPayments.filter((p) => p.status === "paid").forEach((p) => {
      const dateKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].subscriptions += (p.amount || 0);
        dailyMap[dateKey].total += (p.amount || 0);
      }
    });

    realAddonPayments.filter((p) => p.status === "paid").forEach((p) => {
      const dateKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].total += (p.amount || 0);
      }
    });

    const timeSeriesData = Object.values(dailyMap);

    // 7. Pie Chart Data: Revenue Breakdown by Stream (ACTUAL)
    let starterSubRev = 0;
    let proSubRev = 0;
    let agencySubRev = 0;

    realSubPayments.filter((p) => p.status === "paid").forEach(p => {
      const tier = (p.metadata as any)?.tier || "pro";
      if (tier === "starter") starterSubRev += (p.amount || 0);
      else if (tier === "pro") proSubRev += (p.amount || 0);
      else if (tier === "agency") agencySubRev += (p.amount || 0);
    });

    const breakdownPieData = [
      { name: "Pro Subscriptions", value: proSubRev, color: "#10b981" },
      { name: "Custom Lead Unlocks", value: totalLeadUnlockRevenue, color: "#f59e0b" },
      { name: "Agency Visibility Boosts", value: totalAddonRevenue, color: "#ec4899" },
      { name: "Agency Subscriptions", value: agencySubRev, color: "#a855f7" },
      { name: "Starter Subscriptions", value: starterSubRev, color: "#38bdf8" },
    ].filter((item) => item.value > 0);

    if (breakdownPieData.length === 0) {
      breakdownPieData.push({ name: "No Data", value: 1, color: "#334155" });
    }

    // 8. Recent Transaction Feed with full Refund Metadata
    const recentTransactions = realSubPayments
      .map((p: any) => {
        const v = p.profiles || {};
        const refKey = p.id;
        const refund = refundMap.get(refKey) || refundMap.get(`sub-${p.id.slice(0, 8)}`);
        const isRefunded = p.status === "refunded" || !!refund;
        return {
          id: `sub-${p.id.slice(0, 8)}`,
          rawId: p.id,
          paymentType: "subscription" as const,
          type: "Subscription Tier",
          vendorName: v.company_name || v.full_name || "Vendor Partner",
          email: v.email,
          tier: ((p.metadata as any)?.tier || "pro").toUpperCase(),
          amount: p.amount || 10000,
          date: p.created_at,
          status: isRefunded ? "Refunded" : "Settled (SafePay)",
          isRefunded,
          refundReason: refund?.refund_reason || (isRefunded ? "Subscription Refund / Reversal" : null),
          refundTransactionId: refund?.refund_transaction_id || null,
          refundedAt: refund?.refunded_at || null,
          refundAmountPkr: refund?.refund_amount_pkr || (isRefunded ? p.amount : null),
          refundNotes: refund?.refund_notes || null,
        };
      })
      .concat(
        realAddonPayments.map((p: any) => {
          const v = p.profiles || {};
          const refKey = p.id;
          const refund = refundMap.get(refKey) || refundMap.get(`boost-${p.id.slice(0, 8)}`);
          const isRefunded = p.status === "refunded" || !!refund;
          return {
            id: `boost-${p.id.slice(0, 8)}`,
            rawId: p.id,
            paymentType: "payment" as const,
            type: "Marketplace Boost / Ad",
            vendorName: v.company_name || v.full_name || "Verified Partner",
            email: v.email || "agency@globetrek.pk",
            tier: "BOOST ADDON",
            amount: p.amount || 0,
            date: p.created_at,
            status: isRefunded ? "Refunded" : "Settled (SafePay)",
            isRefunded,
            refundReason: refund?.refund_reason || (isRefunded ? "Addon Boost Refund" : null),
            refundTransactionId: refund?.refund_transaction_id || null,
            refundedAt: refund?.refunded_at || null,
            refundAmountPkr: refund?.refund_amount_pkr || (isRefunded ? p.amount : null),
            refundNotes: refund?.refund_notes || null,
          };
        })
      )
      .concat(
        validLeads.map((lp: any) => {
          const refKey = lp.id;
          const refund = refundMap.get(refKey) || refundMap.get(`unlock-${lp.id.slice(0, 8)}`) || refundMap.get(lp.lead_id);
          const isRefunded = lp.status === "refunded" || !!refund;
          return {
            id: `unlock-${lp.id.slice(0, 8)}`,
            rawId: lp.id,
            paymentIntentId: lp.payment_intent_id,
            leadId: lp.lead_id,
            paymentType: "lead_unlock" as const,
            type: "Lead Unlock Fee",
            vendorName: lp.profiles?.company_name || lp.profiles?.full_name || "Travel Partner",
            email: lp.profiles?.email || "vendor@globetrek.pk",
            tier: "LEAD UNLOCK",
            amount: lp.amount || LEAD_UNLOCK_FEE_PKR,
            date: lp.created_at,
            status: isRefunded ? "Refunded" : "Settled (SafePay)",
            isRefunded,
            refundReason: refund?.refund_reason || (isRefunded ? "Lead Unlock Refund" : null),
            refundTransactionId: refund?.refund_transaction_id || lp.payment_intent_id || null,
            refundedAt: refund?.refunded_at || null,
            refundAmountPkr: refund?.refund_amount_pkr || (isRefunded ? (lp.amount || LEAD_UNLOCK_FEE_PKR) : null),
            refundNotes: refund?.refund_notes || null,
          };
        })
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 40);

    return {
      mrrSubscriptions,
      totalLeadUnlocks,
      totalLeadUnlockRevenue,
      totalAddonRevenue,
      totalAddonsCount: allAddonsList.length,
      totalGrossCollections,
      totalRefundedAmount,
      totalRefundsCount,
      netCollections,
      paidVendorsCount: proCount + starterCount + agencyCount,
      freeVendorsCount: freeCount,
      proCount,
      starterCount,
      agencyCount,
      timeSeriesData,
      breakdownPieData,
      recentTransactions,
      refundRecords,
    };
  });

export interface VendorInvoiceItem {
  id: string;
  date: string;
  description: string;
  amount_pkr: number;
  status: "paid" | "pending" | "refunded";
  method: string;
  period: string;
  expires_at?: string;
  payment_intent_id?: string;
  destination?: string;
  departure_city?: string;
  is_refunded?: boolean;
  refund_reason?: string;
  refund_transaction_id?: string;
  refunded_at?: string;
  refund_amount_pkr?: number;
}

export const getVendorInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input?: { targetVendorId?: string }) => input)
  .handler(async ({ data: input, context }): Promise<VendorInvoiceItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let vendorId = context.userId;

    if (input?.targetVendorId && input.targetVendorId !== context.userId) {
      const { data: roleRow } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (roleRow?.role === "admin") {
        vendorId = input.targetVendorId;
      }
    }

    // 1. Fetch vendor's lead unlock payments and refund records
    const [lpRes, refundStoreRes, realPaymentsRes] = await Promise.all([
      supabaseAdmin
        .from("lead_unlock_payments")
        .select("id, lead_id, vendor_id, amount, created_at, status, payment_intent_id, custom_tour_leads(destination, departure_city)")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", "refund_records_store")
        .maybeSingle(),
      supabaseAdmin
        .from("payments")
        .select("id, amount, created_at, status, method, metadata")
        .eq("owner_id", vendorId)
        .order("created_at", { ascending: false }),
    ]);

    let refundRecords: any[] = [];
    if (refundStoreRes.data?.config) {
      const parsed = typeof refundStoreRes.data.config === "string" ? JSON.parse(refundStoreRes.data.config) : refundStoreRes.data.config;
      if (Array.isArray(parsed)) refundRecords = parsed;
    }
    const refundMap = new Map(refundRecords.map((r) => [r.payment_id, r]));

    const invoices: VendorInvoiceItem[] = [];

    // Map lead unlock payments
    (lpRes.data ?? []).forEach((p: any) => {
      const dest = p.custom_tour_leads?.destination || "Custom Tour";
      const dep = p.custom_tour_leads?.departure_city ? ` (${p.custom_tour_leads.departure_city})` : "";
      const refSuffix = p.payment_intent_id ? p.payment_intent_id.replace(/^link_/, "").slice(-6).toUpperCase() : p.id.slice(-6).toUpperCase();
      const refund = refundMap.get(p.id) || refundMap.get(`unlock-${p.id.slice(0, 8)}`) || refundMap.get(p.lead_id);
      const isRefunded = p.status === "refunded" || !!refund;

      invoices.push({
        id: `INV-LEAD-${refSuffix}`,
        date: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        description: `Custom Tour Lead Unlock — ${dest}${dep}`,
        amount_pkr: p.amount || 5000,
        status: isRefunded ? "refunded" : p.status === "completed" ? "paid" : "pending",
        method: "SafePay PKR (QuickLink)",
        period: isRefunded ? "Reversed / Refunded" : "Instant Lead Access & B2B Quotation Desk",
        payment_intent_id: p.payment_intent_id,
        destination: dest,
        departure_city: p.custom_tour_leads?.departure_city,
        is_refunded: isRefunded,
        refund_reason: refund?.refund_reason || (isRefunded ? "Lead Unlock Refund" : undefined),
        refund_transaction_id: refund?.refund_transaction_id || undefined,
        refunded_at: refund?.refunded_at || undefined,
        refund_amount_pkr: refund?.refund_amount_pkr || (isRefunded ? p.amount : undefined),
      });
    });

    // 2. Map real subscription & addon invoices from payments ledger
    (realPaymentsRes.data ?? []).forEach((p: any) => {
      const meta = p.metadata || {};
      const dateStr = p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
      const refSuffix = p.id.slice(-6).toUpperCase();
      const refund = refundMap.get(p.id) || refundMap.get(`sub-${p.id.slice(0, 8)}`) || refundMap.get(`boost-${p.id.slice(0, 8)}`);
      const isRefunded = p.status === "refunded" || !!refund;

      if (meta.type === "subscription") {
        const tierName = (meta.tier || "Subscription").charAt(0).toUpperCase() + (meta.tier || "Subscription").slice(1);
        const invMonth = new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const subExpire = new Date(dateStr);
        subExpire.setDate(subExpire.getDate() + 30);
        invoices.push({
          id: `INV-SUB-${meta.tier?.toUpperCase() || "PRO"}-${refSuffix}`,
          date: dateStr,
          description: `${tierName} Partner Monthly Subscription`,
          amount_pkr: p.amount || 0,
          status: isRefunded ? "refunded" : p.status === "paid" ? "paid" : "pending",
          method: "SafePay PKR",
          period: isRefunded ? "Reversed / Refunded" : `${invMonth} Billing Period`,
          expires_at: subExpire.toISOString().split("T")[0],
          is_refunded: isRefunded,
          refund_reason: refund?.refund_reason || (isRefunded ? "Subscription Refund" : undefined),
          refund_transaction_id: refund?.refund_transaction_id || undefined,
          refunded_at: refund?.refunded_at || undefined,
          refund_amount_pkr: refund?.refund_amount_pkr || (isRefunded ? p.amount : undefined),
        });
      } else if (meta.type === "addon") {
        let durationDays = 30;
        if (meta.billingPeriod?.includes("week") || meta.billingPeriod?.includes("7")) durationDays = 7;
        const subExpire = new Date(dateStr);
        subExpire.setDate(subExpire.getDate() + durationDays);

        invoices.push({
          id: `INV-BOOST-${refSuffix}`,
          date: dateStr,
          description: `${meta.addonTitle || "Addon Boost"} (${meta.billingPeriod || "Campaign"})`,
          amount_pkr: p.amount || 0,
          status: isRefunded ? "refunded" : p.status === "paid" ? "paid" : "pending",
          method: "SafePay PKR",
          period: isRefunded ? "Reversed / Refunded" : `${durationDays === 7 ? "7 Days Flash Campaign" : meta.billingPeriod || "Monthly"} Active Boost`,
          expires_at: subExpire.toISOString().split("T")[0],
          is_refunded: isRefunded,
          refund_reason: refund?.refund_reason || (isRefunded ? "Addon Boost Refund" : undefined),
          refund_transaction_id: refund?.refund_transaction_id || undefined,
          refunded_at: refund?.refunded_at || undefined,
          refund_amount_pkr: refund?.refund_amount_pkr || (isRefunded ? p.amount : undefined),
        });
      }
    });

    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

// -------- Admin: Process / Record SafePay Refund with Reason, Date & Transaction ID --------
export const processOrRecordRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: {
    paymentId: string;
    paymentType?: "lead_unlock" | "subscription" | "payment";
    refundReason: string;
    refundTransactionId: string;
    refundDate?: string;
    refundAmountPkr: number;
    refundNotes?: string;
    revokeAccess?: boolean;
  }) => {
    if (!input.paymentId?.trim()) throw new Error("Payment Reference required");
    if (!input.refundReason?.trim()) throw new Error("Refund Reason required");
    if (!input.refundTransactionId?.trim()) throw new Error("SafePay Transaction ID required");
    if (!input.refundAmountPkr || input.refundAmountPkr <= 0) throw new Error("Valid refund amount required");
    return input;
  })
  .handler(async ({ data: input, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify caller has Admin role
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (roleRow?.role !== "admin") {
      throw new Error("Unauthorized: Only platform administrators can record or process refunds.");
    }

    const refundedAt = input.refundDate ? new Date(input.refundDate).toISOString() : new Date().toISOString();

    const refundEntry = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payment_id: input.paymentId,
      payment_type: input.paymentType || "lead_unlock",
      refund_reason: input.refundReason.trim(),
      refund_transaction_id: input.refundTransactionId.trim(),
      refunded_at: refundedAt,
      refund_amount_pkr: Number(input.refundAmountPkr),
      refund_notes: input.refundNotes?.trim() || "",
      refunded_by: context.userId,
      created_at: new Date().toISOString(),
    };

    // 2. Fetch and update refund store in payment_gateway_settings
    const { data: currentStore } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "refund_records_store")
      .maybeSingle();

    let existingRefunds: any[] = [];
    if (currentStore?.config) {
      existingRefunds = typeof currentStore.config === "string" ? JSON.parse(currentStore.config) : currentStore.config;
      if (!Array.isArray(existingRefunds)) existingRefunds = [];
    }

    const updatedRefunds = [refundEntry, ...existingRefunds.filter((r) => r.payment_id !== input.paymentId)];

    await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert(
        { provider: "refund_records_store", config: updatedRefunds as any, enabled: true },
        { onConflict: "provider" }
      );

    // 3. Mark database records as refunded
    const cleanId = input.paymentId.replace(/^(unlock-|sub-|boost-|pay-|lead-)/, "");

    // Check in lead_unlock_payments
    const { data: lpRows } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("id, lead_id, vendor_id")
      .or(`id.ilike.%${cleanId}%,payment_intent_id.ilike.%${cleanId}%,lead_id.ilike.%${cleanId}%`);

    if (lpRows && lpRows.length > 0) {
      for (const lp of lpRows) {
        await supabaseAdmin
          .from("lead_unlock_payments")
          .update({ status: "refunded" })
          .eq("id", lp.id);

        if (input.revokeAccess !== false) {
          await supabaseAdmin
            .from("vendor_lead_purchases")
            .delete()
            .eq("lead_id", lp.lead_id)
            .eq("vendor_id", lp.vendor_id);
        }
      }
    }

    // Check in payments table
    await supabaseAdmin
      .from("payments")
      .update({ status: "refunded" })
      .or(`id.ilike.%${cleanId}%,payment_intent_id.ilike.%${cleanId}%`);

    return {
      ok: true,
      message: `Refund of Rs ${input.refundAmountPkr.toLocaleString()} recorded successfully with SafePay ID: ${input.refundTransactionId.trim()}`,
      refund: refundEntry,
    };
  });
