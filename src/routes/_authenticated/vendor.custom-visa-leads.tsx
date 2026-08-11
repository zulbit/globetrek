import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FileCheck2,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
  Phone,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Send,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  MapPin,
  ShieldCheck,
  Plane,
} from "lucide-react";
import {
  getMarketplaceVisaLeads,
  createVisaLeadUnlockCheckout,
  verifyVisaLeadUnlockPayment,
  submitVisaLeadQuote,
} from "@/lib/custom-visa-leads.functions";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/custom-visa-leads")({
  component: VendorCustomVisaLeadsPage,
});

export function VendorCustomVisaLeadsPage() {
  const qc = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [refusalOnly, setRefusalOnly] = useState<boolean>(false);

  // Proposal Modal State
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(15000);
  const [embassyFeeEstimate, setEmbassyFeeEstimate] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);
  const [consultationMode, setConsultationMode] = useState<"in_person" | "remote_efiling">("in_person");
  const [proposalNotes, setProposalNotes] = useState<string>("");
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([
    "Complete Document File Audit",
    "Embassy Cover Letter Drafting",
    "Appointment Slot Booking Assistance",
    "Mock Interview Coaching",
  ]);

  // Query Leads
  const { data: marketplaceLeads = [], isLoading, refetch } = useQuery({
    queryKey: ["vendor-custom-visa-leads"],
    queryFn: () => getMarketplaceVisaLeads(),
    refetchInterval: 5000,
  });

  // Unlock Mutation (SafePay Checkout)
  const unlockMutation = useMutation({
    mutationFn: (leadId: string) => createVisaLeadUnlockCheckout({ data: { leadId } }),
    onSuccess: (res) => {
      if (res.checkoutUrl) {
        toast.info("Opening SafePay checkout window for Rs 750...");
        window.open(res.checkoutUrl, "_blank");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not initiate payment.");
    },
  });

  // Verify Payment Mutation (Manual / Fallback verify button)
  const verifyPaymentMutation = useMutation({
    mutationFn: (leadId: string) => verifyVisaLeadUnlockPayment({ data: { leadId } }),
    onSuccess: () => {
      toast.success("SafePay payment verified! Contact details unlocked.");
      qc.invalidateQueries({ queryKey: ["vendor-custom-visa-leads"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to verify unlock.");
    },
  });

  // Submit Proposal Mutation
  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!activeLead) return;
      return await submitVisaLeadQuote({
        data: {
          lead_id: activeLead.id,
          quote_amount_pkr: quoteAmount,
          embassy_fee_estimate_pkr: embassyFeeEstimate,
          estimated_processing_days: estimatedDays,
          consultation_mode: consultationMode,
          inclusions: selectedInclusions,
          proposal_notes: proposalNotes,
        },
      });
    },
    onSuccess: () => {
      toast.success("🎉 Visa proposal submitted! Traveler has been notified on WhatsApp.");
      setProposalModalOpen(false);
      qc.invalidateQueries({ queryKey: ["vendor-custom-visa-leads"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit proposal.");
    },
  });

  const INCLUSION_OPTIONS = [
    "Complete Document File Audit",
    "Embassy Cover Letter Drafting",
    "Appointment Slot Booking Assistance",
    "Mock Interview Coaching",
    "FBR Tax Return Verification",
    "Bank Statement Tie-Back Review",
    "Travel Insurance Policy Included",
    "Courier Document Return Pack",
  ];

  const filteredLeads = marketplaceLeads.filter((l: any) => {
    if (refusalOnly && !l.has_prior_rejection) return false;
    if (selectedFilter !== "all" && !l.destination_country.toLowerCase().includes(selectedFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30">
              <FileCheck2 className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-foreground">Custom Visa Leads Marketplace</h1>
            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[11px] font-bold">
              🔥 HOT B2B LEADS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unlock high-intent visa applicants, fresh passport cases &amp; refusal rectifications for <strong>₨ 750</strong> (Max 5 agencies per lead).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className="size-3.5" /> Refresh Leads
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("all")}
          className="rounded-full text-xs h-8"
        >
          All Destinations ({marketplaceLeads.length})
        </Button>
        {["United Kingdom", "Schengen", "United States", "Canada", "Turkey", "UAE", "Saudi Arabia"].map((c) => (
          <Button
            key={c}
            variant={selectedFilter === c ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(c)}
            className="rounded-full text-xs h-8"
          >
            {c}
          </Button>
        ))}

        <Button
          variant={refusalOnly ? "destructive" : "outline"}
          size="sm"
          onClick={() => setRefusalOnly(!refusalOnly)}
          className="rounded-full text-xs h-8 gap-1.5 ml-auto border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
        >
          <AlertTriangle className="size-3" />
          <span>Prior Refusals Only</span>
        </Button>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading verified visa inquiries...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
          <FileCheck2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Visa Leads Matching Filters</h3>
          <p className="text-xs text-muted-foreground">
            New custom visa inquiries from travelers across Pakistan will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredLeads.map((lead: any) => {
            const isUnlocked = lead.is_unlocked;
            const isSoldOut = lead.is_sold_out && !isUnlocked;
            const remainingSlots = Math.max(0, lead.max_unlocks - lead.unlock_count);

            return (
              <Card
                key={lead.id}
                className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-200 flex flex-col justify-between ${
                  isUnlocked
                    ? "border-emerald-500/40 bg-emerald-500/5 shadow-card"
                    : isSoldOut
                    ? "opacity-60 border-border bg-surface/40"
                    : "border-border bg-card shadow-card hover:border-primary/40"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="bg-rose-500/15 text-rose-300 border-rose-400/30 text-xs font-bold">
                        {lead.destination_country} · {lead.visa_category}
                      </Badge>
                      {lead.has_prior_rejection ? (
                        <Badge variant="destructive" className="text-[10px] font-bold gap-1">
                          <AlertTriangle className="size-3" /> Prior Refusal Case
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          🟢 {lead.case_nature}
                        </Badge>
                      )}
                      {lead.is_local_match && (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30 text-[10px] font-bold">
                          📍 Local Client ({lead.customer_city})
                        </Badge>
                      )}
                    </div>

                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {isSoldOut ? "🔒 Sold Out" : `${lead.unlock_count}/${lead.max_unlocks} Unlocks`}
                    </span>
                  </div>

                  {/* Case Details */}
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="size-3 text-primary" /> Submission Center
                      </p>
                      <p className="font-semibold text-foreground">{lead.submission_office}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-primary" /> Applicant City &amp; Profile
                      </p>
                      <p className="font-semibold text-foreground">
                        {lead.customer_city} · {lead.applicant_profile}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="size-3 text-emerald-400" /> Bank Statement Readiness
                      </p>
                      <p className="font-semibold text-foreground">{lead.bank_statement_status}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users className="size-3 text-primary" /> Applicants &amp; Preferred Mode
                      </p>
                      <p className="font-semibold text-foreground">
                        {lead.applicant_count} Pax · {lead.consultation_mode}
                      </p>
                    </div>
                  </div>

                  {/* Refusal details if any */}
                  {lead.has_prior_rejection && lead.rejection_details && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                      <strong>Refusal History:</strong> {lead.rejection_details}
                    </div>
                  )}

                  {/* Special Notes */}
                  {lead.special_notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                      "{lead.special_notes}"
                    </p>
                  )}

                  {/* Contact Area */}
                  <div className="rounded-2xl border border-border bg-surface/70 p-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Applicant Contact Information
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">{lead.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span className="font-mono font-semibold text-foreground">{lead.contact_phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-5 border-t border-border mt-4 flex flex-col gap-2">
                  {!isUnlocked ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        disabled={isSoldOut || unlockMutation.isPending}
                        onClick={() => unlockMutation.mutate(lead.id)}
                        className="w-full gap-2 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 font-bold text-white shadow-glow hover:scale-[1.01] transition-transform text-xs h-10"
                      >
                        <Lock className="size-4" />
                        <span>
                          {isSoldOut
                            ? "Max 5 Agencies Unlocked"
                            : `Unlock Contact Details — ₨ 750 (SafePay)`}
                        </span>
                      </Button>

                      {/* Quick fallback verification if vendor completed checkout */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => verifyPaymentMutation.mutate(lead.id)}
                        className="text-[11px] text-muted-foreground hover:text-foreground h-7"
                      >
                        Already paid on SafePay? Click here to refresh contact
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`tel:${lead.contact_phone}`, "_self");
                          }}
                          className="gap-1.5 text-xs border-primary/30"
                        >
                          <Phone className="size-3.5 text-primary" /> Call Applicant
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Assalam-o-Alaikum ${lead.contact_name}! We received your custom visa inquiry for ${lead.destination_country} (${lead.visa_category}) on GlobeTrek PK. We would like to discuss your case.`,
                            );
                            window.open(`https://wa.me/${lead.contact_phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
                          }}
                          className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp Chat
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveLead(lead);
                          if (lead.my_quote) {
                            setQuoteAmount(lead.my_quote.quote_amount_pkr);
                            setEmbassyFeeEstimate(lead.my_quote.embassy_fee_estimate_pkr || 0);
                            setEstimatedDays(lead.my_quote.estimated_processing_days || 7);
                            setConsultationMode(lead.my_quote.consultation_mode || "in_person");
                            setProposalNotes(lead.my_quote.proposal_notes || "");
                            setSelectedInclusions(lead.my_quote.inclusions || []);
                          }
                          setProposalModalOpen(true);
                        }}
                        className="w-full gap-2 bg-primary text-primary-foreground font-bold shadow-glow text-xs h-10"
                      >
                        <Send className="size-3.5" />
                        <span>
                          {lead.my_quote
                            ? `Update / Revise Proposal (Active: ₨ ${lead.my_quote.quote_amount_pkr.toLocaleString()})`
                            : "Submit Official Visa Filing Proposal"}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Proposal Submission Modal */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="max-w-lg border-border bg-card p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileCheck2 className="size-5 text-primary" />
              <span>Submit Visa Consultation Proposal</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {activeLead && (
                <span>
                  Case for <strong>{activeLead.contact_name}</strong> · {activeLead.destination_country} ({activeLead.visa_category})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Pricing */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Your Consultancy / Service Fee (PKR)</Label>
                <Input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(Number(e.target.value))}
                  className="h-10 text-sm font-bold text-emerald-400 bg-surface"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Est. Embassy / Drop-box Fee (PKR)</Label>
                <Input
                  type="number"
                  value={embassyFeeEstimate}
                  onChange={(e) => setEmbassyFeeEstimate(Number(e.target.value))}
                  placeholder="e.g. 35000"
                  className="h-10 text-sm bg-surface"
                />
              </div>
            </div>

            {/* Turnaround & Consultation Mode */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">File Turnaround (Days)</Label>
                <Input
                  type="number"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  className="h-10 text-sm bg-surface"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Consultation Mode Offered</Label>
                <select
                  value={consultationMode}
                  onChange={(e) => setConsultationMode(e.target.value as any)}
                  className="w-full h-10 rounded-md border border-border bg-surface px-3 text-xs"
                >
                  <option value="in_person">🏢 In-Person Office Visit Welcome</option>
                  <option value="remote_efiling">🌐 100% Online / Remote E-Filing</option>
                </select>
              </div>
            </div>

            {/* Inclusions Checkboxes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Package Inclusions</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {INCLUSION_OPTIONS.map((inc) => {
                  const isChecked = selectedInclusions.includes(inc);
                  return (
                    <div
                      key={inc}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedInclusions(selectedInclusions.filter((i) => i !== inc));
                        } else {
                          setSelectedInclusions([...selectedInclusions, inc]);
                        }
                      }}
                      className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-surface/50 text-muted-foreground hover:bg-surface"
                      }`}
                    >
                      <span className="text-xs">{isChecked ? "✅" : "⬜"}</span>
                      <span className="text-[11px] truncate">{inc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Proposal Notes / Terms for Traveler</Label>
              <Textarea
                rows={2}
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                placeholder="e.g. Free refusal analysis included, 100% document file preparation, slot booking guaranteed..."
                className="bg-surface text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setProposalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={quoteMutation.isPending}
              onClick={() => quoteMutation.mutate()}
              className="gap-2 bg-primary text-primary-foreground font-bold shadow-glow"
            >
              {quoteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span>Submit &amp; Alert Traveler</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
