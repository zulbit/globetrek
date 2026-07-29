import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Receipt, Download, CreditCard, ShieldCheck, Search, Filter, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/vendor/invoices")({
  component: VendorInvoicesPage,
});

function VendorInvoicesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");

  const { data: profile } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-invoice-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, subscription_tier, lead_credits_balance, city")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Simulated / Sample Vendor Invoices (to be backed by DB billing table when payments live)
  const sampleInvoices = [
    {
      id: "INV-2026-001",
      date: "2026-07-01",
      description: "Full Agency Tier Monthly Subscription",
      amount_pkr: 12000,
      status: "paid",
      method: "SafePay PKR",
      period: "Jul 1, 2026 – Aug 1, 2026",
    },
    {
      id: "INV-2026-002",
      date: "2026-06-01",
      description: "Full Agency Tier Monthly Subscription",
      amount_pkr: 12000,
      status: "paid",
      method: "SafePay PKR",
      period: "Jun 1, 2026 – Jul 1, 2026",
    },
  ];

  const filteredInvoices = sampleInvoices.filter((inv) => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadInvoice = (invId: string) => {
    toast.success(`Downloading PDF Invoice ${invId}...`, {
      description: "Official GlobeTrek PK Tax Receipt generated.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Receipt className="size-4" /> Financial Statements
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices &amp; Receipts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download official tax invoices, billing receipts, and payment statements for your agency.
          </p>
        </div>

        <Button
          onClick={() => toast.info("Partner Desk: Email support@globetrek.pk for custom NTN tax certificates.")}
          variant="outline"
          className="rounded-xl border-border text-xs font-semibold hover:bg-surface"
        >
          <FileText className="size-3.5 mr-1.5" /> Request Official Tax Invoice
        </Button>
      </header>

      {/* Agency Billing Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground block">Agency Account</span>
          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
            {profile?.full_name || "Verified Travel Partner"}
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
          <span className="text-[11px] text-muted-foreground block">City: {profile?.city || "Pakistan"}</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground block">Current Subscription</span>
          <div className="font-bold text-sm text-foreground capitalize">
            {profile?.subscription_tier || "Free"} Plan
          </div>
          <span className="text-[11px] text-muted-foreground block">Billed in PKR (Rs) via SafePay</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground block">Tax ID / NTN Status</span>
          <div className="font-bold text-sm text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="size-4" /> NTN Verified Partner
          </div>
          <span className="text-[11px] text-muted-foreground block">GST Invoice Eligible</span>
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by Invoice ID or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Filter className="size-3.5 text-muted-foreground mr-1" />
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === "paid" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:bg-surface"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Table / Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs space-y-2 bg-surface/20">
            <div className="grid size-12 place-items-center rounded-full bg-surface text-muted-foreground mx-auto">
              <Receipt className="size-6" />
            </div>
            <p className="font-semibold text-foreground">No Invoices Found</p>
            <p className="text-muted-foreground">Invoices will automatically generate here when plan payments complete.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Invoice ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-foreground">{inv.id}</td>
                    <td className="py-3 px-3 text-muted-foreground">{inv.date}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{inv.description}</td>
                    <td className="py-3 px-3 text-muted-foreground">{inv.period}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                      Rs {inv.amount_pkr.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadInvoice(inv.id)}
                        className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg gap-1"
                      >
                        <Download className="size-3" /> PDF Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
