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

    // 2. Fetch completed lead unlocks and real SafePay payments
    const [lpRes, payRes, dbPlansRes, addonGatewayData] = await Promise.all([
      supabaseAdmin
        .from("lead_unlock_payments")
        .select("id, lead_id, vendor_id, amount, created_at, status, profiles(full_name, company_name, email)")
        .eq("status", "completed")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("payments")
        .select("id, owner_id, amount, created_at, metadata, profiles(full_name, company_name, email)")
        .eq("status", "paid")
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
        .maybeSingle()
    ]);

    if (lpRes.error) console.error("[getAdminFinancialMetrics] leadPurchases error:", lpRes.error);
    if (payRes.error) console.error("[getAdminFinancialMetrics] payments error:", payRes.error);

    const validLeads = lpRes.data ?? [];
    const realPayments = payRes.data ?? [];

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
    const totalLeadUnlocks = validLeads.length;
    const totalLeadUnlockRevenue = validLeads.reduce(
      (acc: number, item: any) => acc + (item.amount || LEAD_UNLOCK_FEE_PKR),
      0
    );

    // 5. Compute real Addon Revenue and Subscription Revenue
    const allAddonsList: any[] = (addonGatewayData.data?.config as any[]) || [];
    const totalAddonRevenue = realAddonPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalSubRevenue = realSubPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Total gross collections (ACTUAL settled cash)
    const totalGrossCollections = totalSubRevenue + totalLeadUnlockRevenue + totalAddonRevenue;

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

    validLeads.forEach((lp) => {
      const dateKey = new Date(lp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const unlockAmt = lp.amount || LEAD_UNLOCK_FEE_PKR;
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].leadUnlocks += unlockAmt;
        dailyMap[dateKey].total += unlockAmt;
      }
    });

    realSubPayments.forEach((p) => {
      const dateKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].subscriptions += (p.amount || 0);
        dailyMap[dateKey].total += (p.amount || 0);
      }
    });

    realAddonPayments.forEach((p) => {
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

    realSubPayments.forEach(p => {
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

    // 8. Recent Transaction Feed
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const recentTransactions = realSubPayments
      .map((p: any) => {
        const v = p.profiles || {};
        return {
          id: `sub-${p.id.slice(0, 8)}`,
          type: "Subscription Tier",
          vendorName: v.company_name || v.full_name || "Vendor Partner",
          email: v.email,
          tier: ((p.metadata as any)?.tier || "pro").toUpperCase(),
          amount: p.amount || 10000,
          date: p.created_at,
          status: "Settled (SafePay)",
        };
      })
      .concat(
        realAddonPayments.map((p: any) => {
          const v = p.profiles || {};
          return {
            id: `boost-${p.id.slice(0, 8)}`,
            type: "Marketplace Boost / Ad",
            vendorName: v.company_name || v.full_name || "Verified Partner",
            email: v.email || "agency@globetrek.pk",
            tier: "BOOST ADDON",
            amount: p.amount || 0,
            date: p.created_at,
            status: "Settled (SafePay)",
          };
        })
      )
      .concat(
        validLeads.map((lp: any) => ({
          id: `unlock-${lp.id.slice(0, 8)}`,
          type: "Lead Unlock Fee",
          vendorName: lp.profiles?.company_name || lp.profiles?.full_name || "Travel Partner",
          email: lp.profiles?.email || "vendor@globetrek.pk",
          tier: "LEAD UNLOCK",
          amount: lp.amount || LEAD_UNLOCK_FEE_PKR,
          date: lp.created_at,
          status: "Settled (SafePay)",
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25);

    return {
      mrrSubscriptions,
      totalLeadUnlocks,
      totalLeadUnlockRevenue,
      totalAddonRevenue,
      totalAddonsCount: allAddonsList.length,
      totalGrossCollections,
      paidVendorsCount: proCount + starterCount + agencyCount,
      freeVendorsCount: freeCount,
      proCount,
      starterCount,
      agencyCount,
      timeSeriesData,
      breakdownPieData,
      recentTransactions,
    };
  });

export interface VendorInvoiceItem {
  id: string;
  date: string;
  description: string;
  amount_pkr: number;
  status: "paid" | "pending";
  method: string;
  period: string;
  expires_at?: string;
  payment_intent_id?: string;
  destination?: string;
  departure_city?: string;
}

export const getVendorInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VendorInvoiceItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const vendorId = context.userId;

    // 1. Fetch vendor's lead unlock payments
    const { data: leadPayments, error: lpErr } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("id, lead_id, vendor_id, amount, created_at, status, payment_intent_id, custom_tour_leads(destination, departure_city)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (lpErr) console.error("[getVendorInvoices] lead payments error:", lpErr);

    // 2. Fetch vendor profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier, created_at, updated_at")
      .eq("id", vendorId)
      .maybeSingle();

    const invoices: VendorInvoiceItem[] = [];

    // Map lead unlock payments
    (leadPayments ?? []).forEach((p: any) => {
      const dest = p.custom_tour_leads?.destination || "Custom Tour";
      const dep = p.custom_tour_leads?.departure_city ? ` (${p.custom_tour_leads.departure_city})` : "";
      const refSuffix = p.payment_intent_id ? p.payment_intent_id.replace(/^link_/, "").slice(-6).toUpperCase() : p.id.slice(-6).toUpperCase();

      invoices.push({
        id: `INV-LEAD-${refSuffix}`,
        date: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        description: `Custom Tour Lead Unlock — ${dest}${dep}`,
        amount_pkr: p.amount || 5000,
        status: p.status === "completed" ? "paid" : "pending",
        method: "SafePay PKR (QuickLink)",
        period: "Instant Lead Access & B2B Quotation Desk",
        payment_intent_id: p.payment_intent_id,
        destination: dest,
        departure_city: p.custom_tour_leads?.departure_city,
      });
    });

    // 3. Fetch real subscription & addon invoices from payments ledger
    const { data: realPayments } = await supabaseAdmin
      .from("payments")
      .select("id, amount, created_at, status, method, metadata")
      .eq("owner_id", vendorId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    (realPayments ?? []).forEach((p: any) => {
      const meta = p.metadata || {};
      const dateStr = p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
      const refSuffix = p.id.slice(-6).toUpperCase();

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
          status: p.status === "paid" ? "paid" : "pending",
          method: "SafePay PKR",
          period: `${invMonth} Billing Period`,
          expires_at: subExpire.toISOString().split("T")[0],
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
          status: p.status === "paid" ? "paid" : "pending",
          method: "SafePay PKR",
          period: `${durationDays === 7 ? "7 Days Flash Campaign" : meta.billingPeriod || "Monthly"} Active Boost`,
          expires_at: subExpire.toISOString().split("T")[0],
        });
      }
    });

    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
