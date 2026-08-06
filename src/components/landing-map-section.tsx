import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TOURS, formatPKR, type Tour } from "@/lib/tours";
import { InteractiveTourMap } from "@/components/InteractiveTourMap";
import { TourCard } from "@/components/tour-card";
import { Navigation, ArrowRight, Plane, MapPin, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingMapSection() {
  const featuredTours = TOURS.slice(0, 4);
  const [activeTourId, setActiveTourId] = useState<string>(featuredTours[0].id);

  return (
    <section className="border-y border-border/80 bg-surface-2/40 py-16 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Navigation className="h-3.5 w-3.5 animate-pulse" />
                Live OpenStreetMap Flight Explorer
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                <Crown className="h-3 w-3" /> Pro Vendor Feature
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Trace International Flight Routes &amp; Itineraries
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Hover over any tour card to view live aviation flight arcs from Pakistani departure airports (LHE, KHI, ISB) to destination landing hubs and multi-hop dates.
            </p>
          </div>

          <Link to="/tours">
            <Button size="lg" className="gap-2 font-bold bg-primary text-black hover:bg-primary/90 shadow-glow">
              Explore Full Interactive Map <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Split Grid Container */}
        <div className="grid gap-8 lg:grid-cols-[1fr_560px] xl:grid-cols-[1fr_640px] items-center">
          {/* Left Column: Interactive Tour Cards List */}
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredTours.map((t) => {
              const isSelected = activeTourId === t.id;
              return (
                <div
                  key={t.id}
                  onMouseEnter={() => setActiveTourId(t.id)}
                  onClick={() => setActiveTourId(t.id)}
                  className={`cursor-pointer transition-all duration-300 rounded-2xl ${
                    isSelected
                      ? "ring-2 ring-emerald-500 shadow-emerald-950/50 shadow-xl scale-[1.02]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <TourCard tour={t} />
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Map Preview */}
          <div className="h-[540px] w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
            <InteractiveTourMap
              tours={featuredTours}
              activeTourId={activeTourId}
              onSelectTour={(id) => setActiveTourId(id)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
