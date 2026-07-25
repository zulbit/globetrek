import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket, ChevronLeft, MessageCircle, Phone, Plane } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceInquiryModal } from "@/components/service-inquiry-modal";
import { formatPKR, type TicketService } from "@/lib/services";

export const Route = createFileRoute("/tickets/$id")({ component: TicketDetail });

function TicketDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_services")
        .select("*, profiles:vendor_id(full_name, company_name)")
        .eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as TicketService & { profiles: { full_name: string; company_name: string | null } | null };
    },
  });

  if (isLoading) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24 text-muted-foreground">Loading…</div></SiteShell>;
  if (error || !data) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24">Service not found.</div></SiteShell>;

  const vendor = data.profiles?.company_name || data.profiles?.full_name || "Verified agent";

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/tickets" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-3.5" /> Back to ticketing
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              <Ticket className="size-4" /> {data.route_type} ticketing
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{data.service_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">by <span className="text-foreground font-medium">{vendor}</span></p>

            {data.description && (
              <p className="mt-6 text-sm leading-relaxed text-foreground/90">{data.description}</p>
            )}

            {data.airlines_supported?.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Airlines supported</h2>
                <div className="flex flex-wrap gap-2">
                  {data.airlines_supported.map((a) => (
                    <Badge key={a} variant="outline" className="rounded-full border-border bg-surface">{a}</Badge>
                  ))}
                </div>
              </section>
            )}

            {data.sample_routes?.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sample routes</h2>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
                      <tr><th className="px-4 py-3 text-left">From</th><th className="px-4 py-3 text-left">To</th><th className="px-4 py-3 text-right">Fare from</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.sample_routes.map((r, i) => (
                        <tr key={i} className="hover:bg-surface/30">
                          <td className="px-4 py-3">{r.from}</td>
                          <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><Plane className="size-3 text-amber-400" /> {r.to}</span></td>
                          <td className="px-4 py-3 text-right font-semibold text-highlight">{r.from_pkr ? formatPKR(r.from_pkr) : "Inquire"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Fares are indicative and subject to airline availability at time of ticketing.</p>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs text-muted-foreground">Service fee</div>
            <div className="text-3xl font-bold text-highlight">{formatPKR(data.service_fee_pkr)}</div>
            <div className="text-xs text-muted-foreground">per ticket · {data.refundable ? "refundable" : "non-refundable"}</div>

            <div className="mt-5 space-y-2">
              <ServiceInquiryModal serviceType="tickets" serviceId={data.id} serviceTitle={data.service_name} vendorName={vendor} channel="whatsapp"
                trigger={<Button className="w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"><MessageCircle className="mr-2 size-4" /> WhatsApp agent</Button>} />
              <ServiceInquiryModal serviceType="tickets" serviceId={data.id} serviceTitle={data.service_name} vendorName={vendor} channel="callback"
                trigger={<Button variant="outline" className="w-full"><Phone className="mr-2 size-4" /> Request callback</Button>} />
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
