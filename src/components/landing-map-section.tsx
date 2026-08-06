import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TOURS, formatPKR, type Tour } from "@/lib/tours";
import { InteractiveTourMap } from "@/components/InteractiveTourMap";
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

        {/* Horizontal Interactive Tour Selector Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-emerald-400" />
              Select Tour Package to Trace Live Flight Path ({featuredTours.length})
            </span>
            <span className="text-[11px] font-medium text-emerald-400 hidden sm:inline">
              Hover or click any tour to update route map
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {featuredTours.map((t) => {
              const isSelected = activeTourId === t.id;
              const formattedPrice = t.pricePKR ? `₨ ${(t.pricePKR / 1000).toFixed(0)}k` : "";
              return (
                <button
                  key={t.id}
                  onMouseEnter={() => setActiveTourId(t.id)}
                  onClick={() => setActiveTourId(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-300 border cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-emerald-400 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg scale-[1.02]"
                      : "bg-surface/80 text-muted-foreground border-border/50 hover:bg-surface hover:text-foreground hover:border-emerald-500/40"
                  }`}
                >
                  <span className="text-sm">📍</span>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-foreground line-clamp-1 max-w-[160px]">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {t.destination} · <span className="text-emerald-400 font-bold">{formattedPrice}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full-Width Interactive Leaflet OpenStreetMap Container */}
        <div className="h-[640px] w-full overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
          <InteractiveTourMap
            tours={featuredTours}
            activeTourId={activeTourId}
            onSelectTour={(id) => setActiveTourId(id)}
          />
        </div>
      </div>
    </section>
  );
}
