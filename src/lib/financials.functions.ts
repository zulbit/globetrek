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

    // 2. Fetch completed lead unlocks / purchases with supabaseAdmin (bypasses RLS)
    const { data: leadPurchases, error: lpErr } = await supabaseAdmin
      .from("lead_unlock_payments")
      .select("id, lead_id, vendor_id, amount, created_at, status, profiles(full_name, company_name, email)")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (lpErr) console.error("[getAdminFinancialMetrics] leadPurchases error:", lpErr);

    const validLeads = leadPurchases ?? [];

    // 3. Compute subscription collections
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

    const mrrSubscriptions =
      proCount * TIER_PRICES.pro +
      starterCount * TIER_PRICES.starter +
      agencyCount * TIER_PRICES.agency;

    // 4. Compute Custom Lead Unlocks collections
    const totalLeadUnlocks = validLeads.length;
    const totalLeadUnlockRevenue = validLeads.reduce(
      (acc: number, item: any) => acc + (item.amount || LEAD_UNLOCK_FEE_PKR),
      0
    );

    // 5. Fetch all vendor active add-ons for financial ledger
    const { data: addonGatewayData } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "vendor_active_addons")
      .maybeSingle();

    const allAddonsList: any[] = (addonGatewayData?.config as any[]) || [];
    const totalAddonRevenue = allAddonsList.reduce((acc, a) => acc + (Number(a.amount_pkr) || 0), 0);

    // Total gross collections
    const totalGrossCollections = mrrSubscriptions + totalLeadUnlockRevenue + totalAddonRevenue;

    // 6. Generate daily collections chart data
    const dailyMap: Record<string, { date: string; subscriptions: number; leadUnlocks: number; total: number }> = {};
    const daysCount = inputData.period === "30d" ? 30 : inputData.period === "90d" ? 90 : 180;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = {
        date: key,
        subscriptions: Math.round(mrrSubscriptions / 30),
        leadUnlocks: 0,
        total: Math.round(mrrSubscriptions / 30),
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

    allAddonsList.forEach((a) => {
      const dateKey = new Date(a.starts_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const amt = Number(a.amount_pkr) || 0;
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].total += amt;
      }
    });

    const timeSeriesData = Object.values(dailyMap);

    // 7. Pie Chart Data: Revenue Breakdown by Stream
    const breakdownPieData = [
      { name: "Pro Subscriptions", value: proCount * TIER_PRICES.pro, color: "#10b981" },
      { name: "Custom Lead Unlocks", value: totalLeadUnlockRevenue, color: "#f59e0b" },
      { name: "Agency Visibility Boosts", value: totalAddonRevenue, color: "#ec4899" },
      { name: "Agency Subscriptions", value: agencyCount * TIER_PRICES.agency, color: "#a855f7" },
      { name: "Starter Subscriptions", value: starterCount * TIER_PRICES.starter, color: "#38bdf8" },
    ].filter((item) => item.value > 0);

    if (breakdownPieData.length === 0) {
      breakdownPieData.push({ name: "Lead Unlocks", value: 5000, color: "#f59e0b" });
    }

    // 8. Recent Transaction Feed
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const recentTransactions = vendorsList
      .filter((v) => (v.subscription_tier || "free") !== "free")
      .map((v) => ({
        id: `sub-${v.id.slice(0, 8)}`,
        type: "Subscription Tier",
        vendorName: v.company_name || v.full_name || "Vendor Partner",
        email: v.email,
        tier: (v.subscription_tier || "pro").toUpperCase(),
        amount: TIER_PRICES[v.subscription_tier || "pro"] || 10000,
        date: v.updated_at || v.created_at || new Date().toISOString(),
        status: "Settled (SafePay)",
      }))
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
      .concat(
        allAddonsList.map((a: any) => {
          const v = profileMap.get(a.vendor_id);
          return {
            id: `boost-${a.id ? a.id.slice(-8) : Math.random().toString(36).slice(-8)}`,
            type: "Marketplace Boost / Ad",
            vendorName: v?.company_name || v?.full_name || "Verified Partner",
            email: v?.email || "agency@globetrek.pk",
            tier: "BOOST ADDON",
            amount: Number(a.amount_pkr) || 0,
            date: a.starts_at || new Date().toISOString(),
            status: "Settled (SafePay)",
          };
        })
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25);

    return {
      mrrSubscriptions,
      totalLeadUnlocks,
      totalLeadUnlockRevenue,
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

    // Add subscription invoice if on paid tier
    const tier = (profile?.subscription_tier || "free").toLowerCase();
    if (tier !== "free" && TIER_PRICES[tier]) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
      const subDate = profile?.updated_at || profile?.created_at || new Date().toISOString();
      const subDateStr = subDate.split("T")[0];
      const invMonth = new Date(subDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      const subExpire = new Date(subDate);
      subExpire.setDate(subExpire.getDate() + 30);

      invoices.push({
        id: `INV-SUB-${profile?.subscription_tier?.toUpperCase()}-${new Date(subDate).getMonth() + 1}26`,
        date: subDateStr,
        description: `${tierName} Partner Monthly Subscription`,
        amount_pkr: TIER_PRICES[tier],
        status: "paid",
        method: "SafePay PKR (Recurring)",
        period: `${invMonth} Billing Period`,
        expires_at: subExpire.toISOString().split("T")[0],
      });
    }

    // 3. Fetch vendor active add-on subscriptions & flash banner invoices
    const { data: gatewayData } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "vendor_active_addons")
      .maybeSingle();

    if (gatewayData?.config && Array.isArray(gatewayData.config)) {
      const myAddons = (gatewayData.config as any[]).filter((a) => a.vendor_id === vendorId);
      myAddons.forEach((a) => {
        const dateStr = a.starts_at ? a.starts_at.split("T")[0] : new Date().toISOString().split("T")[0];
        const expireStr = a.expires_at ? a.expires_at.split("T")[0] : undefined;
        const refSuffix = a.id ? a.id.slice(-6).toUpperCase() : Math.random().toString(36).slice(-6).toUpperCase();
        invoices.push({
          id: `INV-BOOST-${refSuffix}`,
          date: dateStr,
          description: `${a.addon_title} (${a.billing_period || "Campaign"})`,
          amount_pkr: Number(a.amount_pkr || 0),
          status: "paid",
          method: "SafePay PKR (QuickLink)",
          period: `${a.billing_period === "weekly" ? "7 Days Flash Campaign" : a.billing_period || "Monthly"} Active Boost`,
          expires_at: expireStr,
        });
      });
    }

    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
