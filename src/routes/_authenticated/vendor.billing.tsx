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

export const Route = createFileRoute("/_authenticated/vendor/billing")({
  component: BillingPage,
});

function BillingPage() {
  const qc = useQueryClient();
  const change = useServerFn(changeSubscriptionTier);

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
