import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  Briefcase,
  Layers,
  Phone,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  getMarketplaceLeads,
  createLeadUnlockCheckout,
  verifyLeadUnlockPayment,
  submitLeadQuote,
  type CustomTourLead,
} from "@/lib/custom-tour-leads.functions";
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
import { formatPKR } from "@/lib/tours";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/vendor/custom-leads")({
  component: VendorCustomLeadsPage,
});

export function VendorCustomLeadsPage() {
  const qc = useQueryClient();
  const { user, profile: authProfile, isProfileLoading } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile-status", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("vendor_status")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isApproved =
    authProfile?.vendor_status === "approved" ||
    profile?.vendor_status === "approved" ||
    authProfile?.role === "admin";

  // -------- Custom Tour Marketplace Leads Query --------
  const { data: marketplaceLeads = [], isLoading, refetch } = useQuery({
    queryKey: ["vendor-leads-marketplace"],
    queryFn: () => getMarketplaceLeads(),
    refetchInterval: 5000,
  });

  // -------- Auto-verify pending lead unlock payments in background --------
  useEffect(() => {
    if (!marketplaceLeads.length) return;
    const pendingLeads = marketplaceLeads.filter((l) => l.has_pending_payment);
    if (!pendingLeads.length) return;

    pendingLeads.forEach((pl) => {
      verifyLeadUnlockPayment({ data: { leadId: pl.id } })
        .then((res) => {
          if (res.unlocked) {
            toast.success("SafePay payment verified! Lead unlocked successfully.");
            qc.invalidateQueries({ queryKey: ["vendor-leads-marketplace"] });
          }
        })
        .catch(() => {});
    });
  }, [marketplaceLeads, qc]);

  // -------- Unlock Lead Mutation (SafePay Checkout) --------
  const unlockMutation = useMutation({
    mutationFn: (leadId: string) => createLeadUnlockCheckout({ data: { leadId } }),
    onSuccess: (res) => {
      if (res.checkoutUrl) {
        toast.info("Opening SafePay checkout window...");
        window.open(res.checkoutUrl, "_blank");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not start payment checkout.");
    },
  });

  // -------- Verify Custom Lead Payment Mutation --------
  const verifyPaymentMutation = useMutation({
    mutationFn: (leadId: string) => verifyLeadUnlockPayment({ data: { leadId } }),
    onSuccess: (res) => {
      if (res.unlocked) {
        toast.success(res.message || "Payment verified and lead unlocked successfully!");
        qc.invalidateQueries({ queryKey: ["vendor-leads-marketplace"] });
      } else {
        toast.warning(res.message || "Payment status not yet complete.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not verify payment.");
    },
  });

  // -------- Detailed Quotation Modal State & Mutation --------
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<CustomTourLead | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string>("350000");
  const [validityDays, setValidityDays] = useState<string>("7");
  const [advanceDepositPercent, setAdvanceDepositPercent] = useState<string>("30");
  const [hotelDetails, setHotelDetails] = useState<string>("4★ City Center Hotel (Double Sharing with Daily Breakfast)");
  const [flightDetails, setFlightDetails] = useState<string>("FlyDubai / Air Arabia (20kg Check-in + 7kg Hand luggage, Direct transfer)");
  const [itinerarySummary, setItinerarySummary] = useState<string>("");
  const [inclusionsInput, setInclusionsInput] = useState<string>("Return Flights, 4★ Hotel Stay, Airport Transfers, Visa Assistance, Daily Breakfast, Guided Sightseeing");
  const [exclusionsInput, setExclusionsInput] = useState<string>("Personal Expenses, Driver Gratuities / Tips, Extra Unspecified Meals");
  const [perksInput, setPerksInput] = useState<string>("Free Tourist eSIM Card, Complimentary Airport Lounge Access");
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    `1. 30% advance deposit required to confirm flight & hotel bookings.
2. Remaining balance due 7 days prior to departure.
3. E-Visa approval is subject to official embassy processing.
4. Cancellation made 14+ days prior to travel receives 90% refund. Non-refundable within 72 hours.
5. Rates are subject to exchange rate & airline tax fluctuations until booking confirmation.`
  );

  const applyQuoteTemplate = (tier: "budget" | "deluxe" | "vip" | "umrah") => {
    if (tier === "budget") {
      setQuoteAmount("220000");
      setHotelDetails("3★ Standard Hotel (Centrally located, Air-conditioned, En-suite bath)");
      setFlightDetails("Connecting Flight via Middle East Hub (20kg baggage)");
      setItinerarySummary("Day 1: Arrival & Hotel Check-in\nDay 2: City Tour & Heritage Sightseeing\nDay 3: Shopping & Local Bazaars\nDay 4: Free day for optional excursions\nDay 5: Airport Transfer & Return Flight");
      setInclusionsInput("3★ Hotel Stay, Breakfast, Return Economy Flights, Group Airport Transfers, Visa Filing Assistance");
      setExclusionsInput("Lunch & Dinner, Optional Excursions, Personal Shopping");
      setPerksInput("Free Sim Card (5GB)");
    } else if (tier === "deluxe") {
      setQuoteAmount("350000");
      setHotelDetails("4★ Premium City Center Hotel (Buffet Breakfast, Swimming Pool & Spa)");
      setFlightDetails("Direct Flight (Emirates / FlyDubai / Air Arabia, 30kg Baggage)");
      setItinerarySummary("Day 1: VIP Airport Welcome & Private Transfer\nDay 2: Full-day Guided Private Excursion\nDay 3: Desert Safari / Cruise Dinner\nDay 4: Cultural Landmark & Souk Exploration\nDay 5: Luxury Shopping & Leisure\nDay 6: Private Airport Drop-off");
      setInclusionsInput("Return Flights (Direct), 4★ Hotel, Private Airport Transfers, Daily Buffet Breakfast, 2 Major Tours, Visa Assistance");
      setExclusionsInput("Personal Expenses, Meals outside itinerary");
      setPerksInput("Free eSIM Card, Complimentary Lounge Access");
    } else if (tier === "vip") {
      setQuoteAmount("650000");
      setHotelDetails("5★ Luxury Waterfront Resort (Club Lounge, Executive Suite, Full Board)");
      setFlightDetails("Business Class Direct Flights (40kg Baggage + Fast Track Immigration)");
      setItinerarySummary("Day 1: Chauffeur Airport Pickup & Private VIP Check-in\nDay 2: Private Yacht Cruise & Fine Dining\nDay 3: Helicopter Scenic Tour & Luxury Excursion\nDay 4: Exclusive Cultural Experience & Shopping Concierge\nDay 5: Chauffeur Drop-off at VIP Terminal");
      setInclusionsInput("Business Class Flights, 5★ Executive Suite, 24/7 Private Chauffeur, All Meals, All Excursions, Full Travel Insurance");
      setExclusionsInput("Personal Shopping");
      setPerksInput("VIP Airport Meet & Greet, Fast Track Immigration, 24/7 Dedicated Trip Concierge");
    } else if (tier === "umrah") {
      setQuoteAmount("195000");
      setHotelDetails("Makkah: 4★ Hotel (Within 350m of Haram) | Madinah: 4★ Hotel (Central Northern Area)");
      setFlightDetails("Direct Saudi Airlines / PIA to Jeddah, Return from Madinah (30kg Baggage + 5L Zamzam)");
      setItinerarySummary("Day 1: Arrival at Jeddah & High-Speed Haramain Train to Makkah\nDay 2: Perform Umrah with Experienced Guide\nDay 3-5: Ibadah in Makkah & Makkah Ziyarat\nDay 6: Transfer to Madinah via Bullet Train\nDay 7-9: Ibadah in Masjid an-Nabawi & Madinah Ziyarat\nDay 10: Departure from Prince Mohammad Bin Abdulaziz Airport");
      setInclusionsInput("Umrah E-Visa with Medical Insurance, Makkah & Madinah Hotels, Haramain Bullet Train Tickets, Complete Guided Ziyarat");
      setExclusionsInput("Personal Laundry & Extra Meals");
      setPerksInput("Complimentary 5L Zamzam packing, 24/7 Ground Assistance in KSA");
    }
  };

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadForQuote) return;
      const price = parseInt((quoteAmount || "").replace(/\D/g, ""), 10);
      const days = parseInt((validityDays || "").replace(/\D/g, "") || "7", 10);
      const validUntilDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const inclusions = inclusionsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const exclusions = exclusionsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const perks = perksInput.split(",").map((s) => s.trim()).filter(Boolean);

      return submitLeadQuote({
        data: {
          leadId: selectedLeadForQuote.id,
          quoteAmount: price,
          validUntil: validUntilDate,
          hotelDetails,
          flightDetails,
          itinerarySummary,
          inclusions,
          exclusions,
          perks,
          termsAndConditions,
          advanceDepositPercent: parseInt(advanceDepositPercent || "30", 10),
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Detailed quotation sent to traveler via Portal & WhatsApp!");
      setQuoteModalOpen(false);
      qc.invalidateQueries({ queryKey: ["vendor-leads-marketplace"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit quotation.");
    },
  });

  function waLink(phone?: string | null, subject?: string | null) {
    const digits = (phone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(`Hi! Following up about your GlobeTrek custom tour request regarding ${subject || "your trip"}.`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  const unlockedCount = marketplaceLeads.filter((l) => l.is_unlocked).length;
  const totalAvailable = marketplaceLeads.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="size-4" /> B2B Custom Tour Leads Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Custom Tour Requests
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-qualified group travelers seeking tailored itineraries. Unlock verified customer contacts &amp; submit online quotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="gap-1.5 text-xs font-semibold h-9 rounded-xl"
          >
            <RefreshCw className="size-3.5" /> Refresh Leads
          </Button>

          <Link
            to="/vendor/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border px-3 py-2 rounded-xl bg-card"
          >
            <FileText className="size-3.5" /> View Direct Inquiries
          </Link>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/30">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {totalAvailable} Custom Tour Leads Available ({unlockedCount} Unlocked by You)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Each lead is limited to 3 vendor unlocks max to prevent market saturation. Unlocking provides full name, verified email, direct mobile number, and the instant Proposal Engine.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-surface/80 border border-border px-3 py-1.5 rounded-xl">
          <span className="text-amber-400">Unlock Fee:</span>
          <span>₨ 5,000 / lead</span>
        </div>
      </div>

      {/* Leads List / Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading marketplace leads...
        </div>
      ) : marketplaceLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
          <Clock className="size-8 text-muted-foreground/50 mx-auto mb-3" />
          No verified custom tour leads available right now. New leads will appear here as soon as approved by Admins.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceLeads.map((l: CustomTourLead) => (
            <div
              key={l.id}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 bg-card ${
                l.is_unlocked
                  ? "border-emerald-500/40 shadow-emerald-500/5 hover:border-emerald-500/60"
                  : "border-border hover:border-border-hover hover:shadow-md"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                      ✈️ {l.departure_city} → {l.destination}
                    </span>
                    <h3 className="font-bold text-base capitalize text-foreground">
                      Custom Tour to {l.destination}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Submitted {new Date(l.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  <Badge
                    variant={l.is_unlocked ? "default" : "outline"}
                    className={`rounded-full text-[10px] uppercase tracking-wider ${
                      l.is_unlocked ? "bg-emerald-500 text-black font-bold" : ""
                    }`}
                  >
                    {l.is_unlocked ? "Unlocked" : "Locked"}
                  </Badge>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 border-t border-border pt-3 mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    <span>Month: <strong className="text-foreground capitalize">{l.travel_month}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5 text-primary shrink-0" />
                    <span>Group: <strong className="text-foreground capitalize">{l.group_size} ({l.group_type})</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Compass className="size-3.5 text-primary shrink-0" />
                    <span>Duration: <strong className="text-foreground">{l.duration_days} Days</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="size-3.5 text-primary shrink-0" />
                    <span>Hotel: <strong className="text-foreground capitalize">{(l.hotel_tier || "3star").replace("star", " ★")}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <Layers className="size-3.5 text-primary shrink-0" />
                    <span>Needs: <strong className="text-foreground capitalize">{[
                      l.flight_class ? `${l.flight_class} flight` : null,
                      l.visa_needed ? "Visa" : null,
                      l.insurance_needed ? "Insurance" : null,
                    ].filter(Boolean).join(", ") || "Custom Package"}</strong></span>
                  </div>
                </div>

                {/* Special requests */}
                {l.special_requests && (
                  <div className="bg-surface/60 border border-border/60 rounded-xl p-3 mb-3 text-xs italic text-muted-foreground">
                    "{l.special_requests}"
                  </div>
                )}
              </div>

              {/* Bottom Actions Block */}
              <div className="border-t border-border pt-3 mt-2">
                {l.is_unlocked ? (
                  <div className="space-y-2.5">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-0.5">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        ✓ Verified Traveler Info
                      </p>
                      <p className="font-bold text-foreground text-sm">{l.contact_name}</p>
                      <p className="text-muted-foreground font-mono text-[11px]">{l.contact_email}</p>
                      <p className="text-primary font-mono font-bold text-xs mt-1">{l.contact_phone}</p>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${l.contact_phone}`}
                        className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl border border-border bg-surface py-2 text-xs font-semibold hover:bg-surface/80"
                      >
                        <Phone className="size-3.5" /> Call
                      </a>
                      <a
                        href={waLink(l.contact_phone, `Custom Tour to ${l.destination}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-2 text-xs font-semibold hover:bg-emerald-500/20"
                      >
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                    </div>

                    {l.my_quote && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-400" /> Proposal Active
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {formatPKR(l.my_quote.quote_amount)}
                        </span>
                      </div>
                    )}

                    <Button
                      size="sm"
                      className={`w-full gap-1.5 font-bold shadow rounded-xl ${
                        l.my_quote
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                          : "bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600"
                      }`}
                      onClick={() => {
                        setSelectedLeadForQuote(l);
                        if (l.my_quote) {
                          setQuoteAmount(String(l.my_quote.quote_amount));
                          setAdvanceDepositPercent(String(l.my_quote.advance_deposit_percent || "30"));
                          setHotelDetails(l.my_quote.hotel_details || "4★ City Center Hotel");
                          setFlightDetails(l.my_quote.flight_details || "Direct Flight");
                          setItinerarySummary(l.my_quote.itinerary_summary || "");
                          setInclusionsInput((l.my_quote.inclusions || []).join(", "));
                          setExclusionsInput((l.my_quote.exclusions || []).join(", "));
                          setPerksInput((l.my_quote.perks || []).join(", "));
                          if (l.my_quote.terms_and_conditions) setTermsAndConditions(l.my_quote.terms_and_conditions);
                        } else {
                          if (!quoteAmount) setQuoteAmount("350000");
                          if (!itinerarySummary) applyQuoteTemplate("deluxe");
                        }
                        setQuoteModalOpen(true);
                      }}
                    >
                      {l.my_quote ? (
                        <>
                          <FileText className="size-3.5" /> Update / Revise Quotation
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" /> Submit Online Quotation
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Blurred mock */}
                    <div className="rounded-xl bg-surface/50 border border-border/50 p-2.5 filter blur-xs select-none pointer-events-none opacity-40 text-xs">
                      <p className="font-bold">🔒 Traveler Contact</p>
                      <p className="font-mono text-[10px]">traveler@email.com</p>
                      <p className="font-mono text-[10px]">+92 300 0000000</p>
                    </div>

                    <div className="flex gap-2">
                      {l.has_pending_payment ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow hover:from-amber-600 hover:to-amber-700 rounded-xl"
                            disabled={verifyPaymentMutation.isPending}
                            onClick={() => verifyPaymentMutation.mutate(l.id)}
                          >
                            {verifyPaymentMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RefreshCw className="size-4" />
                            )}
                            Confirm Payment &amp; Unlock
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl"
                            disabled={unlockMutation.isPending}
                            onClick={() => unlockMutation.mutate(l.id)}
                          >
                            {unlockMutation.isPending ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <ExternalLink className="size-3" />
                            )}
                            Restart Payment Checkout
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow hover:opacity-95 rounded-xl font-bold"
                          disabled={unlockMutation.isPending}
                          onClick={() => {
                            if (!isApproved) {
                              toast.error("Agency Verification Required", {
                                description: "Unverified accounts in Setup Mode cannot unlock traveler leads. Please submit your KYC on /vendor/kyc.",
                                action: {
                                  label: "Go to KYC",
                                  onClick: () => { window.location.href = "/vendor/kyc"; },
                                },
                              });
                              return;
                            }
                            unlockMutation.mutate(l.id);
                          }}
                        >
                          {unlockMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CreditCard className="size-4" />
                          )}
                          Unlock Contact — Rs 5,000
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quotation Modal Dialog */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Send className="size-5 text-amber-500" />
              Prepare Agency Quotation &amp; Itinerary
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct proposal for <strong>{selectedLeadForQuote?.contact_name}</strong> ({selectedLeadForQuote?.group_size} travelers to {selectedLeadForQuote?.destination}).
            </DialogDescription>
          </DialogHeader>

          {/* Quick Template Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1-Click Itinerary Templates
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 font-semibold hover:border-primary"
                onClick={() => applyQuoteTemplate("budget")}
              >
                🎒 Budget (₨ 220k)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 font-semibold hover:border-amber-500 border-amber-500/40 bg-amber-500/5 text-amber-300"
                onClick={() => applyQuoteTemplate("deluxe")}
              >
                ⭐ Deluxe (₨ 350k)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 font-semibold hover:border-purple-500"
                onClick={() => applyQuoteTemplate("vip")}
              >
                👑 VIP (₨ 650k)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 font-semibold hover:border-emerald-500"
                onClick={() => applyQuoteTemplate("umrah")}
              >
                🕋 Umrah (₨ 195k)
              </Button>
            </div>
          </div>

          <div className="grid gap-4 py-2 text-xs">
            {/* Price & Validity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Total Price per Person (PKR)</Label>
                <Input
                  type="text"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="350000"
                  className="font-mono text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Quote Validity (Days)</Label>
                <Input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="7"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Advance Required (%)</Label>
                <Input
                  type="number"
                  value={advanceDepositPercent}
                  onChange={(e) => setAdvanceDepositPercent(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            {/* Flight & Hotel */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Flight Plan &amp; Airline Details</Label>
              <Input
                value={flightDetails}
                onChange={(e) => setFlightDetails(e.target.value)}
                placeholder="Direct FlyDubai / Air Arabia (30kg Baggage)"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Accommodation &amp; Hotel Details</Label>
              <Input
                value={hotelDetails}
                onChange={(e) => setHotelDetails(e.target.value)}
                placeholder="4★ Premium City Center Hotel (Double Sharing with Breakfast)"
              />
            </div>

            {/* Itinerary */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Day-by-Day Itinerary Summary</Label>
              <Textarea
                rows={4}
                value={itinerarySummary}
                onChange={(e) => setItinerarySummary(e.target.value)}
                placeholder="Day 1: Arrival & Private Hotel Check-in..."
                className="text-xs font-mono"
              />
            </div>

            {/* Inclusions / Exclusions / Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Package Inclusions (comma-separated)</Label>
                <Input
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  placeholder="Return Flights, 4★ Hotel, Airport Transfers, Visa Help"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Exclusions (comma-separated)</Label>
                <Input
                  value={exclusionsInput}
                  onChange={(e) => setExclusionsInput(e.target.value)}
                  placeholder="Personal Expenses, Tips, Unspecified Meals"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Complimentary Bonus Perks</Label>
              <Input
                value={perksInput}
                onChange={(e) => setPerksInput(e.target.value)}
                placeholder="Free Tourist eSIM, Lounge Access, 24/7 Guide"
              />
            </div>

            {/* Terms */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Terms &amp; Payment Policies</Label>
              <Textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={quoteMutation.isPending}
              onClick={() => quoteMutation.mutate()}
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-600 hover:to-yellow-600 shadow"
            >
              {quoteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send Detailed Proposal to Traveler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
