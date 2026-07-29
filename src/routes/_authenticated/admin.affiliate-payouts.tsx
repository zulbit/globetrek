import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminAffiliateReferrals,
  markReferralPaid,
  getAffiliateSettings,
  updateAffiliateSettings,
} from "@/lib/affiliate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DollarSign, Users, CheckCircle2, Clock, Settings, TrendingUp,
  Wallet, Calendar, AlertCircle, Copy, Loader2, Share2, Save,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/affiliate-payouts")({
  component: AdminAffiliatePayouts,
});

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Payout", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  approved: { label: "Approved", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  paid: { label: "Paid ✓", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

function AdminAffiliatePayouts() {
  const qc = useQueryClient();
  const getReferralsFn = useServerFn(getAdminAffiliateReferrals);
  const markPaidFn = useServerFn(markReferralPaid);
  const getSettingsFn = useServerFn(getAffiliateSettings);
  const updateSettingsFn = useServerFn(updateAffiliateSettings);

  const [activeTab, setActiveTab] = useState<"pending" | "all" | "settings">("pending");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payRefs, setPayRefs] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({ commission_pct: 20, upgrade_commission_pct: 20, min_payout_pkr: 1000, payout_day: "friday" });
  const [savingSettings, setSavingSettings] = useState(false);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["admin-affiliate-referrals"],
    queryFn: () => getReferralsFn(),
  });

  const { data: savedSettings } = useQuery({
    queryKey: ["affiliate-settings"],
    queryFn: () => getSettingsFn(),
    onSuccess: (d: any) => setSettings({ ...settings, ...d }),
  });

  const pending = referrals.filter((r: any) => r.status === "pending");
  const all = referrals;
  const totalPending = pending.reduce((s: number, r: any) => s + (r.commission_pkr ?? 0), 0);
  const totalPaid = referrals.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + (r.commission_pkr ?? 0), 0);

  async function handleMarkPaid(r: any) {
    const ref = payRefs[r.id];
    if (!ref) {
      toast.error("Enter JazzCash/EasyPaisa transaction ID");
      return;
    }
    setPayingId(r.id);
    try {
      await markPaidFn({
        data: {
          referralId: r.id,
          paymentRef: ref,
          affiliateId: r.affiliate_id,
          commissionPkr: r.commission_pkr,
        },
      });
      toast.success(`Marked as paid — PKR ${r.commission_pkr.toLocaleString()} to ${r.affiliates?.full_name}`);
      qc.invalidateQueries({ queryKey: ["admin-affiliate-referrals"] });
    } catch (err: any) {
      toast.error("Failed to mark paid", { description: err.message });
    } finally {
      setPayingId(null);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await updateSettingsFn({ data: settings });
      toast.success("Commission settings saved!");
      qc.invalidateQueries({ queryKey: ["affiliate-settings"] });
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  }

  const displayReferrals = activeTab === "pending" ? pending : all;

  const TABS = [
    { id: "pending", label: `Pending Payouts (${pending.length})`, icon: Clock },
    { id: "all", label: `All Referrals (${all.length})`, icon: Users },
    { id: "settings", label: "Commission Settings", icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="size-5 text-primary" /> Affiliate Payouts & Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage commission payouts and control commission rates</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Affiliates", value: new Set(referrals.map((r: any) => r.affiliate_id)).size, icon: Share2, color: "text-primary" },
          { label: "Total Referrals", value: all.length, icon: Users, color: "text-violet-400" },
          { label: "Pending Payout", value: `PKR ${totalPending.toLocaleString()}`, icon: Clock, color: "text-amber-400" },
          { label: "Total Paid Out", value: `PKR ${totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={cn("size-5 mb-3", s.color)} />
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Friday reminder */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3 text-xs text-foreground">
        <Calendar className="size-4 text-primary shrink-0" />
        <span>Payouts are scheduled for <strong>every Friday</strong>. Process all pending payouts before end of Thursday.</span>
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

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-lg">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Settings className="size-4 text-primary" /> Commission Rate Settings
            </h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                New Subscription Commission (%)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.commission_pct}
                  onChange={(e) => setSettings((p) => ({ ...p, commission_pct: Number(e.target.value) }))}
                  className="text-xs rounded-xl w-28"
                />
                <span className="text-xs text-muted-foreground">% of plan price</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Current: {settings.commission_pct}% → Starter = PKR {Math.round(3000 * settings.commission_pct / 100).toLocaleString()}, Pro = PKR {Math.round(10000 * settings.commission_pct / 100).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Plan Upgrade Commission (%)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.upgrade_commission_pct}
                  onChange={(e) => setSettings((p) => ({ ...p, upgrade_commission_pct: Number(e.target.value) }))}
                  className="text-xs rounded-xl w-28"
                />
                <span className="text-xs text-muted-foreground">% of new plan price</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Minimum Payout (PKR)
              </label>
              <Input
                type="number"
                min={100}
                value={settings.min_payout_pkr}
                onChange={(e) => setSettings((p) => ({ ...p, min_payout_pkr: Number(e.target.value) }))}
                className="text-xs rounded-xl w-28"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Payout Day</label>
              <select
                value={settings.payout_day}
                onChange={(e) => setSettings((p) => ({ ...p, payout_day: e.target.value }))}
                className="text-xs rounded-xl border border-border bg-background px-3 py-2 w-36"
              >
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-primary text-primary-foreground font-bold rounded-xl gap-1.5 text-xs"
            >
              {savingSettings ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Settings
            </Button>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground max-w-lg">
            <AlertCircle className="size-3.5 inline text-amber-400 mr-1" />
            Commission rate changes apply to <strong>future referrals only</strong>. Existing credited commissions are not affected.
          </div>
        </div>
      )}

      {/* Referrals Table */}
      {activeTab !== "settings" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
              <Loader2 className="size-4 animate-spin" /> Loading referrals…
            </div>
          ) : displayReferrals.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <CheckCircle2 className="size-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium">{activeTab === "pending" ? "No pending payouts!" : "No referrals yet."}</p>
              <p className="text-xs text-muted-foreground mt-1">All affiliate commissions are up to date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">Affiliate</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-center font-semibold">Vendor</th>
                    <th className="px-4 py-3 text-center font-semibold">Plan</th>
                    <th className="px-4 py-3 text-center font-semibold">Type</th>
                    <th className="px-4 py-3 text-center font-semibold">Commission</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    {activeTab === "pending" && <th className="px-4 py-3 text-center font-semibold">Pay</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayReferrals.map((r: any) => {
                    const sm = STATUS_META[r.status] ?? STATUS_META.pending;
                    return (
                      <tr key={r.id} className="hover:bg-surface/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{r.affiliates?.full_name ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{r.affiliates?.referral_code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{r.affiliates?.phone ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground">{r.affiliates?.city}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-foreground max-w-[120px] truncate">
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
                          <div className="text-[10px] text-muted-foreground font-normal">({r.commission_pct ?? 20}%)</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", sm.bg, sm.color)}>
                            {sm.label}
                          </span>
                          {r.status === "paid" && r.admin_note && (
                            <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{r.admin_note}</div>
                          )}
                        </td>
                        {activeTab === "pending" && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Input
                                placeholder="JazzCash/EP Txn ID"
                                className="text-[10px] h-7 rounded-lg w-32"
                                value={payRefs[r.id] ?? ""}
                                onChange={(e) => setPayRefs((p) => ({ ...p, [r.id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                disabled={payingId === r.id}
                                onClick={() => handleMarkPaid(r)}
                                className="h-7 text-[10px] bg-emerald-500 text-white font-bold rounded-lg px-2 gap-1"
                              >
                                {payingId === r.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                                Paid
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
