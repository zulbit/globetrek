import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Shield, Search, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceListCard } from "@/components/service-list-card";
import { ServicePreviewModal } from "@/components/service-preview-modal";
import { INSURANCE_COVERAGE, PAKISTAN_CITIES, formatPKR, getServiceImage, type InsurancePlan } from "@/lib/services";

type VendorInfo = { city: string | null; company_name: string | null; full_name: string | null } | null;
type InsuranceRow = InsurancePlan & { profiles: VendorInfo };

export const Route = createFileRoute("/insurance/")({
  head: () => ({
    meta: [
      { title: "Travel insurance in PKR — GlobeTrek PK" },
      { name: "description", content: "Schengen, medical, family and adventure travel insurance plans from PK brokers. Compare coverage and price in PKR." },
      { property: "og:title", content: "Travel insurance · GlobeTrek PK" },
      { property: "og:description", content: "Compare Schengen and medical travel insurance plans, priced in PKR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsuranceMarketplace,
});

function InsuranceMarketplace() {
  const [coverage, setCoverage] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["public-insurance"],
    queryFn: async () => {
      const { data } = await supabase.from("insurance_plans")
        .select("*, profiles:vendor_id(city, company_name, full_name)")
        .eq("is_active", true).order("price_pkr", { ascending: true });
      return (data ?? []) as unknown as InsuranceRow[];
    },
  });

  const filtered = useMemo(() => data.filter((r) => {
    if (coverage !== "all" && r.coverage_type !== coverage) return false;
    if (city !== "all" && (r.profiles?.city ?? "") !== city) return false;
    if (q && !`${r.plan_name} ${r.coverage_type} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, coverage, city, q]);

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-to-b from-emerald-500/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            <Shield className="size-4" /> Travel insurance
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Travel with cover — Schengen, medical, adventure.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            PK-licensed brokers with plans priced in PKR. Compare coverage, benefits and duration side-by-side.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_200px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plan, coverage…" className="pl-9" />
            </div>
            <Select value={coverage} onValueChange={setCoverage}>
              <SelectTrigger><SelectValue placeholder="All coverage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coverage</SelectItem>
                {INSURANCE_COVERAGE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="Vendor city" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any vendor city</SelectItem>
                {PAKISTAN_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            No insurance plans match your filters yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const vendor = r.profiles?.company_name || r.profiles?.full_name || "Verified broker";
              return (
                <ServiceListCard
                  key={r.id} to="/insurance/$id" params={{ id: r.id }}
                  image_url={getServiceImage(r.coverage_type, r.image_url)}
                  fallback="bg-gradient-to-br from-emerald-500/40 via-emerald-500/10 to-transparent"
                  category="Insurance" categoryTone="text-emerald-100"
                  title={r.plan_name}
                  subtitle={r.description || `${r.coverage_type} cover · Ages ${r.age_min}-${r.age_max}`}
                  meta={[
                    { label: "Coverage", value: r.coverage_type },
                    { label: "Sum insured", value: formatPKR(r.coverage_amount_pkr) },
                    { label: "Duration", value: `${r.duration_days} days` },
                    { label: "Ages", value: `${r.age_min} – ${r.age_max}` },
                  ]}
                  price_pkr={r.price_pkr}
                  city={r.profiles?.city}
                  preview={<ServicePreviewModal kind="insurance" row={r} vendor={vendor} city={r.profiles?.city} />}
                />
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}