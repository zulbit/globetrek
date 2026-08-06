import React, { useEffect, useRef } from "react";
import { getTourMapDetails, type TourMapDetails } from "@/lib/map-data";
import { Plane, MapPin, Navigation, Calendar, Info } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface InteractiveTourMapProps {
  tours: Array<{
    id: string;
    title: string;
    destination?: string;
    departureCity?: string;
    duration?: string;
    pricePKR?: number;
  }>;
  activeTourId: string | null;
  onSelectTour?: (tourId: string) => void;
}

export function InteractiveTourMap({
  tours,
  activeTourId,
  onSelectTour,
}: InteractiveTourMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  const activeTour = tours.find((t) => t.id === activeTourId) || tours[0];
  const activeDetails: TourMapDetails | null = activeTour
    ? getTourMapDetails(activeTour)
    : null;

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [30.0, 60.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // CartoDB Dark Matter / Voyager Vector Tile Layer for premium modern dark-mode aesthetic
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      renderTourLayers(activeDetails);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers & flight path arcs whenever activeTourId changes
  useEffect(() => {
    if (mapInstanceRef.current && activeDetails) {
      renderTourLayers(activeDetails);
    }
  }, [activeTourId, tours]);

  async function renderTourLayers(details: TourMapDetails | null) {
    if (!mapInstanceRef.current || !details) return;

    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current;

    // Clear previous markers & polylines
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    const {
      departureAirport,
      landingAirport,
      routeArcPoints,
      flightDurationText,
      transitsText,
      hops,
      tourTitle,
      tourId,
    } = details;

    // 1. Departure Airport Icon (Green 🛫)
    const depIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-emerald-400/40"></span>
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white font-bold text-xs">
          🛫
        </div>
      </div>
    `;
    const depIcon = L.divIcon({
      html: depIconHtml,
      className: "custom-dep-icon",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const depMarker = L.marker([departureAirport.lat, departureAirport.lng], {
      icon: depIcon,
    }).addTo(map);

    depMarker.bindPopup(`
      <div class="p-2 text-slate-900 font-sans">
        <div class="text-xs font-bold uppercase tracking-wider text-emerald-600">Departure Airport</div>
        <div class="text-sm font-semibold">${departureAirport.name} (${departureAirport.code})</div>
        <div class="text-xs text-slate-500">${departureAirport.city}, ${departureAirport.country}</div>
      </div>
    `);

    layersRef.current.push(depMarker);

    // 2. Landing Airport Icon (Teal 🛬)
    const landIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-teal-400/40"></span>
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg border-2 border-white font-bold text-xs">
          🛬
        </div>
      </div>
    `;
    const landIcon = L.divIcon({
      html: landIconHtml,
      className: "custom-land-icon",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const landMarker = L.marker([landingAirport.lat, landingAirport.lng], {
      icon: landIcon,
    }).addTo(map);

    landMarker.bindPopup(`
      <div class="p-2 text-slate-900 font-sans">
        <div class="text-xs font-bold uppercase tracking-wider text-teal-600">Destination Airport</div>
        <div class="text-sm font-semibold">${landingAirport.name} (${landingAirport.code})</div>
        <div class="text-xs text-slate-500">${landingAirport.city}, ${landingAirport.country}</div>
        <div class="mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">${flightDurationText}</div>
      </div>
    `);

    layersRef.current.push(landMarker);

    // 3. Curved Flight Path Polyline
    const flightArcLine = L.polyline(routeArcPoints, {
      color: "#059669",
      weight: 3.5,
      opacity: 0.85,
      dashArray: "8, 8",
    }).addTo(map);

    layersRef.current.push(flightArcLine);

    // Midpoint Flight Time Badge
    const midIdx = Math.floor(routeArcPoints.length / 2);
    const midPoint = routeArcPoints[midIdx];

    const durationBadgeHtml = `
      <div class="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 text-emerald-400 px-3 py-1 text-[11px] font-semibold shadow-xl border border-emerald-500/40 backdrop-blur-md whitespace-nowrap">
        <span>${flightDurationText}</span>
      </div>
    `;
    const durationIcon = L.divIcon({
      html: durationBadgeHtml,
      className: "duration-badge",
      iconSize: [160, 26],
      iconAnchor: [80, 13],
    });

    const durationMarker = L.marker(midPoint, { icon: durationIcon }).addTo(
      map
    );
    layersRef.current.push(durationMarker);

    // 4. Multi-Hop Itinerary Hop Markers (Numbered 1, 2, 3)
    hops.forEach((hop) => {
      const hopIconHtml = `
        <div class="flex items-center justify-center">
          <div class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md border border-white">
            ${hop.step}
          </div>
        </div>
      `;
      const hopIcon = L.divIcon({
        html: hopIconHtml,
        className: "hop-icon",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const hopMarker = L.marker([hop.lat, hop.lng], { icon: hopIcon }).addTo(
        map
      );

      hopMarker.bindPopup(`
        <div class="p-2.5 text-slate-900 font-sans max-w-xs">
          <div class="flex items-center justify-between gap-2 border-b pb-1 mb-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Stop #${hop.step} · ${hop.city}</span>
            <span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">${hop.country}</span>
          </div>
          <div class="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
            📅 <span>${hop.startDate} – ${hop.endDate}</span>
          </div>
          ${hop.description ? `<div class="text-xs text-slate-500 leading-relaxed">${hop.description}</div>` : ""}
        </div>
      `);

      layersRef.current.push(hopMarker);
    });

    // 5. Smooth Animated Camera FlyTo
    const bounds = L.latLngBounds([
      [departureAirport.lat, departureAirport.lng],
      [landingAirport.lat, landingAirport.lng],
      ...hops.map((h) => [h.lat, h.lng] as [number, number]),
    ]);

    map.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.2,
    });
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-card bg-card">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Floating Active Tour Info Overlay (Top Left) */}
      {activeDetails && (
        <div className="absolute top-4 left-4 z-10 max-w-sm rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Plane className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span>Interactive Flight & Route Explorer</span>
          </div>
          <h3 className="mt-1 text-sm font-bold text-foreground line-clamp-1">
            {activeDetails.tourTitle}
          </h3>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-border/50 bg-surface-2/80 p-2">
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                Departure Hub
              </span>
              <span className="font-semibold text-foreground">
                🛫 {activeDetails.departureAirport.code} ({activeDetails.departureAirport.city})
              </span>
            </div>
            <div className="rounded-lg border border-border/50 bg-surface-2/80 p-2">
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                Landing Hub
              </span>
              <span className="font-semibold text-foreground">
                🛬 {activeDetails.landingAirport.code} ({activeDetails.landingAirport.city})
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400 font-medium">
            <span>{activeDetails.flightDurationText}</span>
            <span className="text-[10px] opacity-80">{activeDetails.transitsText}</span>
          </div>

          {/* Multi-hop schedule badge list */}
          {activeDetails.hops.length > 0 && (
            <div className="mt-2.5 space-y-1.5 border-t border-border/50 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Itinerary Schedule & Hops ({activeDetails.hops.length} Stops)
              </span>
              {activeDetails.hops.map((h) => (
                <div
                  key={h.step}
                  className="flex items-center justify-between rounded-md bg-surface/60 px-2 py-1 text-[11px]"
                >
                  <span className="font-medium text-foreground">
                    #{h.step} {h.city}, {h.country}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {h.startDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
