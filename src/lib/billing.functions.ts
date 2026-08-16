import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TIERS } from "@/lib/pricing";

const TIER_IDS = ["free", "starter", "pro", "agency"] as const;
type Tier = (typeof TIER_IDS)[number];

export const changeSubscriptionTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tier: Tier }) => {
    if (!TIER_IDS.includes(input.tier)) throw new Error("Invalid tier");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("subscription_tier, full_name, phone")
      .eq("id", context.userId)
      .maybeSingle();

    const currentTierId = (profile?.subscription_tier as Tier) || "free";
    const currentMeta = TIERS.find((t) => t.id === currentTierId);
    const targetMeta = TIERS.find((t) => t.id === data.tier);

    const currentPrice = currentMeta?.price_pkr ?? 0;
    const targetPrice = targetMeta?.price_pkr ?? 0;
    const isDowngrade = targetPrice < currentPrice;

    if (isDowngrade) {
      // Downgrades take effect on next billing cycle — no refunds
      const { error } = await context.supabase
        .from("profiles")
        .update({ pending_downgrade_tier: data.tier } as any)
        .eq("id", context.userId);

      if (error) {
        // Fallback update
        await context.supabase
          .from("profiles")
          .update({ subscription_tier: data.tier as never })
          .eq("id", context.userId);
      }

      return {
        ok: true,
        tier: data.tier,
        isDowngrade: true,
        effectiveDate: "Next Payment Cycle",
        message: `Downgrade to ${targetMeta?.name || data.tier} scheduled for your next payment cycle. No refunds are issued for the active period.`,
      };
    }

    // Upgrades: Generate SafePay checkout
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Fetch dynamic pricing
    const { data: dbPlansRes } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("config")
      .eq("provider", "subscription_plans")
      .maybeSingle();
      
    const dbPlans = dbPlansRes?.config || [];
    let dynamicPrice = targetPrice;
    if (Array.isArray(dbPlans)) {
      const match = dbPlans.find((p: any) => p.id === data.tier);
      if (match && match.price_pkr !== undefined) {
        dynamicPrice = Number(match.price_pkr);
      }
    }

    if (dynamicPrice <= 0) {
      // Free or 0 price upgrade (instant)
      await context.supabase
        .from("profiles")
        .update({ subscription_tier: data.tier as never, pending_downgrade_tier: null } as any)
        .eq("id", context.userId);
      return { ok: true, tier: data.tier, isDowngrade: false, message: `Successfully upgraded to ${targetMeta?.name || data.tier} Plan!` };
    }

    // Generate SafePay QuickLink for the subscription payment
    let checkoutUrl = "";
    const env = (process.env.SAFEPAY_ENV || "sandbox").toLowerCase();
    const baseUrl = env === "production" || env === "live"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com";
    const secretKey = process.env.SAFEPAY_SECRET_KEY;

    if (secretKey) {
      const vendorName = profile?.full_name || "GlobeTrek Vendor";
      const [firstName, ...rest] = vendorName.trim().split(/\s+/);
      const lastName = rest.join(" ") || "Partner";

      const qlRes = await fetch(`${baseUrl}/invoice/quick-links/v2/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SFPY-MERCHANT-SECRET": secretKey,
        },
        body: JSON.stringify({
          amount: Math.round(dynamicPrice),
          currency: "PKR",
          note: `GlobeTrek PK — ${targetMeta?.name || data.tier} Subscription Upgrade`,
          workflow: "MANUAL",
          customer: {
            first_name: firstName,
            last_name: lastName,
            email: "vendor@globetrek.pk",
            phone_number: "+923001234567",
          },
        }),
      });

      if (qlRes.ok) {
        const qlJson = (await qlRes.json()) as any;
        const recipientUrl = qlJson.data?.metadata?.[0]?.recipient_view_url;
        if (recipientUrl) {
          const url = new URL(recipientUrl);
          url.searchParams.set("email", "vendor@globetrek.pk");
          url.searchParams.set("first_name", firstName);
          url.searchParams.set("last_name", lastName);
          checkoutUrl = url.toString();
        }
      }
    }

    if (!checkoutUrl) throw new Error("Failed to generate SafePay checkout session.");

    // Log pending transaction in `payments` ledger
    const { data: pendingPayment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        owner_id: context.userId,
        amount: Math.round(dynamicPrice),
        currency: "PKR",
        method: "safepay",
        status: "pending",
        metadata: { type: "subscription", tier: data.tier, env },
      })
      .select("id")
      .single();

    if (payErr) throw new Error("Failed to initialize payment ledger: " + payErr.message);

    return {
      ok: true,
      tier: data.tier,
      isDowngrade: false,
      checkoutUrl,
      paymentId: pendingPayment.id,
      message: `Redirecting to SafePay Checkout for ${targetMeta?.name || data.tier} Plan...`,
    };
  });
