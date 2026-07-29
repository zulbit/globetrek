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
        .select("full_name, company_name, email, subscription_tier, lead_credits_balance, city")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const agencyDisplayName =
    (profile as any)?.company_name ||
    (profile?.full_name && profile?.full_name !== "GlobeTrek Admin" ? profile.full_name : null) ||
    "Registered Vendor Agency";

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

  // Direct Vector jsPDF File Download (0ms UI freeze, direct file save to Downloads folder)
  const handleDirectPDFDownload = async (inv: any) => {
    setDownloadingInvId(inv.id);
    const toastId = toast.loading(`Generating GlobeTrek_Invoice_${inv.id}.pdf...`);

    try {
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default;
      const doc = new jsPDF();

      // 1. Header Banner
      doc.setFillColor(4, 120, 87); // Primary emerald #047857
      doc.rect(0, 0, 210, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("GlobeTrek PK", 15, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Official Vendor Tax Receipt & Billing Statement", 115, 15);

      // 2. Status Badge & Invoice ID
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`INVOICE: ${inv.id}`, 15, 34);

      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105);
      doc.text(`STATUS: ${inv.status.toUpperCase()}`, 155, 34);

      // 3. Billed To & Metadata Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 42, 85, 38, 3, 3, "FD");
      doc.roundedRect(110, 42, 85, 38, 3, 3, "FD");

      // Billed To Text
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BILLED TO (VENDOR AGENCY)", 20, 50);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(agencyDisplayName, 20, 58);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`City: ${profile?.city || "Pakistan"}`, 20, 66);
      doc.text(`Account Tier: ${profile?.subscription_tier || "Agency"} Plan`, 20, 73);

      // Invoice Metadata Text
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("INVOICE METADATA", 115, 50);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${inv.date}`, 115, 58);
      doc.text(`Period: ${inv.period}`, 115, 66);
      doc.text(`Gateway: SafePay PKR (NTN: 8941029-7)`, 115, 73);

      // 4. Line Items Table Header
      doc.setFillColor(15, 23, 42);
      doc.rect(15, 88, 180, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Item Description", 20, 94);
      doc.text("Billing Period", 105, 94);
      doc.text("Amount (PKR)", 160, 94);

      // Row Data
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(inv.description, 20, 106);
      doc.text(inv.period, 105, 106);
      doc.setFont("courier", "bold");
      doc.text(`Rs ${inv.amount_pkr.toLocaleString()}`, 160, 106);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 112, 195, 112);

      // 5. Totals Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(120, 120, 75, 28, 3, 3, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal:", 125, 128);
      doc.text(`Rs ${inv.amount_pkr.toLocaleString()}`, 160, 128);

      doc.text("Sales Tax (0%):", 125, 135);
      doc.text("Rs 0", 160, 135);

      doc.setDrawColor(203, 213, 225);
      doc.line(125, 138, 190, 138);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(4, 120, 87);
      doc.text("Total Paid:", 125, 144);
      doc.text(`Rs ${inv.amount_pkr.toLocaleString()}`, 160, 144);

      // 6. Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("GlobeTrek PK Technologies (Private) Limited — Tax Reg / NTN: 8941029-7", 42, 175);
      doc.text("Official computer-generated receipt issued upon verified SafePay PKR gateway payment completion.", 30, 180);

      // Direct File Save to Browser Downloads Folder!
      doc.save(`GlobeTrek_Invoice_${inv.id}.pdf`);

      toast.dismiss(toastId);
      toast.success(`Downloaded GlobeTrek_Invoice_${inv.id}.pdf!`, {
        description: "File saved directly to your Downloads folder.",
      });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloadingInvId(null);
    }
  };

  const handlePrintInvoiceWindow = (inv: any) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GlobeTrek PK — Invoice ${inv.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 800; color: #047857; margin: 0; }
            .subtitle { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
            .badge { display: inline-block; background-color: #d1fae5; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 12px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            th { background-color: #0f172a; color: #ffffff; padding: 10px 12px; text-align: left; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px; }
            .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .total-box { width: 250px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">GlobeTrek PK</h1>
              <p class="subtitle">Official Vendor Tax Receipt &amp; Billing Statement</p>
            </div>
            <div style="text-align: right;">
              <span class="badge">${inv.status}</span>
              <p style="font-size: 12px; font-weight: 700; font-family: monospace; margin: 6px 0 0 0;">${inv.id}</p>
            </div>
          </div>
          <div class="grid">
            <div class="card">
              <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Billed To</p>
              <p style="font-size: 13px; font-weight: 700; margin: 0 0 2px 0;">${agencyDisplayName}</p>
              <p style="color: #475569; margin: 0;">City: ${profile?.city || "Pakistan"}</p>
            </div>
            <div class="card">
              <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Invoice Details</p>
              <p style="margin: 0;"><strong>Date:</strong> ${inv.date}</p>
              <p style="margin: 2px 0 0 0;"><strong>Period:</strong> ${inv.period}</p>
              <p style="margin: 2px 0 0 0;"><strong>NTN:</strong> 8941029-7</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Item Description</th><th style="text-align:center;">Period</th><th style="text-align:right;">Amount (PKR)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">${inv.description}</td>
                <td style="text-align: center;">${inv.period}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">Rs ${inv.amount_pkr.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div class="total-box">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Subtotal:</span><span>Rs ${inv.amount_pkr.toLocaleString()}</span></div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #047857; border-top: 1px solid #cbd5e1; padding-top: 6px;"><span>Total Paid:</span><span>Rs ${inv.amount_pkr.toLocaleString()}</span></div>
            </div>
          </div>
          <div class="footer">
            <p>GlobeTrek PK Technologies — NTN: 8941029-7 | Computer-Generated Tax Receipt</p>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
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
            {agencyDisplayName}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          disabled={downloadingInvId === inv.id}
                          onClick={() => handleDirectPDFDownload(inv)}
                          className="h-7 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-1 px-2.5"
                        >
                          <Download className="size-3" />
                          {downloadingInvId === inv.id ? "Downloading..." : "Download PDF"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintInvoiceWindow(inv)}
                          className="h-7 text-xs font-medium border-border hover:bg-surface rounded-lg gap-1 px-2.5"
                        >
                          <FileText className="size-3" /> Print
                        </Button>
                      </div>
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
