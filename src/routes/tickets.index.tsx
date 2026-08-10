import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Ticket, Search, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceListCard } from "@/components/service-list-card";
import { ServicePreviewModal } from "@/components/service-preview-modal";
import { TICKET_ROUTE_TYPES, PAKISTAN_CITIES, formatPKR, getServiceImage, type TicketService } from "@/lib/services";

type VendorInfo = { city: string | null; company_name: string | null; full_name: string | null } | null;
type TicketRow = TicketService & { profiles: VendorInfo };

export const Route = createFileRoute("/tickets/")({
  head: () => ({
    meta: [
      { title: "Flight Ticketing Desks & Umrah Packages — GlobeTrek PK" },
      { name: "description", content: "Trusted ticketing agents in Pakistan for domestic, international, Umrah and Hajj flights. Compare fees and airline coverage in PKR." },
      { property: "og:title", content: "Flight Ticketing Desks & Umrah Packages · GlobeTrek PK" },
      { property: "og:description", content: "Ticketing agents from Pakistan for every route, priced in PKR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "GlobeTrek PK Flight Ticketing Desks",
          "url": "https://globetrek.pk/tickets",
          "description": "Book domestic, international, Umrah and Hajj flight tickets with verified Pakistani IATA ticketing desks.",
          "provider": {
            "@type": "Organization",
            "name": "GlobeTrek PK Marketplace"
          },
          "serviceType": "Flight Ticketing & Travel Agency",
          "areaServed": "PK"
        }),
      },
    ],
  }),
  component: TicketsMarketplace,
});

function TicketsMarketplace() {
  const [route, setRoute] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [q, setQ] = useState("");

  const fallbackData: TicketRow[] = [
    {
      id: "c1111111-1111-1111-1111-111111111111",
      vendor_id: "b4d084bb-566d-49b6-8439-bc8b47886bbf",
      service_name: "Express International Flight Desk",
      route_type: "International",
      airlines_supported: ["PIA", "Emirates", "Qatar Airways", "FlyDubai"],
      service_fee_pkr: 3500,
      refundable: true,
      sample_routes: [
        { from: "Lahore", to: "Dubai", from_pkr: 75000 },
        { from: "Islamabad", to: "London", from_pkr: 185000 },
      ],
      description: "Priority ticketing desk for international flights from Lahore, Karachi & Islamabad.",
      image_url: null,
      is_active: true,
      profiles: { city: "Lahore", company_name: "GlobeTrek Demo Tours", full_name: "Demo Vendor" },
    },
    {
      id: "c2222222-2222-2222-2222-222222222222",
      vendor_id: "b4d084bb-566d-49b6-8439-bc8b47886bbf",
      service_name: "Umrah & Hajj Flight Booking",
      route_type: "Umrah",
      airlines_supported: ["PIA", "Saudi Arabian Airlines", "Airblue"],
      service_fee_pkr: 4000,
      refundable: true,
      sample_routes: [
        { from: "Karachi", to: "Jeddah", from_pkr: 120000 },
        { from: "Lahore", to: "Madinah", from_pkr: 135000 },
      ],
      description: "Dedicated Umrah flight booking service with group discounts and baggage allowance.",
      image_url: null,
      is_active: true,
      profiles: { city: "Karachi", company_name: "GlobeTrek Demo Tours", full_name: "Demo Vendor" },
    },
  ];

  const { data = [] } = useQuery({
    queryKey: ["public-tickets"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const { data, error } = await supabase.from("ticket_services")
          .select("*, profiles:vendor_id(city, company_name, full_name)")
          .eq("is_active", true).order("service_fee_pkr", { ascending: true })
          .abortSignal(controller.signal);
        clearTimeout(timer);
        if (error || !data || data.length === 0) return fallbackData;
        return data as unknown as TicketRow[];
      } catch {
        return fallbackData;
      }
    },
    retry: false,
    placeholderData: fallbackData,
  });

  const activeData = data.length > 0 ? data : fallbackData;

  const filtered = useMemo(() => activeData.filter((r) => {
    if (route !== "all" && r.route_type !== route) return false;
    if (city !== "all" && (r.profiles?.city ?? "") !== city) return false;
    if (q && !`${r.service_name} ${(r.airlines_supported ?? []).join(" ")} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [activeData, route, city, q]);

  return (
    <SiteShell>
      <section className="border-b border-border bg-gradient-to-b from-amber-500/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            <Ticket className="size-4" /> Ticketing
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Ticketing agents for every route.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Domestic, international, Umrah and Hajj. Compare service fees, airline coverage and route pricing in PKR.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_200px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agent, airline, route…" className="pl-9" />
            </div>
            <Select value={route} onValueChange={setRoute}>
              <SelectTrigger><SelectValue placeholder="All routes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All routes</SelectItem>
                {TICKET_ROUTE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">No ticketing services match your filters yet.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const vendor = r.profiles?.company_name || r.profiles?.full_name || "Verified agent";
              return (
                <ServiceListCard
                  key={r.id} to="/tickets/$id" params={{ id: r.id }}
                  image_url={getServiceImage(r.route_type, r.image_url)}
                  fallback="bg-gradient-to-br from-amber-500/40 via-amber-500/10 to-transparent"
                  category="Tickets" categoryTone="text-amber-100"
                  title={r.service_name}
                  subtitle={r.description || `${r.route_type} · ${(r.airlines_supported ?? []).slice(0, 3).join(", ")}`}
                  meta={[
                    { label: "Route type", value: r.route_type },
                    { label: "Refundable", value: r.refundable ? "Yes" : "No" },
                    { label: "Airlines", value: `${(r.airlines_supported ?? []).length}+` },
                    { label: "Sample routes", value: `${(r.sample_routes ?? []).length}` },
                  ]}
                  price_pkr={r.service_fee_pkr}
                  priceHint="Service fee from"
                  city={r.profiles?.city}
                  preview={<ServicePreviewModal kind="tickets" row={r} vendor={vendor} city={r.profiles?.city} />}
                />
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}