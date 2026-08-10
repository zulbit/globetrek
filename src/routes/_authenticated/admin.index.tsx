import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Users,
  UserCheck,
  Crown,
  Globe2,
  Sparkles,
  Inbox,
  TrendingUp,
  FileCheck,
  Shield,
  Ticket,
  Calendar,
  ArrowRight,
  Loader2,
  Compass,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/tours";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const PRO_MONTHLY_PKR = 10000;

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

interface LeadItem {
  created_at: string;
  service_type: string;
  customer_name: string;
}

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview-enhanced"],
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
        totalLeads,
        newLeadsMonth,
        tours,
        publishedTours,
        aiEvents,
        recentLeadsData,
        visaCount,
        insuranceCount,
        ticketCount,
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "vendor"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "pro"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "free"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("tours").select("id", { count: "exact", head: true }),
        supabase.from("tours").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ai_usage_events").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase
          .from("leads")
          .select("created_at, service_type, customer_name")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("visa_services").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("insurance_plans").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ticket_services").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      // Query custom tour leads (with grace for missing table)
      let customLeadsCount = 0;
      try {
        const { count } = await supabase.from("custom_tour_leads").select("id", { count: "exact", head: true });
        customLeadsCount = count ?? 0;
      } catch (err) {
        console.error("custom_tour_leads check failed (might not exist yet):", err);
      }

      const leadsList = (recentLeadsData.data as LeadItem[] | null) ?? [];

      // Calculate recent 7 days leads daily distribution
      const dailyLeads: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        dailyLeads[key] = 0;
      }

      leadsList.forEach((l) => {
        const dateKey = new Date(l.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (dateKey in dailyLeads) {
          dailyLeads[dateKey]++;
        }
      });

      const chartData = Object.entries(dailyLeads).map(([date, count]) => ({ date, count }));
      const subRevenue = (proVendors.count ?? 0) * PRO_MONTHLY_PKR;

      return {
        vendors: vendors.count ?? 0,
        customers: customers.count ?? 0,
        proVendors: proVendors.count ?? 0,
        starterVendors: starterVendors.count ?? 0,
        totalLeads: (totalLeads.count ?? 0) + customLeadsCount,
        newLeadsMonth: newLeadsMonth.count ?? 0,
        tours: tours.count ?? 0,
        publishedTours: publishedTours.count ?? 0,
        aiEvents: aiEvents.count ?? 0,
        revenue: subRevenue,
        visaCount: visaCount.count ?? 0,
        insuranceCount: insuranceCount.count ?? 0,
        ticketCount: ticketCount.count ?? 0,
        customLeadsCount,
        chartData,
        recentLeads: leadsList.slice(0, 5),
      };
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading platform analytics…</span>
      </div>
    );
  }

  const publishedRate = data && data.tours > 0 ? Math.round((data.publishedTours / data.tours) * 100) : 0;

  return (
    <div className="space-y-8 pb-10 w-full">
      {/* 1. Primary Metrics Grid (Top) */}
      <section className="w-full">
        <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Community & Membership</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
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
            hint={`${formatPKR(PRO_MONTHLY_PKR)} / mo subscription`}
            tone="amber"
          />
          <MetricCard
            to="/admin/users"
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

      {/* 2. Services Marketplace Channels */}
      <section className="w-full">
        <h2 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Marketplace Channels</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 w-full">
          <MetricCard to="/admin/services" icon={FileCheck} label="Visa listings" value={data?.visaCount ?? 0} hint="Active visa consultants" tone="sky" />
          <MetricCard to="/admin/services" icon={Shield} label="Insurance plans" value={data?.insuranceCount ?? 0} hint="Active travel insurance" tone="emerald" />
          <MetricCard to="/admin/services" icon={Ticket} label="Ticketing services" value={data?.ticketCount ?? 0} hint="Active ticketing desks" tone="amber" />
          <MetricCard to="/admin/custom-leads" icon={Compass} label="Custom tour leads" value={data?.customLeadsCount ?? 0} hint="Exclusive group builder" tone="sky" />
          <MetricCard to="/admin/leads" icon={Inbox} label="Total leads" value={data?.totalLeads ?? 0} hint="All customer interactions" tone="violet" />
        </div>
      </section>

      {/* 3. Revenue Banner & Quick Status Overview */}
      <div className="grid gap-6 lg:grid-cols-3 w-full">
        {/* Hero revenue card */}
        <Link
          to="/admin/vendors"
          className="group relative col-span-1 lg:col-span-2 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-card transition hover:border-primary/40"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col justify-between h-full min-h-[160px]">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
                <TrendingUp className="h-3.5 w-3.5" /> Platform monthly revenue
              </div>
              <div className="mt-3 text-4xl font-bold tabular-nums sm:text-5xl">
                {formatPKR(data?.revenue ?? 0)}
              </div>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Monthly recurring revenue generated from premium Pro vendor subscriptions.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-80 group-hover:opacity-100">
              Manage subscribers & details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Dynamic mini summary */}
        <div className="rounded-3xl border border-border bg-card/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-sky-400">
              <Calendar className="h-3.5 w-3.5" /> Quick Status
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Listings:</span>
                <span className="font-semibold text-foreground">
                  {(data?.tours ?? 0) +
                    (data?.visaCount ?? 0) +
                    (data?.insuranceCount ?? 0) +
                    (data?.ticketCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Inquiries:</span>
                <span className="font-semibold text-foreground">{data?.newLeadsMonth ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Assist Executions:</span>
                <span className="font-semibold text-foreground">{data?.aiEvents ?? 0}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            System status: <span className="font-semibold text-emerald-400">Fully operational</span>
          </div>
        </div>
      </div>

      {/* 4. Analytics & Activity Split Grid */}
      <div className="grid gap-6 lg:grid-cols-3 w-full">
        {/* Leads activity trend graph using Recharts */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Inquiry Traffic Trend</h3>
              <p className="text-xs text-muted-foreground">Customer inquiries received across the last 7 days</p>
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
              Live updates
            </Badge>
          </div>

          <div className="h-[200px] w-full mt-4">
            {data?.chartData && data.chartData.length > 0 ? (
              <ChartContainer config={{ count: { label: "Inquiries", color: "var(--primary)" } }} className="h-full w-full">
                <AreaChart data={data.chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground fill-current" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground fill-current" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="rgb(16, 185, 129)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No inquiry traffic data recorded recently.
              </div>
            )}
          </div>
        </div>

        {/* Recent Platform Inquiries Log */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-4">Recent Activity</h3>
            {data?.recentLeads && data.recentLeads.length > 0 ? (
              <div className="space-y-4">
                {data.recentLeads.map((lead, idx) => (
                  <div key={idx} className="flex items-start justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="text-xs font-semibold text-foreground">{lead.customer_name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Inquired for <span className="font-medium text-primary capitalize">{lead.service_type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 font-mono">
                      {new Date(lead.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                No recent inquiries logged.
              </div>
            )}
          </div>
          <Link
            to="/admin/leads"
            className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/50 py-2.5 text-xs font-medium text-foreground hover:bg-surface transition"
          >
            Manage Vendors & Leads <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
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

function Badge({ variant, className, children }: { variant?: string; className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", className)}>
      {children}
    </span>
  );
}
