import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Calendar,
  Users,
  Compass,
  Briefcase,
  Layers,
  Phone,
  Mail,
  User,
  ExternalLink,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/custom-leads")({
  component: AdminCustomLeads,
});

interface UnlockedVendor {
  vendor_id: string;
  purchased_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface AdminLead {
  id: string;
  departure_city: string;
  destination: string;
  travel_month: string;
  duration_days: number;
  group_size: number;
  group_type: string;
  hotel_tier: string;
  visa_needed: boolean;
  insurance_needed: boolean;
  flight_class: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  special_requests: string | null;
  status: string;
  created_at: string;
  unlocked_vendors?: UnlockedVendor[];
}

function AdminCustomLeads() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // -------- Query Custom Leads for Admins --------
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-custom-leads", filterStatus],
    queryFn: async () => {
      // 1. Fetch leads
      let query = supabase
        .from("custom_tour_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      const leadsList = data as AdminLead[];

      if (leadsList.length === 0) return [];

      // 2. Fetch unlock info
      const leadIds = leadsList.map((l) => l.id);
      const { data: unlocks, error: unlockErr } = await supabase
        .from("vendor_lead_purchases")
        .select("lead_id, vendor_id, purchased_at, profiles(full_name, email)")
        .in("lead_id", leadIds);

      if (unlockErr) {
        console.error("Failed to load unlock list:", unlockErr);
        return leadsList;
      }

      // Map unlocks into leads
      const unlockMap: Record<string, UnlockedVendor[]> = {};
      (unlocks ?? []).forEach((u: any) => {
        if (!unlockMap[u.lead_id]) unlockMap[u.lead_id] = [];
        unlockMap[u.lead_id].push({
          vendor_id: u.vendor_id,
          purchased_at: u.purchased_at,
          profiles: {
            full_name: u.profiles?.full_name || "Unknown",
            email: u.profiles?.email || "",
          },
        });
      });

      return leadsList.map((l) => ({
        ...l,
        unlocked_vendors: unlockMap[l.id] || [],
      }));
    },
    refetchInterval: 5000,
  });

  // -------- Mutation to Update Lead Status --------
  const statusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from("custom_tour_leads")
        .update({ status })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead status updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-custom-leads"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update lead status");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Manage Custom Tour Leads</h1>
          <p className="text-xs text-muted-foreground">
            Review custom itineraries, traveler contacts, and vendor unlocks.
          </p>
        </div>

        <div className="flex gap-2">
          {[
            { id: "all", label: "All Leads" },
            { id: "unverified", label: "⚠️ Unverified (Action Needed)" },
            { id: "verified", label: "✅ Verified / Live" },
            { id: "accepted", label: "🎉 Accepted" },
            { id: "closed", label: "Closed" },
          ].map((st) => (
            <Button
              key={st.id}
              size="sm"
              variant={filterStatus === st.id ? "default" : "outline"}
              onClick={() => setFilterStatus(st.id)}
              className="text-xs rounded-xl"
            >
              {st.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading custom tour leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
          No custom tour leads found matching this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6"
            >
              {/* Top Row: Logistics and Status Badge */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    ✈️ {l.departure_city} → {l.destination}
                  </span>
                  <h2 className="text-lg font-bold">Custom Group Package to {l.destination}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted: {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {l.status === "unverified" && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                        onClick={() => statusMutation.mutate({ leadId: l.id, status: "verified" })}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Approve &amp; Publish to Marketplace
                      </Button>
                    )}
                    {l.status !== "verified" && l.status !== "unverified" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => statusMutation.mutate({ leadId: l.id, status: "verified" })}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Publish Live
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => statusMutation.mutate({ leadId: l.id, status: "closed" })}
                      disabled={l.status === "closed" || statusMutation.isPending}
                    >
                      <XCircle className="size-3.5 mr-1" /> Close
                    </Button>
                  </div>

                  <Badge
                    className={cn(
                      "capitalize text-xs font-semibold rounded-full px-3 py-1 border-0",
                      l.status === "unverified" && "bg-amber-500/20 text-amber-400 border border-amber-500/40",
                      (l.status === "verified" || l.status === "pending") && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                      l.status === "accepted" && "bg-primary/20 text-primary border border-primary/40 font-bold",
                      l.status === "closed" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {l.status === "unverified" ? "⚠️ Unverified" : l.status === "verified" ? "✅ Verified" : l.status}
                  </Badge>
                </div>
              </div>

              {/* Middle Row: Content Split */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Custom Tour Details */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Itinerary Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 text-primary shrink-0" />
                      <span>Month: <strong className="text-foreground capitalize">{l.travel_month}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-4 text-primary shrink-0" />
                      <span>Group: <strong className="text-foreground capitalize">{l.group_size} ({l.group_type})</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Compass className="size-4 text-primary shrink-0" />
                      <span>Duration: <strong className="text-foreground">{l.duration_days} Days</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="size-4 text-primary shrink-0" />
                      <span>Hotel Tier: <strong className="text-foreground capitalize">{l.hotel_tier.replace("star", " ★")}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <Layers className="size-4 text-primary shrink-0" />
                      <span>Requirements: <strong className="text-foreground capitalize">{[
                        l.flight_class ? `${l.flight_class} flight` : null,
                        l.visa_needed ? "Visa help" : null,
                        l.insurance_needed ? "Insurance" : null,
                      ].filter(Boolean).join(", ") || "None"}</strong></span>
                    </div>
                  </div>

                  {l.special_requests && (
                    <div className="bg-surface/50 border border-border/60 rounded-xl p-4 text-xs italic text-muted-foreground">
                      "{l.special_requests}"
                    </div>
                  )}
                </div>

                {/* Contact info (always visible to admin) */}
                <div className="space-y-4 border-t border-border pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Traveler Contacts
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-semibold">{l.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <a href={`mailto:${l.contact_email}`} className="text-primary hover:underline font-mono text-xs">
                        {l.contact_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <a href={`tel:${l.contact_phone}`} className="text-primary hover:underline font-mono text-xs font-bold">
                        {l.contact_phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Unlocked Vendors history */}
              <div className="border-t border-border pt-4 bg-surface/30 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <DollarSign className="size-4 text-amber-500" />
                  Unlocked by {l.unlocked_vendors?.length ?? 0} Vendors
                </h3>

                {l.unlocked_vendors && l.unlocked_vendors.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {l.unlocked_vendors.map((uv) => (
                      <div
                        key={uv.vendor_id}
                        className="flex items-center justify-between border border-border bg-card p-3 rounded-xl text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{uv.profiles?.full_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Unlocked: {new Date(uv.purchased_at).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={`mailto:${uv.profiles?.email}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline text-[10px] font-bold"
                        >
                          <Mail className="size-3" /> {uv.profiles?.email}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This lead has not been purchased by any vendors yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
