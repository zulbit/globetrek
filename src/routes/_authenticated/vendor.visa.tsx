import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, FileCheck, Sparkles, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  saveServiceListing, toggleServiceActive, deleteServiceListing,
} from "@/lib/services.functions";
import { cn } from "@/lib/utils";
import { lookupEmbassyFeeServer } from "@/lib/visa-ai.functions";
import {
  VISA_TYPES, POPULAR_VISA_COUNTRIES, DEFAULT_VISA_DOCS,
  formatPKR, formatEmbassyFee, isEmbassyFeeTBC, type VisaService,
} from "@/lib/services";

export const Route = createFileRoute("/_authenticated/vendor/visa")({
  component: VendorVisa,
});

type Draft = Partial<VisaService> & { documents_text?: string };

type AiSuggestion = {
  fee_pkr: number;
  confidence: string;
  source_note: string;
  disclaimer: string;
};

function emptyDraft(): Draft {
  return {
    country: "Turkey",
    visa_type: "Tourist",
    processing_days: 15,
    price_pkr: 25000,
    service_fee_pkr: 5000,
    success_rate: 95,
    description: "",
    extra_notes: "",
    documents_text: DEFAULT_VISA_DOCS.join("\n"),
    is_active: true,
  };
}

function VendorVisa() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(saveServiceListing);
  const toggle = useServerFn(toggleServiceActive);
  const remove = useServerFn(deleteServiceListing);
  const lookupFee = useServerFn(lookupEmbassyFeeServer);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: profile } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-profile-status", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("vendor_status")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const isApproved = profile?.vendor_status === "approved";

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["vendor-visa", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("visa_services")
        .select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VisaService[];
    },
  });

  function openNew() { setDraft(emptyDraft()); setEditingId(null); setAiSuggestion(null); setOpen(true); }
  function openEdit(r: VisaService) {
    setDraft({ ...r, documents_text: (r.documents_required ?? []).join("\n") });
    setEditingId(r.id);
    setAiSuggestion(null);
    setOpen(true);
  }

  const saveM = useMutation({
    mutationFn: async () => {
      const docs = (draft.documents_text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const shouldPublish = Boolean(draft.is_active ?? true);
      const finalActive = isApproved ? shouldPublish : false;

      if (shouldPublish && !isApproved) {
        toast.info("Setup Mode: Saved as Draft", {
          description: "Your visa service is saved. It will be published once GlobeTrek PK Admins approve your KYC verification.",
        });
      }

      const payload = {
        country: draft.country?.trim(),
        visa_type: draft.visa_type,
        processing_days: Number(draft.processing_days) || 15,
        price_pkr: Number(draft.price_pkr) || 0,
        service_fee_pkr: Number(draft.service_fee_pkr) || 0,
        success_rate: draft.success_rate === null ? null : Number(draft.success_rate),
        description: draft.description ?? "",
        extra_notes: draft.extra_notes || null,
        documents_required: docs,
        is_active: finalActive,
      };
      return save({ data: { serviceType: "visa", id: editingId ?? undefined, data: payload } });
    },
    onSuccess: () => {
      toast.success(editingId ? "Visa service updated" : "Visa service saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["vendor-visa"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggleM = useMutation({
    mutationFn: (r: VisaService) => {
      if (!r.is_active && !isApproved) {
        throw new Error("Agency Verification Required: Unverified vendors cannot publish live visa services. Submit your KYC on /vendor/kyc.");
      }
      return toggle({ data: { serviceType: "visa", id: r.id, is_active: !r.is_active } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-visa"] }),
    onError: (e: any) => toast.error(e.message || "Failed to toggle status"),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => remove({ data: { serviceType: "visa", id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["vendor-visa"] }); },
  });

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
  }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Visa services</p>
          <h2 className="mt-1 text-xl font-semibold">Country-wise visa filings</h2>
          <p className="text-sm text-muted-foreground">Show processing time, price and required documents to travelers.</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1.5 size-4" /> New visa service
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile label="Total listings" value={String(stats.total)} />
        <StatTile label="Active" value={String(stats.active)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Country · Type</th>
              <th className="px-4 py-3 text-left">Processing</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Success</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}><Loader2 className="inline size-4 animate-spin" /> Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                <FileCheck className="mx-auto mb-2 size-6 opacity-40" />
                No visa services yet — click <span className="text-foreground font-medium">New visa service</span>.
              </td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.country}</div>
                  <div className="text-xs text-muted-foreground">{r.visa_type}</div>
                </td>
                <td className="px-4 py-3 text-xs">{r.processing_days} days</td>
                <td className="px-4 py-3 text-xs">
                  {isEmbassyFeeTBC(r.price_pkr) ? (
                    <>
                      <div className="font-semibold text-amber-400">TBC</div>
                      <div className="text-muted-foreground">fee {formatPKR(r.service_fee_pkr)}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-highlight">{formatPKR(r.price_pkr + (r.service_fee_pkr ?? 0))}</div>
                      <div className="text-muted-foreground">fee {formatPKR(r.service_fee_pkr)}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{r.success_rate ? `${r.success_rate}%` : "—"}</td>
                <td className="px-4 py-3">
                  {r.is_active
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">Live</Badge>
                    : <Badge variant="outline" className="text-muted-foreground">Draft</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleM.mutate(r)} title={r.is_active ? "Unpublish" : "Publish"}>
                      {r.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this listing?")) removeM.mutate(r.id); }}>
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
        <DialogTrigger asChild><span /></DialogTrigger>
        <DialogContent className="max-w-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit visa service" : "New visa service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={draft.country} onValueChange={(v) => { setDraft({ ...draft, country: v }); setAiSuggestion(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POPULAR_VISA_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visa type</Label>
              <Select value={draft.visa_type} onValueChange={(v) => { setDraft({ ...draft, visa_type: v }); setAiSuggestion(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VISA_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <NumberField label="Processing days" value={draft.processing_days} onChange={(v) => setDraft({ ...draft, processing_days: v })} />
            <NumberField label="Success rate %" value={draft.success_rate ?? undefined} onChange={(v) => setDraft({ ...draft, success_rate: v })} />

            <div className="sm:col-span-2 rounded-xl border border-border bg-surface/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm">Embassy / visa-centre fee</Label>
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="mt-0.5 size-3 shrink-0 text-amber-400" />
                    Embassy fees change often (currency swings, VFS surcharges). If unsure,
                    tick <span className="text-foreground">To be communicated</span> — travelers see it and know to ask.
                  </p>
                </div>
                <Button
                  type="button" size="sm" variant="outline" disabled={aiBusy || !draft.country || !draft.visa_type}
                  onClick={async () => {
                    setAiBusy(true);
                    try {
                      const res = await lookupFee({ data: { country: draft.country!, visa_type: draft.visa_type! } });
                      if (res.fee_pkr && res.fee_pkr > 0) {
                        setAiSuggestion({
                          fee_pkr: res.fee_pkr,
                          confidence: res.confidence || "Unknown",
                          source_note: res.source_note || "",
                          disclaimer: res.disclaimer || "",
                        });
                        toast.success("AI lookup complete! Review the suggested fee details below.");
                      } else {
                        toast.warning("AI couldn't find a reliable fee — set manually or mark TBC.",
                          { description: res.source_note });
                      }
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "AI lookup failed");
                    } finally { setAiBusy(false); }
                  }}
                >
                  {aiBusy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Sparkles className="mr-1.5 size-3.5 text-amber-400" />}
                  AI lookup
                </Button>
              </div>

              {aiSuggestion && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4.5 space-y-3 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                      <Sparkles className="size-4 shrink-0 text-amber-400 animate-pulse" />
                      AI Suggested Fee: {formatPKR(aiSuggestion.fee_pkr)}
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold px-2 py-0.5 border-amber-500/40 bg-amber-500/20 text-amber-400">
                      {aiSuggestion.confidence} Confidence
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <p className="text-foreground leading-normal">
                      {aiSuggestion.source_note}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-normal italic">
                      Disclaimer: {aiSuggestion.disclaimer}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] hover:bg-surface/50 text-muted-foreground hover:text-foreground"
                      onClick={() => setAiSuggestion(null)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      onClick={() => {
                        const disclaimerText = "Please note: The embassy/visa fee is not final and may change due to currency fluctuations, VFS surcharges, and Embassy policies.";
                        setDraft((d) => {
                          const existingNotes = d.extra_notes?.trim();
                          const nextNotes = existingNotes 
                            ? `${existingNotes}\n\n${disclaimerText}` 
                            : disclaimerText;
                          return {
                            ...d,
                            price_pkr: aiSuggestion.fee_pkr,
                            extra_notes: nextNotes,
                          };
                        });
                        toast.success(`Applied AI suggestion of ${formatPKR(aiSuggestion.fee_pkr)}`);
                        setAiSuggestion(null);
                      }}
                    >
                      Accept Suggestion
                    </Button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isEmbassyFeeTBC(draft.price_pkr)}
                  onCheckedChange={(v) => setDraft({ ...draft, price_pkr: v ? 0 : 25000 })}
                />
                <span>Embassy fee <span className="text-foreground font-medium">to be communicated</span></span>
              </label>

              {!isEmbassyFeeTBC(draft.price_pkr) && (
                <NumberField
                  label="Embassy fee (PKR)"
                  value={draft.price_pkr}
                  onChange={(v) => setDraft({ ...draft, price_pkr: v })}
                />
              )}
            </div>

            <NumberField label="Service fee (PKR)" value={draft.service_fee_pkr} onChange={(v) => setDraft({ ...draft, service_fee_pkr: v })} />

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What travelers get, timelines, embassy relationship…" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Documents required (one per line)</Label>
              <Textarea rows={6} value={draft.documents_text ?? ""} onChange={(e) => setDraft({ ...draft, documents_text: e.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Extra notes (optional)</Label>
              <Textarea rows={2} value={draft.extra_notes ?? ""} onChange={(e) => setDraft({ ...draft, extra_notes: e.target.value })} />
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

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "sky" | "emerald" | "amber" }) {
  const c = tone === "sky" ? "text-sky-400" : tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : "";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
