import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  saveServiceListing, toggleServiceActive, deleteServiceListing,
} from "@/lib/services.functions";
import {
  INSURANCE_COVERAGE, DEFAULT_INSURANCE_BENEFITS, formatPKR, type InsurancePlan,
} from "@/lib/services";

export const Route = createFileRoute("/_authenticated/vendor/insurance")({
  component: VendorInsurance,
});

type Draft = Partial<InsurancePlan> & { benefits_text?: string; exclusions_text?: string };

function emptyDraft(): Draft {
  return {
    plan_name: "Schengen Traveller Silver",
    coverage_type: "Schengen",
    coverage_amount_pkr: 8_000_000,
    duration_days: 30,
    price_pkr: 6500,
    age_min: 18,
    age_max: 65,
    description: "",
    benefits_text: DEFAULT_INSURANCE_BENEFITS.join("\n"),
    exclusions_text: "Pre-existing conditions\nHigh-risk sports (unless add-on)",
    is_active: true,
  };
}

function VendorInsurance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(saveServiceListing);
  const toggle = useServerFn(toggleServiceActive);
  const remove = useServerFn(deleteServiceListing);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-insurance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans")
        .select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InsurancePlan[];
    },
  });

  function openNew() { setDraft(emptyDraft()); setEditingId(null); setOpen(true); }
  function openEdit(r: InsurancePlan) {
    setDraft({ ...r,
      benefits_text: (r.benefits ?? []).join("\n"),
      exclusions_text: (r.exclusions ?? []).join("\n"),
    });
    setEditingId(r.id); setOpen(true);
  }

  const saveM = useMutation({
    mutationFn: async () => {
      const benefits = (draft.benefits_text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const exclusions = (draft.exclusions_text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const payload = {
        plan_name: draft.plan_name?.trim(),
        coverage_type: draft.coverage_type,
        coverage_amount_pkr: Number(draft.coverage_amount_pkr) || 0,
        duration_days: Number(draft.duration_days) || 30,
        price_pkr: Number(draft.price_pkr) || 0,
        age_min: Number(draft.age_min) || 0,
        age_max: Number(draft.age_max) || 99,
        description: draft.description ?? "",
        benefits, exclusions,
        is_active: draft.is_active ?? true,
      };
      return save({ data: { serviceType: "insurance", id: editingId ?? undefined, data: payload } });
    },
    onSuccess: () => { toast.success(editingId ? "Plan updated" : "Plan listed"); setOpen(false); qc.invalidateQueries({ queryKey: ["vendor-insurance"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggleM = useMutation({
    mutationFn: (r: InsurancePlan) => toggle({ data: { serviceType: "insurance", id: r.id, is_active: !r.is_active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-insurance"] }),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => remove({ data: { serviceType: "insurance", id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["vendor-insurance"] }); },
  });

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
  }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Travel insurance</p>
          <h2 className="mt-1 text-xl font-semibold">Insurance plans</h2>
          <p className="text-sm text-muted-foreground">Schengen, medical, adventure — priced and paid in PKR.</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1.5 size-4" /> New plan
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Total plans" value={String(stats.total)} />
        <Tile label="Active" value={String(stats.active)} />
        <Tile label="Category fee" value={`${formatPKR(200)} / unlock`} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Coverage</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground"><Loader2 className="inline size-4 animate-spin" /></td></tr>}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                <Shield className="mx-auto mb-2 size-6 opacity-40" />
                No insurance plans yet.
              </td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.plan_name}</div>
                  <div className="text-xs text-muted-foreground">{r.coverage_type} · Age {r.age_min}-{r.age_max}</div>
                </td>
                <td className="px-4 py-3 text-xs">{formatPKR(r.coverage_amount_pkr)}</td>
                <td className="px-4 py-3 text-xs">{r.duration_days} days</td>
                <td className="px-4 py-3 text-xs font-semibold text-highlight">{formatPKR(r.price_pkr)}</td>
                <td className="px-4 py-3">
                  {r.is_active
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">Live</Badge>
                    : <Badge variant="outline">Draft</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleM.mutate(r)}>{r.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this plan?")) removeM.mutate(r.id); }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-border bg-card">
          <DialogHeader><DialogTitle>{editingId ? "Edit plan" : "New insurance plan"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Plan name</Label>
              <Input value={draft.plan_name ?? ""} onChange={(e) => setDraft({ ...draft, plan_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Coverage type</Label>
              <Select value={draft.coverage_type} onValueChange={(v) => setDraft({ ...draft, coverage_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INSURANCE_COVERAGE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <NumField label="Coverage amount (PKR)" value={draft.coverage_amount_pkr} onChange={(v) => setDraft({ ...draft, coverage_amount_pkr: v })} />
            <NumField label="Duration (days)" value={draft.duration_days} onChange={(v) => setDraft({ ...draft, duration_days: v })} />
            <NumField label="Price (PKR)" value={draft.price_pkr} onChange={(v) => setDraft({ ...draft, price_pkr: v })} />
            <NumField label="Age min" value={draft.age_min} onChange={(v) => setDraft({ ...draft, age_min: v })} />
            <NumField label="Age max" value={draft.age_max} onChange={(v) => setDraft({ ...draft, age_max: v })} />
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Benefits (one per line)</Label>
              <Textarea rows={6} value={draft.benefits_text ?? ""} onChange={(e) => setDraft({ ...draft, benefits_text: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Exclusions (one per line)</Label>
              <Textarea rows={6} value={draft.exclusions_text ?? ""} onChange={(e) => setDraft({ ...draft, exclusions_text: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saveM.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
