import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAffiliateReferrals, getAffiliateSettings } from "@/lib/affiliate.functions";
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2,
  Share2,
  Gift,
  BarChart3,
  Mail,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Award,
  Target,
  Sparkles,
  Zap,
  ArrowUpRight,
  BadgeCheck,
  HandCoins,
  MapPin,
  MessageSquare,
  Clock,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/affiliates")({
  component: AdminAffiliates,
});

/* ─── Program Highlights ─── */
const MODEL_TIERS = [
  {
    name: "Starter Subscription",
    vendorPays: "PKR 3,000 / month",
    commissionRate: "20% One-time",
    affiliateEarns: "PKR 600",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  {
    name: "Pro Subscription",
    vendorPays: "PKR 10,000 / month",
    commissionRate: "20% One-time",
    affiliateEarns: "PKR 2,000",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    popular: true,
  },
];

/* ─── Sales Channels ─── */
const CHANNELS = [
  {
    id: "field",
    icon: MapPin,
    title: "Field Sales & Travel Agencies",
    desc: "Sales partners walk into travel agency offices in major markets (Shah Alam Lahore, Saddar Karachi, Blue Area Islamabad) and pitch GlobeTrek PK.",
    cta: "View Sales Pitch Script",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  {
    id: "whatsapp",
    icon: MessageSquare,
    title: "WhatsApp Travel Operator Groups",
    desc: "Partners pitch GlobeTrek directly to travel agent WhatsApp groups and Umrah/Hajj operator networks across Pakistan.",
    cta: "Copy WhatsApp Pitch Template",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
  },
  {
    id: "influencer",
    icon: Share2,
    title: "Travel Vloggers & Bloggers",
    desc: "Pakistan travel content creators promote GlobeTrek on YouTube and Instagram, encouraging new travel agents to register using their code.",
    cta: "Affiliate Landing Page",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
  },
  {
    id: "edu",
    icon: Award,
    title: "University & Student Ambassadors",
    desc: "Student leaders refer local tour operators and campus trip organizers to list their tour packages on GlobeTrek.",
    cta: "Student Program",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
];

/* ─── Pitch materials ─── */
const OUTREACH_PITCH = `Assalam-o-Alaikum! 🌍 Main GlobeTrek PK ka Sales Partner hun.

Aapki travel agency ke liye ek zabardast digital platform available hai:
✅ Verified customer leads (Tours, Visa, Insurance, Tickets)
✅ Online booking & Safepay payment (PKR)
✅ AI tour description tools & itinerary builder
✅ Storefront page for your agency

Register on GlobeTrek PK: https://tour.testbench.shop/auth?mode=signup
Use my referral code: [YOUR_REFERRAL_CODE]

Pehla month demo testing free hai! Aaj hi sign up karein.`;

function AdminAffiliates() {
  const [activeTab, setActiveTab] = useState<"overview" | "tiers" | "channels" | "materials">("overview");
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const getReferralsFn = useServerFn(getAdminAffiliateReferrals);
  const getSettingsFn = useServerFn(getAffiliateSettings);

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-affiliate-referrals"],
    queryFn: () => getReferralsFn(),
  });

  const { data: settings } = useQuery({
    queryKey: ["affiliate-settings"],
    queryFn: () => getSettingsFn(),
  });

  const commissionPct = settings?.commission_pct ?? 20;

  const totalReferrals = referrals.length;
  const totalEarned = referrals.reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const pendingPayouts = referrals.filter((r: any) => r.status === "pending");
  const pendingAmount = pendingPayouts.reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const uniqueAffiliatesCount = new Set(referrals.map((r: any) => r.affiliate_id)).size;

  function copyPitch() {
    navigator.clipboard.writeText(OUTREACH_PITCH);
    setCopiedPitch(true);
    toast.success("Sales pitch script copied!");
    setTimeout(() => setCopiedPitch(false), 2000);
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "tiers", label: "Commission Model", icon: Award },
    { id: "channels", label: "Sales Channels", icon: Share2 },
    { id: "materials", label: "Pitch Materials", icon: Gift },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            Field Sales & Affiliate Program
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Empower sales partners across Pakistan to introduce travel agencies to GlobeTrek PK
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/affiliate-payouts">
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
              <HandCoins className="size-3.5" /> Payouts Manager ({pendingPayouts.length})
            </Button>
          </Link>
          <Link to="/become-affiliate" target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl">
              <ExternalLink className="size-3.5" /> Public Registration Page
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Partners", value: uniqueAffiliatesCount || "—", icon: Users, color: "text-primary" },
          { label: "Total Conversions", value: totalReferrals, icon: BadgeCheck, color: "text-violet-400" },
          { label: "Pending Friday Payout", value: `PKR ${pendingAmount.toLocaleString()}`, icon: Clock, color: "text-amber-400" },
          { label: "Total Commission Earned", value: `PKR ${totalEarned.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={cn("size-5 mb-3", s.color)} />
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-full overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Action Callout */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HandCoins className="size-4 text-emerald-400" /> Weekly Friday Payout Schedule
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Currently <strong>{pendingPayouts.length} pending referral commissions</strong> totaling <strong>PKR {pendingAmount.toLocaleString()}</strong> waiting for Friday payout.
              </p>
            </div>
            <Link to="/admin/affiliate-payouts">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5">
                Manage Payouts & Settings <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </div>

          {/* How Sales Partner Model Works */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">How the Sales Partner Program Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                {
                  step: "1",
                  icon: BadgeCheck,
                  title: "Partner Registers",
                  desc: "Anyone registers at /become-affiliate with CNIC, phone, and city to receive a unique code (e.g. REF-AHMED1234).",
                  color: "bg-primary/10 text-primary",
                },
                {
                  step: "2",
                  icon: MapPin,
                  title: "Pitches Travel Agencies",
                  desc: "Partner approaches travel agencies in person or via WhatsApp and presents GlobeTrek PK.",
                  color: "bg-violet-500/10 text-violet-400",
                },
                {
                  step: "3",
                  icon: Target,
                  title: "Vendor Enters Code",
                  desc: "Agency enters the referral code during signup or checkout on GlobeTrek PK.",
                  color: "bg-amber-500/10 text-amber-400",
                },
                {
                  step: "4",
                  icon: DollarSign,
                  title: "20% Commission Credited",
                  desc: "When vendor pays subscription, partner gets credited PKR 600 or PKR 2,000, paid every Friday.",
                  color: "bg-emerald-500/10 text-emerald-400",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-border bg-card p-5">
                  <div className={cn("size-9 rounded-xl flex items-center justify-center mb-3", s.color)}>
                    <s.icon className="size-4" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Step {s.step}
                  </div>
                  <div className="font-bold text-sm text-foreground mb-1">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
              <Sparkles className="size-4" /> Program Rules & Settings Summary
            </h4>
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                <strong>Current Commission Rate:</strong> {commissionPct}% one-time commission on initial vendor subscription.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                <strong>Plan Upgrades:</strong> Partners also earn commission when referred vendors upgrade from Starter to Pro.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                <strong>Friday Payouts:</strong> Admin transfers balances &ge; PKR 1,000 via JazzCash/EasyPaisa/Bank on Fridays.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                <strong>Admin Control:</strong> You can adjust commission rates anytime from the <Link to="/admin/affiliate-payouts" className="underline font-bold">Payouts Manager</Link>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── TIERS / MODEL ── */}
      {activeTab === "tiers" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Current default commission model ({commissionPct}% one-time per vendor payout).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODEL_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "rounded-2xl border p-5 relative",
                  tier.bg,
                  tier.border
                )}
              >
                {tier.popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold rounded-full bg-violet-500 text-white px-2 py-0.5">
                    HIGHEST COMMISSION
                  </span>
                )}
                <div className={cn("text-3xl font-black mb-0.5", tier.color)}>{tier.affiliateEarns}</div>
                <div className="text-sm font-bold text-foreground">{tier.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Vendor pays {tier.vendorPays} ({tier.commissionRate})
                </div>
                <ul className="space-y-1.5 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("size-3.5 shrink-0", tier.color)} />
                    Credited automatically when payment completes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("size-3.5 shrink-0", tier.color)} />
                    Paid out every Friday via JazzCash/EasyPaisa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={cn("size-3.5 shrink-0", tier.color)} />
                    Unlimited signups per sales partner
                  </li>
                </ul>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Custom Commission Rates: </span>
            You can change the percentage rate dynamically in <Link to="/admin/affiliate-payouts" className="text-primary font-bold underline">Admin Payout Settings</Link>.
          </div>
        </div>
      )}

      {/* ── CHANNELS ── */}
      {activeTab === "channels" && (
        <div className="space-y-3">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const isExpanded = expandedChannel === ch.id;
            return (
              <div
                key={ch.id}
                className={cn("rounded-2xl border transition-all", ch.bg, ch.border)}
              >
                <button
                  onClick={() => setExpandedChannel(isExpanded ? null : ch.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 bg-card border border-border", ch.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground">{ch.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{ch.desc}</div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3">
                    <p className="text-xs text-foreground">{ch.desc}</p>
                    <div className="rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">Channel Guidance:</p>
                      {ch.id === "field" && (
                        <>
                          <p>• Partners visit travel markets in Lahore, Karachi, Rawalpindi, Peshawar.</p>
                          <p>• Show live demo of GlobeTrek tour listings and AI description generator.</p>
                          <p>• Provide sales partner code for vendor to enter at signup.</p>
                        </>
                      )}
                      {ch.id === "whatsapp" && (
                        <>
                          <p>• Target Umrah & travel agency WhatsApp groups in Pakistan.</p>
                          <p>• Share pre-formatted pitch message with referral code.</p>
                        </>
                      )}
                      {ch.id === "influencer" && (
                        <>
                          <p>• Travel vloggers recommend GlobeTrek to Pakistani travel operators.</p>
                        </>
                      )}
                      {ch.id === "edu" && (
                        <>
                          <p>• Campus travel clubs refer local tour vendors for group packages.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MATERIALS ── */}
      {activeTab === "materials" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Official pitch materials for sales partners to share with travel agencies.
          </p>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" /> WhatsApp / Direct Sales Pitch Script
              </h3>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl" onClick={copyPitch}>
                {copiedPitch ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copiedPitch ? "Copied!" : "Copy Pitch Script"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono bg-surface rounded-xl p-4 border border-border leading-relaxed overflow-x-auto">
              {OUTREACH_PITCH}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
