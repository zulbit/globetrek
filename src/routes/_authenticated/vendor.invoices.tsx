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

  const [downloadingInvId, setDownloadingInvId] = useState<string | null>(null);

  const handleDownloadInvoice = async (inv: any) => {
    setDownloadingInvId(inv.id);
    const toastId = toast.loading(`Generating PDF Invoice ${inv.id}...`);

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const pdfWrapper = document.createElement("div");
      pdfWrapper.style.position = "absolute";
      pdfWrapper.style.left = "-9999px";
      pdfWrapper.style.top = "0";
      pdfWrapper.style.width = "750px";
      pdfWrapper.style.padding = "36px";
      pdfWrapper.style.backgroundColor = "#ffffff";
      pdfWrapper.style.color = "#0f172a";
      pdfWrapper.style.fontFamily = "system-ui, -apple-system, sans-serif";

      pdfWrapper.innerHTML = `
        <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #047857; margin: 0;">GlobeTrek PK</h1>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Official Vendor Tax Receipt &amp; Billing Statement</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background-color: #d1fae5; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">${inv.status}</span>
            <p style="font-size: 12px; font-weight: 700; font-family: monospace; color: #0f172a; margin: 6px 0 0 0;">${inv.id}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 12px;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px;">
            <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Billed To (Vendor Agency)</p>
            <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0;">${profile?.full_name || "GlobeTrek Verified Agency"}</p>
            <p style="color: #475569; margin: 0;">City: ${profile?.city || "Pakistan"}</p>
            <p style="color: #475569; margin: 2px 0 0 0;">Account Tier: ${profile?.subscription_tier || "Agency"} Plan</p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px;">
            <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Invoice Metadata</p>
            <p style="margin: 0; color: #475569;"><strong>Date:</strong> ${inv.date}</p>
            <p style="margin: 2px 0 0 0; color: #475569;"><strong>Billing Period:</strong> ${inv.period}</p>
            <p style="margin: 2px 0 0 0; color: #475569;"><strong>Payment Gateway:</strong> SafePay PKR</p>
            <p style="margin: 2px 0 0 0; color: #475569;"><strong>Platform NTN:</strong> 8941029-7</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 10px 12px; text-align: left;">Item Description</th>
              <th style="padding: 10px 12px; text-align: center;">Billing Period</th>
              <th style="padding: 10px 12px; text-align: right;">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: 600;">${inv.description}</td>
              <td style="padding: 12px; text-align: center; color: #64748b;">${inv.period}</td>
              <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700;">Rs ${inv.amount_pkr.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 250px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">Rs ${inv.amount_pkr.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
              <span>Sales Tax (0%):</span>
              <span style="font-family: monospace;">Rs 0</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1.5 solid #0f172a; padding-top: 6px; font-size: 14px; font-weight: 800; color: #047857;">
              <span>Total Paid:</span>
              <span style="font-family: monospace;">Rs ${inv.amount_pkr.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.5;">
          <p style="margin: 0;">GlobeTrek PK Technologies (Private) Limited — Tax Reg / NTN: 8941029-7</p>
          <p style="margin: 2px 0 0 0;">This is an official computer-generated receipt issued upon verified SafePay PKR gateway payment completion.</p>
        </div>
      `;

      document.body.appendChild(pdfWrapper);

      const opts = {
        margin: 10,
        filename: `GlobeTrek_Invoice_${inv.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opts).from(pdfWrapper).save();
      document.body.removeChild(pdfWrapper);

      toast.dismiss(toastId);
      toast.success(`Downloaded ${inv.id} PDF!`, {
        description: "Official tax receipt saved to your browser downloads.",
      });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloadingInvId(null);
    }
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
                        disabled={downloadingInvId === inv.id}
                        onClick={() => handleDownloadInvoice(inv)}
                        className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg gap-1"
                      >
                        <Download className="size-3" />
                        {downloadingInvId === inv.id ? "Generating PDF..." : "PDF Receipt"}
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
