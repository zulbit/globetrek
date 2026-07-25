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
    return { ok: true, tier: data.tier };
  });
