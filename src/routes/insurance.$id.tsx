import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, ChevronLeft, MessageCircle, Phone, Check, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ServiceInquiryModal } from "@/components/service-inquiry-modal";
import { formatPKR, type InsurancePlan } from "@/lib/services";

export const Route = createFileRoute("/insurance/$id")({ component: InsuranceDetail });

function InsuranceDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["insurance-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans")
        .select("*, profiles:vendor_id(full_name, company_name)")
        .eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as InsurancePlan & { profiles: { full_name: string; company_name: string | null } | null };
    },
  });

  if (isLoading) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24 text-muted-foreground">Loading…</div></SiteShell>;
  if (error || !data) return <SiteShell><div className="mx-auto max-w-4xl px-4 py-24">Plan not found.</div></SiteShell>;

  const vendor = data.profiles?.company_name || data.profiles?.full_name || "Verified broker";

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/insurance" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-3.5" /> Back to insurance
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              <Shield className="size-4" /> {data.coverage_type} · Travel insurance
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{data.plan_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">by <span className="text-foreground font-medium">{vendor}</span></p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Tile label="Sum insured" value={formatPKR(data.coverage_amount_pkr)} />
              <Tile label="Duration" value={`${data.duration_days} days`} />
              <Tile label="Age range" value={`${data.age_min} – ${data.age_max}`} />
            </div>

            {data.description && (
              <section className="mt-8">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">About this plan</h2>
                <p className="text-sm leading-relaxed text-foreground/90">{data.description}</p>
              </section>
            )}

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {data.benefits?.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">Benefits</h2>
                  <ul className="space-y-2 text-sm">
                    {data.benefits.map((b, i) => (
                      <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {b}</li>
                    ))}
                  </ul>
                </section>
              )}
              {data.exclusions?.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exclusions</h2>
                  <ul className="space-y-2 text-sm">
                    {data.exclusions.map((b, i) => (
                      <li key={i} className="flex gap-2 text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" /> {b}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs text-muted-foreground">Premium</div>
            <div className="text-3xl font-bold text-highlight">{formatPKR(data.price_pkr)}</div>
            <div className="text-xs text-muted-foreground">for {data.duration_days} days · one traveler</div>

            <div className="mt-5 space-y-2">
              <ServiceInquiryModal serviceType="insurance" serviceId={data.id} serviceTitle={data.plan_name} vendorName={vendor} channel="whatsapp"
                trigger={<Button className="w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"><MessageCircle className="mr-2 size-4" /> WhatsApp broker</Button>} />
              <ServiceInquiryModal serviceType="insurance" serviceId={data.id} serviceTitle={data.plan_name} vendorName={vendor} channel="callback"
                trigger={<Button variant="outline" className="w-full"><Phone className="mr-2 size-4" /> Request callback</Button>} />
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
