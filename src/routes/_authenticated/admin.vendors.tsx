import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Check, Ban, Plus, Minus, Clock, Phone, ShieldCheck, UserCheck, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getAdminVendors,
  updateAdminVendorStatus,
  updateAdminVendorCredits,
  updateAdminVendorTier,
  type VendorProfile,
} from "@/lib/vendors.functions";
import { getVendorKYCDetails } from "@/lib/kyc.functions";
import { sendTemplateWhatsAppMessage } from "@/lib/whatsapp.functions";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendors,
});

function AdminVendors() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "banned">("all");
  const [viewingKyc, setViewingKyc] = React.useState<string | null>(null);
  const [viewingKycName, setViewingKycName] = React.useState<string>("");

  const getKycFn = useServerFn(getVendorKYCDetails);

  const { data: kycDetails, isLoading: loadingKyc } = useQuery({
    queryKey: ["vendor-kyc-details", viewingKyc],
    enabled: !!viewingKyc,
    queryFn: () => getKycFn({ data: { userId: viewingKyc! } }),
  });

  const fetchVendorsFn = useServerFn(getAdminVendors);
  const setStatusFn = useServerFn(updateAdminVendorStatus);
  const setCreditsFn = useServerFn(updateAdminVendorCredits);
  const setTierFn = useServerFn(updateAdminVendorTier);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      try {
        const serverData = await fetchVendorsFn();
        if (serverData && serverData.length > 0) {
          return serverData;
        }
      } catch (e) {
        console.warn("[admin.vendors] Server function fetch error:", e);
      }

      // Fallback query directly from profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, vendor_status, subscription_tier, lead_credits_balance, created_at, city")
        .order("created_at", { ascending: false });

      return (profilesData ?? []).filter((p) => {
        if (p.company_name) return true;
        if (p.vendor_status === "pending") return true;
        if (p.email && p.email.toLowerCase().includes("vendor")) return true;
        if (p.email && !p.email.includes("customer.demo") && !p.email.includes("admin.demo")) return true;
        return false;
      }) as VendorProfile[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async (variables: {
      id: string;
      status: "approved" | "banned" | "pending";
      phone?: string | null;
      fullName?: string | null;
      companyName?: string | null;
      reason?: string;
    }) => {
      const { id, status, phone, fullName, companyName, reason } = variables;
      const res = await setStatusFn({ data: { id, status } });

      if (phone && (status === "approved" || status === "banned")) {
        try {
          const tplId = status === "approved"
            ? "vendor_application_approved"
            : "vendor_application_rejected";

          const vars: Record<string, string> = {
            vendor_name: fullName || "Vendor Partner",
            company_name: companyName || "Travel Agency",
          };

          if (status === "approved") {
            vars.portal_link = "https://globetrek.pk/auth";
          } else {
            vars.rejection_reason = reason || "Submitted documents could not be verified or DTS license expired.";
          }

          await sendTemplateWhatsAppMessage({
            data: {
              templateId: tplId,
              phone,
              variables: vars,
            }
          });
          toast.success("Verification alert sent via WhatsApp!");
        } catch (err) {
          console.warn("Failed to dispatch status alert:", err);
        }
      }

      return res;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === "approved" ? "Agency Approved & Verified!" : "Vendor Status Updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustCredits = useMutation({
    mutationFn: (data: { id: string; next: number }) => setCreditsFn({ data }),
    onSuccess: () => {
      toast.success("Credits updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setTier = useMutation({
    mutationFn: (data: { id: string; tier: "free" | "starter" | "pro" | "agency" }) => setTierFn({ data }),
    onSuccess: () => {
      toast.success("Subscription tier updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingVendors = (data ?? []).filter((v) => v.vendor_status === "pending");
  const filteredVendors = (data ?? []).filter((v) => filter === "all" || v.vendor_status === filter);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner: Pending Agency Approvals Notice */}
      {pendingVendors.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                <Clock className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Pending Vendor Approvals ({pendingVendors.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  New travel agencies waiting for license &amp; mobile verification.
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono">
              Action Required
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {pendingVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-xl border border-amber-500/30 bg-card p-4 space-y-2 text-xs shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground truncate max-w-[180px]">
                      {vendor.company_name || vendor.full_name || "New Travel Agency"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">{vendor.email}</p>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] uppercase font-bold">
                    Pending
                  </Badge>
                </div>

                {vendor.phone && (
                  <div className="flex items-center gap-1.5 text-primary font-mono text-[11px]">
                    <Phone className="size-3" />
                    <a
                      href={`https://wa.me/${vendor.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {vendor.phone} <MessageSquare className="size-2.5 text-emerald-400" />
                    </a>
                  </div>
                )}

                <div className="pt-2 flex gap-2 border-t border-border/50">
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: vendor.id, status: "approved" })}
                    className="w-full h-7 text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg gap-1"
                  >
                    <Check className="size-3" /> Approve Agency
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Vendor Table Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Registered Vendors Registry</h3>
          <p className="text-xs text-muted-foreground">Manage vendor status, lead credits, and account tiers.</p>
        </div>

        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs">
          {[
            { id: "all", label: `All (${data?.length ?? 0})` },
            { id: "pending", label: `Pending (${pendingVendors.length})` },
            { id: "approved", label: "Approved" },
            { id: "banned", label: "Banned" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filter === tab.id
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1.4fr_1.1fr_auto_auto_auto] gap-4 border-b border-border bg-surface/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Vendor &amp; Contact</div>
          <div>Agency / Company</div>
          <div>Tier</div>
          <div>Credits</div>
          <div className="text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading vendors…
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No vendors found matching filter.
          </div>
        ) : (
          filteredVendors.map((p) => (
            <VendorRow
              key={p.id}
              p={p}
              onStatus={(status, reason) => setStatus.mutate({
                id: p.id,
                status,
                phone: p.phone,
                fullName: p.full_name,
                companyName: p.company_name,
                reason,
              })}
              onCredits={(next) => adjustCredits.mutate({ id: p.id, next })}
              onTier={(tier) => setTier.mutate({ id: p.id, tier })}
              onViewKyc={() => {
                setViewingKyc(p.id);
                setViewingKycName(p.company_name || p.full_name || "Vendor");
              }}
            />
          ))
        )}
      </div>

      <Dialog open={!!viewingKyc} onOpenChange={(open) => { if (!open) setViewingKyc(null); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-400" />
              Agency Verification (KYC)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Submitted KYC documents for {viewingKycName}
            </DialogDescription>
          </DialogHeader>

          {loadingKyc ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading submitted details…
            </div>
          ) : !kycDetails ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No KYC submission record found for this vendor.
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {Object.entries(kycDetails).map(([key, val]) => {
                  const label = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={key} className="space-y-1 bg-surface/50 border border-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        {label}
                      </span>
                      <span className="text-foreground text-sm font-medium break-all">
                        {String(val || "—")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorRow({
  p, onStatus, onCredits, onTier, onViewKyc,
}: {
  p: VendorProfile;
  onStatus: (s: "approved" | "banned" | "pending") => void;
  onCredits: (next: number) => void;
  onTier: (t: "free" | "starter" | "pro" | "agency") => void;
  onViewKyc: () => void;
}) {
  const [draft, setDraft] = React.useState<string>(String(p.lead_credits_balance));
  React.useEffect(() => setDraft(String(p.lead_credits_balance)), [p.lead_credits_balance]);
  const isPro = p.subscription_tier === "pro";

  return (
    <div className="grid grid-cols-[1.4fr_1.1fr_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0 hover:bg-surface/30 transition">
      <div className="min-w-0">
        <div className="truncate font-bold text-foreground">{p.full_name || "Unnamed Vendor"}</div>
        <div className="truncate text-xs text-muted-foreground">{p.email}</div>
        {p.phone && (
          <div className="text-[11px] font-mono text-primary flex items-center gap-1 mt-0.5">
            <Phone className="size-2.5" />
            <a
              href={`https://wa.me/${p.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {p.phone}
            </a>
          </div>
        )}
        <span
          className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold ${
            p.vendor_status === "approved"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              : p.vendor_status === "banned"
                ? "border-destructive/40 bg-destructive/15 text-destructive"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300"
          }`}
        >
          {p.vendor_status === "approved" ? "Verified" : p.vendor_status}
        </span>
      </div>
      <div className="truncate text-xs font-semibold text-foreground">{p.company_name || "—"}</div>
      <div>
        <select
          value={p.subscription_tier || "free"}
          onChange={(e) => onTier(e.target.value as "free" | "starter" | "pro" | "agency")}
          className="h-8 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-hidden transition"
        >
          <option value="free">Free</option>
          <option value="starter">Travel Desk</option>
          <option value="pro">Tour Operator</option>
          <option value="agency">Full Agency</option>
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCredits(p.lead_credits_balance - 1)}
          className="rounded-md border border-border bg-surface p-1 hover:bg-surface/70"
          aria-label="Decrease"
        >
          <Minus className="size-3" />
        </button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={() => {
            const n = Number(draft || 0);
            if (n !== p.lead_credits_balance) onCredits(n);
          }}
          className="h-8 w-14 text-center tabular-nums text-xs"
        />
        <button
          onClick={() => onCredits(p.lead_credits_balance + 1)}
          className="rounded-md border border-border bg-surface p-1 hover:bg-surface/70"
          aria-label="Increase"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="flex justify-end gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={onViewKyc}
          className="h-7 text-xs font-semibold border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg px-2.5"
        >
          <FileText className="mr-1 size-3" /> View KYC
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("gtpk.impersonated_vendor_id", p.id);
              localStorage.setItem("gtpk.impersonated_vendor_company", p.company_name || p.full_name || "Impersonated Vendor");
              toast.success(`Impersonating ${p.company_name || p.full_name || "Vendor"}`);
              window.location.href = "/vendor";
            }
          }}
          className="h-7 text-xs font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg px-2.5"
        >
          <UserCheck className="mr-1 size-3" /> Login As
        </Button>
        {p.vendor_status !== "approved" && (
          <Button
            size="sm"
            onClick={() => onStatus("approved")}
            className="h-7 text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg px-2.5"
          >
            <Check className="mr-1 size-3" /> Approve
          </Button>
        )}
        {p.vendor_status !== "banned" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const reason = prompt("Enter rejection/ban reason for WhatsApp alert:", "Submitted documents could not be verified or DTS license expired.");
              if (reason !== null) {
                onStatus("banned", reason);
              }
            }}
            className="h-7 text-xs font-semibold border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg px-2.5"
          >
            <Ban className="mr-1 size-3" /> Ban
          </Button>
        )}
      </div>
    </div>
  );
}
