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

    // Upgrades take effect immediately
    const { error } = await context.supabase
      .from("profiles")
      .update({
        subscription_tier: data.tier as never,
        pending_downgrade_tier: null,
      } as any)
      .eq("id", context.userId);

    if (error) throw new Error(error.message);

    // Send WhatsApp payment receipt to vendor
    try {
      if (profile?.phone) {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const msg = `💳 *GlobeTrek PK — Subscription Upgraded!* 🎉\n\nDear *${profile.full_name || "Vendor"}*,\n\nYour account has been successfully upgraded to the *${(targetMeta?.name || data.tier).toUpperCase()} Plan*!\n\nYou now enjoy priority search placement, verified vendor status, and tier privileges.\n\nManage your subscription:\nhttps://globetrek.pk/vendor/billing`;
        await sendWhatsAppMessage({
          data: { phone: profile.phone, message: msg, skipDeduplication: true },
        });
      }
    } catch (waErr) {
      console.error("Subscription upgrade WhatsApp alert error:", waErr);
    }

    return {
      ok: true,
      tier: data.tier,
      isDowngrade: false,
      message: `Successfully upgraded to ${targetMeta?.name || data.tier} Plan!`,
    };
  });
