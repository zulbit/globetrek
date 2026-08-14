import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  Sparkles,
  Compass,
  Download,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/tours";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

import { getAdminFinancialMetrics } from "@/lib/financials.functions";

export const Route = createFileRoute("/_authenticated/admin/financials")({
  component: AdminFinancials,
});

export function AdminFinancials() {
  const [period, setPeriod] = useState<"30d" | "90d" | "all">("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-financials-metrics", period],
    queryFn: () => getAdminFinancialMetrics({ data: { period } }),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Compiling vendor collections & financial metrics…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Wallet className="size-4" /> Vendor Financial Collections Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Collections & Revenue Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time breakdown of recurring vendor subscriptions and custom tour lead unlock revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setPeriod("30d")}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition",
                period === "30d" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
              )}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod("90d")}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition",
                period === "90d" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
              )}
            >
              90 Days
            </button>
          </div>

          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold h-9 rounded-xl">
            <Download className="size-3.5" /> Export Audit Log
          </Button>
        </div>
      </div>

      {/* Top Metric Tiles Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Gross Collections */}
        <Card className="p-5 space-y-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Total Gross Collections</span>
            <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono">
            {formatPKR(data?.totalGrossCollections ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Subscriptions + Lead Unlocks</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="size-3" /> +100% Settled
            </span>
          </div>
        </Card>

        {/* Vendor Subscriptions MRR */}
        <Card className="p-5 space-y-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Monthly Subscription MRR</span>
            <div className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono">
            {formatPKR(data?.mrrSubscriptions ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Pro &amp; Starter Partners</span>
            <span className="text-emerald-400 font-semibold">{data?.proCount ?? 0} Pro Active</span>
          </div>
        </Card>

        {/* Custom Tour Lead Unlocks */}
        <Card className="p-5 space-y-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Lead Unlocks Revenue</span>
            <div className="size-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono">
            {formatPKR(data?.totalLeadUnlockRevenue ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{data?.totalLeadUnlocks ?? 0} Unlocks Sold</span>
            <span className="text-amber-400 font-semibold">₨ 5,000 / lead</span>
          </div>
        </Card>

        {/* Agency Visibility Boosts */}
        <Card className="p-5 space-y-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Agency Visibility Boosts</span>
            <div className="size-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono">
            {formatPKR(data?.totalAddonRevenue ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{data?.totalAddonsCount ?? 0} Boosts Active</span>
            <span className="text-purple-300 font-semibold">Flash Ads &amp; Badges</span>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Time-Series Collections Area Chart */}
        <Card className="lg:col-span-2 p-6 space-y-4 border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Daily Collections Trend (PKR)
              </h3>
              <p className="text-xs text-muted-foreground">
                Combined daily timeline of recurring vendor subscriptions and custom lead unlocks.
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-mono text-[10px]">
              SafePay Verified
            </Badge>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ChartContainer
              config={{
                total: { label: "Total Collections (PKR)", color: "#10b981" },
                leadUnlocks: { label: "Lead Unlocks (PKR)", color: "#f59e0b" },
              }}
              className="h-full w-full"
            >
              <AreaChart data={data?.timeSeriesData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Collections" />
                <Area type="monotone" dataKey="leadUnlocks" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" name="Lead Unlocks" />
              </AreaChart>
            </ChartContainer>
          </div>
        </Card>

        {/* Revenue Breakdown Pie Chart */}
        <Card className="p-6 space-y-4 border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <PieIcon className="size-4 text-amber-400" /> Revenue Stream Share
            </h3>
            <p className="text-xs text-muted-foreground">Distribution across vendor tiers and lead unlocks.</p>

            <div className="h-[200px] w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.breakdownPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data?.breakdownPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`Rs ${Number(val).toLocaleString()} PKR`, "Amount"]}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #334155" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Legend List */}
          <div className="space-y-2 border-t border-border pt-4 text-xs">
            {data?.breakdownPieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground font-mono">Rs {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction & Settlement Audit Table */}
      <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Vendor Settlements &amp; Transactions Feed
            </h3>
            <p className="text-xs text-muted-foreground">
              Itemized ledger of recent subscription purchases and SafePay lead unlocks.
            </p>
          </div>

          <Badge variant="outline" className="border-primary/30 text-primary font-bold text-xs">
            SafePay Webhook Reconciled
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface/80 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Transaction Ref</th>
                <th className="p-3.5">Vendor / Partner</th>
                <th className="p-3.5">Type &amp; Tier</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5 text-right">Amount (PKR)</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface/40 transition">
                    <td className="p-3.5 font-mono text-muted-foreground font-semibold">{tx.id.slice(0, 16)}</td>
                    <td className="p-3.5 font-bold text-foreground">
                      <div>{tx.vendorName}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">{tx.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          tx.tier.includes("PRO")
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : tx.tier.includes("STARTER")
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        )}
                      >
                        {tx.tier}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono">
                      {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3.5 text-right font-black text-foreground font-mono">
                      Rs {tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="size-3.5" /> {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
