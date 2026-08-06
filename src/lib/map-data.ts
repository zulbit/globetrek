export type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

export type ItineraryHop = {
  step: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  startDate: string; // e.g. "07 Sept 2026"
  endDate: string;   // e.g. "09 Sept 2026"
  description?: string;
};

export type TourMapDetails = {
  tourId: string;
  tourTitle: string;
  departureAirport: Airport;
  landingAirport: Airport;
  flightDurationText: string;
  transitsText: string;
  routeArcPoints: [number, number][];
  hops: ItineraryHop[];
  centerLat: number;
  centerLng: number;
  zoom: number;
};

export const AIRPORTS: Record<string, Airport> = {
  // Pakistani Departure Hubs
  LHE: { code: "LHE", name: "Allama Iqbal Int'l Airport", city: "Lahore", country: "Pakistan", lat: 31.5216, lng: 74.4036 },
  KHI: { code: "KHI", name: "Jinnah Int'l Airport", city: "Karachi", country: "Pakistan", lat: 24.9065, lng: 67.1608 },
  ISB: { code: "ISB", name: "Islamabad Int'l Airport", city: "Islamabad", country: "Pakistan", lat: 33.5492, lng: 72.8258 },

  // Destination Hubs
  IST: { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519 },
  NAV: { code: "NAV", name: "Nevşehir Kapadokya Airport", city: "Cappadocia", country: "Turkey", lat: 38.7719, lng: 34.5342 },
  BKK: { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501 },
  HKT: { code: "HKT", name: "Phuket Int'l Airport", city: "Phuket", country: "Thailand", lat: 8.1132, lng: 98.3169 },
  DXB: { code: "DXB", name: "Dubai Int'l Airport", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657 },
  CDG: { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479 },
  FCO: { code: "FCO", name: "Rome Fiumicino Airport", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389 },
  ZRH: { code: "ZRH", name: "Zurich Airport", city: "Interlaken / Zurich", country: "Switzerland", lat: 47.4582, lng: 8.5555 },
  KUL: { code: "KUL", name: "Kuala Lumpur Int'l Airport", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lng: 101.7099 },
  SGN: { code: "SGN", name: "Tan Son Nhat Int'l Airport", city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8185, lng: 106.6519 },
  SIN: { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915 },
  MLE: { code: "MLE", name: "Velana Int'l Airport", city: "Male", country: "Maldives", lat: 4.1918, lng: 73.5291 },
  MED: { code: "MED", name: "Prince Mohammad bin Abdulaziz Airport", city: "Madinah", country: "Saudi Arabia", lat: 24.5534, lng: 39.7051 },
  JED: { code: "JED", name: "King Abdulaziz Int'l Airport", city: "Jeddah / Makkah", country: "Saudi Arabia", lat: 21.6796, lng: 39.1565 },
};

/** Generate curved polyline coordinates (aviation arc curve) between 2 lat/lng points */
export function generateCurvedArc(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 30
): [number, number][] {
  const points: [number, number][] = [];

  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  const dx = endLng - startLng;
  const dy = endLat - startLat;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const curvature = Math.min(dist * 0.18, 6.0);
  const controlLat = midLat + curvature;
  const controlLng = midLng - curvature * 0.2;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlLat + t * t * endLat;
    const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * controlLng + t * t * endLng;
    points.push([lat, lng]);
  }

  return points;
}

export function getDepartureAirport(departureCity?: string): Airport {
  const city = (departureCity || "").toLowerCase().trim();
  if (city.includes("karachi")) return AIRPORTS.KHI;
  if (city.includes("islamabad")) return AIRPORTS.ISB;
  return AIRPORTS.LHE;
}

export function getTourMapDetails(tour: {
  id: string;
  title: string;
  destination?: string;
  departureCity?: string;
  duration?: string;
  pricePKR?: number;
}): TourMapDetails {
  const depAirport = getDepartureAirport(tour.departureCity);
  const titleLower = tour.title.toLowerCase();
  const destLower = (tour.destination || "").toLowerCase();

  let landingAirport = AIRPORTS.IST;
  let flightDurationText = "✈️ 5h 45m · Direct Flight";
  let transitsText = "Non-Stop / Direct";
  let hops: ItineraryHop[] = [];

  if (titleLower.includes("turkey") || destLower.includes("turkey")) {
    landingAirport = AIRPORTS.IST;
    flightDurationText = "✈️ 5h 50m · Direct Flight";
    transitsText = "Non-Stop (PIA / Turkish Airlines)";
    hops = [
      { step: 1, city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, startDate: "07 Sept 2026", endDate: "09 Sept 2026", description: "Bosphorus Cruise, Hagia Sophia & Grand Bazaar" },
      { step: 2, city: "Cappadocia", country: "Turkey", lat: 38.6431, lng: 34.8289, startDate: "10 Sept 2026", endDate: "13 Sept 2026", description: "Hot Air Balloon Flight & Fairy Chimneys" },
    ];
  } else if (titleLower.includes("thailand") || titleLower.includes("bangkok") || titleLower.includes("phuket")) {
    landingAirport = AIRPORTS.BKK;
    flightDurationText = "✈️ 6h 15m · 1 Transit";
    transitsText = "1 Stop (Bangkok Airways Transfer)";
    hops = [
      { step: 1, city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, startDate: "15 Sept 2026", endDate: "17 Sept 2026", description: "Grand Palace & Floating Markets" },
      { step: 2, city: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923, startDate: "18 Sept 2026", endDate: "20 Sept 2026", description: "Phi Phi Islands Speedboat Tour & Patong Beach" },
    ];
  } else if (titleLower.includes("europe") || destLower.includes("europe") || titleLower.includes("paris")) {
    landingAirport = AIRPORTS.CDG;
    flightDurationText = "✈️ 9h 30m · 1 Transit";
    transitsText = "1 Stop (Qatar / Emirates Layover)";
    hops = [
      { step: 1, city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, startDate: "01 Oct 2026", endDate: "03 Oct 2026", description: "Eiffel Tower & Louvre Museum" },
      { step: 2, city: "Interlaken", country: "Switzerland", lat: 46.6863, lng: 7.8632, startDate: "04 Oct 2026", endDate: "06 Oct 2026", description: "Jungfraujoch Top of Europe Train" },
      { step: 3, city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, startDate: "07 Oct 2026", endDate: "10 Oct 2026", description: "Colosseum & Trevi Fountain" },
    ];
  } else if (titleLower.includes("dubai") || titleLower.includes("uae") || destLower.includes("dubai")) {
    landingAirport = AIRPORTS.DXB;
    flightDurationText = "✈️ 3h 15m · Direct Flight";
    transitsText = "Non-Stop (Emirates / FlyDubai)";
    hops = [
      { step: 1, city: "Dubai City", country: "UAE", lat: 25.2048, lng: 55.2708, startDate: "20 Sept 2026", endDate: "22 Sept 2026", description: "Burj Khalifa & Dubai Mall Fountain" },
      { step: 2, city: "Desert Conservation Reserve", country: "UAE", lat: 24.8427, lng: 55.6264, startDate: "23 Sept 2026", endDate: "24 Sept 2026", description: "VIP Dune Bashing & Arabian Desert Camp" },
    ];
  } else if (titleLower.includes("malaysia") || titleLower.includes("vietnam") || titleLower.includes("singapore")) {
    landingAirport = AIRPORTS.KUL;
    flightDurationText = "✈️ 8h 45m · Multi-City Transits";
    transitsText = "2 Transits (AirAsia / Malindo)";
    hops = [
      { step: 1, city: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869, startDate: "05 Oct 2026", endDate: "07 Oct 2026", description: "Petronas Twin Towers & Batu Caves" },
      { step: 2, city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297, startDate: "08 Oct 2026", endDate: "10 Oct 2026", description: "Mekong Delta Cruise & Cu Chi Tunnels" },
      { step: 3, city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, startDate: "11 Oct 2026", endDate: "14 Oct 2026", description: "Gardens by the Bay & Marina Bay Sands" },
    ];
  } else {
    landingAirport = AIRPORTS.MLE;
    flightDurationText = "✈️ 4h 50m · 1 Transit";
    transitsText = "1 Stop (SriLankan Airlines Layover)";
    hops = [
      { step: 1, city: "Male Atoll", country: "Maldives", lat: 4.1755, lng: 73.5093, startDate: "12 Oct 2026", endDate: "17 Oct 2026", description: "Water Villa Resort & Sunset Dolphin Cruise" },
    ];
  }

  const arcPoints = generateCurvedArc(depAirport.lat, depAirport.lng, landingAirport.lat, landingAirport.lng);
  const centerLat = (depAirport.lat + landingAirport.lat) / 2;
  const centerLng = (depAirport.lng + landingAirport.lng) / 2;

  return {
    tourId: tour.id,
    tourTitle: tour.title,
    departureAirport: depAirport,
    landingAirport,
    flightDurationText,
    transitsText,
    routeArcPoints: arcPoints,
    hops,
    centerLat,
    centerLng,
    zoom: 4,
  };
}
