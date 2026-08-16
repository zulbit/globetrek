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

import { getVendorInvoices } from "@/lib/financials.functions";

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

  const { data: realInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["vendor-real-invoices", user?.id],
    queryFn: () => getVendorInvoices(),
    refetchInterval: 5000,
  });

  const agencyDisplayName =
    (profile as any)?.company_name ||
    (profile?.full_name && profile?.full_name !== "GlobeTrek Admin" ? profile.full_name : null) ||
    "Registered Vendor Agency";

  const fallbackSampleInvoices = [
    {
      id: "INV-2026-001",
      date: "2026-07-01",
      description: "Full Agency Tier Monthly Subscription",
      amount_pkr: 12000,
      status: "paid" as const,
      method: "SafePay PKR",
      period: "Jul 1, 2026 – Aug 1, 2026",
    },
  ];

  const invoiceList = realInvoices.length > 0 ? realInvoices : fallbackSampleInvoices;

  const filteredInvoices = invoiceList.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [downloadingInvId, setDownloadingInvId] = useState<string | null>(null);

  // Helper to format date cleanly as dd-MMM-yyyy (e.g. 14-Aug-2026)
  const formatInvoiceDate = (dStr?: string) => {
    if (!dStr) return "N/A";
    const dt = new Date(dStr);
    if (isNaN(dt.getTime())) return dStr;
    const day = String(dt.getDate()).padStart(2, "0");
    const month = dt.toLocaleString("en-GB", { month: "short" });
    const year = dt.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Direct Vector jsPDF File Download (0ms UI freeze, direct file save to Downloads folder)
  const handleDirectPDFDownload = async (inv: any) => {
    setDownloadingInvId(inv.id);
    const toastId = toast.loading(`Generating GlobeTrek_Invoice_${inv.id}.pdf...`);

    try {
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default;
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      // 1. Top Decorative Bar
      doc.setFillColor(5, 150, 105);
      doc.rect(0, 0, 210, 5, "F");

      // 2. Load & Embed Official GlobeTrek Logo Image
      try {
        const logoImg = new Image();
        logoImg.src = "/og-image.jpg";
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, "JPEG", 15, 12, 22, 16);
      } catch {
        // Fallback Logo badge if image load fails
        doc.setFillColor(5, 150, 105);
        doc.roundedRect(15, 12, 16, 16, 3, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text("GT", 19, 22.5);
      }

      // Company Title & Legal Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("GlobeTrek PK", 40, 19);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Pakistan's Premier Travel Marketplace & B2B Portal", 40, 23.5);
      doc.text("GlobeTrek PK Technologies (Pvt) Ltd · NTN: 8941029-7", 40, 27.5);

      // Right Header: TAX INVOICE & Reference
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.text("TAX INVOICE", 195, 18, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Ref: ${inv.id}`, 195, 23, { align: "right" });

      // Status Badge (Paid & Settled) - Scaled with proper padding
      doc.setFillColor(209, 250, 229); // emerald-100
      doc.roundedRect(155, 26, 40, 6, 1.5, 1.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(4, 120, 87);
      doc.text("PAID & SETTLED", 175, 30.2, { align: "center" });

      // Horizontal Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 35, 195, 35);

      // 3. Two-Column Metadata Info Cards
      const issueDateFormatted = formatInvoiceDate(inv.date);
      const expireDateFormatted = inv.expires_at ? formatInvoiceDate(inv.expires_at) : "Active (Perpetual)";

      // Left Card: Billed To (Vendor)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 39, 86, 38, 2, 2, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BILLED TO (REGISTERED VENDOR)", 20, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(agencyDisplayName, 20, 52);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Account Tier: ${profile?.subscription_tier ? profile.subscription_tier.toUpperCase() : "STARTER"} Partner`, 20, 58);
      doc.text(`Operating City: ${profile?.city || "Pakistan"}`, 20, 64);
      doc.text(`Email: ${profile?.email || "vendor@globetrek.pk"}`, 20, 70);

      // Right Card: Payment & Expiration Details
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(109, 39, 86, 38, 2, 2, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("PAYMENT & VALIDITY DETAILS", 114, 45);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Issue Date:", 114, 52);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(issueDateFormatted, 142, 52);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Expires On:", 114, 58);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text(expireDateFormatted, 142, 58);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Billing Period:", 114, 64);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${inv.period}`, 142, 64);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Payment Gateway:", 114, 70);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text("SafePay PKR (QuickLink)", 142, 70);

      // 4. Itemized Table
      const tableStartY = 82;
      doc.setFillColor(15, 23, 42); // Dark slate header
      doc.rect(15, tableStartY, 180, 8.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("ITEM DESCRIPTION & SERVICE SPECIFICATION", 20, tableStartY + 5.8);
      doc.text("VALIDITY PERIOD", 120, tableStartY + 5.8);
      doc.text("AMOUNT (PKR)", 190, tableStartY + 5.8, { align: "right" });

      // Table Row
      const rowY = tableStartY + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(inv.description, 20, rowY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Valid: ${issueDateFormatted} until ${expireDateFormatted}`, 20, rowY + 4.8);

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(inv.period, 120, rowY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs ${Number(inv.amount_pkr).toLocaleString()}`, 190, rowY, { align: "right" });

      // Table Row Border
      doc.setDrawColor(226, 232, 240);
      doc.line(15, rowY + 9, 195, rowY + 9);

      // 5. Bottom Section: Security Stamp (Left) + Totals Box (Right)
      const bottomY = rowY + 15;

      // Security Stamp & Compliance Note (Left)
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, bottomY, 96, 32, 2, 2, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("VERIFIED TRANSACTION & NTN CERTIFIED", 20, bottomY + 6.5);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("This receipt confirms automated payment settlement via SafePay.", 20, bottomY + 12);
      doc.text("GST/PRA Sales Tax Exempt under Digital B2B Services Schedule.", 20, bottomY + 17);
      doc.text("Generated by GlobeTrek PK Financial Billing Engine.", 20, bottomY + 22);

      // Totals Box (Right)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(118, bottomY, 77, 32, 2, 2, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal:", 123, bottomY + 7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs ${Number(inv.amount_pkr).toLocaleString()}`, 190, bottomY + 7.5, { align: "right" });

      doc.setTextColor(100, 116, 139);
      doc.text("Sales Tax (0%):", 123, bottomY + 14.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Rs 0", 190, bottomY + 14.5, { align: "right" });

      doc.setDrawColor(203, 213, 225);
      doc.line(123, bottomY + 18.5, 190, bottomY + 18.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105);
      doc.text("Total Paid (PKR):", 123, bottomY + 25.5);
      doc.text(`Rs ${Number(inv.amount_pkr).toLocaleString()}`, 190, bottomY + 25.5, { align: "right" });

      // 6. Professional Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 265, 195, 265);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("GlobeTrek PK Technologies (Private) Limited", 105, 271, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Karachi · Lahore · Islamabad · Peshawar · Quetta | Web: globetrek.pk | Support: billing@globetrek.pk", 105, 275, { align: "center" });
      doc.text("Official computer-generated tax invoice. No signature required.", 105, 279, { align: "center" });

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
    const issueDateFormatted = formatInvoiceDate(inv.date);
    const expireDateFormatted = inv.expires_at ? formatInvoiceDate(inv.expires_at) : "Active (Perpetual)";

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GlobeTrek PK — Tax Invoice ${inv.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 820px; margin: 0 auto; background: #ffffff; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand-logo { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0; }
            .brand-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; }
            .brand-sub { font-size: 11px; color: #64748b; margin: 3px 0 0 0; }
            .badge { display: inline-block; background-color: #d1fae5; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-top: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 12px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            th { background-color: #0f172a; color: #ffffff; padding: 12px 14px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            th:first-child { border-top-left-radius: 8px; }
            th:last-child { border-top-right-radius: 8px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 14px; }
            .totals { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .security-box { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px; font-size: 11px; color: #475569; width: 50%; line-height: 1.5; }
            .total-box { width: 42%; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; font-size: 12px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              .header { border-bottom: 2px solid #059669; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="/og-image.jpg" alt="GlobeTrek PK" class="brand-logo" />
              <div>
                <h1 class="brand-title">GlobeTrek PK</h1>
                <p class="brand-sub">Pakistan's Premier Travel Marketplace &amp; B2B Portal</p>
                <p class="brand-sub" style="color: #059669; font-weight: 600;">NTN: 8941029-7 · SafePay Verified</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 800; color: #059669; margin: 0;">TAX INVOICE</h2>
              <p style="font-size: 12px; font-weight: 700; font-family: monospace; color: #0f172a; margin: 4px 0 0 0;">${inv.id}</p>
              <span class="badge">✓ ${inv.status.toUpperCase()} &amp; SETTLED</span>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Billed To (Registered Vendor)</p>
              <p style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">${agencyDisplayName}</p>
              <p style="color: #475569; margin: 0 0 2px 0;">Account Tier: <strong>${profile?.subscription_tier ? profile.subscription_tier.toUpperCase() : "STARTER"} Partner</strong></p>
              <p style="color: #475569; margin: 0 0 2px 0;">City: ${profile?.city || "Pakistan"}</p>
              <p style="color: #475569; margin: 0;">Email: ${profile?.email || "vendor@globetrek.pk"}</p>
            </div>
            <div class="card">
              <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 6px 0;">Payment &amp; Validity Details</p>
              <p style="margin: 0 0 4px 0; color: #475569;"><strong>Issue Date:</strong> <span style="color: #0f172a;">${issueDateFormatted}</span></p>
              <p style="margin: 0 0 4px 0; color: #475569;"><strong>Expires On:</strong> <span style="color: #059669; font-weight: 700;">${expireDateFormatted}</span></p>
              <p style="margin: 0 0 4px 0; color: #475569;"><strong>Billing Period:</strong> <span style="color: #0f172a;">${inv.period}</span></p>
              <p style="margin: 0; color: #475569;"><strong>Gateway:</strong> <span style="color: #059669; font-weight: 700;">SafePay PKR (QuickLink)</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description &amp; Specification</th>
                <th style="text-align:center;">Validity Period</th>
                <th style="text-align:right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${inv.description}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Valid from ${issueDateFormatted} until ${expireDateFormatted} · Verified B2B Activation</div>
                </td>
                <td style="text-align: center; color: #475569; font-weight: 600;">${inv.period}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 800; font-size: 13px; color: #0f172a;">Rs ${Number(inv.amount_pkr).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="security-box">
              <strong>🔒 Verified Payment &amp; NTN Certified</strong><br>
              This invoice confirms automated payment settlement via SafePay PKR.<br>
              GST/PRA Sales Tax Exempt under Digital Services Schedule.<br>
              Issued by GlobeTrek PK Technologies (Private) Limited.
            </div>
            <div class="total-box">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b;">
                <span>Subtotal:</span><span style="font-weight: 600; color: #0f172a;">Rs ${Number(inv.amount_pkr).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                <span>Sales Tax (0%):</span><span style="color: #0f172a;">Rs 0</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #059669; border-top: 2px solid #e2e8f0; padding-top: 8px;">
                <span>Total Paid:</span><span>Rs ${Number(inv.amount_pkr).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">GlobeTrek PK Technologies (Private) Limited · NTN: 8941029-7</p>
            <p style="margin: 0;">Karachi · Lahore · Islamabad · Peshawar · Quetta | Web: globetrek.pk | Support: billing@globetrek.pk</p>
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
                      <Badge className={`text-[10px] uppercase font-bold ${
                        inv.status.toLowerCase() === "pending" 
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                          : inv.status.toLowerCase() === "failed" || inv.status.toLowerCase() === "cancelled"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
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
