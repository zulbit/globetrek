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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMarketplaceLeads,
  createLeadUnlockCheckout,
  verifyLeadUnlockPayment,
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
  const [mode, setMode] = useState<"direct" | "marketplace">("direct");
  const [tab, setTab] = useState<"all" | ServiceType>("all");

  // -------- Direct Leads Query --------
  const { data: directLeads = [], isLoading: directLoading } = useQuery({
    queryKey: ["vendor-leads-poly"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_phone, message, is_unlocked, created_at, service_type, service_id, tours(title)")
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
        toast.warning(res.message || "Payment status check completed but transaction is not paid.");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to verify payment status.");
    },
  });

  // Realtime subscription for direct leads
  useEffect(() => {
    let channel: any;
    async function initRealtime() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const vendorId = u.user.id;

      channel = supabase
        .channel(`leads-inbox-${vendorId}`)
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
            <TabsTrigger value="marketplace" className="px-4">
              👑 Custom Tour Requests
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mode 1: Direct Inquiries */}
      {mode === "direct" && (
        <div className="space-y-4">
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
    </div>
  );
}
