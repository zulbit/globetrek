import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  FileCheck,
  Globe2,
  Phone,
  Mail,
  User,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminCustomVisaLeadsServer,
  updateVisaLeadStatusServer,
  type CustomVisaLeadItem,
} from "@/lib/custom-visa-leads.functions";
import { formatPKR } from "@/lib/tours";

export const Route = createFileRoute("/_authenticated/admin/custom-visa")({
  head: () => ({
    meta: [
      { title: "Manage Custom Visa Leads · Admin Console" },
      { name: "description", content: "Oversee custom visa leads, applicant background checks, agency bids, and unlock transactions." },
    ],
  }),
  component: AdminCustomVisaPage,
});

interface UnlockedVisaVendor {
  vendor_id: string;
  purchased_at: string;
  amount_paid: number;
  profiles: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface AdminVisaLead extends CustomVisaLeadItem {
  unlocked_vendors?: UnlockedVisaVendor[];
  quotes?: Array<{
    id: string;
    vendor_name: string;
    quote_amount_pkr: number;
    estimated_processing_days: number;
    status: string;
    proposal_notes: string;
  }>;
  quote_count?: number;
}

function AdminCustomVisaPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const getLeadsFn = useServerFn(getAdminCustomVisaLeadsServer);
  const updateStatusFn = useServerFn(updateVisaLeadStatusServer);

  // -------- Query Custom Visa Leads for Admins --------
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-custom-visa-leads", filterStatus],
    queryFn: () => getLeadsFn({ data: { filterStatus } }) as Promise<AdminVisaLead[]>,
    refetchInterval: 5000,
  });

  // -------- Mutation to Update Lead Status --------
  const statusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: "verified" | "accepted" | "closed" }) => {
      await updateStatusFn({ data: { leadId, status } });
    },
    onSuccess: () => {
      toast.success("Visa lead status updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-custom-visa-leads"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update lead status");
    },
  });

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header and Filter */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Manage Custom Visa Leads</h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
              ₨ 750 / Unlock
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review applicant profiles, previous visa refusal details, agency unlocking history, and submitted proposals.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All Cases" },
            { id: "verified", label: "✅ Verified / Live" },
            { id: "accepted", label: "🎉 Accepted Proposal" },
            { id: "closed", label: "Closed" },
          ].map((st) => (
            <Button
              key={st.id}
              size="sm"
              variant={filterStatus === st.id ? "default" : "outline"}
              onClick={() => setFilterStatus(st.id)}
              className="text-xs rounded-xl h-8"
            >
              {st.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading custom visa applicant cases...
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
          No custom visa leads found matching this filter.
        </div>
      ) : (
        <div className="space-y-5">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6"
            >
              {/* Top Row: Country, Visa Type, and Status Actions */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
                      🌍 {l.destination_country} · {l.visa_category} Visa
                    </span>

                    {l.has_prior_rejection && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Prior Refusal Case
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-foreground">
                    {l.contact_name} ({l.customer_city || "Pakistan"}) — {l.applicant_profile || "Applicant"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Case ID: <code className="font-mono text-emerald-400">{l.id.slice(0, 8)}</code> · Submitted: {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {l.status !== "verified" && (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
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
                      <XCircle className="size-3.5 mr-1" /> Close Case
                    </Button>
                  </div>

                  <Badge
                    className={cn(
                      "capitalize text-xs font-semibold rounded-full px-3 py-1 border-0",
                      l.status === "verified" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                      l.status === "accepted" && "bg-primary/20 text-primary border border-primary/40 font-bold",
                      l.status === "closed" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {l.status === "verified" ? "✅ Live & Bidding" : l.status === "accepted" ? "🎉 Proposal Accepted" : l.status}
                  </Badge>
                </div>
              </div>

              {/* Middle Row: Case Specifics & Contacts */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Applicant Case Specifics */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Applicant Profile &amp; Submission Profile
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe2 className="size-4 text-primary shrink-0" />
                      <span>Destination: <strong className="text-foreground">{l.destination_country}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck className="size-4 text-primary shrink-0" />
                      <span>Category: <strong className="text-foreground">{l.visa_category}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="size-4 text-primary shrink-0" />
                      <span>Profile: <strong className="text-foreground">{l.applicant_profile}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="size-4 text-primary shrink-0" />
                      <span>Bank Statement: <strong className="text-foreground">{l.bank_statement_status}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 text-primary shrink-0" />
                      <span>Submission Office: <strong className="text-foreground">{l.submission_office}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="size-4 text-primary shrink-0" />
                      <span>Mode: <strong className="text-foreground">{l.consultation_mode}</strong></span>
                    </div>
                  </div>

                  {l.has_prior_rejection && l.rejection_details && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 text-xs text-red-300 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5" /> Previous Refusal Background:
                      </p>
                      <p className="italic">"{l.rejection_details}"</p>
                    </div>
                  )}

                  {l.special_notes && (
                    <div className="bg-surface/50 border border-border/60 rounded-2xl p-3.5 text-xs italic text-muted-foreground">
                      "{l.special_notes}"
                    </div>
                  )}
                </div>

                {/* Contact info (always accessible to admin) */}
                <div className="space-y-4 border-t border-border pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Direct Traveler Contacts
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{l.contact_name}</span>
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

              {/* Bottom Row: Unlocked Visa Agents & Submitted Proposals */}
              <div className="border-t border-border pt-4 bg-surface/30 -mx-6 -mb-6 p-6 rounded-b-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="size-4 text-emerald-400" />
                    Unlocked by {l.unlocked_vendors?.length ?? 0} Visa Consultants
                  </h3>

                  <span className="text-[11px] font-mono text-muted-foreground">
                    Total Unlock Revenue: <strong className="text-emerald-400 font-bold">{formatPKR((l.unlocked_vendors?.length ?? 0) * 750)}</strong>
                  </span>
                </div>

                {l.unlocked_vendors && l.unlocked_vendors.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {l.unlocked_vendors.map((uv) => (
                      <div
                        key={uv.vendor_id}
                        className="flex items-center justify-between border border-border bg-card p-3 rounded-2xl text-xs shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{uv.profiles?.full_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Unlocked: {new Date(uv.purchased_at).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={`tel:${uv.profiles?.phone || ""}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline text-[10px] font-bold"
                        >
                          <Phone className="size-3" /> {uv.profiles?.phone || "Contact"}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No visa consultants have unlocked this applicant case yet.
                  </p>
                )}

                {/* Submitted Quotes / Proposals */}
                {l.quotes && l.quotes.length > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-primary" /> Submitted Proposals ({l.quotes.length}):
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {l.quotes.map((q) => (
                        <div key={q.id} className="p-3 rounded-xl border border-border bg-card/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{q.vendor_name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono text-emerald-400">
                              {formatPKR(q.quote_amount_pkr)} · ~{q.estimated_processing_days}d
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic">"{q.proposal_notes}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
