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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - Dreamstay Style */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 animate-pulse" />
              ON THE MAP
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-serif">
              Every tour, <span className="italic font-normal text-muted-foreground">precisely placed.</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:text-right">
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Browse the list, hover a package, and watch it light up on the map with live flight routes and hop dates.
            </p>
            <Link to="/tours" className="shrink-0">
              <Button size="lg" className="gap-2 font-bold bg-primary text-black hover:bg-primary/90 shadow-glow">
                Explore All Tours <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dreamstay Two-Column Layout: Stacked Tours Left, Map Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-6 items-stretch">
          {/* Left Column: Stacked Tour Cards List Container */}
          <div className="flex flex-col rounded-2xl border border-border/70 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md h-[340px] sm:h-[440px] lg:h-[560px]">
            <div className="flex items-center justify-between px-2 py-2 border-b border-border/50 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-emerald-400" />
                Featured Packages ({featuredTours.length})
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">
                Hover to locate
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-border">
              {featuredTours.map((t) => {
                const isSelected = activeTourId === t.id;
                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setActiveTourId(t.id)}
                    onClick={() => setActiveTourId(t.id)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500/40"
                        : "border-border/40 bg-surface/50 hover:bg-surface/90 hover:border-emerald-500/40"
                    }`}
                  >
                    {/* Tour Image Thumbnail */}
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-border/40">
                      <img
                        src={t.image}
                        alt={t.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                        {t.durationDays}D/{t.nights}N
                      </span>
                    </div>

                    {/* Tour Details */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <h3
                        className={`text-xs font-bold line-clamp-2 transition-colors ${
                          isSelected ? "text-emerald-400" : "text-foreground group-hover:text-emerald-400"
                        }`}
                      >
                        {t.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-400" />
                        <span className="truncate">{t.destination}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                          Rs {t.pricePKR ? (t.pricePKR).toLocaleString() : "Contact"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          From {t.departureCity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive OpenStreetMap */}
          <div className="h-[340px] sm:h-[440px] lg:h-[560px] w-full overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
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
