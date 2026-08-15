import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  TICKET_ROUTE_TYPES, AIRLINES, formatPKR, type TicketService,
} from "@/lib/services";

export const Route = createFileRoute("/_authenticated/vendor/tickets")({
  component: VendorTickets,
});

type Draft = Partial<TicketService> & {
  routes_text?: string;
  airlines_text?: string;
};

function emptyDraft(): Draft {
  return {
    service_name: "International ticketing desk",
    route_type: "International",
    service_fee_pkr: 3500,
    refundable: false,
    description: "",
    airlines_text: "Emirates, Qatar Airways, Turkish Airlines, Saudia",
    routes_text: "KHI → IST | from 145000\nLHE → DXB | from 82000\nISB → BKK | from 128000",
    is_active: true,
  };
}

function parseRoutes(txt: string) {
  return txt.split("\n").map((line) => {
    const [route, price] = line.split("|").map((s) => s.trim());
    if (!route) return null;
    const [from, to] = route.split("→").map((s) => s?.trim());
    if (!from || !to) return null;
    const priceMatch = (price ?? "").match(/(\d[\d,]*)/);
    return { from, to, from_pkr: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : undefined };
  }).filter(Boolean) as { from: string; to: string; from_pkr?: number }[];
}

function VendorTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(saveServiceListing);
  const toggle = useServerFn(toggleServiceActive);
  const remove = useServerFn(deleteServiceListing);

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
    queryKey: ["vendor-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_services")
        .select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TicketService[];
    },
  });

  function openNew() { setDraft(emptyDraft()); setEditingId(null); setOpen(true); }
  function openEdit(r: TicketService) {
    setDraft({ ...r,
      airlines_text: (r.airlines_supported ?? []).join(", "),
      routes_text: (r.sample_routes ?? []).map((x) => `${x.from} → ${x.to}${x.from_pkr ? ` | from ${x.from_pkr}` : ""}`).join("\n"),
    });
    setEditingId(r.id); setOpen(true);
  }

  const saveM = useMutation({
    mutationFn: async () => {
      const airlines = (draft.airlines_text ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      const sample_routes = parseRoutes(draft.routes_text ?? "");
      const shouldPublish = Boolean(draft.is_active ?? true);
      const finalActive = isApproved ? shouldPublish : false;

      if (shouldPublish && !isApproved) {
        toast.info("Setup Mode: Saved as Draft", {
          description: "Your ticketing service is saved. It will be published once GlobeTrek PK Admins approve your KYC verification.",
        });
      }

      const payload = {
        service_name: draft.service_name?.trim(),
        route_type: draft.route_type,
        airlines_supported: airlines,
        service_fee_pkr: Number(draft.service_fee_pkr) || 0,
        refundable: !!draft.refundable,
        sample_routes,
        description: draft.description ?? "",
        is_active: finalActive,
      };
      return save({ data: { serviceType: "tickets", id: editingId ?? undefined, data: payload } });
    },
    onSuccess: () => { toast.success(editingId ? "Ticket service updated" : "Ticket service saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["vendor-tickets"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggleM = useMutation({
    mutationFn: (r: TicketService) => {
      if (!r.is_active && !isApproved) {
        throw new Error("Agency Verification Required: Unverified vendors cannot publish live ticketing desks. Submit your KYC on /vendor/kyc.");
      }
      return toggle({ data: { serviceType: "tickets", id: r.id, is_active: !r.is_active } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-tickets"] }),
    onError: (e: any) => toast.error(e.message || "Failed to toggle status"),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => remove({ data: { serviceType: "tickets", id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["vendor-tickets"] }); },
  });

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
  }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Ticketing</p>
          <h2 className="mt-1 text-xl font-semibold">Flight ticketing services</h2>
          <p className="text-sm text-muted-foreground">Advertise your ticketing desk with route pricing and airline coverage.</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1.5 size-4" /> New service
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile label="Total services" value={String(stats.total)} />
        <Tile label="Active" value={String(stats.active)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Route type</th>
              <th className="px-4 py-3 text-left">Airlines</th>
              <th className="px-4 py-3 text-left">Fee</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground"><Loader2 className="inline size-4 animate-spin" /></td></tr>}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                <Ticket className="mx-auto mb-2 size-6 opacity-40" />
                No ticketing services yet.
              </td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.service_name}</div>
                  <div className="text-xs text-muted-foreground">{r.refundable ? "Refundable" : "Non-refundable"}</div>
                </td>
                <td className="px-4 py-3 text-xs">{r.route_type}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[180px]">{(r.airlines_supported ?? []).slice(0, 3).join(", ")}{(r.airlines_supported ?? []).length > 3 ? "…" : ""}</td>
                <td className="px-4 py-3 text-xs font-semibold text-highlight">{formatPKR(r.service_fee_pkr)}</td>
                <td className="px-4 py-3">
                  {r.is_active
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">Live</Badge>
                    : <Badge variant="outline">Draft</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleM.mutate(r)}>{r.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this service?")) removeM.mutate(r.id); }}>
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
          <DialogHeader><DialogTitle>{editingId ? "Edit ticketing service" : "New ticketing service"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Service name</Label>
              <Input value={draft.service_name ?? ""} onChange={(e) => setDraft({ ...draft, service_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Route type</Label>
              <Select value={draft.route_type} onValueChange={(v) => setDraft({ ...draft, route_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TICKET_ROUTE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service fee (PKR)</Label>
              <Input type="number" value={draft.service_fee_pkr ?? ""} onChange={(e) => setDraft({ ...draft, service_fee_pkr: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Checkbox id="refundable" checked={!!draft.refundable} onCheckedChange={(v) => setDraft({ ...draft, refundable: !!v })} />
              <Label htmlFor="refundable" className="cursor-pointer">Tickets are refundable</Label>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Airlines supported (comma separated)</Label>
              <Input value={draft.airlines_text ?? ""} onChange={(e) => setDraft({ ...draft, airlines_text: e.target.value })} placeholder={AIRLINES.slice(0, 4).join(", ")} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Sample routes (one per line — <code className="text-xs">KHI → DXB | from 82000</code>)</Label>
              <Textarea rows={5} value={draft.routes_text ?? ""} onChange={(e) => setDraft({ ...draft, routes_text: e.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
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
