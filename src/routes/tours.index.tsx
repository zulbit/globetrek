import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { TourCard } from "@/components/tour-card";
import { InteractiveTourMap } from "@/components/InteractiveTourMap";
import { supabase } from "@/integrations/supabase/client";
import {
  DESTINATIONS,
  TOUR_TYPES,
  TOURS,
  formatPKR,
  DB_TOUR_COLUMNS,
  mapDbTour,
  type DbTourRow,
} from "@/lib/tours";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, List, Crown, Sparkles, Filter, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      { title: "Interactive Tour Explorer & Maps · GlobeTrek PK" },
      {
        name: "description",
        content:
          "Explore international tour packages from verified Pakistani vendors with interactive OpenStreetMap airport routes, flight times & itinerary schedules.",
      },
      { property: "og:title", content: "Interactive Tour Explorer & Maps · GlobeTrek PK" },
      {
        property: "og:description",
        content:
          "Explore international tour packages from verified Pakistani vendors with interactive OpenStreetMap airport routes, flight times & itinerary schedules.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globetrek.pk/tours" },
      { property: "og:image", content: "https://globetrek.pk/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://globetrek.pk/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://globetrek.pk/tours" },
    ],
  }),
  component: ToursPage,
});

function ToursPage() {
  const search = Route.useSearch();
  const [destination, setDestination] = React.useState<string>(
    search.destination ?? "any"
  );
  const [type, setType] = React.useState<string>(search.type ?? "any");
  const [budget, setBudget] = React.useState<[number, number]>([
    search.min ?? 100000,
    search.max ?? 1000000,
  ]);
  const [activeTourId, setActiveTourId] = React.useState<string | null>(null);
  const [mobileTab, setMobileTab] = React.useState<"list" | "map">("list");

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

  // Default active tour to first filtered item if none selected
  React.useEffect(() => {
    if (filtered.length > 0 && !activeTourId) {
      setActiveTourId(filtered[0].id);
    }
  }, [filtered, activeTourId]);

  return (
    <SiteShell>
      <div className="min-h-screen bg-background pb-16">
        {/* Top Header Banner */}
        <section className="border-b border-border/70 bg-gradient-to-r from-surface-2 via-surface to-surface-2 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                    <Navigation className="h-3 w-3 animate-pulse" />
                    OpenStreetMap Interactive Flight Explorer
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    <Crown className="h-3 w-3" /> Pro Vendor Feature
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  Explore International Tours & Flight Paths
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse packages with live airport routes, flight durations, transits, and interactive multi-hop itinerary dates.
                </p>
              </div>

              {/* Quick Filters Header Control */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border bg-card p-2 shadow-xs text-xs font-medium text-muted-foreground">
                  Showing <span className="font-bold text-emerald-400">{filtered.length}</span> active packages
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Dreamstay Split-Screen Container */}
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Mobile View Toggle Bar */}
          <div className="mb-4 flex lg:hidden">
            <div className="grid w-full grid-cols-2 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setMobileTab("list")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  mobileTab === "list"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" /> Tour List ({filtered.length})
              </button>
              <button
                onClick={() => setMobileTab("map")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  mobileTab === "map"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Map className="h-4 w-4" /> Interactive Map 🗺️
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_640px] 2xl:grid-cols-[1fr_720px]">
            {/* Left Column: Filter Sidebar + Scrollable Tour Cards */}
            <div
              className={`space-y-6 ${
                mobileTab === "map" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Filter Bar */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                  <Filter className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-foreground">Filter Packages</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
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
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span>Budget (PKR)</span>
                      <span className="text-emerald-400 font-semibold">
                        {formatPKR(budget[0])} – {formatPKR(budget[1])}
                      </span>
                    </div>
                    <div className="flex h-10 items-center rounded-md border border-border bg-surface px-3">
                      <Slider
                        value={budget}
                        min={100000}
                        max={1000000}
                        step={10000}
                        onValueChange={(v) =>
                          setBudget([v[0], v[1]] as [number, number])
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tour Cards Grid */}
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  No tours match those filters. Try widening your budget or clearing destination filters.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((t) => {
                    const isSelected = activeTourId === t.id;
                    return (
                      <div
                        key={t.id}
                        onMouseEnter={() => setActiveTourId(t.id)}
                        onClick={() => setActiveTourId(t.id)}
                        className={`transition-all rounded-2xl ${
                          isSelected
                            ? "ring-2 ring-emerald-500 shadow-emerald-950/40 shadow-xl"
                            : ""
                        }`}
                      >
                        <TourCard tour={t} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Sticky Full-Height Interactive OpenStreetMap */}
            <div
              className={`lg:block ${
                mobileTab === "list" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="sticky top-20 h-[calc(100vh-120px)] min-h-[500px] w-full">
                <InteractiveTourMap
                  tours={filtered}
                  activeTourId={activeTourId}
                  onSelectTour={(id) => setActiveTourId(id)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}