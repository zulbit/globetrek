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
        center: [30.0, 50.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // CartoDB Voyager Tile Layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      renderAllTourLayers();
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

  // Re-render map layers whenever activeTourId or tours list changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderAllTourLayers();
    }
  }, [activeTourId, tours]);

  async function renderAllTourLayers() {
    if (!mapInstanceRef.current || tours.length === 0) return;

    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current;

    // Clear previous markers & polylines
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    // 1. Render Destination Pins for ALL Tours in the list
    tours.forEach((tour) => {
      const details = getTourMapDetails(tour);
      const isActive = tour.id === (activeTourId || activeTour?.id);
      const landing = details.landingAirport;
      const formattedPrice = tour.pricePKR
        ? `₨ ${(tour.pricePKR / 1000).toFixed(0)}k`
        : "";

      const pinHtml = `
        <div class="cursor-pointer group flex flex-col items-center justify-center transition-all duration-300">
          <div class="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-lg border backdrop-blur transition-transform group-hover:scale-110 ${
            isActive
              ? "bg-slate-900 text-emerald-400 border-emerald-400 ring-4 ring-emerald-500/30 scale-110"
              : "bg-slate-900/90 text-white border-slate-700 hover:border-emerald-400"
          }">
            <span>📍 ${landing.city}</span>
            ${formattedPrice ? `<span class="text-amber-400 font-extrabold border-l border-slate-700 pl-1 ml-0.5">${formattedPrice}</span>` : ""}
          </div>
          <div class="h-2 w-0.5 ${isActive ? "bg-emerald-400" : "bg-slate-700"}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: `custom-tour-pin-${tour.id}`,
        iconSize: [120, 36],
        iconAnchor: [60, 36],
      });

      const marker = L.marker([landing.lat, landing.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.on("click", () => {
        if (onSelectTour) onSelectTour(tour.id);
      });

      marker.bindPopup(`
        <div class="p-2.5 text-slate-900 font-sans max-w-xs">
          <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Destination Hub</div>
          <div class="text-sm font-bold text-slate-900">${tour.title}</div>
          <div class="text-xs text-slate-500 font-medium">${landing.name} (${landing.code})</div>
          ${
            tour.pricePKR
              ? `<div class="mt-1.5 inline-block text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Rs ${tour.pricePKR.toLocaleString()} PKR</div>`
              : ""
          }
        </div>
      `);

      layersRef.current.push(marker);
    });

    // 2. Render Flight Arc & Multi-hop Itinerary Stops ONLY for the Active Tour
    if (activeDetails) {
      const {
        departureAirport,
        landingAirport,
        routeArcPoints,
        flightDurationText,
        hops,
      } = activeDetails;

      // Departure Airport Marker (Green 🛫)
      const depIconHtml = `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-emerald-400/50"></span>
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl border-2 border-white font-bold text-xs">
            🛫
          </div>
        </div>
      `;
      const depIcon = L.divIcon({
        html: depIconHtml,
        className: "active-dep-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const depMarker = L.marker(
        [departureAirport.lat, departureAirport.lng],
        { icon: depIcon }
      ).addTo(map);

      depMarker.bindPopup(`
        <div class="p-2 text-slate-900 font-sans">
          <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Departure Airport</div>
          <div class="text-sm font-bold">${departureAirport.name} (${departureAirport.code})</div>
          <div class="text-xs text-slate-500">${departureAirport.city}, ${departureAirport.country}</div>
        </div>
      `);

      layersRef.current.push(depMarker);

      // Flight Path Polyline
      const flightArcLine = L.polyline(routeArcPoints, {
        color: "#059669",
        weight: 4,
        opacity: 0.9,
        dashArray: "8, 8",
      }).addTo(map);

      layersRef.current.push(flightArcLine);

      // Midpoint Duration Badge
      const midIdx = Math.floor(routeArcPoints.length / 2);
      const midPoint = routeArcPoints[midIdx];

      const durationBadgeHtml = `
        <div class="inline-flex items-center gap-1.5 rounded-full bg-slate-900/95 text-emerald-400 px-3 py-1 text-[11px] font-bold shadow-2xl border border-emerald-500/50 backdrop-blur-md whitespace-nowrap">
          <span>${flightDurationText}</span>
        </div>
      `;
      const durationIcon = L.divIcon({
        html: durationBadgeHtml,
        className: "duration-badge",
        iconSize: [170, 28],
        iconAnchor: [85, 14],
      });

      const durationMarker = L.marker(midPoint, { icon: durationIcon }).addTo(
        map
      );
      layersRef.current.push(durationMarker);

      // Multi-hop Itinerary Stops (Numbered 1, 2, 3)
      hops.forEach((hop) => {
        const hopIconHtml = `
          <div class="flex items-center justify-center">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-lg border border-white">
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

        const hopMarker = L.marker([hop.lat, hop.lng], {
          icon: hopIcon,
        }).addTo(map);

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

      // Smooth Camera Animation to fit route bounds
      const bounds = L.latLngBounds([
        [departureAirport.lat, departureAirport.lng],
        [landingAirport.lat, landingAirport.lng],
        ...hops.map((h) => [h.lat, h.lng] as [number, number]),
      ]);

      map.flyToBounds(bounds, {
        padding: [60, 60],
        duration: 1.2,
      });
    }
  }

  const [isCardExpanded, setIsCardExpanded] = React.useState<boolean>(true);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-card bg-card">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Floating Active Tour Info Badge (Top Left) */}
      {activeDetails && (
        <div className="absolute top-3 left-3 z-[400] max-w-xs sm:max-w-sm rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <div className="flex items-center gap-1.5 line-clamp-1">
              <Plane className="h-3.5 w-3.5 shrink-0 animate-pulse text-emerald-400" />
              <span className="text-[11px] font-bold text-foreground line-clamp-1">
                {activeDetails.tourTitle}
              </span>
            </div>
            <button
              onClick={() => setIsCardExpanded(!isCardExpanded)}
              className="inline-flex items-center gap-1 rounded-md bg-surface/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-surface border border-emerald-500/30 shrink-0 cursor-pointer"
              title={isCardExpanded ? "Minimize Card" : "Expand Flight Details"}
            >
              {isCardExpanded ? "Minimize ▲" : "Details ▼"}
            </button>
          </div>

          {isCardExpanded && (
            <div className="mt-2.5 pt-2 border-t border-border/50 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-border/50 bg-surface-2/80 p-2">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                    Departure
                  </span>
                  <span className="font-bold text-foreground">
                    🛫 {activeDetails.departureAirport.code} ({activeDetails.departureAirport.city})
                  </span>
                </div>
                <div className="rounded-lg border border-border/50 bg-surface-2/80 p-2">
                  <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                    Landing Hub
                  </span>
                  <span className="font-bold text-foreground">
                    🛬 {activeDetails.landingAirport.code} ({activeDetails.landingAirport.city})
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400 font-semibold">
                <span>{activeDetails.flightDurationText}</span>
                <span className="text-[10px] opacity-80">{activeDetails.transitsText}</span>
              </div>

              {activeDetails.hops.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Itinerary Schedule &amp; Hops ({activeDetails.hops.length} Stops)
                  </span>
                  {activeDetails.hops.map((h) => (
                    <div
                      key={h.step}
                      className="flex items-center justify-between rounded-md bg-surface/80 px-2 py-1 text-[11px]"
                    >
                      <span className="font-medium text-foreground">
                        #{h.step} {h.city}, {h.country}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {h.startDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
