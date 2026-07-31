import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Inbox,
  Phone,
  Globe2,
  FileCheck,
  Shield,
  Ticket,
  Compass,
  Calendar,
  Search,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [{ title: "Leads Management — GlobeTrek Admin" }],
  }),
  component: AdminLeads,
});

type ServiceType = "tours" | "visa" | "insurance" | "tickets";
type LeadStatus = "new" | "contacted" | "converted" | "closed";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string | null;
  notes: string | null;
  service_type: ServiceType;
  service_id: string | null;
  status: LeadStatus;
  created_at: string;
  vendor_id: string | null;
  vendor_name: string | null;
}

const SVC: Record<ServiceType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  tours:     { label: "Tour",      icon: Globe2,    color: "text-violet-400",  bg: "bg-violet-500/15 border-violet-500/30" },
  visa:      { label: "Visa",      icon: FileCheck, color: "text-sky-400",     bg: "bg-sky-500/15 border-sky-500/30" },
  insurance: { label: "Insurance", icon: Shield,    color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  tickets:   { label: "Tickets",   icon: Ticket,    color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30" },
};

const STATUS: Record<LeadStatus, { label: string; icon: React.ElementType; color: string }> = {
  new:       { label: "New",       icon: Clock,         color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  contacted: { label: "Contacted", icon: MessageCircle, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  converted: { label: "Converted", icon: CheckCircle2,  color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  closed:    { label: "Closed",    icon: XCircle,       color: "text-muted-foreground bg-muted/40 border-border/30" },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AdminLeads() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState<"all" | ServiceType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | LeadStatus>("all");

  const { data: leads = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      // Fetch leads with vendor profile (vendor_id → profiles)
      // NOTE: service_id is polymorphic so we cannot join tours directly
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_phone, message, notes, service_type, service_id, status, created_at, vendor_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Fetch vendor names separately to avoid FK join issues
      const vendorIds = [...new Set((data ?? []).map((l: any) => l.vendor_id).filter(Boolean))];
      let vendorMap: Record<string, string> = {};
      if (vendorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, company_name, full_name")
          .in("id", vendorIds);
        (profiles ?? []).forEach((p: any) => {
          vendorMap[p.id] = p.company_name || p.full_name || "Vendor";
        });
      }

      return (data ?? []).map((l: any) => ({
        ...l,
        vendor_name: l.vendor_id ? (vendorMap[l.vendor_id] ?? "Unknown Vendor") : "—",
      })) as Lead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      l.customer_name?.toLowerCase().includes(q) ||
      l.customer_phone?.includes(q) ||
      l.message?.toLowerCase().includes(q);
    const matchSvc = filterService === "all" || l.service_type === filterService;
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchQ && matchSvc && matchStatus;
  });

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    today: leads.filter((l) => {
      const d = new Date(l.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-violet-400" />
            Customer Leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All inquiries captured by the AI Concierge chat and service booking forms.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>


      {/* Summary stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Leads", value: stats.total, color: "text-foreground" },
          { label: "New", value: stats.new, color: "text-blue-400" },
          { label: "Contacted", value: stats.contacted, color: "text-amber-400" },
          { label: "Converted", value: stats.converted, color: "text-emerald-400" },
          { label: "Today", value: stats.today, color: "text-violet-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <div className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={filterService} onValueChange={(v) => setFilterService(v as any)}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="tours">🌍 Tours</SelectItem>
            <SelectItem value="visa">📄 Visa</SelectItem>
            <SelectItem value="insurance">🛡️ Insurance</SelectItem>
            <SelectItem value="tickets">✈️ Tickets</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">🆕 New</SelectItem>
            <SelectItem value="contacted">📞 Contacted</SelectItem>
            <SelectItem value="converted">✅ Converted</SelectItem>
            <SelectItem value="closed">❌ Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {leads.length} leads
        </span>
      </div>

      {/* Leads table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
          <p className="text-sm font-medium">Failed to load leads</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
          <Inbox className="h-8 w-8 opacity-30" />
          <p className="text-sm">No leads match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const svc = SVC[lead.service_type] ?? SVC.tours;
                  const SvcIcon = svc.icon;
                  const st = STATUS[lead.status as LeadStatus] ?? STATUS.new;
                  const StIcon = st.icon;
                  const vendorName = (lead.profiles as any)?.company_name || (lead.profiles as any)?.full_name || "—";

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        "border-b border-border/50 transition hover:bg-surface-2/40",
                        i % 2 === 0 ? "bg-card" : "bg-card/60"
                      )}
                    >
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{lead.customer_name || "Unknown"}</div>
                        <a
                          href={`https://wa.me/${lead.customer_phone?.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-0.5"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.customer_phone}
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        </a>
                      </td>

                      {/* Service type */}
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", svc.bg, svc.color)}>
                          <SvcIcon className="h-3 w-3" />
                          {svc.label}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-xs text-muted-foreground" title={lead.message ?? ""}>
                          {lead.message || lead.notes || <em className="opacity-40">No message</em>}
                        </p>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{lead.vendor_name ?? "—"}</span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {relativeTime(lead.created_at)}
                        </div>
                      </td>

                      {/* Status selector */}
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status ?? "new"}
                          onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v as LeadStatus })}
                        >
                          <SelectTrigger className={cn("h-7 w-32 text-[11px] border rounded-full px-2.5", st.color)}>
                            <StIcon className="h-3 w-3 shrink-0" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">🆕 New</SelectItem>
                            <SelectItem value="contacted">📞 Contacted</SelectItem>
                            <SelectItem value="converted">✅ Converted</SelectItem>
                            <SelectItem value="closed">❌ Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Link to Custom Tour Leads */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <Compass className="h-4 w-4 text-sky-400" />
            Custom Group Tour Requests
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Exclusive group builder requests submitted through the Custom Tour portal
          </p>
        </div>
        <Link
          to="/admin/custom-leads"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2 transition"
        >
          View Custom Leads <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
