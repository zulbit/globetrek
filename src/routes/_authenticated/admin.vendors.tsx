import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Ban, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendors,
});

interface VendorProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  vendor_status: string;
  subscription_tier: string;
  lead_credits_balance: number;
}

function AdminVendors() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles:profiles!user_roles_user_id_fkey(id, email, full_name, company_name, vendor_status, subscription_tier, lead_credits_balance, created_at)")
        .eq("role", "vendor");
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as unknown as { profiles: VendorProfile | null }).profiles)
        .filter((p): p is VendorProfile => !!p);
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "banned" | "pending" }) => {
      const { error } = await supabase.from("profiles").update({ vendor_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vendor updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustCredits = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: number }) => {
      const { error } = await supabase.from("profiles").update({ lead_credits_balance: Math.max(0, next) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setTier = useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: "free" | "pro" }) => {
      const { error } = await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscription tier updated");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[1.3fr_1fr_auto_auto_auto] gap-4 border-b border-border bg-surface/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Vendor</div>
        <div>Company</div>
        <div>Tier</div>
        <div>Credits</div>
        <div className="text-right">Actions</div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No vendors registered.</div>
      ) : (
        data!.map((p) => (
          <VendorRow
            key={p.id}
            p={p}
            onStatus={(status) => setStatus.mutate({ id: p.id, status })}
            onCredits={(next) => adjustCredits.mutate({ id: p.id, next })}
            onTier={(tier) => setTier.mutate({ id: p.id, tier })}
          />
        ))
      )}
    </div>
  );
}

function VendorRow({
  p, onStatus, onCredits, onTier,
}: {
  p: VendorProfile;
  onStatus: (s: "approved" | "banned" | "pending") => void;
  onCredits: (next: number) => void;
  onTier: (t: "free" | "pro") => void;
}) {
  const [draft, setDraft] = React.useState<string>(String(p.lead_credits_balance));
  React.useEffect(() => setDraft(String(p.lead_credits_balance)), [p.lead_credits_balance]);
  const isPro = p.subscription_tier === "pro";

  return (
    <div className="grid grid-cols-[1.3fr_1fr_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0">
      <div className="min-w-0">
        <div className="truncate font-medium">{p.full_name || "Unnamed"}</div>
        <div className="truncate text-xs text-muted-foreground">{p.email}</div>
        <span
          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${
            p.vendor_status === "approved"
              ? "border-primary/40 bg-primary/15 text-primary"
              : p.vendor_status === "banned"
                ? "border-destructive/40 bg-destructive/15 text-destructive"
                : "border-highlight/40 bg-highlight/15 text-highlight"
          }`}
        >
          {p.vendor_status}
        </span>
      </div>
      <div className="truncate text-xs text-muted-foreground">{p.company_name || "—"}</div>
      <div>
        <button
          onClick={() => onTier(isPro ? "free" : "pro")}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isPro
              ? "border-highlight/40 bg-highlight/15 text-highlight"
              : "border-border bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          {isPro ? "PRO" : "Free"}
        </button>
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
          className="h-8 w-14 text-center tabular-nums"
        />
        <button
          onClick={() => onCredits(p.lead_credits_balance + 1)}
          className="rounded-md border border-border bg-surface p-1 hover:bg-surface/70"
          aria-label="Increase"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onStatus("approved")}
          className="border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
        >
          <Check className="mr-1 size-3.5" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onStatus("banned")}
          className="border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25"
        >
          <Ban className="mr-1 size-3.5" /> Ban
        </Button>
      </div>
    </div>
  );
}
