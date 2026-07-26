import turkey from "@/assets/tour-turkey.jpg";
import thailand from "@/assets/tour-thailand.jpg";
import europe from "@/assets/tour-europe.jpg";
import dubai from "@/assets/tour-dubai.jpg";
import singapore from "@/assets/tour-singapore.jpg";
import vietnam from "@/assets/tour-vietnam.jpg";
import uk from "@/assets/tour-uk.jpg";
import malaysia from "@/assets/tour-malaysia.jpg";

export type TourType = "Honeymoon" | "Family" | "Cultural" | "Adventure" | "City Break";
export type Destination = string;
export type DepartureCity = "Lahore" | "Karachi" | "Islamabad";

export interface Tour {
  id: string;
  title: string;
  destination: Destination;
  type: TourType;
  image: string;
  durationDays: number;
  nights: number;
  departureCity: DepartureCity;
  vendor: string;
  inclusions: string[];
  pricePKR: number;
  seatsLeft: number;
  totalSeats: number;
  rating: number;
  reviews: number;
  summary: string;
  itinerary: ItineraryDay[];
  requirements?: TourRequirement[];
  accommodation?: TourAccommodation;
  extraNotes?: string;
}

export type TourRequirement = { item: string; required: boolean; note?: string };
export type TourAccommodation = {
  standard?: string;
  premium?: { description: string; additional_pkr: number };
  return_tickets_included?: boolean;
  visa_included?: boolean;
  insurance_included?: boolean;
};


export const DESTINATIONS: Destination[] = [
  "Turkey", "Thailand", "UAE", "Saudi Arabia", "Malaysia", "Singapore", "Vietnam", "Maldives",
  "Azerbaijan", "UK", "USA", "Canada", "Europe", "Switzerland", "Germany", "France", "Italy",
  "Spain", "Japan", "China", "Australia", "Indonesia", "Sri Lanka", "Egypt", "Kenya", "South Africa",
  "Qatar", "Bahrain", "Oman", "Kuwait"
];
export const TOUR_TYPES: TourType[] = ["Honeymoon", "Family", "Cultural", "Adventure", "City Break"];
export const DEPARTURE_CITIES: DepartureCity[] = ["Lahore", "Karachi", "Islamabad"];

const cityCode = (c: DepartureCity) => (c === "Lahore" ? "LHE" : c === "Karachi" ? "KHI" : "ISB");
export const departureCode = cityCode;

export const TOURS: Tour[] = [
  {
    id: "turkey-explorer-7d",
    title: "7-Day Turkey Explorer (Istanbul & Cappadocia)",
    destination: "Turkey",
    type: "Cultural",
    image: turkey,
    durationDays: 7,
    nights: 6,
    departureCity: "Lahore",
    vendor: "Silk Route Holidays",
    inclusions: ["Return flights", "4★ hotels", "Daily breakfast", "Balloon ride (optional)", "English guide"],
    pricePKR: 385000,
    seatsLeft: 6,
    totalSeats: 20,
    rating: 4.9,
    reviews: 214,
    summary:
      "Two nights of hot air balloons over Cappadocia, then Bosphorus cruises, Hagia Sophia, and the Grand Bazaar in Istanbul.",
    itinerary: [
      { day: 1, title: "Lahore → Istanbul", detail: "Arrival, hotel check-in near Sultanahmet." },
      { day: 2, title: "Old Istanbul", detail: "Hagia Sophia, Blue Mosque, Topkapi Palace." },
      { day: 3, title: "Bosphorus & Bazaar", detail: "Cruise between two continents, Grand Bazaar." },
      { day: 4, title: "Fly to Cappadocia", detail: "Cave hotel stay in Göreme." },
      { day: 5, title: "Balloon sunrise", detail: "Optional balloon ride, Red Valley hike." },
      { day: 6, title: "Underground cities", detail: "Derinkuyu and Uçhisar castle." },
      { day: 7, title: "Return home", detail: "Fly Cappadocia → Istanbul → Lahore." },
    ],
  },
  {
    id: "bangkok-phuket-5d",
    title: "5-Day Bangkok & Phuket Getaway",
    destination: "Thailand",
    type: "Family",
    image: thailand,
    durationDays: 5,
    nights: 4,
    departureCity: "Karachi",
    vendor: "Orient Escapes",
    inclusions: ["Return flights", "4★ resort", "Airport transfers", "Phi Phi island tour", "Daily breakfast"],
    pricePKR: 245000,
    seatsLeft: 9,
    totalSeats: 24,
    rating: 4.8,
    reviews: 341,
    summary:
      "Two nights in Bangkok for temples and street food, then three nights of turquoise beaches and island-hopping in Phuket.",
    itinerary: [
      { day: 1, title: "Karachi → Bangkok", detail: "Arrival, Asiatique riverfront night." },
      { day: 2, title: "Grand Palace & Wat Arun", detail: "City tour + Chao Phraya river dinner." },
      { day: 3, title: "Fly to Phuket", detail: "Patong beach evening." },
      { day: 4, title: "Phi Phi Islands", detail: "Speedboat tour, Maya Bay, snorkel stops." },
      { day: 5, title: "Return home", detail: "Fly Phuket → Karachi." },
    ],
  },
  {
    id: "grand-europe-10d",
    title: "10-Day Grand Europe Tour",
    destination: "Europe",
    type: "Honeymoon",
    image: europe,
    durationDays: 10,
    nights: 9,
    departureCity: "Islamabad",
    vendor: "Voyage Continental",
    inclusions: ["Return flights", "Schengen visa support", "4★ hotels", "Eurail passes", "Daily breakfast"],
    pricePKR: 895000,
    seatsLeft: 4,
    totalSeats: 16,
    rating: 4.9,
    reviews: 128,
    summary:
      "Paris, Interlaken, Venice, and Rome — the classic four-country loop, timed for spring blossoms and long evenings.",
    itinerary: [
      { day: 1, title: "ISB → Paris", detail: "Seine cruise on arrival evening." },
      { day: 2, title: "Paris", detail: "Eiffel Tower, Louvre, Montmartre." },
      { day: 3, title: "TGV → Switzerland", detail: "Interlaken alpine base." },
      { day: 4, title: "Jungfraujoch", detail: "Top of Europe day trip." },
      { day: 5, title: "Train → Venice", detail: "Gondola ride, St Mark's." },
      { day: 6, title: "Venice canals", detail: "Murano and Burano islands." },
      { day: 7, title: "Train → Rome", detail: "Trevi and Spanish Steps by night." },
      { day: 8, title: "Ancient Rome", detail: "Colosseum, Forum, Palatine." },
      { day: 9, title: "Vatican City", detail: "St Peter's and the Sistine Chapel." },
      { day: 10, title: "Fly home", detail: "Rome → Islamabad." },
    ],
  },
  {
    id: "dubai-city-break-4d",
    title: "4-Day Dubai City Break",
    destination: "UAE",
    type: "City Break",
    image: dubai,
    durationDays: 4,
    nights: 3,
    departureCity: "Karachi",
    vendor: "Gulf Wings Travel",
    inclusions: ["Return flights", "5★ downtown hotel", "Burj Khalifa entry", "Desert safari", "Airport transfers"],
    pricePKR: 165000,
    seatsLeft: 12,
    totalSeats: 30,
    rating: 4.7,
    reviews: 512,
    summary:
      "Skyline views from At the Top, dune-bashing at sunset, and a full evening in Old Dubai's spice and gold souks.",
    itinerary: [
      { day: 1, title: "Karachi → Dubai", detail: "Marina walk on arrival." },
      { day: 2, title: "Modern Dubai", detail: "Burj Khalifa, Dubai Mall fountains." },
      { day: 3, title: "Desert safari", detail: "Dune bashing, BBQ dinner under stars." },
      { day: 4, title: "Old Dubai & fly out", detail: "Souks and abra ride, then home." },
    ],
  },
  {
    id: "singapore-family-5d",
    title: "5-Day Singapore Family Fun",
    destination: "Singapore",
    type: "Family",
    image: singapore,
    durationDays: 5,
    nights: 4,
    departureCity: "Lahore",
    vendor: "Orient Escapes",
    inclusions: ["Return flights", "4★ hotel", "Universal Studios tickets", "S.E.A. Aquarium", "Airport transfers"],
    pricePKR: 315000,
    seatsLeft: 7,
    totalSeats: 20,
    rating: 4.8,
    reviews: 189,
    summary:
      "Sentosa island for the kids, Gardens by the Bay after sunset, and hawker food across Chinatown and Little India.",
    itinerary: [
      { day: 1, title: "Lahore → Singapore", detail: "Marina Bay light show." },
      { day: 2, title: "Universal Studios", detail: "Full day at Sentosa." },
      { day: 3, title: "S.E.A. Aquarium", detail: "Skyline luge and cable car." },
      { day: 4, title: "Gardens by the Bay", detail: "Cloud Forest, Supertree Grove." },
      { day: 5, title: "Fly home", detail: "Return to Lahore." },
    ],
  },
  {
    id: "vietnam-halong-7d",
    title: "7-Day Vietnam: Hanoi & Halong Bay",
    destination: "Vietnam",
    type: "Adventure",
    image: vietnam,
    durationDays: 7,
    nights: 6,
    departureCity: "Islamabad",
    vendor: "Indochina Trails",
    inclusions: ["Return flights", "Overnight junk cruise", "Boutique hotels", "Guided city tours", "Most meals"],
    pricePKR: 335000,
    seatsLeft: 5,
    totalSeats: 18,
    rating: 4.9,
    reviews: 96,
    summary:
      "Old Quarter walks in Hanoi, an overnight junk boat through the karsts of Halong Bay, and a beach finish in Da Nang.",
    itinerary: [
      { day: 1, title: "ISB → Hanoi", detail: "Old Quarter street-food tour." },
      { day: 2, title: "Hanoi city", detail: "Ho Chi Minh mausoleum, Temple of Literature." },
      { day: 3, title: "Halong Bay", detail: "Board overnight junk cruise." },
      { day: 4, title: "Kayak the karsts", detail: "Sung Sot cave, sunset on deck." },
      { day: 5, title: "Fly to Da Nang", detail: "Marble Mountains." },
      { day: 6, title: "Hoi An old town", detail: "Lantern-lit riverside evening." },
      { day: 7, title: "Return home", detail: "Da Nang → Islamabad." },
    ],
  },
  {
    id: "malaysia-kl-langkawi-6d",
    title: "6-Day Malaysia: KL & Langkawi",
    destination: "Malaysia",
    type: "Family",
    image: malaysia,
    durationDays: 6,
    nights: 5,
    departureCity: "Karachi",
    vendor: "Orient Escapes",
    inclusions: ["Return flights", "4★ hotels", "Langkawi cable car", "Island hopping", "Airport transfers"],
    pricePKR: 275000,
    seatsLeft: 10,
    totalSeats: 22,
    rating: 4.7,
    reviews: 143,
    summary:
      "Petronas Towers by night in KL, then three easy days of beaches, mangroves, and sky-bridge views on Langkawi.",
    itinerary: [
      { day: 1, title: "Karachi → KL", detail: "KLCC park and Suria mall evening." },
      { day: 2, title: "KL city tour", detail: "Batu Caves and Petronas skybridge." },
      { day: 3, title: "Fly to Langkawi", detail: "Cenang beach sunset." },
      { day: 4, title: "Island hopping", detail: "Pregnant Maiden Lake, eagle feeding." },
      { day: 5, title: "SkyCab & SkyBridge", detail: "Mount Mat Cincang cable car." },
      { day: 6, title: "Fly home", detail: "Langkawi → Karachi." },
    ],
  },
  {
    id: "uk-london-edinburgh-8d",
    title: "8-Day UK: London & Edinburgh",
    destination: "UK",
    type: "Cultural",
    image: uk,
    durationDays: 8,
    nights: 7,
    departureCity: "Islamabad",
    vendor: "Voyage Continental",
    inclusions: ["Return flights", "UK visa support", "4★ hotels", "London Pass", "LNER train tickets"],
    pricePKR: 725000,
    seatsLeft: 3,
    totalSeats: 14,
    rating: 4.8,
    reviews: 87,
    summary:
      "Four nights in London for the classics — Westminster, the Tower, and a West End show — then three in Royal Mile Edinburgh.",
    itinerary: [
      { day: 1, title: "ISB → London", detail: "Thames evening walk." },
      { day: 2, title: "Royal London", detail: "Buckingham, Westminster Abbey, Big Ben." },
      { day: 3, title: "Museums", detail: "British Museum and National Gallery." },
      { day: 4, title: "Windsor day trip", detail: "Castle and old town." },
      { day: 5, title: "LNER to Edinburgh", detail: "Check in near Old Town." },
      { day: 6, title: "Edinburgh Castle", detail: "Royal Mile and Arthur's Seat." },
      { day: 7, title: "Scottish Highlands", detail: "Loch Ness and Glencoe day tour." },
      { day: 8, title: "Fly home", detail: "Edinburgh → London → Islamabad." },
    ],
  },
];

export function formatPKR(n: number): string {
  return `₨ ${new Intl.NumberFormat("en-PK").format(Math.round(n))}`;
}

export function getTour(id: string): Tour | undefined {
  return TOURS.find((t) => t.id === id);
}

export type ItineraryActivity = { time: string; title: string };
export type ItineraryDay = {
  day: number;
  title: string;
  detail: string;
  activities?: ItineraryActivity[];
};

export type DbTourRow = {
  id: string;
  title: string;
  description: string | null;
  destination_country: string | null;
  departure_city: string | null;
  duration_days: number | null;
  price_pkr: number;
  total_seats: number | null;
  image_url: string | null;
  itinerary?: unknown;
  requirements?: unknown;
  accommodation?: unknown;
  extra_notes?: string | null;
};

export const DB_TOUR_COLUMNS =
  "id, title, description, destination_country, departure_city, duration_days, price_pkr, total_seats, image_url, itinerary, requirements, accommodation, extra_notes";

function parseActivities(raw: unknown): ItineraryActivity[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .map((a) => {
      const o = (a ?? {}) as Record<string, unknown>;
      return { time: String(o.time ?? "").trim(), title: String(o.title ?? "").trim() };
    })
    .filter((a) => a.time || a.title);
  return out.length ? out : undefined;
}

function parseItinerary(raw: unknown): ItineraryDay[] {
  let arr: unknown[] | null = null;
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object" && "days" in raw) {
    const d = (raw as { days: unknown }).days;
    if (Array.isArray(d)) arr = d;
  }
  if (!arr) return [];
  return arr
    .map((d, i) => {
      const o = (d ?? {}) as Record<string, unknown>;
      return {
        day: Number(o.day ?? i + 1),
        title: String(o.title ?? ""),
        detail: String(o.detail ?? ""),
        activities: parseActivities(o.activities),
      };
    })
    .filter((d) => d.title || d.detail || (d.activities?.length ?? 0) > 0);
}

function parseRequirements(raw: unknown): TourRequirement[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        item: String(o.item ?? "").trim(),
        required: Boolean(o.required ?? true),
        note: o.note ? String(o.note) : undefined,
      };
    })
    .filter((r) => r.item);
  return out.length ? out : undefined;
}

function parseAccommodation(raw: unknown): TourAccommodation | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const acc: TourAccommodation = {};
  if (o.standard) acc.standard = String(o.standard);
  if (o.premium && typeof o.premium === "object") {
    const p = o.premium as Record<string, unknown>;
    const desc = String(p.description ?? "").trim();
    const add = Number(p.additional_pkr ?? 0);
    if (desc) acc.premium = { description: desc, additional_pkr: Number.isFinite(add) ? add : 0 };
  }
  if (typeof o.return_tickets_included === "boolean") {
    acc.return_tickets_included = o.return_tickets_included;
  }
  if (typeof o.visa_included === "boolean") {
    acc.visa_included = o.visa_included;
  }
  if (typeof o.insurance_included === "boolean") {
    acc.insurance_included = o.insurance_included;
  }
  return acc.standard || acc.premium || typeof acc.return_tickets_included === "boolean" || typeof acc.visa_included === "boolean" || typeof acc.insurance_included === "boolean" ? acc : undefined;
}

// Fallback image lookup for tours (esp. seeded ones without image_url)
export function fallbackImageFor(destination: string | null | undefined, title?: string): string {
  const match = TOURS.find(
    (t) =>
      (title && t.title.toLowerCase() === title.toLowerCase()) ||
      t.destination === (destination as Destination),
  );
  return match?.image ?? "";
}

export function mapDbTour(row: DbTourRow): Tour {
  const match = TOURS.find(
    (t) =>
      t.title.toLowerCase() === row.title.toLowerCase() ||
      t.destination === row.destination_country,
  );
  const seats = row.total_seats ?? match?.totalSeats ?? 20;
  const duration = row.duration_days ?? match?.durationDays ?? 7;
  const dbItinerary = parseItinerary(row.itinerary);
  return {
    id: row.id,
    title: row.title,
    destination: ((row.destination_country as Destination) ?? match?.destination ?? "Europe") as Destination,
    type: match?.type ?? "Cultural",
    image: row.image_url || match?.image || "",
    durationDays: duration,
    nights: Math.max(1, duration - 1),
    departureCity: ((row.departure_city as DepartureCity) ?? match?.departureCity ?? "Lahore") as DepartureCity,
    vendor: match?.vendor ?? "Verified Vendor",
    inclusions: match?.inclusions ?? ["Return flights", "Hotels", "Daily breakfast"],
    pricePKR: Number(row.price_pkr),
    seatsLeft: Math.max(1, Math.floor(seats * 0.4)),
    totalSeats: seats,
    rating: match?.rating ?? 4.8,
    reviews: match?.reviews ?? 120,
    summary: row.description || match?.summary || "",
    itinerary: dbItinerary.length > 0 ? dbItinerary : match?.itinerary ?? [],
    requirements: (() => {
      const requirements = parseRequirements(row.requirements) || [];
      const dest = row.destination_country || "";
      if (dest.includes("-") || dest.includes(",") || dest.includes("/")) {
        const countries = dest.split(/[-,\/]+/).map(c => c.trim()).filter(Boolean);
        countries.forEach(country => {
          const hasVisa = requirements.some(r => r.item.toLowerCase().includes("visa") && r.item.toLowerCase().includes(country.toLowerCase()));
          if (!hasVisa && country.toLowerCase() !== "europe" && country.toLowerCase() !== "multi") {
            requirements.push({
              item: `Visa for ${country}`,
              required: true,
              note: `Separate visa filing required for entry into ${country}`,
            });
          }
        });
      } else if (dest.toLowerCase() === "europe") {
        const hasSchengen = requirements.some(r => r.item.toLowerCase().includes("schengen") || r.item.toLowerCase().includes("visa"));
        if (!hasSchengen) {
          requirements.push({
            item: "Schengen Visa",
            required: true,
            note: "Required for entry into Schengen zone countries",
          });
        }
      }
      return requirements;
    })(),
    accommodation: parseAccommodation(row.accommodation),
    extraNotes: row.extra_notes ?? undefined,
  };
}



