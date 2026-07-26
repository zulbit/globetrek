import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileCheck, Search, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceListCard } from "@/components/service-list-card";
import { ServicePreviewModal } from "@/components/service-preview-modal";
import { POPULAR_VISA_COUNTRIES, PAKISTAN_CITIES, formatPKR, formatEmbassyFee, isEmbassyFeeTBC, getServiceImage, type VisaService } from "@/lib/services";

type VendorInfo = { city: string | null; company_name: string | null; full_name: string | null } | null;
type VisaRow = VisaService & { profiles: VendorInfo };

export const Route = createFileRoute("/visa/")({
  head: () => ({
    meta: [
      { title: "Visa services in PKR — GlobeTrek PK" },
      { name: "description", content: "Trusted Pakistani visa consultants for Turkey, Schengen, UAE, UK. Compare processing time, success rate and fees — all in PKR." },
      { property: "og:title", content: "Visa services · GlobeTrek PK" },
      { property: "og:description", content: "Compare visa consultants across popular destinations, priced in PKR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisaMarketplace,
});

function VisaMarketplace() {
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["public-visa"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("visa_services")
          .select("*, profiles:vendor_id(city, company_name, full_name)")
          .eq("is_active", true).order("processing_days", { ascending: true });
        if (error) return [];
        return (data ?? []) as unknown as VisaRow[];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  const fallbackData: VisaRow[] = [
    {
      id: "a1111111-1111-1111-1111-111111111111",
      vendor_id: "b4d084bb-566d-49b6-8439-bc8b47886bbf",
      country: "UAE",
      visa_type: "Tourist Visa",
      processing_days: 3,
      price_pkr: 35000,
      service_fee_pkr: 5000,
      success_rate: 99,
      description: "30-day UAE tourist visa with express 72-hour processing. Great for Dubai stopovers and family visits.",
      extra_notes: "Express processing option available",
      documents_required: ["Passport", "Photo", "CNIC"],
      image_url: null,
      is_active: true,
      profiles: { city: "Lahore", company_name: "GlobeTrek Demo Tours", full_name: "Demo Vendor" },
    },
    {
      id: "a2222222-2222-2222-2222-222222222222",
      vendor_id: "b4d084bb-566d-49b6-8439-bc8b47886bbf",
      country: "Saudi Arabia",
      visa_type: "Umrah Visa",
      processing_days: 5,
      price_pkr: 45000,
      service_fee_pkr: 7500,
      success_rate: 99,
      description: "Umrah visa issuance bundled with Makkah/Madinah hotel confirmation and ground transport advisory.",
      extra_notes: null,
      documents_required: ["Passport", "Photo", "Vaccination Certificate"],
      image_url: null,
      is_active: true,
      profiles: { city: "Lahore", company_name: "GlobeTrek Demo Tours", full_name: "Demo Vendor" },
    },
    {
      id: "a3333333-3333-3333-3333-333333333333",
      vendor_id: "b4d084bb-566d-49b6-8439-bc8b47886bbf",
      country: "Turkey",
      visa_type: "Tourist Visa",
      processing_days: 7,
      price_pkr: 28000,
      service_fee_pkr: 4000,
      success_rate: 97,
      description: "Fast-track e-visa filing for Turkey with document review and appointment booking.",
      extra_notes: null,
      documents_required: ["Passport", "Bank Statement", "Flight Booking"],
      image_url: null,
      is_active: true,
      profiles: { city: "Islamabad", company_name: "GlobeTrek Demo Tours", full_name: "Demo Vendor" },
    },
  ];

  const activeData = data.length > 0 ? data : fallbackData;

  const filtered = useMemo(() => activeData.filter((r) => {
    if (country !== "all" && r.country !== country) return false;
    if (city !== "all" && (r.profiles?.city ?? "") !== city) return false;
    if (q && !`${r.country} ${r.visa_type} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [activeData, country, city, q]);

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-to-b from-sky-500/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
            <FileCheck className="size-4" /> Visa marketplace
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Visas for every destination, filed by trusted PK consultants.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Turkey to Schengen, business to tourist — verified consultants show you processing time,
            success rate and total cost in PKR before you commit.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_200px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search destination, visa type…" className="pl-9" />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="All countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {POPULAR_VISA_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
          <p className="mt-2 text-[11px] text-muted-foreground">
            Prefer local consultants? Filter by the vendor's originating city.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            No visa services match your filters yet. Try widening the city or country.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const vendor = r.profiles?.company_name || r.profiles?.full_name || "Verified consultant";
              return (
                <ServiceListCard
                  key={r.id}
                  to="/visa/$id"
                  params={{ id: r.id }}
                  image_url={getServiceImage(r.country, r.image_url)}
                  fallback="bg-gradient-to-br from-sky-500/40 via-sky-500/10 to-transparent"
                  category="Visa"
                  categoryTone="text-sky-100"
                  title={`${r.country} · ${r.visa_type} Visa`}
                  subtitle={r.description || `Filed by verified consultant — ~${r.processing_days} day turnaround.`}
                  meta={[
                    { label: "Processing", value: `${r.processing_days} days` },
                    { label: "Success", value: r.success_rate ? `${r.success_rate}%` : "—" },
                    { label: "Embassy fee", value: formatEmbassyFee(r.price_pkr) },
                    { label: "Service fee", value: formatPKR(r.service_fee_pkr) },
                  ]}
                  price_pkr={isEmbassyFeeTBC(r.price_pkr) ? (r.service_fee_pkr ?? 0) : r.price_pkr + (r.service_fee_pkr ?? 0)}
                  priceHint={isEmbassyFeeTBC(r.price_pkr) ? "Service fee · embassy TBC" : "All-in from"}
                  city={r.profiles?.city}
                  preview={<ServicePreviewModal kind="visa" row={r} vendor={vendor} city={r.profiles?.city} />}
                />
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}