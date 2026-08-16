import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Zap, Wand2, Globe2, FileCheck, Shield, Ticket,
  TrendingUp, Users, CreditCard, ArrowUpRight, Plus, Inbox,
  Clock, ChevronRight, BarChart2, BellRing, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradeModal } from "@/components/upgrade-modal";

import { useServerFn } from "@tanstack/react-start";
import { getVendorKYCDetails } from "@/lib/kyc.functions";

export const Route = createFileRoute("/_authenticated/vendor/")({
  component: VendorOverview,
});

type Tier = "free" | "starter" | "pro" | "agency";

const AI_LIMITS: Record<Tier, { description: number | null; plan: number | null }> = {
  free: { description: 0, plan: 0 },
  starter: { description: 10, plan: 0 },
  pro: { description: null, plan: 50 },
  agency: { description: null, plan: null },
};

/* ─── Service Config ──────────────────────────────── */
const SERVICES = [
  {
    key: "tours" as const,
    label: "Tour Packages",
    icon: Globe2,
    gradient: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    link: "/vendor/tours",
    addLabel: "Add Tour",
  },
  {
    key: "visa" as const,
    label: "Visa Services",
    icon: FileCheck,
    gradient: "from-sky-500/20 to-blue-500/10",
    border: "border-sky-500/30",
    accent: "text-sky-400",
    iconBg: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    link: "/vendor/visa",
    addLabel: "Add Visa",
  },
  {
    key: "insurance" as const,
    label: "Insurance Plans",
    icon: Shield,
    gradient: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/30",
    accent: "text-violet-400",
    iconBg: "bg-violet-500/15 text-violet-400 ring-violet-500/30",
    link: "/vendor/insurance",
    addLabel: "Add Plan",
  },
  {
    key: "tickets" as const,
    label: "Ticketing",
    icon: Ticket,
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/30",
    accent: "text-amber-400",
    iconBg: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    link: "/vendor/tickets",
    addLabel: "Add Service",
  },
];

interface RecentLead {
  id: string;
  customer_name: string;
  service_type: string;
  created_at: string;
  is_unlocked: boolean;
}

/* ─── Component ───────────────────────────────────── */
function VendorOverview() {
  const queryClient = useQueryClient();
  const getKycFn = useServerFn(getVendorKYCDetails);

  const { data } = useQuery({
    queryKey: ["vendor-overview"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user!.id;
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const [tours, visas, insurance, tickets, leads, profile, usage, chartLeadsRes, customPurchasesRes, kycData] = await Promise.all([
        supabase.from("tours").select("id,is_active").eq("vendor_id", uid),
        supabase.from("visa_services").select("id,is_active").eq("vendor_id", uid),
        supabase.from("insurance_plans").select("id,is_active").eq("vendor_id", uid),
        supabase.from("ticket_services").select("id,is_active").eq("vendor_id", uid),
        supabase.from("leads").select("id,is_unlocked,service_type,customer_name,created_at").eq("vendor_id", uid).order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("lead_credits_balance,subscription_tier,vendor_status,company_name,full_name").eq("id", uid).maybeSingle(),
        supabase.from("ai_usage_events").select("kind").eq("user_id", uid).gte("created_at", monthStart.toISOString()),
        supabase.from("leads").select("service_type,created_at").eq("vendor_id", uid).gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("vendor_lead_purchases").select("purchased_at").eq("vendor_id", uid).gte("purchased_at", thirtyDaysAgo.toISOString()),
        getKycFn({ data: { userId: uid } }).catch(() => null),
      ]);

      const allLeads = leads.data ?? [];
      const customPurchases = customPurchasesRes.data ?? [];
      const totalCustomLeads = customPurchases.length;

      const leadsByType: Record<string, number> = { tours: 0, visa: 0, insurance: 0, tickets: 0, customLeads: totalCustomLeads };
      allLeads.forEach((l) => { leadsByType[l.service_type ?? "tours"] = (leadsByType[l.service_type ?? "tours"] ?? 0) + 1; });

      // Build 30-day chart data
      const chartRaw = chartLeadsRes.data ?? [];
      const dayMap: Record<string, Record<string, number>> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        dayMap[key] = { tours: 0, visa: 0, insurance: 0, tickets: 0, customLeads: 0 };
      }
      chartRaw.forEach((l: any) => {
        const key = new Date(l.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        if (dayMap[key] && l.service_type) {
          dayMap[key][l.service_type] = (dayMap[key][l.service_type] ?? 0) + 1;
        }
      });
      // Map purchased custom leads onto chart dates
      customPurchases.forEach((cp: any) => {
        const key = new Date(cp.purchased_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        if (dayMap[key]) {
          dayMap[key].customLeads = (dayMap[key].customLeads ?? 0) + 1;
        }
      });

      const chartData = Object.entries(dayMap).map(([date, counts]) => ({ date, ...counts }));

      const events = (usage.data ?? []) as { kind: "description" | "plan" }[];

      return {
        services: {
          tours: { active: (tours.data ?? []).filter((t) => t.is_active).length, total: tours.data?.length ?? 0 },
          visa: { active: (visas.data ?? []).filter((t) => t.is_active).length, total: visas.data?.length ?? 0 },
          insurance: { active: (insurance.data ?? []).filter((t) => t.is_active).length, total: insurance.data?.length ?? 0 },
          tickets: { active: (tickets.data ?? []).filter((t) => t.is_active).length, total: tickets.data?.length ?? 0 },
        },
        totalCustomLeads,
        totalLeads: allLeads.length + totalCustomLeads,
        unlockedLeads: allLeads.filter((l) => l.is_unlocked).length + totalCustomLeads,
        leadsByType,
        recentLeads: allLeads.slice(0, 5) as RecentLead[],
        credits: profile.data?.lead_credits_balance ?? 0,
        tier: (profile.data?.subscription_tier ?? "free") as Tier,
        vendorStatus: profile.data?.vendor_status ?? "pending",
        companyName: profile.data?.company_name ?? "",
        kycRecord: kycData,
        aiDescriptions: events.filter((e) => e.kind === "description").length,
        aiPlans: events.filter((e) => e.kind === "plan").length,
        chartData,
      };
    },
    refetchInterval: 3000,
  });

  // Audible Chime Sound generator (using Web Audio API for 100% reliability and zero fetch dependency)
  function playChime() {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1 (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Tone 2 (A5) slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn("Chime audio playback error:", err);
    }
  }

  const prevLockedCountRef = useRef<number | null>(null);
  const lockedLeadsCount = data ? data.totalLeads - data.unlockedLeads : 0;

  // Sound alert on new lead receipt
  useEffect(() => {
    if (data) {
      if (prevLockedCountRef.current !== null && lockedLeadsCount > prevLockedCountRef.current) {
        playChime();
      }
      prevLockedCountRef.current = lockedLeadsCount;
    }
  }, [lockedLeadsCount, data]);

  // Supabase Realtime Subscription
  useEffect(() => {
    let channel: any;
    async function initRealtime() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const vendorId = u.user.id;
      channel = supabase
        .channel(`overview-leads-${vendorId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads", filter: `vendor_id=eq.${vendorId}` }, (payload: any) => {
          const lead = payload.new;
          const svc = (lead.service_type || "Service").toUpperCase();
          playChime();
          toast.success(`🎉 New ${svc} Inquiry Received!`, {
            description: `${lead.customer_name || "Customer"} (${lead.customer_phone || "Phone"}) left an inquiry!`,
            duration: 10000,
            action: { label: "View Inbox", onClick: () => window.location.href = "/vendor/leads" },
          });
          queryClient.invalidateQueries({ queryKey: ["vendor-overview"] });
          queryClient.invalidateQueries({ queryKey: ["vendor-leads-poly"] });
        })
        .subscribe();
    }
    initRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [queryClient]);

  const isPro = data?.tier === "pro";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const tier: Tier = data?.tier ?? "free";
  const limits = AI_LIMITS[tier];
  const conversionRate = data && data.totalLeads > 0
    ? Math.round((data.unlockedLeads / data.totalLeads) * 100)
    : 0;

  const isApproved = data?.vendorStatus === "approved" || data?.kycRecord?.status === "approved";
  const isKycSubmitted = !isApproved && (data?.kycRecord?.status === "submitted" || !!data?.kycRecord?.isSubmitted);

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} recommend="pro" />

      {/* ── Agency Onboarding & KYC Progress Card ── */}
      {!isApproved && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <FileCheck className="size-4" /> Agency Onboarding Progress
              </div>
              <h2 className="text-xl font-black text-foreground tracking-tight">
                Complete Setup to Activate Live Marketplace
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Your agency account is in Setup Mode. Prepare your tour drafts now — complete verification to unlock live publishing and traveler inquiries.
              </p>
            </div>

            <Button asChild size="sm" className="bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs rounded-xl px-4 shrink-0 gap-1.5 shadow-md">
              <Link to="/vendor/kyc">
                {isKycSubmitted ? "View Verification Details" : "Submit KYC Documents"} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            {/* Step 1 */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Step 1</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">Done</span>
              </div>
              <p className="font-bold text-foreground">Agency Account</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Registered &amp; authorized</p>
            </div>

            {/* Step 2 */}
            <div className={`rounded-xl border p-3.5 space-y-1.5 ${
              isKycSubmitted
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-amber-500/40 bg-amber-500/10 animate-pulse"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">Step 2</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isKycSubmitted
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/30 text-amber-300"
                }`}>
                  {isKycSubmitted ? "Submitted" : "Action Required"}
                </span>
              </div>
              <p className="font-bold text-foreground">DTS &amp; NTN Credentials</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {isKycSubmitted ? "KYC details provided" : "Submit license for approval"}
              </p>
            </div>

            {/* Step 3 */}
            <div className={`rounded-xl border p-3.5 space-y-1.5 ${
              isKycSubmitted
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-border bg-surface/50 opacity-70"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider">Step 3</span>
                <span className="rounded-full bg-surface text-muted-foreground px-1.5 py-0.5 text-[10px] font-bold">
                  {isKycSubmitted ? "Under Review" : "Pending Step 2"}
                </span>
              </div>
              <p className="font-bold text-foreground">Admin Verification</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {isKycSubmitted ? "24h verification SLA" : "Starts after KYC submission"}
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-border bg-surface/50 opacity-70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider">Step 4</span>
                <span className="rounded-full bg-surface text-muted-foreground px-1.5 py-0.5 text-[10px] font-bold">Locked</span>
              </div>
              <p className="font-bold text-foreground">Marketplace Live</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Publish tours &amp; unlock leads</p>
            </div>
          </div>
        </div>
      )}

      {/* ── New Lead Waiting Alert ── */}
      {lockedLeadsCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-amber-500/10 blur-2xl animate-pulse" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 shrink-0">
                <BellRing className="size-5 animate-bounce" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  New Customer Inquiry Awaiting Unlock!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  You have <strong className="text-foreground font-semibold">{lockedLeadsCount}</strong> new travel lead{lockedLeadsCount === 1 ? "" : "s"} waiting. Claim now to unlock traveler contact details and submit your quotation.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                window.location.href = "/vendor/leads";
              }}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold shrink-0 shadow-sm"
            >
              Open Leads Inbox <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Upgrade Banner ── */}
      {!isPro && (
        <div className="relative overflow-hidden rounded-2xl border border-highlight/30 bg-gradient-to-r from-highlight/15 via-primary/10 to-transparent p-5">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-highlight/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-highlight/20 text-highlight ring-1 ring-highlight/40">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Upgrade to Tour Operator for ₨ 7,500 / month</h3>
              <p className="text-xs text-muted-foreground">
                100 monthly lead credits, interactive OSM map &amp; flight paths, unlimited tour listings, and verified badge.
              </p>
            </div>
            <Button onClick={() => setUpgradeOpen(true)} className="bg-highlight text-black hover:bg-highlight/90 font-bold">
              <Zap className="mr-2 size-4" /> Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* ── Summary Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Users}
          label="Total Leads"
          value={data?.totalLeads ?? 0}
          subtitle={`${data?.unlockedLeads ?? 0} unlocked`}
          iconBg="bg-primary/15 text-primary ring-primary/30"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Unlocked / Total"
          iconBg="bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
        />
        <div className="group relative overflow-hidden rounded-2xl border border-highlight/40 bg-gradient-to-br from-highlight/10 via-card to-card p-5 shadow-card transition-all duration-300 hover:shadow-lg hover:shadow-highlight/5">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-highlight/10 blur-2xl transition-all duration-500 group-hover:bg-highlight/20" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-highlight/20 text-highlight ring-1 ring-highlight/40">
                <CreditCard className="size-4" />
              </span>
              <span className="text-[11px] uppercase tracking-wider text-highlight/90">Lead Credits</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-highlight">
                {isPro ? "∞" : (data?.credits ?? 0)}
              </span>
              {isPro && (
                <Badge variant="outline" className="border-highlight/40 bg-highlight/20 text-[10px] font-semibold uppercase text-highlight">Pro</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPro ? "Unlimited unlocks on your Pro plan." : "1 credit unlocks 1 customer contact."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Custom Tour Leads Marketplace Promo ── */}
      <Link
        to="/vendor/leads"
        search={{} as any}
        className="group block"
        onClick={() => {
          // Store intent to open marketplace tab
          sessionStorage.setItem("leads-tab", "marketplace");
        }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/8 to-transparent p-5 transition-all duration-300 hover:border-amber-400/60 hover:from-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10">
          {/* Ambient glows */}
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-amber-400/10 blur-3xl transition-all duration-500 group-hover:bg-amber-400/20" />
          <div className="absolute -bottom-8 left-1/3 size-32 rounded-full bg-yellow-500/5 blur-2xl" />

          <div className="relative flex flex-wrap items-center gap-4">
            {/* Icon with pulse */}
            <span className="relative grid size-12 flex-shrink-0 place-items-center rounded-xl bg-amber-500/20 text-2xl ring-1 ring-amber-400/40">
              👑
              <span className="absolute -right-1 -top-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-400" />
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-sm font-bold text-transparent">
                  Custom Tour Leads Marketplace
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                  Premium
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pre-qualified group travelers actively requesting custom tour packages — unlock their contact for ₨ 5,000 per lead.
              </p>
            </div>

            <span className="flex-shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow shadow-amber-500/30 transition-all group-hover:bg-amber-400 group-hover:shadow-amber-400/40">
              View Leads →
            </span>
          </div>
        </div>
      </Link>

      {/* ── Service Portfolio Grid ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Services</h2>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((svc) => {
            const Icon = svc.icon;
            const stats = data?.services[svc.key];
            const leads = data?.leadsByType[svc.key] ?? 0;
            return (
              <div
                key={svc.key}
                className={`group relative overflow-hidden rounded-2xl border ${svc.border} bg-gradient-to-br ${svc.gradient} to-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {/* Decorative glow */}
                <div className="absolute -right-4 -top-4 size-20 rounded-full bg-current opacity-5 blur-2xl transition-all duration-500 group-hover:opacity-10" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className={`grid size-10 place-items-center rounded-xl ring-1 ${svc.iconBg}`}>
                      <Icon className="size-5" />
                    </span>
                    <Link to={svc.link} className={`inline-flex items-center gap-0.5 text-xs font-medium ${svc.accent} opacity-0 transition-opacity group-hover:opacity-100`}>
                      Manage <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{svc.label}</h3>
                  <div className="mt-2 flex items-baseline gap-3">
                    <div>
                      <span className={`text-2xl font-bold tabular-nums ${svc.accent}`}>{stats?.active ?? 0}</span>
                      <span className="ml-1 text-xs text-muted-foreground">active</span>
                    </div>
                    {(stats?.total ?? 0) > (stats?.active ?? 0) && (
                      <span className="text-xs text-muted-foreground">/ {stats?.total} total</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">{leads} lead{leads !== 1 ? "s" : ""}</span>
                    <Link to={svc.link}>
                      <Button size="sm" variant="ghost" className={`h-7 gap-1 px-2 text-xs ${svc.accent} hover:bg-current/10`}>
                        <Plus className="size-3" /> {svc.addLabel}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lead Activity Chart ── */}
      {(() => {
        const SERVICE_LINES = [
          { key: "tours",       label: "Tour Packages",          color: "#10b981" },
          { key: "customLeads", label: "Purchased Custom Leads", color: "#f43f5e" },
          { key: "visa",        label: "Visa Services",          color: "#0ea5e9" },
          { key: "insurance",   label: "Insurance",              color: "#8b5cf6" },
          { key: "tickets",     label: "Ticketing",              color: "#f59e0b" },
        ] as const;
        // Only show lines for services the vendor actually has configured or custom leads purchased
        const activeLines = SERVICE_LINES.filter((s) => {
          if (s.key === "customLeads") {
            return (data?.totalCustomLeads ?? 0) > 0;
          }
          return (data?.services[s.key]?.total ?? 0) > 0;
        });
        if (!data?.chartData || activeLines.length === 0) return null;
        return (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <BarChart2 className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Lead Activity</h3>
                  <p className="text-[11px] text-muted-foreground">Last 30 days · by service</p>
                </div>
              </div>
              {/* Legend */}
              <div className="hidden items-center gap-4 sm:flex">
                {activeLines.map((l) => (
                  <span key={l.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(data.chartData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                />
                {activeLines.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.label}
                    stroke={l.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ── Two-Column: Recent Activity + AI Usage ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                <Inbox className="size-4" />
              </span>
              <h3 className="text-sm font-semibold">Recent Activity</h3>
            </div>
            <Link
              to="/vendor/leads"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("leads-tab", "marketplace");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View All <ChevronRight className="size-3" />
            </Link>
          </div>

          {!data?.recentLeads?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-surface">
                <Inbox className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No inquiries yet</p>
              <p className="text-xs text-muted-foreground/70">Leads from travelers will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.recentLeads.map((lead, i) => {
                const svcMeta = SERVICES.find((s) => s.key === lead.service_type) ?? SERVICES[0];
                const LeadIcon = svcMeta.icon;
                const timeAgo = getTimeAgo(lead.created_at);
                return (
                  <Link
                    key={lead.id}
                    to="/vendor/leads"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface/80"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${svcMeta.iconBg}`}>
                      <LeadIcon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{lead.customer_name}</span>
                        {!lead.is_unlocked && (
                          <Badge variant="outline" className="h-4 shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 text-[9px] text-amber-400">NEW</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{svcMeta.label} inquiry</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {timeAgo}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Usage */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                <Wand2 className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">AI Usage this month</h3>
                <p className="text-xs text-muted-foreground capitalize">{tier} plan</p>
              </div>
            </div>
            {tier !== "agency" && (
              <Button size="sm" variant="outline" onClick={() => setUpgradeOpen(true)} className="border-primary/30 text-primary hover:bg-primary/10">
                Upgrade
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageMeter label="AI short descriptions" used={data?.aiDescriptions ?? 0} limit={limits.description} />
            <UsageMeter label="AI full-trip plans" used={data?.aiPlans ?? 0} limit={limits.plan} />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Resets on the 1st of each month. Usage is counted per successful AI generation.
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-3 text-sm font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/vendor/tours">
            <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              <Globe2 className="size-3.5" /> Add Tour Package
            </Button>
          </Link>
          <Link to="/vendor/visa">
            <Button variant="outline" size="sm" className="gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
              <FileCheck className="size-3.5" /> Add Visa Service
            </Button>
          </Link>
          <Link to="/vendor/insurance">
            <Button variant="outline" size="sm" className="gap-1.5 border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
              <Shield className="size-3.5" /> Add Insurance Plan
            </Button>
          </Link>
          <Link to="/vendor/tickets">
            <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <Ticket className="size-3.5" /> Add Ticketing
            </Button>
          </Link>
          <Link to="/vendor/leads">
            <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <Inbox className="size-3.5" /> View All Leads
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary Card ────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, subtitle, iconBg }: {
  icon: any; label: string; value: string | number; subtitle: string; iconBg: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-lg">
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className={`grid size-8 place-items-center rounded-lg ring-1 ${iconBg}`}>
            <Icon className="size-4" />
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Usage Meter ─────────────────────────────────── */
function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null;
  const disabled = limit === 0;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const nearLimit = !unlimited && !disabled && used / limit >= 0.8;
  const barColor = disabled ? "bg-muted-foreground/40" : unlimited ? "bg-highlight" : nearLimit ? "bg-highlight" : "bg-primary";

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {unlimited ? (
            <>{used} <span className="text-xs text-muted-foreground">/ ∞</span></>
          ) : disabled ? (
            <span className="text-xs text-muted-foreground">Not included</span>
          ) : (
            <>{used} <span className="text-xs text-muted-foreground">/ {limit} used</span></>
          )}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${disabled ? 0 : pct}%` }} />
      </div>
      {!unlimited && !disabled && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{Math.max(0, limit - used)} remaining this month</p>
      )}
      {disabled && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">Upgrade to unlock this AI feature.</p>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────── */
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
