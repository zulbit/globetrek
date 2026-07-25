import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Zap, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/upgrade-modal";

export const Route = createFileRoute("/_authenticated/vendor/")({
  component: VendorOverview,
});

type Tier = "free" | "starter" | "pro" | "agency";

// null = unlimited
const AI_LIMITS: Record<Tier, { description: number | null; plan: number | null }> = {
  free: { description: 0, plan: 0 },
  starter: { description: 10, plan: 0 },
  pro: { description: null, plan: 50 },
  agency: { description: null, plan: null },
};

function VendorOverview() {
  const { data } = useQuery({
    queryKey: ["vendor-overview"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user!.id;
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const [tours, leads, profile, usage] = await Promise.all([
        supabase.from("tours").select("id,is_active").eq("vendor_id", uid),
        supabase.from("leads").select("id,is_unlocked").eq("vendor_id", uid),
        supabase.from("profiles").select("lead_credits_balance,subscription_tier").eq("id", uid).maybeSingle(),
        supabase
          .from("ai_usage_events")
          .select("kind")
          .eq("user_id", uid)
          .gte("created_at", monthStart.toISOString()),
      ]);
      const events = (usage.data ?? []) as { kind: "description" | "plan" }[];
      return {
        activeTours: (tours.data ?? []).filter((t) => t.is_active).length,
        totalLeads: leads.data?.length ?? 0,
        unlockedLeads: (leads.data ?? []).filter((l) => l.is_unlocked).length,
        credits: profile.data?.lead_credits_balance ?? 0,
        tier: (profile.data?.subscription_tier ?? "free") as Tier,
        aiDescriptions: events.filter((e) => e.kind === "description").length,
        aiPlans: events.filter((e) => e.kind === "plan").length,
      };
    },
  });

  const isPro = data?.tier === "pro";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const tier: Tier = data?.tier ?? "free";
  const limits = AI_LIMITS[tier];


  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} recommend="pro" />

      {/* Upgrade banner */}
      {!isPro && (
        <div className="relative overflow-hidden rounded-2xl border border-highlight/30 bg-linear-to-r from-highlight/15 via-primary/10 to-transparent p-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-highlight/20 text-highlight ring-1 ring-highlight/40">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Upgrade to Pro for ₨ 10,000 / month</h3>
              <p className="text-xs text-muted-foreground">
                Unlimited lead unlocks, priority placement on search, and a verified vendor badge.
              </p>
            </div>
            <Button
              onClick={() => setUpgradeOpen(true)}
              className="bg-highlight text-black hover:bg-highlight/90"
            >
              <Zap className="mr-2 size-4" /> Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Stat bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active tours" value={String(data?.activeTours ?? 0)} />
        <StatCard label="Total leads" value={String(data?.totalLeads ?? 0)} />
        <div className="rounded-2xl border border-highlight/40 bg-highlight/10 p-5 shadow-card">
          <div className="text-[11px] uppercase tracking-wider text-highlight/90">
            Lead credits remaining
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-2xl font-bold tabular-nums text-highlight">
              {isPro ? "∞" : (data?.credits ?? 0)}
            </div>
            {isPro && (
              <span className="rounded-full border border-highlight/40 bg-highlight/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-highlight">
                Pro
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isPro ? "Unlimited unlocks on your Pro plan." : "1 credit unlocks 1 customer contact."}
          </p>
        </div>
      </div>

      {/* AI usage meters */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Wand2 className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">AI usage this month</h3>
              <p className="text-xs text-muted-foreground capitalize">{tier} plan</p>
            </div>
          </div>
          {tier !== "agency" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUpgradeOpen(true)}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Upgrade
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageMeter
            label="AI short descriptions"
            used={data?.aiDescriptions ?? 0}
            limit={limits.description}
          />
          <UsageMeter
            label="AI full-trip plans"
            used={data?.aiPlans ?? 0}
            limit={limits.plan}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Resets on the 1st of each month. Usage is counted per successful AI generation.
        </p>
      </div>



      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Next steps</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• <Link to="/vendor/tours" className="text-primary hover:underline">Publish a new tour</Link> so travelers can find you.</li>
          <li>• Head to <Link to="/vendor/leads" className="text-primary hover:underline">Leads</Link> to unlock and contact incoming inquiries.</li>
          <li>• Top up credits or upgrade to Pro to never miss a lead.</li>
        </ul>
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit === null;
  const disabled = limit === 0;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const nearLimit = !unlimited && !disabled && used / limit >= 0.8;
  const barColor = disabled
    ? "bg-muted-foreground/40"
    : unlimited
      ? "bg-highlight"
      : nearLimit
        ? "bg-highlight"
        : "bg-primary";

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {unlimited ? (
            <>
              {used} <span className="text-xs text-muted-foreground">/ ∞</span>
            </>
          ) : disabled ? (
            <span className="text-xs text-muted-foreground">Not included</span>
          ) : (
            <>
              {used} <span className="text-xs text-muted-foreground">/ {limit} used</span>
            </>
          )}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${disabled ? 0 : pct}%` }}
        />
      </div>
      {!unlimited && !disabled && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {Math.max(0, limit - used)} remaining this month
        </p>
      )}
      {disabled && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Upgrade to unlock this AI feature.
        </p>
      )}
    </div>
  );
}

