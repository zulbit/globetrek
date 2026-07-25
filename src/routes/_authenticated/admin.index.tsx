import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Users,
  UserCheck,
  Crown,
  Globe2,
  Sparkles,
  Wallet,
  Inbox,
  TrendingUp,
  Activity,
  FileCheck,
  Shield,
  Ticket,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/tours";
import { cn } from "@/lib/utils";

const CREDIT_PRICE_PKR = 500;
const PRO_MONTHLY_PKR = 10000;

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const iso = monthStart.toISOString();

      const [
        vendors,
        customers,
        proVendors,
        starterVendors,
        unlocked,
        totalLeads,
        newLeadsMonth,
        tours,
        publishedTours,
        aiEvents,
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "vendor"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "pro"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "free"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_unlocked", true),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("tours").select("id", { count: "exact", head: true }),
        supabase.from("tours").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ai_usage_events").select("id", { count: "exact", head: true }).gte("created_at", iso),
      ]);

      const [visaCount, insuranceCount, ticketCount, serviceLeads] = await Promise.all([
        supabase.from("visa_services").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("insurance_plans").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ticket_services").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("leads").select("id", { count: "exact", head: true }).neq("service_type", "tours"),
      ]);


      const creditRevenue = (unlocked.count ?? 0) * CREDIT_PRICE_PKR;
      const subRevenue = (proVendors.count ?? 0) * PRO_MONTHLY_PKR;
      return {
        vendors: vendors.count ?? 0,
        customers: customers.count ?? 0,
        proVendors: proVendors.count ?? 0,
        starterVendors: starterVendors.count ?? 0, // free-tier vendors
        unlockedLeads: unlocked.count ?? 0,
        totalLeads: totalLeads.count ?? 0,
        newLeadsMonth: newLeadsMonth.count ?? 0,
        tours: tours.count ?? 0,
        publishedTours: publishedTours.count ?? 0,
        aiEvents: aiEvents.count ?? 0,
        revenue: creditRevenue + subRevenue,
        creditRevenue,
        subRevenue,
        visaCount: visaCount.count ?? 0,
        insuranceCount: insuranceCount.count ?? 0,
        ticketCount: ticketCount.count ?? 0,
        serviceLeads: serviceLeads.count ?? 0,
      };
    },
  });


  const conv = data && data.totalLeads > 0 ? Math.round((data.unlockedLeads / data.totalLeads) * 100) : 0;
  const publishedRate = data && data.tours > 0 ? Math.round((data.publishedTours / data.tours) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero revenue card */}
      <Link
        to="/admin/vendors"
        className="group relative block overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-card transition hover:border-primary/60"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Platform revenue
            </div>
            <div className="mt-3 text-4xl font-bold tabular-nums sm:text-5xl">
              {isLoading ? "—" : formatPKR(data?.revenue ?? 0)}
            </div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Combined earnings from lead credit unlocks and Pro subscriptions this cycle.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <MiniStat label="Lead credits" value={formatPKR(data?.creditRevenue ?? 0)} />
            <MiniStat label="Subscriptions" value={formatPKR(data?.subRevenue ?? 0)} />
          </div>
        </div>
        <div className="relative mt-6 flex items-center gap-2 text-sm text-primary opacity-0 transition group-hover:opacity-100">
          Break down by vendor <ArrowUpRight className="h-4 w-4" />
        </div>
      </Link>

      {/* Primary metrics grid */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Community</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            to="/admin/vendors"
            icon={Users}
            label="Total vendors"
            value={data?.vendors ?? 0}
            hint={`${data?.proVendors ?? 0} Pro · ${data?.starterVendors ?? 0} Free`}
            tone="emerald"
          />
          <MetricCard
            to="/admin/vendors"
            icon={Crown}
            label="Pro subscribers"
            value={data?.proVendors ?? 0}
            hint={`${formatPKR(PRO_MONTHLY_PKR)} / mo each`}
            tone="amber"
          />
          <MetricCard
            to="/admin/vendors"
            icon={UserCheck}
            label="Registered travelers"
            value={data?.customers ?? 0}
            hint="Verified customer accounts"
            tone="sky"
          />
          <MetricCard
            to="/admin/tours"
            icon={Globe2}
            label="Published tours"
            value={data?.publishedTours ?? 0}
            hint={`${publishedRate}% of ${data?.tours ?? 0} total`}
            tone="violet"
            progress={publishedRate}
          />
        </div>
      </section>

      {/* Lead funnel */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Lead marketplace</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            to="/admin/vendors"
            icon={Inbox}
            label="Total inquiries"
            value={data?.totalLeads ?? 0}
            hint="Lifetime lead volume"
            tone="sky"
          />
          <MetricCard
            to="/admin/vendors"
            icon={Activity}
            label="New this month"
            value={data?.newLeadsMonth ?? 0}
            hint="Fresh customer intent"
            tone="emerald"
          />
          <MetricCard
            to="/admin/vendors"
            icon={Wallet}
            label="Unlocked leads"
            value={data?.unlockedLeads ?? 0}
            hint={`${conv}% conversion · ${formatPKR(CREDIT_PRICE_PKR)}/unlock`}
            tone="amber"
            progress={conv}
          />
          <MetricCard
            to="/admin/tours"
            icon={Sparkles}
            label="AI generations"
            value={data?.aiEvents ?? 0}
            hint="Descriptions & plans this month"
            tone="violet"
          />
        </div>
      </section>

      {/* Services marketplace */}
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Services marketplace</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard to="/admin/services" icon={FileCheck} label="Visa listings" value={data?.visaCount ?? 0} hint="Active visa consultants" tone="sky" />
          <MetricCard to="/admin/services" icon={Shield} label="Insurance plans" value={data?.insuranceCount ?? 0} hint="Active travel insurance" tone="emerald" />
          <MetricCard to="/admin/services" icon={Ticket} label="Ticketing services" value={data?.ticketCount ?? 0} hint="Active ticketing desks" tone="amber" />
          <MetricCard to="/admin/services" icon={Inbox} label="Service leads" value={data?.serviceLeads ?? 0} hint="Visa · Insurance · Tickets" tone="violet" />
        </div>
      </section>
    </div>

  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

type Tone = "emerald" | "amber" | "sky" | "violet";
const TONE: Record<Tone, { bg: string; text: string; ring: string; bar: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "group-hover:border-emerald-500/60", bar: "bg-emerald-500" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   ring: "group-hover:border-amber-500/60",   bar: "bg-amber-500" },
  sky:     { bg: "bg-sky-500/10",     text: "text-sky-400",     ring: "group-hover:border-sky-500/60",     bar: "bg-sky-500" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  ring: "group-hover:border-violet-500/60",  bar: "bg-violet-500" },
};

function MetricCard({
  to,
  icon: Icon,
  label,
  value,
  hint,
  tone,
  progress,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  tone: Tone;
  progress?: number;
}) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg",
        t.ring,
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t.bg)}>
          <Icon className={cn("h-5 w-5", t.text)} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      {typeof progress === "number" ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
          <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      ) : null}
    </Link>
  );
}
