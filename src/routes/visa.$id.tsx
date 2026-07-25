import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Clock, ShieldCheck, ChevronLeft, MessageCircle, Phone, Check, Printer } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ServiceInquiryModal } from "@/components/service-inquiry-modal";
import { formatPKR, formatEmbassyFee, isEmbassyFeeTBC, type VisaService } from "@/lib/services";
import { printChecklist } from "@/lib/print-checklist";

export const Route = createFileRoute("/visa/$id")({
  component: VisaDetail,
});

function VisaDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["visa-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("visa_services")
        .select("*, profiles:vendor_id(full_name, company_name)")
        .eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as VisaService & { profiles: { full_name: string; company_name: string | null } | null };
    },
  });

  if (isLoading) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24 text-muted-foreground">Loading…</div></SiteShell>;
  if (error || !data) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24">Visa service not found.</div></SiteShell>;

  const feeTBC = isEmbassyFeeTBC(data.price_pkr);
  const allIn = data.price_pkr + (data.service_fee_pkr ?? 0);
  const vendor = data.profiles?.company_name || data.profiles?.full_name || "Verified consultant";

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/visa" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-3.5" /> Back to visa marketplace
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
              <FileCheck className="size-4" /> {data.country} · {data.visa_type} Visa
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {data.country} {data.visa_type} Visa
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Filed by <span className="text-foreground font-medium">{vendor}</span></p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric icon={<Clock className="size-4" />} label="Processing time" value={`${data.processing_days} days`} />
              <Metric icon={<ShieldCheck className="size-4" />} label="Success rate" value={data.success_rate ? `${data.success_rate}%` : "—"} />
              <Metric icon={<FileCheck className="size-4" />} label={feeTBC ? "Service fee" : "Total cost"} value={feeTBC ? formatPKR(data.service_fee_pkr) : formatPKR(allIn)} tone="text-highlight" />
            </div>

            {data.description && (
              <section className="mt-8">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">About this service</h2>
                <p className="text-sm leading-relaxed text-foreground/90">{data.description}</p>
              </section>
            )}

            {data.documents_required?.length > 0 && (
              <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documents required</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printChecklist({
                      title: `${data.country} ${data.visa_type} Visa – Document Checklist`,
                      vendor,
                      meta: [
                        `Processing time: ${data.processing_days} days`,
                        data.success_rate ? `Success rate: ${data.success_rate}%` : "",
                        `Total cost: ${formatPKR(allIn)}`,
                      ].filter(Boolean),
                      items: data.documents_required,
                      notes: data.extra_notes ?? undefined,
                    })}
                    className="print:hidden"
                  >
                    <Printer className="mr-2 size-3.5" /> Printable checklist
                  </Button>
                </div>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {data.documents_required.map((doc, i) => (
                        <tr key={i} className="hover:bg-surface/30">
                          <td className="w-10 px-4 py-3 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-3">{doc}</td>
                          <td className="w-10 px-4 py-3"><Check className="size-4 text-emerald-400" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {data.extra_notes && (
              <section className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100/90">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Notes</div>
                <p className="mt-1">{data.extra_notes}</p>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs text-muted-foreground">{feeTBC ? "Service fee" : "All-in cost"}</div>
            <div className="text-3xl font-bold text-highlight">{feeTBC ? formatPKR(data.service_fee_pkr) : formatPKR(allIn)}</div>
            <div className="text-xs text-muted-foreground">
              Embassy <span className={feeTBC ? "text-amber-400 font-medium" : ""}>{formatEmbassyFee(data.price_pkr)}</span> · Service {formatPKR(data.service_fee_pkr)}
            </div>
            {feeTBC && (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
                Embassy visa fees change frequently (currency rates, VFS/TLS surcharges). The consultant will confirm the current embassy fee when you inquire.
              </p>
            )}



            <div className="mt-5 space-y-2">
              <ServiceInquiryModal
                serviceType="visa" serviceId={data.id} serviceTitle={`${data.country} ${data.visa_type} visa`}
                vendorName={vendor} channel="whatsapp"
                trigger={<Button className="w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"><MessageCircle className="mr-2 size-4" /> WhatsApp consultant</Button>}
              />
              <ServiceInquiryModal
                serviceType="visa" serviceId={data.id} serviceTitle={`${data.country} ${data.visa_type} visa`}
                vendorName={vendor} channel="callback"
                trigger={<Button variant="outline" className="w-full"><Phone className="mr-2 size-4" /> Request callback</Button>}
              />
            </div>

            <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
              Free inquiry. The consultant contacts you to confirm documents and next steps.
            </p>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className={`mt-1.5 text-lg font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
