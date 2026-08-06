import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TOURS, formatPKR, type Tour } from "@/lib/tours";
import { InteractiveTourMap } from "@/components/InteractiveTourMap";
import { TourCard } from "@/components/tour-card";
import { Navigation, ArrowRight, Plane, MapPin, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingMapSection() {
  const featuredTours = TOURS.slice(0, 6);
  const [activeTourId, setActiveTourId] = useState<string>(featuredTours[0].id);

  return (
    <section className="border-y border-border/80 bg-surface-2/40 py-12 sm:py-16 overflow-hidden">
      <div className="mx-auto max-w-[1850px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Navigation className="h-3.5 w-3.5 animate-pulse" />
                Live OpenStreetMap Flight Explorer
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                <Crown className="h-3 w-3" /> Pro Vendor Feature
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Explore Flight Routes &amp; Destinations Live
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Click or hover any tour package on the left to trace its live flight path arc, departure airport, landing hub, and multi-hop itinerary dates across the globe.
            </p>
          </div>

          <Link to="/tours">
            <Button size="lg" className="gap-2 font-bold bg-primary text-black hover:bg-primary/90 shadow-glow">
              Explore All Tours on Interactive Map <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Dreamstay Full-Width Split Container */}
        <div className="grid gap-6 lg:grid-cols-[480px_1fr] xl:grid-cols-[540px_1fr] 2xl:grid-cols-[580px_1fr] items-start">
          {/* Left Column: Scrollable Interactive Tour Cards List */}
          <div className="max-h-[660px] overflow-y-auto pr-2 space-y-4 rounded-2xl p-1 border border-border/40 bg-background/50 backdrop-blur">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-2">
              <span>Tour Packages ({featuredTours.length})</span>
              <span className="text-emerald-400 text-[10px]">Hover to highlight map</span>
            </div>

            {featuredTours.map((t) => {
              const isSelected = activeTourId === t.id;
              return (
                <div
                  key={t.id}
                  onMouseEnter={() => setActiveTourId(t.id)}
                  onClick={() => setActiveTourId(t.id)}
                  className={`cursor-pointer transition-all duration-300 rounded-2xl ${
                    isSelected
                      ? "ring-2 ring-emerald-500 shadow-emerald-950/50 shadow-xl scale-[1.01]"
                      : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <TourCard tour={t} />
                </div>
              );
            })}
          </div>

          {/* Right Column: Full-Height Interactive Leaflet OpenStreetMap */}
          <div className="h-[660px] w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
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
