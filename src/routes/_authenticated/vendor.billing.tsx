import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles, CreditCard, ArrowRight, Loader2, Crown } from "lucide-react";
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

import { useMemo } from "react";
import { getSubscriptionPlans } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/vendor/billing")({
  component: BillingPage,
});

function BillingPage() {
  const qc = useQueryClient();
  const change = useServerFn(changeSubscriptionTier);
  const getPlansFn = useServerFn(getSubscriptionPlans);

  const { data: dbPlans } = useQuery({
    queryKey: ["subscription-plans-config-vendor-billing"],
    queryFn: () => getPlansFn(),
  });

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

      {/* Plan switcher */}
      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Change plan</h3>
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
            Compare all features <ArrowRight className="size-3" />
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier;
            const Icon = tier.icon;
            const pending = mutation.isPending && mutation.variables === tier.id;
            const disabled = isCurrent || isLoading || mutation.isPending;
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition ${
                  isCurrent
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                    : tier.highlight
                      ? "border-primary/30 bg-card hover:border-primary/50"
                      : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
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
                <Button
                  size="sm"
                  disabled={disabled}
                  onClick={() => mutation.mutate(tier.id)}
                  className={`mt-auto w-full ${
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
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="size-3.5" /> Boost Reach &amp; Lead Conversion
          </div>
          <h3 className="text-base font-bold text-foreground">Marketplace Placement &amp; Flash Campaign Add-ons</h3>
          <p className="text-xs text-muted-foreground">
            Optional visibility boosts you can attach to your agency profile anytime.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeAddons.map((addon: any) => {
            const isAd = addon.plan_type === "advertisement";
            return (
              <div
                key={addon.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 ${
                  isAd
                    ? "border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-card"
                    : "border-purple-500/40 bg-gradient-to-b from-purple-500/10 to-card"
                }`}
              >
                <div>
                  <span
                    className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full mb-2 border ${
                      isAd
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    {isAd ? "⚡ 1-Week Flash Banner" : "🌟 Placement Add-on"}
                  </span>

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
                  onClick={() =>
                    toast.success(`Request sent for ${addon.name}!`, {
                      description: "GlobeTrek Partner Desk will reach out on WhatsApp to activate this addon.",
                    })
                  }
                  className={`w-full font-bold text-xs rounded-xl border ${
                    isAd
                      ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-400/40"
                      : "bg-purple-600 hover:bg-purple-700 text-white border-purple-400/40"
                  }`}
                >
                  {isAd ? "Book Flash Banner" : "Activate Add-on"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history placeholder */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Billing history</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Invoices and receipts will appear here once live payments are enabled.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No invoices yet.
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
