import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileCheck, Shield, Ticket, Globe2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatPKR } from "@/lib/services";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: AdminServicesMarketplace,
});

type Tab = "visa" | "insurance" | "tickets";

function AdminServicesMarketplace() {
  const [tab, setTab] = useState<Tab>("visa");

  const { data: totals } = useQuery({
    queryKey: ["admin-service-totals"],
    queryFn: async () => {
      const [visa, ins, tk, leads] = await Promise.all([
        supabase.from("visa_services").select("id", { count: "exact", head: true }),
        supabase.from("insurance_plans").select("id", { count: "exact", head: true }),
        supabase.from("ticket_services").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).neq("service_type", "tours"),
      ]);
      return {
        visa: visa.count ?? 0,
        insurance: ins.count ?? 0,
        tickets: tk.count ?? 0,
        service_leads: leads.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Services marketplace</h2>
        <p className="text-sm text-muted-foreground">Oversee visa, insurance and ticketing listings across every vendor.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi icon={<FileCheck className="size-4 text-sky-400" />} label="Visa listings" value={totals?.visa ?? "—"} />
        <Kpi icon={<Shield className="size-4 text-emerald-400" />} label="Insurance plans" value={totals?.insurance ?? "—"} />
        <Kpi icon={<Ticket className="size-4 text-amber-400" />} label="Ticketing services" value={totals?.tickets ?? "—"} />
        <Kpi icon={<Globe2 className="size-4 text-primary" />} label="Service leads" value={totals?.service_leads ?? "—"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="visa">Visa</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="visa" className="mt-4"><ListingsTable kind="visa" /></TabsContent>
        <TabsContent value="insurance" className="mt-4"><ListingsTable kind="insurance" /></TabsContent>
        <TabsContent value="tickets" className="mt-4"><ListingsTable kind="tickets" /></TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

const CONFIG = {
  visa: {
    table: "visa_services" as const,
    columns: ["Country · Type", "Processing", "All-in cost", "Vendor", "Status"],
    render: (r: Record<string, unknown>) => [
      `${r.country} · ${r.visa_type}`,
      `${r.processing_days} days`,
      formatPKR(Number(r.price_pkr ?? 0) + Number(r.service_fee_pkr ?? 0)),
    ],
  },
  insurance: {
    table: "insurance_plans" as const,
    columns: ["Plan", "Coverage", "Price", "Vendor", "Status"],
    render: (r: Record<string, unknown>) => [
      String(r.plan_name),
      `${r.coverage_type} · ${r.duration_days}d`,
      formatPKR(Number(r.price_pkr ?? 0)),
    ],
  },
  tickets: {
    table: "ticket_services" as const,
    columns: ["Service", "Route type", "Fee", "Vendor", "Status"],
    render: (r: Record<string, unknown>) => [
      String(r.service_name),
      String(r.route_type),
      formatPKR(Number(r.service_fee_pkr ?? 0)),
    ],
  },
};

function ListingsTable({ kind }: { kind: Tab }) {
  const cfg = CONFIG[kind];
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-services", kind],
    queryFn: async () => {
      const { data } = await supabase.from(cfg.table)
        .select("*, profiles:vendor_id(full_name, company_name)")
        .order("created_at", { ascending: false }).limit(100);
      return (data ?? []) as Record<string, unknown>[];
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
          <tr>{cfg.columns.map((c) => <th key={c} className="px-4 py-3 text-left">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading && <tr><td colSpan={cfg.columns.length} className="px-4 py-6"><Loader2 className="inline size-4 animate-spin" /></td></tr>}
          {!isLoading && data.length === 0 && <tr><td colSpan={cfg.columns.length} className="px-4 py-8 text-center text-muted-foreground">No listings yet.</td></tr>}
          {data.map((r) => {
            const cells = cfg.render(r);
            const profile = r.profiles as { full_name?: string; company_name?: string | null } | null;
            const vendor = profile?.company_name || profile?.full_name || "—";
            return (
              <tr key={String(r.id)} className="hover:bg-surface/30">
                {cells.map((c, i) => <td key={i} className="px-4 py-3">{c}</td>)}
                <td className="px-4 py-3 text-xs text-muted-foreground">{vendor}</td>
                <td className="px-4 py-3">
                  {r.is_active
                    ? <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">Live</Badge>
                    : <Badge variant="outline">Draft</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
