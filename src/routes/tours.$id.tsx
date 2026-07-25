import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarDays, Check, Clock, MapPin, MessageCircle, Phone, Plane, Star, Users,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { InquiryModal } from "@/components/inquiry-modal";
import { CrossSellPanel } from "@/components/cross-sell-panel";

import { supabase } from "@/integrations/supabase/client";
import {
  DB_TOUR_COLUMNS, formatPKR, getTour, mapDbTour, type DbTourRow, type Tour,
} from "@/lib/tours";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const tourQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["tour", id],
    staleTime: 60_000,
    queryFn: async (): Promise<Tour> => {
      if (UUID_RE.test(id)) {
        const { data, error } = await supabase
          .from("tours")
          .select(DB_TOUR_COLUMNS)
          .eq("id", id)
          .eq("is_active", true)
          .maybeSingle();
        if (error) throw error;
        if (data) return mapDbTour(data as DbTourRow);
      }
      const seeded = getTour(id);
      if (seeded) return seeded;
      throw notFound();
    },
  });

export const Route = createFileRoute("/tours/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(tourQueryOptions(params.id)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · GlobeTrek PK` },
          { name: "description", content: loaderData.summary || `${loaderData.destination} tour departing from ${loaderData.departureCity}, priced in PKR.` },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.summary || `${loaderData.durationDays}-day ${loaderData.destination} package from ${formatPKR(loaderData.pricePKR)}.` },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          ...(loaderData.image?.startsWith("https://")
            ? [
                { property: "og:image", content: loaderData.image },
                { name: "twitter:image", content: loaderData.image },
              ]
            : []),
        ]
      : [{ title: "Tour · GlobeTrek PK" }],
  }),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Tour not found</h1>
        <p className="mt-2 text-muted-foreground">This tour is no longer available.</p>
        <Link to="/tours" className="mt-6 inline-block text-primary hover:underline">
          Browse all tours →
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ reset }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Couldn't load this tour</h1>
        <Button onClick={reset} className="mt-4">Try again</Button>
      </div>
    </SiteShell>
  ),
  component: TourDetail,
});

function TourDetail() {
  const { id } = Route.useParams();
  const { data: tour } = useSuspenseQuery(tourQueryOptions(id));

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden">
          {tour.image ? (
            <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-primary/20 via-surface to-background" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-card backdrop-blur sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">
                {tour.type}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {tour.destination}
              </span>
              <span className="inline-flex items-center gap-1">
                by <span className="font-medium text-foreground">{tour.vendor}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-highlight text-highlight" />
                {tour.rating} · {tour.reviews} reviews
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
              {tour.title}
            </h1>
            {tour.summary ? (
              <p className="mt-3 max-w-3xl text-muted-foreground">{tour.summary}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact icon={<Clock className="size-4" />} k="Duration" v={`${tour.durationDays}D / ${tour.nights}N`} />
              <Fact icon={<Plane className="size-4" />} k="Departs" v={tour.departureCity} />
              <Fact icon={<Users className="size-4" />} k="Group" v={`Max ${tour.totalSeats}`} />
              <Fact icon={<CalendarDays className="size-4" />} k="Next date" v="14 Mar 2026" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Itinerary</h2>
              {tour.itinerary.length > 0 ? (
                <ol className="mt-4 space-y-3">
                  {tour.itinerary.map((d) => (
                    <li key={d.day} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                          {d.day}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold">{d.title}</h3>
                          {d.detail && <p className="mt-0.5 text-sm text-muted-foreground">{d.detail}</p>}
                          {(d.activities?.length ?? 0) > 0 && (
                            <ul className="mt-3 space-y-1.5 border-l-2 border-primary/30 pl-4">
                              {d.activities!.map((a, k) => (
                                <li key={k} className="flex gap-3 text-sm">
                                  <span className="min-w-16 font-mono font-semibold text-primary">{a.time}</span>
                                  <span className="text-muted-foreground">{a.title}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                  A day-by-day itinerary will be shared by the vendor after your inquiry.
                </p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold">What's included</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {tour.inclusions.map((inc) => (
                  <li key={inc} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <Check className="size-4 text-primary" /> {inc}
                  </li>
                ))}
              </ul>
            </div>

            {tour.requirements && tour.requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">Traveler requirements</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-left font-medium">Note</th>
                        <th className="px-4 py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tour.requirements.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-4 py-2.5">{r.item}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{r.note ?? "—"}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${
                              r.required ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-surface text-muted-foreground"
                            }`}>{r.required ? "Required" : "Optional"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tour.accommodation && (tour.accommodation.standard || tour.accommodation.premium) && (
              <div>
                <h2 className="text-lg font-semibold">Accommodation</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tour.accommodation.standard && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Standard · Included</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tour.accommodation.standard}</p>
                    </div>
                  )}
                  {tour.accommodation.premium && (
                    <div className="rounded-xl border border-highlight/40 bg-highlight/5 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-highlight">Premium upgrade</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tour.accommodation.premium.description}</p>
                      <p className="mt-2 text-sm font-semibold text-highlight">
                        + {formatPKR(tour.accommodation.premium.additional_pkr)} per person
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tour.extraNotes && (
              <div>
                <h2 className="text-lg font-semibold">Good to know</h2>
                <p className="mt-3 whitespace-pre-line rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  {tour.extraNotes}
                </p>
              </div>
            )}

            <CrossSellPanel destinationCountry={tour.destination} />
          </div>


          {/* Booking rail */}
          <aside className="lg:sticky lg:top-24 h-max">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">from</div>
                  <div className="text-3xl font-bold tabular-nums text-highlight">
                    {formatPKR(tour.pricePKR)}
                  </div>
                  <div className="text-xs text-muted-foreground">per adult · all-in</div>
                </div>
                <span className="rounded-full border border-highlight/40 bg-highlight/15 px-2.5 py-1 text-[11px] font-semibold text-highlight">
                  {tour.seatsLeft} seats left
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <Row label="Duration" value={`${tour.durationDays} days`} />
                <Row label="Departure" value={tour.departureCity} />
                <Row label="Group size" value={`${tour.totalSeats} guests`} />
                <Row label="Next date" value="Sat, 14 Mar 2026" />
              </div>

              <div className="mt-5 space-y-2">
                <InquiryModal
                  tour={tour}
                  channel="whatsapp"
                  trigger={
                    <Button className="w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90">
                      <MessageCircle className="mr-2 size-4" /> Inquire on WhatsApp
                    </Button>
                  }
                />
                <InquiryModal
                  tour={tour}
                  channel="callback"
                  trigger={
                    <Button variant="outline" className="w-full border-border bg-surface hover:bg-surface/70">
                      <Phone className="mr-2 size-4" /> Request a callback
                    </Button>
                  }
                />
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                No payment now — the vendor will contact you with a quote.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function Fact({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}{k}
      </div>
      <div className="mt-1 text-sm font-semibold">{v}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-2 first:border-0 first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
