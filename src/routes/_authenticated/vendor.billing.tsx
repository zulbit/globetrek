import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles, CreditCard, ArrowRight, Loader2, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TIERS, formatTierPrice, type PricingTier } from "@/lib/pricing";
import { changeSubscriptionTier } from "@/lib/billing.functions";

type Tier = PricingTier["id"];

const AI_LIMITS: Record<Tier, { description: number | null; plan: number | null }> = {
  free: { description: 0, plan: 0 },
  starter: { description: 10, plan: 0 },
  pro: { description: null, plan: 50 },
  agency: { description: null, plan: null },
};

// PLANNED MONETIZATION EXTENSIONS (Do not create active plan records for now):
// 1. Search Placement Plan: Priority ranking in /tours, /visa, /insurance, /tickets search results.
// 2. AI Placement Plan: Featured vendor recommendations by AI Concierge (/api/ai-chat).
// 3. Landing Page Placement Plan: Featured Agency Spotlight badge on landing page.
// 4. 1-Week Flash Banner Advertisement Plan: 7-Day promotional hero banner on landing page.

import { useState, useMemo } from "react";
import { ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSubscriptionPlans, activateVendorAddon, getVendorActiveAddons } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/vendor/billing")({
  component: BillingPage,
});

function BillingPage() {
  const qc = useQueryClient();
  const change = useServerFn(changeSubscriptionTier);
  const getPlansFn = useServerFn(getSubscriptionPlans);
  const activateAddonFn = useServerFn(activateVendorAddon);
  const getVendorAddonsFn = useServerFn(getVendorActiveAddons);

  const [selectedAddonCheckout, setSelectedAddonCheckout] = useState<any | null>(null);

  const { data: myActiveAddons } = useQuery({
    queryKey: ["vendor-my-active-addons"],
    queryFn: () => getVendorAddonsFn(),
  });

  const activateAddonMutation = useMutation({
    mutationFn: (input: { addonId: string; addonTitle: string; amountPKR: number; billingPeriod: string }) =>
      activateAddonFn({ data: input }),
    onSuccess: (res, variables) => {
      toast.success(`Activated ${variables.addonTitle}!`, {
        description: "Your SafePay PKR payment completed cleanly. Your visibility boost is live now!",
      });
      setSelectedAddonCheckout(null);
      qc.invalidateQueries({ queryKey: ["vendor-my-active-addons"] });
    },
    onError: (err: any) => {
      toast.error("Checkout failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const { data: dbPlans } = useQuery({
    queryKey: ["subscription-plans-config-vendor-billing"],
    queryFn: () => getPlansFn(),
  });

  const activeBasePlans = useMemo(() => {
    if (!dbPlans || dbPlans.length === 0) return TIERS;
    const baseOnly = dbPlans.filter((p: any) => (p.plan_type || "base") === "base" && p.is_enabled !== false);
    if (baseOnly.length === 0) return TIERS;
    return baseOnly.map((p: any) => {
      const match = TIERS.find((t) => t.id === p.id);
      return {
        ...p,
        icon: match?.icon || Sparkles,
        accent: match?.accent || "muted-foreground",
        covers: p.covers || match?.covers || [],
      };
    });
  }, [dbPlans]);

  const activeAddons = useMemo(() => {
    if (!dbPlans || dbPlans.length === 0) {
      return [
        {
          id: "placement_search",
          name: "Search Placement Boost",
          plan_type: "placement",
          price_pkr: 8000,
          billing_period: "monthly",
          tagline: "Top #1-#3 search position boost in category queries",
          features: [
            "Top 3 position ranking in search queries",
            "Featured badge on search result cards",
            "4x average traveler click-through rate",
            "Priority lead routing",
          ],
        },
        {
          id: "placement_ai",
          name: "AI Concierge Recommendation",
          plan_type: "placement",
          price_pkr: 12000,
          billing_period: "monthly",
          tagline: "Recommended by AI Concierge in Roman Urdu & English",
          features: [
            "Direct AI recommendation priority in chat queries",
            "AI Concierge booking link placement",
            "High-trust traveler lead conversions",
            "Weekly performance analytics report",
          ],
        },
        {
          id: "placement_landing",
          name: "Landing Page Spotlight",
          plan_type: "placement",
          price_pkr: 15000,
          billing_period: "monthly",
          tagline: "Featured Agency Spotlight card on main landing page",
          features: [
            "Featured Agency Spotlight showcase on homepage",
            "Top hero slider package placement",
            "Maximum brand authority & trust",
            "Dedicated agency store link",
          ],
        },
        {
          id: "ad_flash_banner_1w",
          name: "1-Week Hero Flash Banner Ad",
          plan_type: "advertisement",
          price_pkr: 15000,
          billing_period: "weekly",
          tagline: "7-Day exclusive promotional banner on homepage hero",
          features: [
            "7-Day Hero Banner Ad on GlobeTrek PK homepage",
            "Custom CTA link to your specific package or store",
            "Ideal for seasonal sales (Umrah, Baku Winter, Eid Specials)",
            "Dedicated campaign analytics report",
          ],
        },
      ];
    }
    return dbPlans.filter((p: any) => (p.plan_type === "placement" || p.plan_type === "advertisement") && p.is_enabled !== false);
  }, [dbPlans]);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-billing"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user!.id;
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const [profile, usage, tours, leads] = await Promise.all([
        supabase
          .from("profiles")
          .select("subscription_tier, lead_credits_balance, updated_at")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("ai_usage_events")
          .select("kind")
          .eq("user_id", uid)
          .gte("created_at", monthStart.toISOString()),
        supabase.from("tours").select("id,is_active").eq("vendor_id", uid),
        supabase.from("leads").select("id,is_unlocked").eq("vendor_id", uid),
      ]);
      const events = (usage.data ?? []) as { kind: "description" | "plan" }[];
      return {
        tier: (profile.data?.subscription_tier ?? "free") as Tier,
        credits: profile.data?.lead_credits_balance ?? 0,
        updated_at: profile.data?.updated_at as string | undefined,
        aiDescriptions: events.filter((e) => e.kind === "description").length,
        aiPlans: events.filter((e) => e.kind === "plan").length,
        activeTours: (tours.data ?? []).filter((t) => t.is_active).length,
        totalTours: tours.data?.length ?? 0,
        unlockedLeads: (leads.data ?? []).filter((l) => l.is_unlocked).length,
      };
    },
  });

  const mutation = useMutation({
    mutationFn: (tier: Tier) => change({ data: { tier } }),
    onSuccess: (_res, tier) => {
      const name = TIERS.find((t) => t.id === tier)?.name ?? tier;
      toast.success(`Switched to ${name} plan`, {
        description: "Real payment processing is coming soon — this is a demo switch.",
      });
      qc.invalidateQueries({ queryKey: ["vendor-billing"] });
      qc.invalidateQueries({ queryKey: ["vendor-overview"] });
      qc.invalidateQueries({ queryKey: ["vendor-tier"] });
    },
    onError: (e: unknown) => {
      toast.error("Could not switch plan", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    },
  });

  const currentTier: Tier = data?.tier ?? "free";
  const currentTierMeta = TIERS.find((t) => t.id === currentTier)!;
  const limits = AI_LIMITS[currentTier];

  return (
    <div className="space-y-6">
      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-highlight/30 bg-highlight/5 px-4 py-3 text-xs text-highlight/90">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <p>
          Payment processing isn't live yet. Switching plans here updates your account instantly
          so you can preview locked features — no card is charged.
        </p>
      </div>

      {/* Current plan hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <CreditCard className="size-3.5" /> Current plan
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40">
                    <currentTierMeta.icon className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{currentTierMeta.name}</h2>
                    <p className="text-xs text-muted-foreground">{currentTierMeta.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums">
                    {formatTierPrice(currentTierMeta.price_pkr)}
                  </span>
                  {currentTierMeta.price_pkr > 0 && (
                    <span className="text-xs text-muted-foreground">/ month</span>
                  )}
                </div>
              </div>
              <div className="grid gap-2 text-right text-xs text-muted-foreground">
                <div>
                  Lead credits: <span className="font-semibold text-foreground">
                    {currentTier === "pro" || currentTier === "agency" ? "Unlimited" : data?.credits ?? 0}
                  </span>
                </div>
                <div>
                  Active tours: <span className="font-semibold text-foreground">{data?.activeTours ?? 0}</span>
                  {" "}/ {data?.totalTours ?? 0}
                </div>
                <div>
                  Leads unlocked: <span className="font-semibold text-foreground">{data?.unlockedLeads ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Usage bars */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <UsageBar label="AI short descriptions" used={data?.aiDescriptions ?? 0} limit={limits.description} />
              <UsageBar label="AI full-trip plans" used={data?.aiPlans ?? 0} limit={limits.plan} />
            </div>
          </div>

          {/* Active Vendor Add-on Boosts */}
          {myActiveAddons && myActiveAddons.length > 0 && (
            <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-purple-500/20 text-purple-300">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Active Agency Visibility Boosts</h3>
                    <p className="text-[11px] text-muted-foreground">Your active marketplace placements &amp; banner ad campaigns</p>
                  </div>
                </div>
                <Badge className="bg-purple-500 text-white font-bold text-[10px]">
                  {myActiveAddons.length} Active Boost{myActiveAddons.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {myActiveAddons.map((act: any) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(act.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={act.id} className="rounded-xl border border-purple-500/30 bg-card p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{act.addon_title}</span>
                        <span className="text-[10px] text-purple-300 font-mono">
                          Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} ({new Date(act.expires_at).toLocaleDateString()})
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold">
                        Live
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan switcher */}
          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Change Base Plan</h3>
                <p className="text-xs text-muted-foreground">
                  Upgrade, downgrade, or switch at any time. Changes take effect immediately.
                </p>
              </div>
              <a
                href="/pricing"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Compare features <ArrowRight className="size-3" />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activeBasePlans.map((tier) => {
                const isCurrent = tier.id === currentTier;
                const Icon = tier.icon || Sparkles;
                const pending = mutation.isPending && mutation.variables === tier.id;
                const disabled = isCurrent || isLoading || mutation.isPending;
                return (
                  <div
                    key={tier.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                      isCurrent
                        ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                        : tier.highlight
                          ? "border-primary/30 bg-card hover:border-primary/50"
                          : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div>
                      {isCurrent && (
                        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                          <Crown className="size-3" /> Current
                        </span>
                      )}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-lg bg-surface text-muted-foreground ring-1 ring-border">
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold">{tier.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{tier.tagline}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums">
                          {formatTierPrice(tier.price_pkr)}
                        </span>
                        {tier.price_pkr > 0 && (
                          <span className="text-[11px] text-muted-foreground">/ mo</span>
                        )}
                      </div>
                      <ul className="mb-4 space-y-1.5 text-xs">
                        {tier.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex gap-2">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      disabled={disabled}
                      onClick={() => mutation.mutate(tier.id)}
                      className={`mt-auto w-full font-bold rounded-xl ${
                        isCurrent
                          ? "bg-surface text-muted-foreground"
                          : tier.highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-surface-2 text-foreground hover:bg-surface"
                      }`}
                    >
                      {pending ? (
                        <><Loader2 className="mr-2 size-3.5 animate-spin" /> Switching…</>
                      ) : isCurrent ? (
                        "Current plan"
                      ) : tier.price_pkr === 0 ? (
                        "Downgrade to Free"
                      ) : tier.price_pkr > (currentTierMeta.price_pkr) ? (
                        `Upgrade to ${tier.name}`
                      ) : (
                        `Switch to ${tier.name}`
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Marketplace Placement & Campaign Addons Section */}
          <div className="pt-4 border-t border-border">
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-400 mb-1">
                <Sparkles className="size-3.5" /> Boost Reach &amp; Lead Conversion
              </div>
              <h3 className="text-base font-bold text-foreground">Marketplace Placement &amp; Flash Campaign Add-ons</h3>
              <p className="text-xs text-muted-foreground">
                Optional visibility boosts you can attach to your agency profile anytime.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {activeAddons.map((addon: any) => {
                const isAd = addon.plan_type === "advertisement";
                const isFreeTier = currentTier === "free";

                return (
                  <div
                    key={addon.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition group ${
                      isFreeTier
                        ? "border-border/60 bg-surface/30 opacity-75 grayscale-[25%]"
                        : isAd
                          ? "border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-card hover:-translate-y-0.5"
                          : "border-purple-500/40 bg-gradient-to-b from-purple-500/10 to-card hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Free Tier Overlay / Hover Warning Banner */}
                    {isFreeTier && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 rounded-2xl bg-card/95 backdrop-blur-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-amber-500/40 shadow-xl">
                        <div className="size-8 rounded-full bg-amber-500/20 text-amber-400 grid place-items-center mb-2">
                          <Lock className="size-4" />
                        </div>
                        <h5 className="text-xs font-bold text-foreground">Not Available on FREE Tier</h5>
                        <p className="text-[11px] text-muted-foreground mt-1 mb-3 max-w-[220px] leading-relaxed">
                          Add-ons are not available on the FREE tier. Upgrade your plan to unlock Marketplace Boosts &amp; Flash Banners.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            window.scrollTo({ top: 150, behavior: "smooth" });
                            toast.info("Please select a paid plan above to activate add-ons.");
                          }}
                          className="text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 rounded-xl h-7 px-3 gap-1 shadow-sm"
                        >
                          <Sparkles className="size-3" /> Upgrade Plan
                        </Button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            isAd
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          {isAd ? "⚡ 1-Week Flash Banner" : "🌟 Placement Add-on"}
                        </span>
                        {isFreeTier && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Lock className="size-2.5" /> Locked on Free
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-foreground mb-1">{addon.name}</h4>
                      <p className="text-[11px] text-muted-foreground mb-3 leading-snug">{addon.tagline}</p>

                      <div className="mb-3 flex items-baseline gap-1">
                        <span className="text-xl font-extrabold font-mono text-foreground">
                          {formatTierPrice(addon.price_pkr)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          / {addon.billing_period === "weekly" ? "7 days" : "mo"}
                        </span>
                      </div>

                      <ul className="mb-4 space-y-1.5 text-[11px]">
                        {(addon.features || []).slice(0, 3).map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                            <Check
                              className={`size-3 shrink-0 mt-0.5 ${
                                isAd ? "text-rose-400" : "text-purple-400"
                              }`}
                            />
                            <span className="text-foreground/90">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      disabled={isFreeTier}
                      onClick={() => setSelectedAddonCheckout(addon)}
                      className={`w-full font-bold text-xs rounded-xl border ${
                        isFreeTier
                          ? "bg-surface text-muted-foreground border-border cursor-not-allowed"
                          : isAd
                            ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-400/40"
                            : "bg-purple-600 hover:bg-purple-700 text-white border-purple-400/40"
                      }`}
                    >
                      {isFreeTier ? "Requires Paid Plan" : isAd ? "Book Flash Banner" : "Activate Add-on"}
                    </Button>
                  </div>
                );
              })}
            </div>
      </div>

      {/* SafePay Checkout Modal for Addons */}
      {selectedAddonCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">SafePay Instant Checkout</h3>
                  <p className="text-[11px] text-muted-foreground">PKR Payment Gateway</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAddonCheckout(null)}
                className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{selectedAddonCheckout.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedAddonCheckout.tagline}</p>
                </div>
                <Badge className="bg-primary text-primary-foreground font-mono">
                  Rs {selectedAddonCheckout.price_pkr?.toLocaleString()}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-primary/20 flex justify-between">
                <span>Billing Period</span>
                <span className="font-semibold text-foreground capitalize">
                  {selectedAddonCheckout.billing_period === "weekly" ? "7 Days Campaign" : "Monthly Recurring"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-muted-foreground">Select Payment Method</label>
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span className="font-bold text-foreground">SafePay PKR QuickLink</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Encrypted</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedAddonCheckout(null)}
                className="w-1/3 text-xs rounded-xl border-border"
              >
                Cancel
              </Button>
              <Button
                disabled={activateAddonMutation.isPending}
                onClick={() =>
                  activateAddonMutation.mutate({
                    addonId: selectedAddonCheckout.id,
                    addonTitle: selectedAddonCheckout.name,
                    amountPKR: selectedAddonCheckout.price_pkr,
                    billingPeriod: selectedAddonCheckout.billing_period || "monthly",
                  })
                }
                className="w-2/3 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {activateAddonMutation.isPending ? (
                  <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Processing SafePay…</>
                ) : (
                  `Pay Rs ${selectedAddonCheckout.price_pkr?.toLocaleString()} via SafePay`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Expiration & Non-Renewal Policy Safeguard Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4 shadow-xs">
        <div className="border-b border-amber-500/20 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Zap className="size-4" /> Plan Expiration &amp; Non-Renewal Policy
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] font-mono">
            Vendor Protection Safeguard
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="space-y-2 rounded-xl border border-amber-500/20 bg-background/50 p-4">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              🔔 1. Expiration Notifications
            </h4>
            <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4">
              <li>
                <strong>7-Day Early Warning:</strong> Alert banner on vendor header &amp; dashboard.
              </li>
              <li>
                <strong>WhatsApp &amp; Email Alerts:</strong> Automated reminders sent at 7d, 3d, and 24h before renewal.
              </li>
              <li>
                <strong>1-Click SafePay PKR Renewal:</strong> Instant renewal via SafePay quick links.
              </li>
            </ul>
          </div>

          <div className="space-y-2 rounded-xl border border-amber-500/20 bg-background/50 p-4">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              ⚠️ 2. Non-Renewal Action
            </h4>
            <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4">
              <li>
                <strong>Auto-Downgrade to Free:</strong> Account reverts to standard Starter Free tier.
              </li>
              <li>
                <strong>Extra Listings Paused:</strong> Listings above Free limit (1 active) unpublish (`is_active: false`).
              </li>
              <li>
                <strong>Zero Data Loss:</strong> Package drafts, itineraries, leads, and quotes preserved 100%.
              </li>
            </ul>
          </div>

          <div className="space-y-2 rounded-xl border border-amber-500/20 bg-background/50 p-4">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              📉 3. Plan Downgrade &amp; Refund Policy
            </h4>
            <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4">
              <li>
                <strong>Effective Next Cycle:</strong> Downgrades take effect at the start of your <strong>next payment cycle</strong>.
              </li>
              <li>
                <strong>No Refunds:</strong> No partial or prorated refunds are issued for active billing cycles.
              </li>
              <li>
                <strong>Retain Full Privileges:</strong> Enjoy current plan features until your next billing date.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit === null;
  const blocked = limit === 0;
  const pct = unlimited || blocked ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {unlimited ? `${used} used · Unlimited` : blocked ? "Not included" : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full transition-all ${
            unlimited ? "bg-primary/60 w-1/6" : blocked ? "bg-muted-foreground/30 w-full" : "bg-primary"
          }`}
          style={unlimited || blocked ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
