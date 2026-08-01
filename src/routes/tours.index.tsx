import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { TourCard } from "@/components/tour-card";
import { supabase } from "@/integrations/supabase/client";
import {
  DESTINATIONS, TOUR_TYPES, TOURS, formatPKR, DB_TOUR_COLUMNS, mapDbTour, type DbTourRow,
} from "@/lib/tours";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Search = {
  destination?: string;
  type?: string;
  min?: number;
  max?: number;
};

export const Route = createFileRoute("/tours/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    destination: typeof s.destination === "string" ? s.destination : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
    min: typeof s.min === "number" ? s.min : undefined,
    max: typeof s.max === "number" ? s.max : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All Tours · GlobeTrek PK" },
      { name: "description", content: "Browse international tour packages from verified Pakistani vendors, priced in PKR." },
      { property: "og:title", content: "All Tours · GlobeTrek PK" },
      { property: "og:description", content: "Browse international tour packages from verified Pakistani vendors, priced in PKR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToursPage,
});

function ToursPage() {
  const search = Route.useSearch();
  const [destination, setDestination] = React.useState<string>(search.destination ?? "any");
  const [type, setType] = React.useState<string>(search.type ?? "any");
  const [budget, setBudget] = React.useState<[number, number]>([
    search.min ?? 100000, search.max ?? 1000000,
  ]);

  const { data: dbTours = [] } = useQuery({
    queryKey: ["all-tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select(DB_TOUR_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DbTourRow[]).map(mapDbTour);
    },
  });

  const tourList = dbTours.length > 0 ? dbTours : TOURS;

  const filtered = tourList.filter((t) => {
    if (destination !== "any" && t.destination !== destination) return false;
    if (type !== "any" && t.type !== type) return false;
    if (t.pricePKR < budget[0] || t.pricePKR > budget[1]) return false;
    return true;
  });

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">All tours</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            International packages, priced transparently in PKR
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-max rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Filter</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Destination
                </label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-10 border-border bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any destination</SelectItem>
                    {DESTINATIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tour type
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-10 border-border bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {TOUR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Budget (PKR)</span>
                  <span className="text-highlight">
                    {formatPKR(budget[0])} — {formatPKR(budget[1])}
                  </span>
                </div>
                <div className="flex h-10 items-center rounded-md border border-border bg-surface px-3">
                  <Slider
                    value={budget}
                    min={100000}
                    max={1000000}
                    step={10000}
                    onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])}
                  />
                </div>
              </div>
            </div>
          </aside>

          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} tour{filtered.length === 1 ? "" : "s"} found
            </p>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No tours match those filters. Try widening your budget.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((t) => <TourCard key={t.id} tour={t} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}