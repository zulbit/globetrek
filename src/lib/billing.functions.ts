import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TIERS = ["free", "starter", "pro", "agency"] as const;
type Tier = (typeof TIERS)[number];

export const changeSubscriptionTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tier: Tier }) => {
    if (!TIERS.includes(input.tier)) throw new Error("Invalid tier");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ subscription_tier: data.tier as never })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    // Send WhatsApp payment receipt to vendor
    try {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", context.userId)
        .single();

      if (profile?.phone) {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp.functions");
        const msg = `💳 *GlobeTrek PK — Subscription Upgraded!* 🎉\n\nDear *${profile.full_name || "Vendor"}*,\n\nYour account has been successfully upgraded to the *${data.tier.toUpperCase()} Plan*!\n\nYou now enjoy priority search placement, verified vendor status, and tier privileges.\n\nManage your subscription:\nhttps://tour.testbench.shop/vendor/billing`;
        await sendWhatsAppMessage({
          data: { phone: profile.phone, message: msg, skipDeduplication: true }
        });
      }
    } catch (waErr) {
      console.error("Subscription upgrade WhatsApp alert error:", waErr);
    }

    return { ok: true, tier: data.tier };
  });
