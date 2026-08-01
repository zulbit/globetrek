import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Globe2,
  FileCheck,
  Shield,
  Ticket,
  Calendar,
  Users,
  Compass,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMarketplaceLeads,
  createLeadUnlockCheckout,
  verifyLeadUnlockPayment,
  submitLeadQuote,
  type CustomTourLead,
} from "@/lib/custom-tour-leads.functions";

export const Route = createFileRoute("/_authenticated/vendor/leads")({
  component: VendorLeads,
});

type ServiceType = "tours" | "visa" | "insurance" | "tickets";

interface LeadRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string | null;
  is_unlocked: boolean;
  created_at: string;
  service_type: ServiceType;
  service_id: string;
  status: string;
  tours: { title: string } | null;
}

const SVC = {
  tours:     { label: "Tour",      icon: Globe2,    tone: "text-primary bg-primary/15" },
  visa:      { label: "Visa",      icon: FileCheck, tone: "text-sky-400 bg-sky-500/15" },
  insurance: { label: "Insurance", icon: Shield,    tone: "text-emerald-400 bg-emerald-500/15" },
  tickets:   { label: "Tickets",   icon: Ticket,    tone: "text-amber-400 bg-amber-500/15" },
} as const;

function VendorLeads() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"direct" | "marketplace">(() => {
    // Auto-switch to marketplace if navigated from the Overview promo card
    if (typeof window !== "undefined") {
      const intent = sessionStorage.getItem("leads-tab");
      if (intent === "marketplace") {
        sessionStorage.removeItem("leads-tab");
        return "marketplace";
      }
    }
    return "direct";
  });
  const [tab, setTab] = useState<"all" | ServiceType>("all");

  // -------- Direct Leads Query --------
  const { data: directLeads = [], isLoading: directLoading } = useQuery({
    queryKey: ["vendor-leads-poly"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("leads")
          .select("id, customer_name, customer_phone, message, is_unlocked, created_at, service_type, service_id, status, tours(title)")
        .eq("vendor_id", u.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeadRow[];
    },
    enabled: mode === "direct",
    refetchInterval: 5000,
  });

  // -------- Custom Tour Marketplace Leads Query --------
  const { data: marketplaceLeads = [], isLoading: marketplaceLoading } = useQuery({
    queryKey: ["vendor-leads-marketplace"],
    queryFn: () => getMarketplaceLeads(),
    enabled: mode === "marketplace",
    refetchInterval: 5000,
  });

  // -------- Unlock Lead Mutation --------
  const unlockMutation = useMutation({
    mutationFn: (leadId: string) => createLeadUnlockCheckout({ data: { leadId } }),
    onSuccess: (res) => {
      if (res.checkoutUrl) {
        toast.info("Redirecting to SafePay Sandbox for payment...");
        window.open(res.checkoutUrl, "_blank");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not start payment checkout.");
    },
  });

  // -------- Unlock Direct Lead Mutation (Consumes 1 Credit) --------
  const unlockDirectMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("unlock_lead", { _lead_id: leadId });
      if (error) throw error;
      await supabase.from("leads").update({ status: "contacted" }).eq("id", leadId);
      return data;
    },
    onSuccess: () => {
      toast.success("Lead unlocked successfully! 1 credit consumed.");
      qc.invalidateQueries({ queryKey: ["vendor-leads-poly"] });
      qc.invalidateQueries({ queryKey: ["vendor-overview"] });
      qc.invalidateQueries({ queryKey: ["vendor-billing"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not unlock lead.");
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
  const [quoteAmount, setQuoteAmount] = useState<string>("");
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

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadForQuote) return;
      const price = parseInt(quoteAmount.replace(/\D/g, ""), 10);
      const days = parseInt(validityDays.replace(/\D/g, "") || "7", 10);
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
          termsAndConditions,
          perks,
          advanceDepositPercent: parseInt(advanceDepositPercent || "30", 10),
        },
      });
    },
    onSuccess: () => {
      toast.success("Detailed quotation submitted successfully! Traveler notified via WhatsApp.");
      setQuoteModalOpen(false);
      setQuoteAmount("");
      setItinerarySummary("");
      qc.invalidateQueries({ queryKey: ["vendor-leads-marketplace"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit quotation.");
    },
  });

  // -------- Update Lead Status Mutation --------
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "contacted" | "converted" | "closed" }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead status updated successfully");
      qc.invalidateQueries({ queryKey: ["vendor-leads-poly"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  // -------- Quotation Template Functions --------
  const applyQuoteTemplate = (type: "deluxe" | "vip" | "budget" | "umrah") => {
    if (type === "deluxe") {
      setValidityDays("7");
      setAdvanceDepositPercent("30");
      setHotelDetails("4★ City Center Hotel (Double Sharing with Daily Breakfast)");
      setFlightDetails("FlyDubai / Air Arabia (20kg Check-in + 7kg Hand carry, Direct transfers)");
      setItinerarySummary("Day 1: Arrival & Private Airport Transfer to Hotel\nDay 2: Full Day City Tour & Historic Landmark Exploration\nDay 3: Excursion & Cultural Sightseeing\nDay 4: Free Shopping Day & Evening Transfer to Airport");
      setInclusionsInput("Return Flights, 4★ Hotel Stay, Airport Transfers, Visa Assistance, Daily Breakfast, Guided Sightseeing");
      setExclusionsInput("Personal Expenses, Driver Gratuities / Tips, Extra Unspecified Meals");
      setPerksInput("Free Tourist eSIM Card, Complimentary Airport Lounge Access");
      setTermsAndConditions("1. 30% advance deposit required to confirm booking.\n2. Balance payment due 7 days prior to departure.\n3. E-Visa approval is subject to official embassy clearance.\n4. 90% refund if cancelled 14+ days prior to travel.");
      toast.success("Loaded Deluxe 4★ Family Tour Template!");
    } else if (type === "vip") {
      setValidityDays("5");
      setAdvanceDepositPercent("40");
      setHotelDetails("5★ Grand Luxury Hotel (Executive Suite with Breakfast & Dinner)");
      setFlightDetails("Emirates / Qatar Airways (30kg Check-in + 7kg Hand luggage, Private Luxury SUV)");
      setItinerarySummary("Day 1: VIP Airport SUV Reception & Hotel Check-in\nDay 2: Private Guided Cultural Tour & Fine Dining\nDay 3: Yacht Excursion & Shopping Experience\nDay 4: Luxury Spa & Evening Airport SUV Transfer");
      setInclusionsInput("VIP Flights, 5★ Luxury Suite, Private Luxury SUV Transfers, Fast-track E-Visa, Half-Board Meals, Dedicated Guide");
      setExclusionsInput("Personal Shopping, Alcoholic Beverages");
      setPerksInput("VIP Airport Lounge, Dinner Cruise Ticket, Free Tourist eSIM");
      setTermsAndConditions("1. 40% advance deposit required.\n2. Remaining balance due 5 days prior to departure.\n3. Non-refundable within 48 hours of travel.");
      toast.success("Loaded VIP 5★ Luxury Package Template!");
    } else if (type === "umrah") {
      setValidityDays("7");
      setAdvanceDepositPercent("35");
      setHotelDetails("4★ Makkah Hotel (400m Clock Tower) & 4★ Madinah Hotel (Markaziah)");
      setFlightDetails("PIA / Saudi Arabian Airlines (30kg Baggage Allowance, AC Bus Transfers)");
      setItinerarySummary("Day 1: Jeddah Arrival & Transfer to Makkah Hotel for Umrah\nDay 2: Perform Umrah & Ibadaah\nDay 3: Makkah Ziyarat Tour\nDay 4: Transfer to Madinah Hotel\nDay 5: Madinah Ziyarat & Departure");
      setInclusionsInput("Return Flights, Umrah Visa, Makkah & Madinah Hotel Stay, Ziyarat Tours, AC Transport");
      setExclusionsInput("Personal Laundry, Extra Food outside Buffet");
      setPerksInput("Free Zamzam Water 5L, Complimentary Ihram / Prayer Mat");
      setTermsAndConditions("1. 35% advance deposit required.\n2. Passport valid for at least 6 months required.\n3. Umrah visa clearance subject to Saudi Ministry rules.");
      toast.success("Loaded Umrah Package Template!");
    } else {
      setValidityDays("10");
      setAdvanceDepositPercent("25");
      setHotelDetails("3★ Standard Hotel (Triple / Quad Sharing with Breakfast)");
      setFlightDetails("Economy Flights (20kg Check-in + 7kg Hand carry)");
      setItinerarySummary("Day 1: Arrival & Group Hotel Check-in\nDay 2: Group Sightseeing Tour\nDay 3: Free Exploration Day\nDay 4: Departure Transfer");
      setInclusionsInput("Economy Flights, 3★ Hotel, Group Bus Transfers, Tourist Visa, Daily Breakfast");
      setExclusionsInput("Personal Shopping, Lunch & Dinner, Driver Tips");
      setPerksInput("Free Group SIM Card");
      setTermsAndConditions("1. 25% advance deposit required.\n2. Balance due 10 days prior to departure.\n3. 80% refund if cancelled 14+ days prior.");
      toast.success("Loaded Budget Group Package Template!");
    }
  };

  const saveCustomAgencyTemplate = () => {
    const template = {
      validityDays,
      advanceDepositPercent,
      hotelDetails,
      flightDetails,
      inclusionsInput,
      exclusionsInput,
      perksInput,
      termsAndConditions,
    };
    localStorage.setItem("vendor-agency-quote-template", JSON.stringify(template));
    toast.success("Current layout saved as your Agency Default Template! 💾");
  };

  const loadCustomAgencyTemplate = () => {
    try {
      const raw = localStorage.getItem("vendor-agency-quote-template");
      if (!raw) {
        toast.info("No saved custom template found. Click 'Save Form as Template' first!");
        return;
      }
      const t = JSON.parse(raw);
      if (t.validityDays) setValidityDays(t.validityDays);
      if (t.advanceDepositPercent) setAdvanceDepositPercent(t.advanceDepositPercent);
      if (t.hotelDetails) setHotelDetails(t.hotelDetails);
      if (t.flightDetails) setFlightDetails(t.flightDetails);
      if (t.inclusionsInput) setInclusionsInput(t.inclusionsInput);
      if (t.exclusionsInput) setExclusionsInput(t.exclusionsInput);
      if (t.perksInput) setPerksInput(t.perksInput);
      if (t.termsAndConditions) setTermsAndConditions(t.termsAndConditions);
      toast.success("Loaded your Agency Default Template! ⚡");
    } catch {
      toast.error("Could not load custom template.");
    }
  };

  // Realtime subscription for direct leads
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function initRealtime() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const vendorId = u.user.id;
      const channelName = `leads-inbox-${vendorId}`;

      // Remove any stale channel with the same name before subscribing
      const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
      if (existing) await supabase.removeChannel(existing);

      if (cancelled) return;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "leads",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload: any) => {
            const lead = payload.new;
            toast.success(`🎉 New Direct Inquiry Received!`, {
              description: `New lead from ${lead.customer_name || "Customer"}`,
              duration: 10000,
            });
            qc.invalidateQueries({ queryKey: ["vendor-leads-poly"] });
          }
        )
        .subscribe();
    }

    initRealtime();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  // Filters and counts for Direct tab
  const filteredDirect = useMemo(() => {
    return tab === "all" ? directLeads : directLeads.filter((l) => l.service_type === tab);
  }, [directLeads, tab]);

  const directCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0, tours: 0, visa: 0, insurance: 0, tickets: 0 };
    directLeads.forEach((l) => {
      c.all++;
      c[l.service_type ?? "tours"] = (c[l.service_type ?? "tours"] ?? 0) + 1;
    });
    return c;
  }, [directLeads]);

  function waLink(phone: string, subject: string) {
    const digits = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hi! Following up about your GlobeTrek inquiry regarding ${subject}.`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Manage your direct customer inquiries or purchase custom package leads.
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-fit">
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="direct" className="px-4">
              Direct Inquiries
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              className="relative px-4 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
            >
              {/* Ambient glow when inactive */}
              <span className="absolute inset-0 rounded-md ring-1 ring-amber-400/0 transition-all duration-300 data-[state=inactive]:ring-amber-400/30" />
              <span className="flex items-center gap-1.5">
                {/* Animated pulse dot */}
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
                </span>
                <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text font-semibold text-transparent">
                  Custom Tour Requests
                </span>
                {/* Live count badge */}
                {marketplaceLeads.length > 0 && (
                  <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow shadow-amber-500/40">
                    {marketplaceLeads.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mode 1: Direct Inquiries */}
      {mode === "direct" && (
        <div className="space-y-4">
          {/* Premium marketplace teaser — shown only when there are available leads */}
          {marketplaceLeads.length > 0 && (
            <div
              className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-4 transition-all hover:border-amber-400/50 hover:from-amber-500/15"
              onClick={() => setMode("marketplace")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setMode("marketplace")}
            >
              <div className="absolute -right-6 -top-6 size-24 rounded-full bg-amber-400/10 blur-2xl transition-all group-hover:bg-amber-400/20" />
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-400" />
              </span>
              <div className="relative min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-300">
                  👑 {marketplaceLeads.length} Custom Tour {marketplaceLeads.length === 1 ? "Lead" : "Leads"} Available in the Marketplace
                </p>
                <p className="text-xs text-muted-foreground">
                  Pre-qualified group travelers looking for custom packages — unlock contact for ₨ 5,000
                </p>
              </div>
              <span className="relative flex-shrink-0 text-xs font-semibold text-amber-400 underline-offset-2 hover:underline">
                View Leads →
              </span>
            </div>
          )}
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="all">All · {directCounts.all ?? 0}</TabsTrigger>
              <TabsTrigger value="tours">Tours · {directCounts.tours ?? 0}</TabsTrigger>
              <TabsTrigger value="visa">Visa · {directCounts.visa ?? 0}</TabsTrigger>
              <TabsTrigger value="insurance">Insurance · {directCounts.insurance ?? 0}</TabsTrigger>
              <TabsTrigger value="tickets">Tickets · {directCounts.tickets ?? 0}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[110px_1.2fr_1fr_1.1fr_auto] gap-4 border-b border-border bg-surface/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Service</div>
              <div>Customer</div>
              <div>Subject</div>
              <div>Phone</div>
              <div className="text-right">Action</div>
            </div>

            {directLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
              </div>
            ) : filteredDirect.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No direct leads yet in this category.
              </div>
            ) : (
              filteredDirect.map((l) => {
                const meta = SVC[l.service_type ?? "tours"];
                const Icon = meta.icon;
                const subject = l.tours?.title ?? `${meta.label} inquiry`;
                return (
                  <div
                    key={l.id}
                    className="grid grid-cols-[110px_1.2fr_1fr_1.1fr_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0 hover:bg-surface/20"
                  >
                    <Badge variant="outline" className={`w-fit rounded-full border-transparent ${meta.tone}`}>
                      <Icon className="mr-1 size-3" /> {meta.label}
                    </Badge>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{l.customer_name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString()} · {l.message || "No message"}
                      </div>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{subject}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {l.is_unlocked ? l.customer_phone : "+92 3•• •••• •••"}
                    </div>
                    <div className="flex justify-end gap-2">
                      {l.is_unlocked ? (
                        <>
                          <Select
                            value={l.status || "contacted"}
                            onValueChange={(val) =>
                              updateStatusMutation.mutate({ id: l.id, status: val as any })
                            }
                          >
                            <SelectTrigger className="h-8 w-28 text-xs bg-surface border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contacted">📞 Contacted</SelectItem>
                              <SelectItem value="converted">✅ Converted</SelectItem>
                              <SelectItem value="closed">❌ Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <a
                            href={`tel:${l.customer_phone}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface/70"
                          >
                            <Phone className="size-3.5" /> Call
                          </a>
                          <a
                            href={waLink(l.customer_phone, subject)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/25"
                          >
                            <MessageCircle className="size-3.5" /> WhatsApp
                          </a>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 text-xs py-1 h-8"
                          disabled={unlockDirectMutation.isPending}
                          onClick={() => unlockDirectMutation.mutate(l.id)}
                        >
                          {unlockDirectMutation.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Lock className="size-3" />
                          )}
                          Unlock (1 Credit)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Custom Tour Requests Marketplace */}
      {mode === "marketplace" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
            <p className="text-xs text-primary font-medium flex items-center gap-2">
              <Sparkles className="size-4" />
              Paid Lead Marketplace: Unlock any custom group lead's contact information instantly for ₨ 5,000.
            </p>
          </div>

          {marketplaceLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading marketplace...
            </div>
          ) : marketplaceLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
              No custom tour requests available in the marketplace right now. Check back later!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {marketplaceLeads.map((l: CustomTourLead) => (
                <div
                  key={l.id}
                  className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 bg-card ${
                    l.is_unlocked
                      ? "border-primary/30 shadow-primary/5 hover:border-primary/50"
                      : "border-border hover:border-border-hover hover:shadow-md"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">
                        ✈️ {l.departure_city} → {l.destination}
                      </span>
                      <h3 className="font-semibold text-base capitalize">
                        Custom tour to {l.destination}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submitted {new Date(l.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge variant={l.is_unlocked ? "default" : "outline"} className="rounded-full">
                      {l.is_unlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>

                  {/* Requirements details */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-border pt-3 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5 text-primary" />
                      <span>Month: <strong className="text-foreground capitalize">{l.travel_month}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5 text-primary" />
                      <span>Group: <strong className="text-foreground capitalize">{l.group_size} ({l.group_type})</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Compass className="size-3.5 text-primary" />
                      <span>Duration: <strong className="text-foreground">{l.duration_days} Days</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="size-3.5 text-primary" />
                      <span>Hotel Tier: <strong className="text-foreground capitalize">{l.hotel_tier.replace("star", " ★")}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <Layers className="size-3.5 text-primary" />
                      <span>Includes: <strong className="text-foreground capitalize">{[
                        l.flight_class ? `${l.flight_class} flight` : null,
                        l.visa_needed ? "Visa help" : null,
                        l.insurance_needed ? "Insurance" : null,
                      ].filter(Boolean).join(", ") || "Custom"}</strong></span>
                    </div>
                  </div>

                  {/* Special requests block */}
                  {l.special_requests && (
                    <div className="bg-surface/50 border border-border/60 rounded-xl p-3 mb-4 text-xs italic text-muted-foreground">
                      "{l.special_requests}"
                    </div>
                  )}

                  {/* Bottom Panel (Unlocked details vs Lock Screen) */}
                  <div className="border-t border-border pt-4 mt-2">
                    {l.is_unlocked ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1 rounded-xl bg-primary/5 p-3">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                            Traveler Information
                          </p>
                          <p className="text-sm font-semibold text-foreground">{l.contact_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{l.contact_email}</p>
                          <p className="text-xs text-muted-foreground font-mono font-bold mt-1">{l.contact_phone}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <a
                              href={`tel:${l.contact_phone}`}
                              className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-xs font-semibold hover:bg-surface/70"
                            >
                              <Phone className="size-3.5" /> Call Client
                            </a>
                            <a
                              href={waLink(l.contact_phone!, `Custom Tour to ${l.destination}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary py-2 text-xs font-semibold hover:bg-primary/20"
                            >
                              <MessageCircle className="size-3.5" /> WhatsApp
                            </a>
                          </div>

                          <Button
                            size="sm"
                            className="w-full gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-600 hover:to-yellow-600 shadow"
                            onClick={() => {
                              setSelectedLeadForQuote(l);
                              setQuoteModalOpen(true);
                            }}
                          >
                            <Send className="size-3.5" /> Submit Online Quotation
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Blur placeholder */}
                        <div className="flex flex-col gap-1 rounded-xl bg-surface p-3 filter blur-xs select-none pointer-events-none opacity-40">
                          <p className="text-[10px] font-semibold uppercase tracking-wider">
                            Traveler Information
                          </p>
                          <p className="text-sm font-semibold">🔒 Contact Name</p>
                          <p className="text-xs font-mono">contact@email.com</p>
                          <p className="text-xs font-mono">+92 300 0000000</p>
                        </div>

                        <div className="flex gap-2">
                          {l.has_pending_payment ? (
                            // Payment was initiated but not yet verified — only show Verify
                            <Button
                              className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow hover:from-amber-600 hover:to-amber-700"
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
                          ) : (
                            <>
                              <Button
                                className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-primary text-white shadow-glow hover:from-amber-600 hover:to-primary/90"
                                disabled={unlockMutation.isPending}
                                onClick={() => unlockMutation.mutate(l.id)}
                              >
                                {unlockMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Lock className="size-4" />
                                )}
                                Unlock Lead Info — ₨ 5,000
                              </Button>
                              <Button
                                variant="outline"
                                className="border-primary/20 hover:bg-primary/5 hover:text-primary gap-1.5"
                                disabled={verifyPaymentMutation.isPending}
                                onClick={() => verifyPaymentMutation.mutate(l.id)}
                                title="Verify if you have already completed payment"
                              >
                                {verifyPaymentMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="size-4" />
                                )}
                                Verify Payment
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------- Detailed Submit Quotation Modal -------- */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <span>✈️ Submit Detailed Online Quotation</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit your detailed, competitive proposal for {selectedLeadForQuote?.destination} ({selectedLeadForQuote?.group_size} travelers, {selectedLeadForQuote?.duration_days} days).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Quick Quotation Preset Templates Bar */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> One-Click Quotation Templates:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadCustomAgencyTemplate}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    ⚡ Load Agency Default
                  </button>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={saveCustomAgencyTemplate}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    💾 Save Form as Default
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyQuoteTemplate("deluxe")}
                  className="rounded-xl border border-border/80 bg-card hover:bg-amber-500/20 hover:border-amber-500/40 px-2.5 py-1 text-[10px] font-semibold text-foreground transition-all"
                >
                  🌟 Deluxe 4★ Family Tour
                </button>
                <button
                  type="button"
                  onClick={() => applyQuoteTemplate("vip")}
                  className="rounded-xl border border-border/80 bg-card hover:bg-purple-500/20 hover:border-purple-500/40 px-2.5 py-1 text-[10px] font-semibold text-foreground transition-all"
                >
                  🏆 VIP 5★ Luxury Package
                </button>
                <button
                  type="button"
                  onClick={() => applyQuoteTemplate("umrah")}
                  className="rounded-xl border border-border/80 bg-card hover:bg-emerald-500/20 hover:border-emerald-500/40 px-2.5 py-1 text-[10px] font-semibold text-foreground transition-all"
                >
                  🕋 Umrah / Group Package
                </button>
                <button
                  type="button"
                  onClick={() => applyQuoteTemplate("budget")}
                  className="rounded-xl border border-border/80 bg-card hover:bg-sky-500/20 hover:border-sky-500/40 px-2.5 py-1 text-[10px] font-semibold text-foreground transition-all"
                >
                  🎒 Budget Friends Group
                </button>
              </div>
            </div>

            {/* 1. Price, Validity & Advance Deposit */}
            <div className="grid gap-3 sm:grid-cols-3 bg-surface/50 p-3.5 rounded-2xl border border-border/80">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Total Package Price (PKR)*</label>
                <Input
                  placeholder="e.g. 350000"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Quote Validity (Days)*</label>
                <Input
                  placeholder="e.g. 7"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Advance Deposit %</label>
                <Input
                  placeholder="e.g. 30"
                  value={advanceDepositPercent}
                  onChange={(e) => setAdvanceDepositPercent(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-card"
                />
              </div>
            </div>

            {/* 2. Hotel & Flight Details */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">🏨 Hotel &amp; Accommodation Details</label>
                <Textarea
                  placeholder="Specific hotel names, star tier, room sharing &amp; meal plan..."
                  rows={2}
                  value={hotelDetails}
                  onChange={(e) => setHotelDetails(e.target.value)}
                  className="text-xs rounded-xl bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">✈️ Flight &amp; Transit Details</label>
                <Textarea
                  placeholder="Airline name, flight route, baggage allowance &amp; transfers..."
                  rows={2}
                  value={flightDetails}
                  onChange={(e) => setFlightDetails(e.target.value)}
                  className="text-xs rounded-xl bg-card"
                />
              </div>
            </div>

            {/* 3. Day-by-Day Itinerary Highlights */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">📅 Day-by-Day Itinerary &amp; Sightseeing Highlights*</label>
              <Textarea
                placeholder="Day 1: Arrival &amp; Transfer to Hotel&#10;Day 2: City Tour &amp; Key Landmarks&#10;Day 3: Excursion &amp; Shopping..."
                rows={4}
                value={itinerarySummary}
                onChange={(e) => setItinerarySummary(e.target.value)}
                className="text-xs rounded-xl bg-card"
              />
            </div>

            {/* 4. Inclusions & Exclusions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">✅ Included Services (comma separated)</label>
                <Input
                  placeholder="Flights, Hotel, Transfers, Visa, Breakfast..."
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  className="text-xs rounded-xl bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">❌ Excluded Services (comma separated)</label>
                <Input
                  placeholder="Personal Expenses, Driver Tips, Extra Meals..."
                  value={exclusionsInput}
                  onChange={(e) => setExclusionsInput(e.target.value)}
                  className="text-xs rounded-xl bg-card"
                />
              </div>
            </div>

            {/* 5. Free Perks */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">🎁 Complimentary Perks / Extras (comma separated)</label>
              <Input
                placeholder="Free Tourist SIM, Free Dinner Cruise, Airport Lounge Access..."
                value={perksInput}
                onChange={(e) => setPerksInput(e.target.value)}
                className="text-xs rounded-xl bg-card"
              />
            </div>

            {/* 6. Editable Sample Terms & Conditions */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">📝 Quotation Terms &amp; Conditions (Editable)</label>
              <Textarea
                rows={4}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="text-[11px] font-mono rounded-xl bg-card border-border"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Pre-filled with standard agency terms. Edit any clause as needed.</p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setQuoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 rounded-xl"
              disabled={quoteMutation.isPending || !quoteAmount || !itinerarySummary}
              onClick={() => quoteMutation.mutate()}
            >
              {quoteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
              Send Detailed Proposal to Traveler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
