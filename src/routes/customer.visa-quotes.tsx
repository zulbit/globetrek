import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck2,
  AlertTriangle,
  Building2,
  Phone,
  MessageCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  ArrowLeft,
  Home,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getCustomerVisaLeadQuotes,
  acceptVisaLeadQuote,
  type VisaLeadQuoteItem,
} from "@/lib/custom-visa-leads.functions";

export const Route = createFileRoute("/customer/visa-quotes")({
  component: CustomerVisaQuotesPortal,
});

function CustomerVisaQuotesPortal() {
  const search = useSearch({ from: "/customer/visa-quotes" }) as { token?: string };
  const token = search.token || "";
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-visa-quotes", token],
    queryFn: () => getCustomerVisaLeadQuotes({ data: { token } }),
    enabled: Boolean(token),
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => acceptVisaLeadQuote({ data: { quoteId, token } }),
    onSuccess: (res) => {
      toast.success(res.message || "Proposal accepted!");
      qc.invalidateQueries({ queryKey: ["customer-visa-quotes", token] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to accept proposal.");
    },
  });

  if (!token) {
    return (
      <div className="container max-w-xl mx-auto py-20 px-4 text-center">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card space-y-4">
          <FileCheck2 className="size-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Access Token Required</h1>
          <p className="text-sm text-muted-foreground">
            Please use the secure link sent to your WhatsApp or Email to view your custom visa proposals.
          </p>
          <div className="pt-2">
            <Link to="/customer">
              <Button variant="outline" className="rounded-xl text-xs">
                <ArrowLeft className="size-3.5 mr-1.5" /> Back to Traveler Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-20 px-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading your custom visa proposals...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-xl mx-auto py-20 px-4 text-center">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 shadow-card space-y-3">
          <h1 className="text-xl font-bold text-destructive">Invalid or Expired Link</h1>
          <p className="text-xs text-muted-foreground">
            {(error as Error)?.message || "We could not find visa proposals for this link."}
          </p>
          <div className="pt-2">
            <Link to="/customer">
              <Button variant="outline" className="rounded-xl text-xs">
                <ArrowLeft className="size-3.5 mr-1.5" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { lead, quotes } = data;
  const isAccepted = lead.status === "accepted";
  const acceptedQuote = quotes.find((q: VisaLeadQuoteItem) => q.status === "accepted");

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10 px-4">
      <div className="container max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/customer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface hover:text-primary transition shadow-sm"
            >
              <ArrowLeft className="size-3.5 text-primary" /> Back to Customer Dashboard
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition hidden sm:inline-flex"
            >
              <Home className="size-3.5" /> Home
            </Link>
          </div>

          <Link
            to="/custom-visa"
            className="text-xs text-primary font-semibold hover:underline hidden sm:inline-block"
          >
            + New Visa Request
          </Link>
        </div>

        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-rose-400/10 blur-3xl" />

          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold px-3 py-1">
                🛂 Custom Visa Case File
              </Badge>
              <Badge variant={isAccepted ? "default" : "outline"} className="rounded-full">
                {isAccepted ? "✓ Proposal Confirmed" : `Awaiting Proposals (${quotes.length}/5 Bids)`}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                {lead.destination_country} · {lead.visa_category}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Case for <strong>{lead.contact_name}</strong> ({lead.applicant_profile} from {lead.customer_city}) · Submission: {lead.submission_office}
              </p>
            </div>

            {/* Case Nature Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="text-xs font-semibold">
                {lead.case_nature}
              </Badge>
              {lead.has_prior_rejection && lead.rejection_details && (
                <Badge variant="destructive" className="text-xs font-semibold">
                  🚨 Prior Refusal: {lead.rejection_details}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                💰 Bank: {lead.bank_statement_status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                🏢 Mode: {lead.consultation_mode}
              </Badge>
            </div>
          </div>
        </div>

        {/* Accepted Banner */}
        {isAccepted && acceptedQuote && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="size-5" /> Proposal Accepted &amp; Confirmed!
            </div>
            <p className="text-xs text-muted-foreground">
              You selected <strong>{acceptedQuote.vendor_name}</strong> ({acceptedQuote.vendor_city}) for <strong>Rs {acceptedQuote.quote_amount_pkr.toLocaleString()}</strong>.
              Connect directly on WhatsApp to begin your file preparation!
            </p>
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Received Proposals ({quotes.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Compare consultation fees, document checklists &amp; processing times from verified visa experts.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Max 5 Bids</span>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Sparkles className="size-8 text-primary mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-foreground">Verified Consultants Are Reviewing Your Case</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Your request has been broadcasted to verified visa lawyers and agencies.
                As soon as an expert submits a proposal, it will appear right here and you will be notified on WhatsApp.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {quotes.map((q: VisaLeadQuoteItem) => {
                const isThisAccepted = q.status === "accepted";
                const isRejected = isAccepted && !isThisAccepted;

                return (
                  <div
                    key={q.id}
                    className={`relative rounded-3xl border p-6 transition-all duration-200 flex flex-col justify-between ${
                      isThisAccepted
                        ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                        : isRejected
                        ? "opacity-50 border-border bg-surface/30"
                        : "border-border bg-card shadow-card hover:border-primary/40"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Agency Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-primary" />
                            <h3 className="text-sm font-bold text-foreground">{q.vendor_name}</h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {q.vendor_city ? `📍 ${q.vendor_city} Office` : "Verified Visa Agency"} · {q.consultation_mode === "in_person" ? "🏢 In-Person Visit Welcome" : "🌐 Remote E-Filing Specialist"}
                          </p>
                        </div>
                        {isThisAccepted && (
                          <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                            ✓ Winning Proposal
                          </Badge>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-emerald-400">
                            Rs {q.quote_amount_pkr.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Consultancy &amp; Filing Fee
                          </span>
                        </div>
                        {q.embassy_fee_estimate_pkr ? (
                          <p className="text-[11px] text-muted-foreground">
                            + Est. Embassy Fee: ~Rs {q.embassy_fee_estimate_pkr.toLocaleString()}
                          </p>
                        ) : null}
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5 text-sky-400" />
                        <span>Estimated File Turnaround: <strong>~{q.estimated_processing_days} Days</strong></span>
                      </div>

                      {/* Inclusions */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Package Inclusions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.inclusions.map((inc) => (
                            <span
                              key={inc}
                              className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium border border-border"
                            >
                              ✅ {inc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {q.proposal_notes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 py-1">
                          "{q.proposal_notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-5 border-t border-border mt-4 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Assalam-o-Alaikum ${q.vendor_name}! I am reviewing your visa proposal of Rs ${q.quote_amount_pkr.toLocaleString()} for my ${lead.destination_country} visa on GlobeTrek PK. I would like to discuss my case.`,
                          );
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                        className="w-full gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                      >
                        <MessageCircle className="size-4" /> Discuss on WhatsApp
                      </Button>

                      {!isAccepted && (
                        <Button
                          size="sm"
                          disabled={acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate(q.id)}
                          className="w-full gap-2 bg-primary text-primary-foreground font-bold shadow-glow text-xs"
                        >
                          <CheckCircle2 className="size-4" /> Accept &amp; Confirm Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
