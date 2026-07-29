import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getAffiliateDashboard } from "@/lib/affiliate.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Mountain, Share2, DollarSign, Users, Copy, CheckCircle2,
  Clock, TrendingUp, MessageSquare, ExternalLink, AlertCircle,
  BadgeCheck, Wallet, Calendar, ArrowUpRight,
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

function AffiliateDashboard() {
  const { user } = useAuth();
  const getDashFn = useServerFn(getAffiliateDashboard);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

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

  function copyWhatsApp() {
    if (!data?.affiliate?.referral_code) return;
    const msg = `Assalam-o-Alaikum! 🌍 Main GlobeTrek PK ka Sales Partner hun.\n\nAapki travel agency ke liye ek zabardast digital platform available hai:\n✅ Verified customer leads\n✅ Online booking & payment (PKR)\n✅ AI tour description tools\n✅ Visa, Insurance & Ticketing listings\n\nSign up link: https://tour.testbench.shop/auth?mode=signup\nMeray referral code se register karein: *${data.affiliate.referral_code}*\n\nPehla mahina demo available hai! Aaj contact karein.`;
    navigator.clipboard.writeText(msg);
    setCopiedWa(true);
    toast.success("WhatsApp message copied!");
    setTimeout(() => setCopiedWa(false), 2000);
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

  const { affiliate, referrals } = data;
  const pendingPayout = referrals
    .filter((r: any) => r.status === "pending")
    .reduce((sum: number, r: any) => sum + (r.commission_pkr ?? 0), 0);
  const totalEarned = affiliate.total_earned ?? 0;
  const totalPaid = affiliate.total_paid ?? 0;
  const balance = totalEarned - totalPaid;

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
            When a travel agency signs up on GlobeTrek PK, they enter this code at checkout. You earn commission automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyCode} variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl">
              {copiedCode ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copiedCode ? "Copied!" : "Copy Code"}
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
        {balance > 0 && balance < 1000 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
            <Calendar className="size-3.5 inline mr-1" />
            Minimum payout is PKR 1,000. You have PKR {balance.toLocaleString()} — need PKR {(1000 - balance).toLocaleString()} more to request payout.
          </div>
        )}

        {/* Referrals Table */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="size-4 text-primary" /> My Referrals
          </h2>
          {referrals.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Share2 className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No referrals yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Visit travel agencies, share your code, and your referrals will appear here once a vendor subscribes.</p>
              <Link to="/become-affiliate" className="mt-4 inline-block">
                <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1.5">
                  <ExternalLink className="size-3.5" /> View Earning Tips
                </Button>
              </Link>
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
      </main>
    </div>
  );
}
