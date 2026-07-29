import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminAffiliateReferrals,
  getAffiliateSettings,
  updateAffiliateSettings,
  getAdminSocialPosts,
  verifySocialPost,
} from "@/lib/affiliate.functions";
import { TIERS } from "@/lib/pricing";
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
  Settings,
  Save,
  Loader2,
  AlertCircle,
  Video,
  Camera,
  XCircle,
  Youtube,
  Instagram,
  Facebook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/affiliates")({
  component: AdminAffiliates,
});

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

const SOCIAL_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Verification ⏳", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  verified: { label: "Verified ✓", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected: { label: "Rejected ❌", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

function AdminAffiliates() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "verifications" | "settings" | "channels" | "materials">("overview");
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const getReferralsFn = useServerFn(getAdminAffiliateReferrals);
  const getSettingsFn = useServerFn(getAffiliateSettings);
  const updateSettingsFn = useServerFn(updateAffiliateSettings);
  const getSocialPostsFn = useServerFn(getAdminSocialPosts);
  const verifyPostFn = useServerFn(verifySocialPost);

  const [settingsForm, setSettingsForm] = useState({
    commission_pct: 20,
    upgrade_commission_pct: 20,
    min_payout_pkr: 1000,
    payout_day: "friday",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-affiliate-referrals"],
    queryFn: () => getReferralsFn(),
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ["admin-social-posts"],
    queryFn: () => getSocialPostsFn(),
  });

  const { data: savedSettings } = useQuery({
    queryKey: ["affiliate-settings"],
    queryFn: () => getSettingsFn(),
  });

  useEffect(() => {
    if (savedSettings) {
      setSettingsForm({
        commission_pct: savedSettings.commission_pct ?? 20,
        upgrade_commission_pct: savedSettings.upgrade_commission_pct ?? 20,
        min_payout_pkr: savedSettings.min_payout_pkr ?? 1000,
        payout_day: savedSettings.payout_day ?? "friday",
      });
    }
  }, [savedSettings]);

  const commissionPct = settingsForm.commission_pct;
  const paidTiers = TIERS.filter((t) => t.price_pkr > 0);
  const dynamicTierRates = paidTiers.map((t) => ({
    name: t.name,
    price: t.price_pkr,
    commission: Math.round((t.price_pkr * commissionPct) / 100),
    archetype: t.archetype,
    color: t.id === "agency" ? "text-amber-400" : t.id === "pro" ? "text-primary" : "text-sky-400",
    bg: t.id === "agency" ? "bg-amber-500/5" : t.id === "pro" ? "bg-primary/5" : "bg-sky-500/5",
    border: t.id === "agency" ? "border-amber-500/20" : t.id === "pro" ? "border-primary/20" : "border-sky-500/20",
  }));

  const totalReferrals = referrals.length;
  const totalEarned = referrals.reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const pendingPayouts = referrals.filter((r: any) => r.status === "pending");
  const pendingAmount = pendingPayouts.reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const uniqueAffiliatesCount = new Set(referrals.map((r: any) => r.affiliate_id)).size;

  const pendingSocialPosts = socialPosts.filter((p: any) => p.status === "pending");

  function copyPitch() {
    navigator.clipboard.writeText(OUTREACH_PITCH);
    setCopiedPitch(true);
    toast.success("Sales pitch script copied!");
    setTimeout(() => setCopiedPitch(false), 2000);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateSettingsFn({ data: settingsForm });
      toast.success("Affiliate program settings updated!");
      qc.invalidateQueries({ queryKey: ["affiliate-settings"] });
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleVerifySocialPost(postId: string, status: "verified" | "rejected") {
    setVerifyingId(postId);
    try {
      await verifyPostFn({ data: { postId, status } });
      toast.success(`Social post marked as ${status}!`);
      qc.invalidateQueries({ queryKey: ["admin-social-posts"] });
    } catch (err: any) {
      toast.error("Failed to update post status", { description: err.message });
    } finally {
      setVerifyingId(null);
    }
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "verifications", label: `Social Post Verifications (${pendingSocialPosts.length})`, icon: Camera },
    { id: "settings", label: "Commission Settings", icon: Settings },
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
          {/* Action Callouts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <HandCoins className="size-4 text-emerald-400" /> Weekly Friday Payout Schedule
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently <strong>{pendingPayouts.length} pending referral commissions</strong> totaling <strong>PKR {pendingAmount.toLocaleString()}</strong> waiting for Friday payout.
                </p>
              </div>
              <Link to="/admin/affiliate-payouts">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 w-fit">
                  Process Payouts <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Camera className="size-4 text-violet-400" /> Social Post Verification Queue
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently <strong>{pendingSocialPosts.length} social media post proofs</strong> submitted by affiliates waiting for admin verification.
                </p>
              </div>
              <Button onClick={() => setActiveTab("verifications")} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl gap-1.5 w-fit">
                Review Social Proofs ({pendingSocialPosts.length}) <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Current Live Rates Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dynamicTierRates.map((t) => (
              <div key={t.name} className={cn("rounded-2xl border p-5 space-y-1 flex flex-col justify-between", t.bg, t.border)}>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t.name} Plan</div>
                  <div className="text-xs text-muted-foreground mb-3">Vendor pays PKR {t.price.toLocaleString()}/month</div>
                  <div className={cn("text-3xl font-black", t.color)}>PKR {t.commission.toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                  {commissionPct}% commission for affiliate ({t.archetype})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SOCIAL POST VERIFICATIONS TAB ── */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Review and verify social media post links submitted by affiliates.
          </p>

          {socialPosts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-xs text-muted-foreground">
              No social posts submitted for verification yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">Affiliate</th>
                    <th className="px-4 py-3 text-left font-semibold">Platform</th>
                    <th className="px-4 py-3 text-left font-semibold">Post Link</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Submitted</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {socialPosts.map((p: any) => {
                    const sm = SOCIAL_STATUS_META[p.status] ?? SOCIAL_STATUS_META.pending;
                    return (
                      <tr key={p.id} className="hover:bg-surface/40 transition">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {p.affiliates?.full_name ?? "—"}
                          <div className="text-[10px] font-mono text-muted-foreground">{p.affiliates?.phone}</div>
                        </td>
                        <td className="px-4 py-3 font-medium capitalize text-foreground flex items-center gap-1.5">
                          {p.platform === "youtube" && <Youtube className="size-3.5 text-red-500" />}
                          {p.platform === "instagram" && <Instagram className="size-3.5 text-pink-500" />}
                          {p.platform === "facebook" && <Facebook className="size-3.5 text-blue-500" />}
                          {p.platform}
                        </td>
                        <td className="px-4 py-3 font-mono text-primary max-w-[220px] truncate">
                          <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="size-3" /> Open Post
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", sm.bg, sm.color)}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.status === "pending" ? (
                            <div className="flex gap-1.5 justify-center">
                              <Button
                                size="sm"
                                disabled={verifyingId === p.id}
                                onClick={() => handleVerifySocialPost(p.id, "verified")}
                                className="h-7 text-[10px] bg-emerald-500 text-white font-bold rounded-lg px-2 gap-1"
                              >
                                {verifyingId === p.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                                Verify ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={verifyingId === p.id}
                                onClick={() => handleVerifySocialPost(p.id, "rejected")}
                                className="h-7 text-[10px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold rounded-lg px-2 gap-1"
                              >
                                <XCircle className="size-3" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure default commission percentages and payout threshold for the affiliate program.
          </p>
          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Settings className="size-4 text-primary" /> Program Settings & Rates
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  New Subscription Commission (%) *
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={settingsForm.commission_pct}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, commission_pct: Number(e.target.value) }))}
                    className="text-xs rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Starter = PKR {starterCommission.toLocaleString()} · Pro = PKR {proCommission.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Plan Upgrade Commission (%) *
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={settingsForm.upgrade_commission_pct}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, upgrade_commission_pct: Number(e.target.value) }))}
                    className="text-xs rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Applied when vendor upgrades tier
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Minimum Payout Threshold (PKR) *
                </label>
                <Input
                  type="number"
                  min={100}
                  required
                  value={settingsForm.min_payout_pkr}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, min_payout_pkr: Number(e.target.value) }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Payout Schedule Day</label>
                <select
                  value={settingsForm.payout_day}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, payout_day: e.target.value }))}
                  className="text-xs rounded-xl border border-border bg-background px-3 py-2 w-full"
                >
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={savingSettings}
              className="bg-primary text-primary-foreground font-bold rounded-xl gap-1.5 text-xs"
            >
              {savingSettings ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Program Settings
            </Button>
          </form>
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
