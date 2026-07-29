import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Users,
  Link2,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2,
  Star,
  Globe2,
  Sparkles,
  Zap,
  ArrowUpRight,
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
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/affiliates")({
  component: AdminAffiliates,
});

/* ─── Affiliate Tiers ─── */
const TIERS = [
  {
    id: "starter",
    name: "Starter Affiliate",
    commission: "5%",
    minReferrals: 0,
    maxReferrals: 4,
    color: "text-muted-foreground",
    bg: "bg-surface",
    border: "border-border",
    perks: ["Unique referral link", "Monthly payouts via JazzCash/EasyPaisa", "Real-time dashboard"],
  },
  {
    id: "silver",
    name: "Silver Partner",
    commission: "8%",
    minReferrals: 5,
    maxReferrals: 19,
    color: "text-slate-300",
    bg: "bg-slate-500/5",
    border: "border-slate-500/30",
    perks: ["8% lifetime commission", "Priority support", "Co-branded materials", "Starter perks included"],
  },
  {
    id: "gold",
    name: "Gold Partner",
    commission: "12%",
    minReferrals: 20,
    maxReferrals: 49,
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    perks: [
      "12% lifetime commission",
      "Dedicated account manager",
      "Featured affiliate listing",
      "Silver perks included",
    ],
  },
  {
    id: "platinum",
    name: "Platinum Partner",
    commission: "15%",
    minReferrals: 50,
    maxReferrals: Infinity,
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/30",
    popular: true,
    perks: [
      "15% lifetime commission",
      "Revenue share on upsells",
      "White-label options",
      "Speaking opportunities",
      "Gold perks included",
    ],
  },
];

/* ─── Affiliate Channels ─── */
const CHANNELS = [
  {
    id: "blog",
    icon: FileText,
    title: "Travel Bloggers & Influencers",
    desc: "Pakistan travel bloggers, YouTube vloggers, and Instagram travel accounts promote GlobeTrek in their content for a commission on every signup.",
    cta: "Draft Outreach Email",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  {
    id: "agency",
    icon: Globe2,
    title: "Offline Travel Agencies",
    desc: "Traditional travel agencies who don't have digital presence can refer vendors and customers to GlobeTrek PK for recurring commission.",
    cta: "Download Partnership Deck",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
  },
  {
    id: "corporate",
    icon: Users,
    title: "Corporate HR Affiliates",
    desc: "HR managers at companies refer GlobeTrek for corporate travel, team trips, and Hajj/Umrah employee programs.",
    cta: "View Corporate Program",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
  },
  {
    id: "edu",
    icon: Award,
    title: "University & Student Networks",
    desc: "Student travel clubs and university societies promote GlobeTrek student packages (Hunza, Northern areas) for campus commissions.",
    cta: "Student Program Details",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
];

/* ─── Promo Materials ─── */
const PROMO_ASSETS = [
  { label: "Affiliate Homepage Banner (1200×628)", format: "PNG", link: "#" },
  { label: "WhatsApp Promotional Message Template", format: "TXT", link: "#" },
  { label: "Facebook Post Copy (5 variants)", format: "DOCX", link: "#" },
  { label: "Email Newsletter Insert (HTML)", format: "HTML", link: "#" },
  { label: "Co-branded PDF Brochure", format: "PDF", link: "#" },
  { label: "YouTube Thumbnail Template", format: "PSD", link: "#" },
];

/* ─── Sample Affiliates ─── */
const SAMPLE_AFFILIATES = [
  { name: "TravelWithAli PK", channel: "YouTube", referrals: 67, earned: "PKR 84,000", tier: "platinum" },
  { name: "Explore Pakistan Blog", channel: "Blog", referrals: 31, earned: "PKR 38,400", tier: "gold" },
  { name: "Lahore Wanderers", channel: "Instagram", referrals: 14, earned: "PKR 11,200", tier: "silver" },
  { name: "HajjPlanning.pk", channel: "Website", referrals: 8, earned: "PKR 6,400", tier: "silver" },
  { name: "Campus Tours LUMS", channel: "Student Club", referrals: 3, earned: "PKR 1,800", tier: "starter" },
];

/* ─── Email Template ─── */
const OUTREACH_EMAIL = `Subject: Earn up to 15% Commission — Join GlobeTrek PK Affiliate Program

Dear [Name],

I came across your [blog/channel] and love how you showcase Pakistan travel. We'd love to partner with you!

GlobeTrek PK is Pakistan's fastest-growing travel marketplace and we're inviting select creators to join our Affiliate Program:

✅ Earn 5–15% commission on every referred subscription
✅ Monthly payouts via JazzCash / EasyPaisa
✅ Dedicated partner dashboard with real-time tracking
✅ Co-branded materials & social media support

Your unique affiliate link: https://tour.testbench.shop/ref/[YOUR_CODE]

To join or learn more, simply reply to this email or visit:
https://tour.testbench.shop/affiliates

Looking forward to building something great together!

Warm regards,
GlobeTrek PK Team
https://tour.testbench.shop`;

/* ─── Component ─── */
function AdminAffiliates() {
  const [activeTab, setActiveTab] = useState<"overview" | "tiers" | "channels" | "materials" | "leaderboard">("overview");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const AFFILIATE_BASE = "https://tour.testbench.shop/ref/";
  const DEMO_CODE = "ADMIN001";

  function copyLink() {
    navigator.clipboard.writeText(AFFILIATE_BASE + DEMO_CODE);
    setCopiedLink(true);
    toast.success("Affiliate link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function copyEmail() {
    navigator.clipboard.writeText(OUTREACH_EMAIL);
    setCopiedEmail(true);
    toast.success("Email template copied!");
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "tiers", label: "Tiers & Rewards", icon: Award },
    { id: "channels", label: "Channels", icon: Share2 },
    { id: "materials", label: "Promo Materials", icon: Gift },
    { id: "leaderboard", label: "Leaderboard", icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            Affiliate & Partner Program
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Grow GlobeTrek PK through influencers, bloggers, agencies, and student networks
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-xl">
          <Mail className="size-3.5" /> Invite Affiliate
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Affiliates", value: "23", icon: Users, color: "text-primary" },
          { label: "Total Referrals", value: "123", icon: Link2, color: "text-violet-400" },
          { label: "Commissions Paid", value: "PKR 1.41L", icon: DollarSign, color: "text-emerald-400" },
          { label: "Avg Commission", value: "9.2%", icon: TrendingUp, color: "text-amber-400" },
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
          {/* Affiliate Link Generator */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Link2 className="size-4 text-primary" /> Your Affiliate Link
            </h3>
            <div className="flex gap-2">
              <Input
                readOnly
                value={AFFILIATE_BASE + DEMO_CODE}
                className="font-mono text-xs rounded-xl bg-surface flex-1"
              />
              <Button
                onClick={copyLink}
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs rounded-xl shrink-0"
              >
                {copiedLink ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copiedLink ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Share this link — every vendor who subscribes through it earns you a commission.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">How the Affiliate Program Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  icon: Link2,
                  title: "Share Your Link",
                  desc: "Distribute your unique affiliate link across social media, WhatsApp groups, blog posts, or via email.",
                  color: "bg-primary/10 text-primary",
                },
                {
                  step: "2",
                  icon: Users,
                  title: "Vendor Signs Up",
                  desc: "A travel agency or vendor registers on GlobeTrek PK through your link and subscribes to a paid plan.",
                  color: "bg-violet-500/10 text-violet-400",
                },
                {
                  step: "3",
                  icon: DollarSign,
                  title: "You Earn Commission",
                  desc: "Receive 5–15% of the subscription value monthly for the lifetime of the referred vendor's account.",
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

          {/* Strategy Highlights */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
              <Sparkles className="size-4" /> Promotion Strategy — Top Priorities
            </h4>
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                Target <strong>Pakistan travel YouTubers</strong> with 10K+ subscribers — highest conversion channel for vendor signups.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                Partner with <strong>Umrah & Hajj group admins</strong> on WhatsApp — they have direct access to pilgrimage vendors.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                Run a <strong>Eid campaign</strong> offering 2-month free trial for vendors referred by affiliates — seasonal spike opportunity.
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="size-3.5 mt-0.5 text-amber-400 shrink-0" />
                List GlobeTrek on <strong>Pakistani affiliate networks</strong> (Rozee, iMarketing.pk) to attract performance marketers.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── TIERS ── */}
      {activeTab === "tiers" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Commission tiers auto-upgrade based on cumulative referrals. Lifetime commissions keep paying every month.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "rounded-2xl border p-5 relative",
                  tier.bg,
                  tier.border
                )}
              >
                {tier.popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold rounded-full bg-violet-500 text-white px-2 py-0.5">
                    TOP TIER
                  </span>
                )}
                <div className={cn("text-2xl font-black mb-0.5", tier.color)}>{tier.commission}</div>
                <div className="text-sm font-bold text-foreground">{tier.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 mb-3">
                  {tier.maxReferrals === Infinity
                    ? `${tier.minReferrals}+ referrals`
                    : `${tier.minReferrals}–${tier.maxReferrals} referrals`}
                </div>
                <ul className="space-y-1.5">
                  {tier.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className={cn("size-3.5 mt-0.5 shrink-0", tier.color)} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Commission basis: </span>
            Calculated on monthly subscription value (Starter PKR 3,000/mo · Pro PKR 10,000/mo). Paid monthly via{" "}
            <strong>JazzCash, EasyPaisa, or bank transfer</strong> on the 1st of each month. Minimum payout: PKR 1,000.
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
                      <p className="font-semibold text-foreground">Best Practices:</p>
                      {ch.id === "blog" && (
                        <>
                          <p>• Search for Pakistan travel bloggers on YouTube with 5K–100K subscribers.</p>
                          <p>• Offer a free Pro trial for 2 months in exchange for a sponsored video.</p>
                          <p>• Provide ready-made content: comparison tables, key features, pricing FAQ.</p>
                        </>
                      )}
                      {ch.id === "agency" && (
                        <>
                          <p>• Visit PTDC-registered agents in Lahore, Karachi, and Islamabad.</p>
                          <p>• Offer printed brochures and a simple WhatsApp onboarding guide.</p>
                          <p>• Emphasize lead credits and digital visibility benefits for offline agents.</p>
                        </>
                      )}
                      {ch.id === "corporate" && (
                        <>
                          <p>• Target HR contacts via LinkedIn Sales Navigator for companies 200+ employees.</p>
                          <p>• Position GlobeTrek as the all-in-one platform for annual retreats & Umrah packages.</p>
                          <p>• Offer a volume-discount package for 10+ employees per booking.</p>
                        </>
                      )}
                      {ch.id === "edu" && (
                        <>
                          <p>• Partner with LUMS, IBA, NUST, and FAST student societies.</p>
                          <p>• Create a "Student Affiliate Kit" with ready-made WhatsApp group messages.</p>
                          <p>• Offer group discount codes for 5+ students booking together.</p>
                        </>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl">
                      <ExternalLink className="size-3.5" />
                      {ch.cta}
                    </Button>
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
            Ready-to-use promotional assets for affiliates. Share these with partners to maintain brand consistency.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROMO_ASSETS.map((a) => (
              <div
                key={a.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{a.label}</div>
                  <div className="text-[10px] text-muted-foreground">{a.format}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1 rounded-xl shrink-0">
                  <ArrowUpRight className="size-3" /> Get
                </Button>
              </div>
            ))}
          </div>

          {/* Email Template */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Mail className="size-4 text-primary" /> Affiliate Outreach Email Template
              </h3>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl" onClick={copyEmail}>
                {copiedEmail ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copiedEmail ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono bg-surface rounded-xl p-4 border border-border leading-relaxed overflow-x-auto">
              {OUTREACH_EMAIL}
            </pre>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Top performing affiliates by referrals. Recognize and reward top affiliates to retain them.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">Affiliate</th>
                  <th className="px-4 py-3 text-center font-semibold">Channel</th>
                  <th className="px-4 py-3 text-center font-semibold">Referrals</th>
                  <th className="px-4 py-3 text-center font-semibold">Earned</th>
                  <th className="px-4 py-3 text-center font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SAMPLE_AFFILIATES.map((a, i) => {
                  const tier = TIERS.find((t) => t.id === a.tier)!;
                  return (
                    <tr key={a.name} className="hover:bg-surface/40 transition">
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-black text-lg tabular-nums",
                            i === 0
                              ? "text-amber-400"
                              : i === 1
                              ? "text-slate-300"
                              : i === 2
                              ? "text-orange-400"
                              : "text-muted-foreground"
                          )}
                        >
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{a.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{a.channel}</td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">{a.referrals}</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400 font-bold">{a.earned}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border", tier.bg, tier.border, tier.color)}>
                          {tier.name.split(" ")[0]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground space-y-1">
            <p className="font-semibold text-primary flex items-center gap-1.5"><Target className="size-3.5" /> Retention Strategy</p>
            <p>• Send a <strong>monthly performance digest</strong> email to all affiliates with their earnings and ranking.</p>
            <p>• Celebrate <strong>top 3 affiliates</strong> publicly (with consent) on GlobeTrek's social media.</p>
            <p>• Run a <strong>quarterly contest</strong> — top affiliate wins a 1-week northern Pakistan tour package.</p>
            <p>• Offer <strong>bonus PKR 5,000</strong> for the 10th vendor referral milestone.</p>
          </div>
        </div>
      )}
    </div>
  );
}
