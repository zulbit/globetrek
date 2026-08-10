import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getAffiliateDashboard, submitSocialPostProof } from "@/lib/affiliate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Mountain, Share2, DollarSign, Users, Copy, CheckCircle2,
  Clock, TrendingUp, MessageSquare, ExternalLink, AlertCircle,
  BadgeCheck, Wallet, Calendar, ArrowUpRight, Video, Camera,
  Link2, Send, Loader2, Play, Instagram, Youtube, Facebook,
  BookOpen, Award,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/affiliate")({
  component: AffiliateDashboard,
  head: () => ({
    meta: [{ title: "Affiliate Dashboard — GlobeTrek PK" }],
  }),
});

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Payout", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  approved: { label: "Approved", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  paid: { label: "Paid ✓", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const SOCIAL_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Under Verification ⏳", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  verified: { label: "Verified ✓", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

function AffiliateDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const getDashFn = useServerFn(getAffiliateDashboard);
  const submitProofFn = useServerFn(submitSocialPostProof);

  const [activeTab, setActiveTab] = useState<"referrals" | "social_kit">("referrals");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Social Proof Form State
  const [proofForm, setProofForm] = useState({ platform: "youtube", postUrl: "", screenshotUrl: "", captionSnippet: "" });
  const [submittingProof, setSubmittingProof] = useState(false);

  const { data, isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["affiliate-dashboard", user?.id],
    queryFn: () => getDashFn({ data: { userId: user!.id } }),
  });

  function copyCode() {
    if (!data?.affiliate?.referral_code) return;
    navigator.clipboard.writeText(data.affiliate.referral_code);
    setCopiedCode(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyTrackableLink() {
    if (!data?.affiliate?.referral_code) return;
    const link = `https://globetrek.pk/auth?mode=signup&ref=${data.affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Trackable Bio Link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function copyWhatsApp() {
    if (!data?.affiliate?.referral_code) return;
    const msg = `Assalam-o-Alaikum! 🌍 Main GlobeTrek PK ka Sales Partner hun.\n\nAapki travel agency ke liye ek zabardast digital platform available hai:\n✅ Verified customer leads\n✅ Online booking & payment (PKR)\n✅ AI tour description tools\n✅ Visa, Insurance & Ticketing listings\n\nSign up link: https://globetrek.pk/auth?mode=signup&ref=${data.affiliate.referral_code}\nMeray referral code se register karein: *${data.affiliate.referral_code}*\n\nPehla mahina demo available hai! Aaj contact karein.`;
    navigator.clipboard.writeText(msg);
    setCopiedWa(true);
    toast.success("WhatsApp message copied!");
    setTimeout(() => setCopiedWa(false), 2000);
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!proofForm.postUrl.trim()) {
      toast.error("Please enter your post URL");
      return;
    }
    setSubmittingProof(true);
    try {
      await submitProofFn({
        data: {
          userId: user.id,
          platform: proofForm.platform,
          postUrl: proofForm.postUrl.trim(),
          screenshotUrl: proofForm.screenshotUrl.trim() || undefined,
          captionSnippet: proofForm.captionSnippet.trim() || undefined,
        },
      });
      toast.success("Social post submitted for verification!", {
        description: "Our admin team will review your post within 24 hours.",
      });
      setProofForm({ platform: "youtube", postUrl: "", screenshotUrl: "", captionSnippet: "" });
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard", user.id] });
    } catch (err: any) {
      toast.error("Failed to submit proof", { description: err.message });
    } finally {
      setSubmittingProof(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="size-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Sign in required</h2>
          <p className="text-sm text-muted-foreground mb-4">You need to be signed in to access your affiliate dashboard.</p>
          <Link to="/auth"><Button className="bg-primary text-primary-foreground rounded-xl font-bold">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Share2 className="size-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Not registered yet</h2>
          <p className="text-sm text-muted-foreground mb-4">You haven't registered as an affiliate yet. Join free and start earning today.</p>
          <Link to="/become-affiliate">
            <Button className="bg-primary text-primary-foreground rounded-xl font-bold gap-2">
              <BadgeCheck className="size-4" /> Become an Affiliate
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { affiliate, referrals, socialPosts = [] } = data;
  const pendingPayout = referrals
    .filter((r: any) => r.status === "pending")
    .reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const totalEarned = affiliate.total_earned ?? 0;
  const totalPaid = affiliate.total_paid ?? 0;
  const balance = totalEarned - totalPaid;

  const trackableBioLink = `https://globetrek.pk/auth?mode=signup&ref=${affiliate.referral_code}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Mountain className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">GlobeTrek <span className="text-primary">PK</span></span>
          </Link>
          <span className="text-xs text-muted-foreground">Affiliate Dashboard</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {affiliate.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">City: {affiliate.city} · Partner since {new Date(affiliate.created_at).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</p>
        </div>

        {/* Referral Code Hero */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Your Unique Referral Code</div>
          <div className="text-4xl sm:text-5xl font-black tracking-widest text-foreground my-3">
            {affiliate.referral_code}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            When a travel agency signs up on GlobeTrek PK using your code or link, you earn 20% commission automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyCode} variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
              {copiedCode ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copiedCode ? "Copied Code!" : "Copy Code"}
            </Button>
            <Button onClick={copyTrackableLink} variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
              {copiedLink ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Link2 className="size-3.5" />}
              {copiedLink ? "Copied Link!" : "Copy Bio Link"}
            </Button>
            <Button onClick={copyWhatsApp} variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
              {copiedWa ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <MessageSquare className="size-3.5" />}
              {copiedWa ? "Copied!" : "Copy WhatsApp Pitch"}
            </Button>
            <Link to="/become-affiliate">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
                <ExternalLink className="size-3.5" /> Affiliate Guide
              </Button>
            </Link>
            <Link to="/vendor-guide" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
                <BookOpen className="size-3.5" /> Vendor Guide
              </Button>
            </Link>
            <Link to="/enterprise" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
                <Award className="size-3.5" /> Enterprise Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: referrals.length, icon: Users, color: "text-primary" },
            { label: "Total Earned", value: `PKR ${totalEarned.toLocaleString()}`, icon: TrendingUp, color: "text-violet-400" },
            { label: "Pending Payout", value: `PKR ${pendingPayout.toLocaleString()}`, icon: Clock, color: "text-amber-400" },
            { label: "Total Paid", value: `PKR ${totalPaid.toLocaleString()}`, icon: Wallet, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <s.icon className={cn("size-4 mb-2", s.color)} />
              <div className="text-xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payout info */}
        {balance >= 1000 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
            <DollarSign className="size-5 text-emerald-400 shrink-0" />
            <div className="flex-1 text-xs text-foreground">
              <span className="font-bold">PKR {balance.toLocaleString()} available for payout!</span> Contact GlobeTrek admin via WhatsApp to request your Friday payout.
            </div>
            <a href="https://wa.me/923001234567?text=I%20want%20to%20request%20my%20affiliate%20payout" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-emerald-500 text-white font-bold rounded-xl text-xs gap-1.5">
                <ArrowUpRight className="size-3.5" /> Request Payout
              </Button>
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("referrals")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2",
              activeTab === "referrals"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <Users className="size-3.5" /> My Referrals ({referrals.length})
          </button>
          <button
            onClick={() => setActiveTab("social_kit")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2",
              activeTab === "social_kit"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            )}
          >
            <Video className="size-3.5" /> Social Media Kit & Proof Verification ({socialPosts.length})
          </button>
        </div>

        {/* ── REFERRALS TAB ── */}
        {activeTab === "referrals" && (
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <Share2 className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No referrals yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">Visit travel agencies, share your code or link on social media, and your referrals will appear here once a vendor subscribes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                      <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                      <th className="px-4 py-3 text-center font-semibold">Plan</th>
                      <th className="px-4 py-3 text-center font-semibold">Type</th>
                      <th className="px-4 py-3 text-center font-semibold">Commission</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                      <th className="px-4 py-3 text-center font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referrals.map((r: any) => {
                      const sm = STATUS_META[r.status] ?? STATUS_META.pending;
                      return (
                        <tr key={r.id} className="hover:bg-surface/40 transition">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {r.profiles?.company_name ?? r.profiles?.email ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-center capitalize">{r.plan}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", r.is_upgrade ? "bg-violet-500/10 border-violet-500/20 text-violet-400" : "bg-surface border-border text-muted-foreground")}>
                              {r.is_upgrade ? "Upgrade" : "New"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold font-mono text-emerald-400">
                            PKR {(r.commission_pkr ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", sm.bg, sm.color)}>
                              {sm.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
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

        {/* ── SOCIAL KIT & PROOF SUBMISSION TAB ── */}
        {activeTab === "social_kit" && (
          <div className="space-y-6">
            {/* Bio Link Card */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Link2 className="size-4 text-violet-400" /> Trackable Social Media Bio Link
              </h3>
              <p className="text-xs text-muted-foreground">
                Place this link in your Instagram bio, YouTube video description, TikTok bio, or Facebook post. When any travel agency clicks this link, your code is auto-saved in their browser for 30 days!
              </p>
              <div className="flex gap-2 pt-1">
                <Input readOnly value={trackableBioLink} className="text-xs font-mono rounded-xl bg-background flex-1" />
                <Button onClick={copyTrackableLink} size="sm" className="bg-violet-600 text-white font-bold rounded-xl text-xs gap-1.5 shrink-0">
                  {copiedLink ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Submit Post Proof Form */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Send className="size-4 text-primary" /> Submit Social Media Post Proof
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Promoted GlobeTrek on YouTube, Instagram, Facebook, TikTok, or LinkedIn? Submit your post URL so our admin team can verify it!
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-3 pt-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Platform *</label>
                    <select
                      value={proofForm.platform}
                      onChange={(e) => setProofForm((p) => ({ ...p, platform: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2"
                    >
                      <option value="youtube">YouTube (Video / Short)</option>
                      <option value="instagram">Instagram (Reel / Story / Post)</option>
                      <option value="facebook">Facebook (Group Post / Page)</option>
                      <option value="tiktok">TikTok (Video)</option>
                      <option value="linkedin">LinkedIn (B2B Post)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Post / Video URL *</label>
                    <Input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/p/..."
                      value={proofForm.postUrl}
                      onChange={(e) => setProofForm((p) => ({ ...p, postUrl: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Screenshot URL (Optional)</label>
                    <Input
                      type="url"
                      placeholder="https://imgur.com/... or Google Drive link"
                      value={proofForm.screenshotUrl}
                      onChange={(e) => setProofForm((p) => ({ ...p, screenshotUrl: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Caption / Description Snippet (Optional)</label>
                    <Input
                      placeholder="e.g. Added link to bio + code in caption"
                      value={proofForm.captionSnippet}
                      onChange={(e) => setProofForm((p) => ({ ...p, captionSnippet: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submittingProof}
                  className="bg-primary text-primary-foreground font-bold rounded-xl gap-1.5 text-xs mt-1"
                >
                  {submittingProof ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Submit Post for Admin Verification
                </Button>
              </form>
            </div>

            {/* Submitted Proofs Table */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Camera className="size-4 text-primary" /> Submitted Social Proofs ({socialPosts.length})
              </h3>

              {socialPosts.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                  No social posts submitted yet. Share a post on YouTube, Instagram, or TikTok and submit your link above!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                        <th className="px-4 py-3 text-left font-semibold">Platform</th>
                        <th className="px-4 py-3 text-left font-semibold">Post Link</th>
                        <th className="px-4 py-3 text-center font-semibold">Status</th>
                        <th className="px-4 py-3 text-center font-semibold">Submitted</th>
                        <th className="px-4 py-3 text-left font-semibold">Admin Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {socialPosts.map((p: any) => {
                        const sm = SOCIAL_STATUS_META[p.status] ?? SOCIAL_STATUS_META.pending;
                        return (
                          <tr key={p.id} className="hover:bg-surface/40 transition">
                            <td className="px-4 py-3 font-semibold capitalize text-foreground flex items-center gap-1.5">
                              {p.platform === "youtube" && <Youtube className="size-3.5 text-red-500" />}
                              {p.platform === "instagram" && <Instagram className="size-3.5 text-pink-500" />}
                              {p.platform === "facebook" && <Facebook className="size-3.5 text-blue-500" />}
                              {p.platform}
                            </td>
                            <td className="px-4 py-3 font-mono text-primary max-w-[200px] truncate">
                              <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                                <ExternalLink className="size-3" /> View Post
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
                            <td className="px-4 py-3 text-muted-foreground italic text-[11px]">
                              {p.admin_notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
