import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plane,
  Calendar,
  Users,
  Building,
  CheckCircle2,
  Phone,
  MessageCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Star,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCustomerQuotesByToken, acceptLeadQuote } from "@/lib/custom-tour-leads.functions";

export const Route = createFileRoute("/customer/quotes")({
  component: CustomerQuotesPortal,
});

function CustomerQuotesPortal() {
  const search = useSearch({ from: "/customer/quotes" }) as { token?: string };
  const token = search.token || "";
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-quotes", token],
    queryFn: () => getCustomerQuotesByToken({ data: { token } }),
    enabled: Boolean(token),
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => acceptLeadQuote({ data: { quoteId, token } }),
    onSuccess: (res) => {
      toast.success(res.message || "Quote accepted!");
      qc.invalidateQueries({ queryKey: ["customer-quotes", token] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to accept quote.");
    },
  });

  if (!token) {
    return (
      <div className="container max-w-xl mx-auto py-20 px-4 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-4">
          <Plane className="size-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Access Token Required</h1>
          <p className="text-sm text-muted-foreground">
            Please use the secure link sent to your WhatsApp or Email to view your tour quotations.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-20 px-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading your custom tour quotations...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-xl mx-auto py-20 px-4 text-center">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 shadow-card space-y-3">
          <h1 className="text-xl font-bold text-destructive">Invalid or Expired Link</h1>
          <p className="text-xs text-muted-foreground">
            {(error as Error)?.message || "We could not find quotations for this link."}
          </p>
        </div>
      </div>
    );
  }

  const { lead, quotes } = data;
  const isAccepted = lead.status === "accepted";
  const acceptedQuote = quotes.find((q: any) => q.status === "accepted");

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="container max-w-5xl mx-auto space-y-8">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-400/10 blur-3xl" />
          
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold px-3 py-1">
                ✈️ Custom Tour Request
              </Badge>
              <Badge variant={isAccepted ? "default" : "outline"} className="rounded-full">
                {isAccepted ? "🎉 Quote Accepted & Reserved" : `${quotes.length} Quotes Received`}
              </Badge>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Custom Group Tour to {lead.destination}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Prepared for <strong className="text-foreground">{lead.contact_name}</strong> · Submitted on {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Request Summary Pills */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-xl bg-surface/80 px-3 py-1.5 border border-border">
                <Calendar className="size-3.5 text-amber-400" />
                <span>Month: <strong className="capitalize">{lead.travel_month}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-surface/80 px-3 py-1.5 border border-border">
                <Users className="size-3.5 text-amber-400" />
                <span>Group: <strong className="capitalize">{lead.group_size} ({lead.group_type})</strong></span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-surface/80 px-3 py-1.5 border border-border">
                <Building className="size-3.5 text-amber-400" />
                <span>Hotel: <strong className="capitalize">{lead.hotel_tier.replace("star", " ★")}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-surface/80 px-3 py-1.5 border border-border">
                <Plane className="size-3.5 text-amber-400" />
                <span>Duration: <strong>{lead.duration_days} Days</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Accepted Quote Banner */}
        {isAccepted && acceptedQuote && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="size-6" /> Quote Accepted &amp; Package Reserved!
            </div>
            <p className="text-xs text-muted-foreground">
              You accepted the quotation from <strong className="text-foreground">{acceptedQuote.profiles?.full_name || "Verified Vendor"}</strong> for <strong className="text-emerald-400 font-mono text-sm">Rs {acceptedQuote.quote_amount?.toLocaleString()} PKR</strong>. They will contact you shortly to confirm travel details.
            </p>
          </div>
        )}

        {/* Quotations List / Side-by-Side Comparison */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" /> Compare Verified Vendor Proposals
          </h2>

          {quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card space-y-2">
              <p className="font-semibold text-foreground">Quotations are being prepared...</p>
              <p className="text-xs">Verified travel agents are reviewing your request. You will receive a WhatsApp message as soon as a quote is ready!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {quotes.map((q: any) => {
                const vendorName = q.profiles?.full_name || "GlobeTrek Verified Agent";
                const isSelected = q.status === "accepted";

                return (
                  <div
                    key={q.id}
                    className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between shadow-card bg-card transition-all ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-border hover:border-amber-500/40"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Vendor Badge */}
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-base">{vendorName}</h3>
                            <ShieldCheck className="size-4 text-emerald-400" />
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Award className="size-3 text-amber-400" /> GlobeTrek Verified Partner
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">Total Price</span>
                          <span className="text-xl font-extrabold text-amber-400 font-mono">
                            Rs {q.quote_amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Itinerary Summary */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Itinerary &amp; Package Summary
                        </h4>
                        <p className="text-xs text-foreground/90 whitespace-pre-line bg-surface/50 p-3 rounded-xl border border-border/50">
                          {q.itinerary_summary}
                        </p>
                      </div>

                      {/* Inclusions */}
                      {q.inclusions && q.inclusions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            What's Included
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {q.inclusions.map((inc: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400"
                              >
                                <CheckCircle2 className="size-3" /> {inc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 border-t border-border mt-4">
                      {isSelected ? (
                        <Button className="w-full bg-emerald-500 text-black font-bold cursor-default">
                          <CheckCircle2 className="size-4 mr-1.5" /> Selected Proposal
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-600 hover:to-yellow-600 shadow"
                          disabled={isAccepted || acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate(q.id)}
                        >
                          {acceptMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4 mr-1.5" />
                          )}
                          Accept This Quotation
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
