import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Loader2, Lock, MessageCircle, Phone, Globe2, FileCheck, Shield, Ticket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/vendor/leads")({
  component: VendorLeads,
});

type ServiceType = "tours" | "visa" | "insurance" | "tickets";

interface LeadRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string | null;
  is_unlocked: boolean;
  created_at: string;
  service_type: ServiceType;
  service_id: string;
  tours: { title: string } | null;
}

const SVC = {
  tours:     { label: "Tour",      icon: Globe2,    tone: "text-primary bg-primary/15" },
  visa:      { label: "Visa",      icon: FileCheck, tone: "text-sky-400 bg-sky-500/15" },
  insurance: { label: "Insurance", icon: Shield,    tone: "text-emerald-400 bg-emerald-500/15" },
  tickets:   { label: "Tickets",   icon: Ticket,    tone: "text-amber-400 bg-amber-500/15" },
} as const;

function VendorLeads() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | ServiceType>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-leads-poly"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_phone, message, is_unlocked, created_at, service_type, service_id, tours(title)")
        .eq("vendor_id", u.user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeadRow[];
    },
    refetchInterval: 3000,
  });

  // Supabase Realtime Subscription for Instant Leads Inbox Update
  useEffect(() => {
    let channel: any;
    async function initRealtime() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const vendorId = u.user.id;

      channel = supabase
        .channel(`leads-inbox-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "leads",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload: any) => {
            const lead = payload.new;
            const serviceTypeFormatted = (lead.service_type || "Service").toUpperCase();
            toast.success(`🎉 New ${serviceTypeFormatted} Inquiry Received!`, {
              description: `New lead from ${lead.customer_name || "Customer"} (${lead.customer_phone || "Contact"})`,
              duration: 10000,
            });
            qc.invalidateQueries({ queryKey: ["vendor-leads-poly"] });
            qc.invalidateQueries({ queryKey: ["vendor-overview"] });
          }
        )
        .subscribe();
    }

    initRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  const filtered = useMemo(() => {
    const list = data ?? [];
    return tab === "all" ? list : list.filter((l) => l.service_type === tab);
  }, [data, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, tours: 0, visa: 0, insurance: 0, tickets: 0 };
    (data ?? []).forEach((l) => { c.all++; c[l.service_type ?? "tours"] = (c[l.service_type ?? "tours"] ?? 0) + 1; });
    return c;
  }, [data]);



  function waLink(phone: string, subject: string) {
    const digits = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hi! Following up about your interest in ${subject}.`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all">All · {counts.all ?? 0}</TabsTrigger>
          <TabsTrigger value="tours">Tours · {counts.tours ?? 0}</TabsTrigger>
          <TabsTrigger value="visa">Visa · {counts.visa ?? 0}</TabsTrigger>
          <TabsTrigger value="insurance">Insurance · {counts.insurance ?? 0}</TabsTrigger>
          <TabsTrigger value="tickets">Tickets · {counts.tickets ?? 0}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[110px_1.2fr_1fr_1.1fr_auto] gap-4 border-b border-border bg-surface/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Service</div>
          <div>Customer</div>
          <div>Subject</div>
          <div>Phone</div>
          <div className="text-right">Action</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No leads yet in this category.
          </div>
        ) : (
          filtered.map((l) => {
            const meta = SVC[l.service_type ?? "tours"];
            const Icon = meta.icon;
            const subject = l.tours?.title ?? `${meta.label} inquiry`;
            return (
              <div key={l.id} className="grid grid-cols-[110px_1.2fr_1fr_1.1fr_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0">
                <Badge variant="outline" className={`w-fit rounded-full border-transparent ${meta.tone}`}>
                  <Icon className="mr-1 size-3" /> {meta.label}
                </Badge>
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.customer_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()} · {l.message ? l.message.slice(0, 60) : "No message"}
                  </div>
                </div>
                <div className="truncate text-xs text-muted-foreground">{subject}</div>
                <div className="font-mono text-xs">
                  <span className="text-foreground">{l.customer_phone}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <a href={`tel:${l.customer_phone}`} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface/70">
                    <Phone className="size-3.5" /> Call
                  </a>
                  <a href={waLink(l.customer_phone, subject)} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/25">
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
