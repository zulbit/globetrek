import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  RotateCcw,
  AlertTriangle,
  Info,
  Calendar,
  DollarSign,
  FileText,
  Copy,
  Check,
  Search,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/tours";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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

import { getAdminFinancialMetrics, processOrRecordRefund } from "@/lib/financials.functions";

export const Route = createFileRoute("/_authenticated/admin/financials")({
  component: AdminFinancials,
});

export function AdminFinancials() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<"30d" | "90d" | "all">("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "settled" | "refunded">("all");

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>("Invalid Traveler / Lead Contact Info");
  const [customReasonText, setCustomReasonText] = useState<string>("");
  const [refundTransactionId, setRefundTransactionId] = useState<string>("");
  const [refundDate, setRefundDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState<string>("");
  const [revokeAccess, setRevokeAccess] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-financials-metrics", period],
    queryFn: () => getAdminFinancialMetrics({ data: { period } }),
    refetchInterval: 5000,
  });

  const refundMutation = useMutation({
    mutationFn: (vars: {
      paymentId: string;
      paymentType?: "lead_unlock" | "subscription" | "payment";
      refundReason: string;
      refundTransactionId: string;
      refundDate?: string;
      refundAmountPkr: number;
      refundNotes?: string;
      revokeAccess?: boolean;
    }) => processOrRecordRefund({ data: vars }),
    onSuccess: (res) => {
      toast.success(res.message || "Refund recorded successfully!");
      setRefundModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-financials-metrics"] });
      qc.invalidateQueries({ queryKey: ["vendor-real-invoices"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record refund.");
    },
  });

  const handleOpenRefundModal = (tx: any) => {
    setSelectedTxForRefund(tx);
    setRefundAmount(String(tx.amount || 5000));
    setRefundTransactionId(tx.refundTransactionId || tx.paymentIntentId || `track_${Date.now()}`);
    setRefundReason(tx.refundReason || "Invalid Traveler / Lead Contact Info");
    setRefundDate(tx.refundedAt ? new Date(tx.refundedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    setRefundNotes(tx.refundNotes || "");
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = () => {
    if (!selectedTxForRefund) return;
    const finalReason = refundReason === "Other (Custom)" ? customReasonText.trim() || "Administrative Refund" : refundReason;
    if (!refundTransactionId.trim()) {
      toast.error("SafePay Related Transaction ID is required.");
      return;
    }
    const amt = Number(refundAmount);
    if (!amt || amt <= 0) {
      toast.error("Valid refund amount is required.");
      return;
    }

    refundMutation.mutate({
      paymentId: selectedTxForRefund.rawId || selectedTxForRefund.id,
      paymentType: selectedTxForRefund.paymentType || "lead_unlock",
      refundReason: finalReason,
      refundTransactionId: refundTransactionId.trim(),
      refundDate: refundDate ? new Date(refundDate).toISOString() : new Date().toISOString(),
      refundAmountPkr: amt,
      refundNotes: refundNotes.trim(),
      revokeAccess,
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("SafePay Transaction Ref copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = (data?.recentTransactions || []).filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.refundTransactionId && tx.refundTransactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "refunded" && tx.isRefunded) ||
      (statusFilter === "settled" && !tx.isRefunded);

    return matchesSearch && matchesStatus;
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
            <Wallet className="size-4" /> Vendor Financial Collections &amp; Refunds Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Collections &amp; Refund Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time breakdown of recurring vendor subscriptions, lead unlock revenue, and SafePay refund audits.
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
            <button
              onClick={() => setPeriod("all")}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition",
                period === "all" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Time
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
              <TrendingUp className="size-3" /> Settled (SafePay)
            </span>
          </div>
        </Card>

        {/* Net Revenue after Refunds */}
        <Card className="p-5 space-y-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Net Retained Revenue</span>
            <div className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono text-emerald-400">
            {formatPKR(data?.netCollections ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Gross minus Total Refunds</span>
            <span className="text-emerald-400 font-semibold font-mono">Net Settled</span>
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
            <span>{data?.totalLeadUnlocks ?? 0} Unlocks Active</span>
            <span className="text-amber-400 font-semibold">B2B Marketplace</span>
          </div>
        </Card>

        {/* Total Refunds & Chargebacks */}
        <Card className="p-5 space-y-2 border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-card to-card relative overflow-hidden shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Total Refunds &amp; Reversals</span>
            <div className="size-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <RotateCcw className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono text-rose-400">
            {formatPKR(data?.totalRefundedAmount ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{data?.totalRefundsCount ?? 0} Transactions Refunded</span>
            <span className="text-rose-400 font-bold">SafePay Tracked</span>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Inflow Trend Chart */}
        <Card className="p-6 space-y-4 border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Daily Cash Collections Inflow (PKR)
              </h3>
              <p className="text-xs text-muted-foreground">Aggregated across all verified vendor payments.</p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
              Live SafePay Sync
            </Badge>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ChartContainer
              config={{
                total: { label: "Gross Collections (PKR)", color: "#10b981" },
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
                    itemStyle={{ color: "#f8fafc", fontWeight: 600 }}
                    labelStyle={{ color: "#94a3b8" }}
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

      {/* Transaction & Settlement Audit Table with Refund Manager */}
      <Card className="p-6 space-y-4 border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Vendor Settlements, Invoices &amp; SafePay Refunds
            </h3>
            <p className="text-xs text-muted-foreground">
              Itemized ledger of all transactions with audit dates, refund reasons, and SafePay transaction references.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search vendor, email, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-[200px] rounded-xl"
              />
            </div>

            {/* Status Filter */}
            <div className="flex rounded-xl border border-border bg-card p-1 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition text-[11px]",
                  statusFilter === "all" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("settled")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition text-[11px]",
                  statusFilter === "settled" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Settled
              </button>
              <button
                onClick={() => setStatusFilter("refunded")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition text-[11px]",
                  statusFilter === "refunded" ? "bg-rose-500/20 text-rose-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Refunded
              </button>
            </div>
          </div>
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
                <th className="p-3.5">Status &amp; Refund Info</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className={cn("hover:bg-surface/40 transition", tx.isRefunded && "bg-rose-500/[0.03]")}>
                    <td className="p-3.5 font-mono text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.id.slice(0, 16)}</span>
                        {tx.refundTransactionId && (
                          <button
                            onClick={() => handleCopy(tx.refundTransactionId, tx.id)}
                            title="Copy SafePay Transaction Ref"
                            className="text-muted-foreground hover:text-foreground transition p-0.5"
                          >
                            {copiedId === tx.id ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          </button>
                        )}
                      </div>
                    </td>
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
                      {new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      <div className="text-[10px] text-muted-foreground/70">
                        {new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-black text-foreground font-mono">
                      <span className={cn(tx.isRefunded && "line-through text-muted-foreground")}>
                        Rs {tx.amount.toLocaleString()}
                      </span>
                      {tx.isRefunded && (
                        <div className="text-[10px] font-bold text-rose-400">
                          -Rs {(tx.refundAmountPkr || tx.amount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {tx.isRefunded ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            <RotateCcw className="size-3" /> Refunded
                          </span>
                          {tx.refundReason && (
                            <div className="text-[10px] text-muted-foreground">
                              <span className="font-semibold text-foreground">Reason:</span> {tx.refundReason}
                            </div>
                          )}
                          {tx.refundTransactionId && (
                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={tx.refundTransactionId}>
                              <span className="font-semibold text-foreground">Ref:</span> {tx.refundTransactionId}
                            </div>
                          )}
                          {tx.refundedAt && (
                            <div className="text-[9px] text-muted-foreground/70">
                              Date: {new Date(tx.refundedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="size-3.5" /> {tx.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {tx.isRefunded ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                          onClick={() => handleOpenRefundModal(tx)}
                        >
                          <Info className="size-3" /> Audit Record
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1 rounded-lg font-semibold"
                          onClick={() => handleOpenRefundModal(tx)}
                        >
                          <RotateCcw className="size-3" /> Record Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No transactions matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SafePay Refund Management Dialog */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-foreground">
              <RotateCcw className="size-5 text-rose-400" />
              {selectedTxForRefund?.isRefunded ? "SafePay Refund Audit Details" : "Record / Process SafePay Refund"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedTxForRefund?.isRefunded
                ? "Review the recorded reason, date, and SafePay transaction reference for this refund."
                : "Record a full or partial refund issued via SafePay dashboard with audit tracking."}
            </DialogDescription>
          </DialogHeader>

          {selectedTxForRefund && (
            <div className="space-y-4 py-2 text-xs">
              {/* Transaction Summary Card */}
              <div className="rounded-xl border border-border bg-surface/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Transaction ID:</span>
                  <span className="font-mono font-bold text-foreground">{selectedTxForRefund.id}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Vendor Agency:</span>
                  <span className="font-bold text-foreground">{selectedTxForRefund.vendorName}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Original Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">Rs {selectedTxForRefund.amount.toLocaleString()} PKR</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Original Date:</span>
                  <span className="font-mono text-foreground">
                    {new Date(selectedTxForRefund.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Refund Reason Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="refund-reason" className="text-xs font-bold text-foreground">
                  Reason for Refund <span className="text-rose-400">*</span>
                </Label>
                <Select value={refundReason} onValueChange={setRefundReason}>
                  <SelectTrigger id="refund-reason" className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Invalid Traveler / Lead Contact Info">Invalid Traveler / Lead Contact Info</SelectItem>
                    <SelectItem value="Duplicate Transaction / Double Charge">Duplicate Transaction / Double Charge</SelectItem>
                    <SelectItem value="Traveler Cancellation (Within 14-Day Window)">Traveler Cancellation (Within 14-Day Window)</SelectItem>
                    <SelectItem value="Agency Invoicing Adjustment">Agency Invoicing Adjustment</SelectItem>
                    <SelectItem value="Chargeback / Bank Dispute Resolution">Chargeback / Bank Dispute Resolution</SelectItem>
                    <SelectItem value="Test / Administrative Reversal">Test / Administrative Reversal</SelectItem>
                    <SelectItem value="Customer Satisfaction Settlement">Customer Satisfaction Settlement</SelectItem>
                    <SelectItem value="Other (Custom)">Other (Specify below)</SelectItem>
                  </SelectContent>
                </Select>

                {refundReason === "Other (Custom)" && (
                  <Input
                    placeholder="Enter specific custom reason..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1.5"
                  />
                )}
              </div>

              {/* SafePay Related Transaction ID */}
              <div className="space-y-1.5">
                <Label htmlFor="safepay-ref" className="text-xs font-bold text-foreground">
                  SafePay Related Transaction ID / Tracker ID <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="safepay-ref"
                    placeholder="e.g. track_6a7515d8-4047-4583-8781-fa860d6e9f8c or 7868960550696425704806"
                    value={refundTransactionId}
                    onChange={(e) => setRefundTransactionId(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl pl-8"
                  />
                  <ShieldCheck className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Copy the tracker ID or Cybersource code from the SafePay dashboard refund confirmation.
                </p>
              </div>

              {/* Refund Date & Amount Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="refund-date" className="text-xs font-bold text-foreground">
                    Date of Refund <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="refund-date"
                    type="datetime-local"
                    value={refundDate}
                    onChange={(e) => setRefundDate(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="refund-amount" className="text-xs font-bold text-foreground">
                    Refund Amount (PKR) <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="h-9 text-xs font-mono font-bold rounded-xl"
                  />
                </div>
              </div>

              {/* Administrative Audit Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="refund-notes" className="text-xs font-bold text-foreground">
                  Internal Notes &amp; Remarks (Optional)
                </Label>
                <Textarea
                  id="refund-notes"
                  placeholder="e.g. Cardholder requested reversal via WhatsApp support; refunded in SafePay sandbox."
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="text-xs rounded-xl min-h-[60px]"
                />
              </div>

              {/* Revoke Access Option */}
              {selectedTxForRefund.paymentType === "lead_unlock" && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 text-xs">
                  <input
                    type="checkbox"
                    id="revoke-access"
                    checked={revokeAccess}
                    onChange={(e) => setRevokeAccess(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label htmlFor="revoke-access" className="cursor-pointer text-xs">
                    Revoke traveler contact access from vendor's dashboard for this lead
                  </Label>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setRefundModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={refundMutation.isPending}
              onClick={handleSubmitRefund}
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving Audit...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" /> Save Refund Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
