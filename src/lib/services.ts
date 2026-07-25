// Shared service-marketplace types and helpers.
// Keep this file client-safe (no server imports).

export type ServiceType = "tours" | "visa" | "insurance" | "tickets";

export interface VisaService {
  id: string;
  vendor_id: string;
  country: string;
  visa_type: string;
  processing_days: number;
  price_pkr: number;
  service_fee_pkr: number;
  success_rate: number | null;
  documents_required: string[];
  description: string;
  extra_notes: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface InsurancePlan {
  id: string;
  vendor_id: string;
  plan_name: string;
  coverage_type: string;
  coverage_amount_pkr: number;
  duration_days: number;
  price_pkr: number;
  age_min: number;
  age_max: number;
  benefits: string[];
  exclusions: string[];
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface TicketService {
  id: string;
  vendor_id: string;
  service_name: string;
  route_type: string;
  airlines_supported: string[];
  service_fee_pkr: number;
  refundable: boolean;
  sample_routes: { from: string; to: string; from_pkr?: number }[];
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

/* Constants */

export const VISA_TYPES = [
  "Tourist", "Business", "Student", "Work", "Family Visit", "Umrah", "Transit",
] as const;

export const INSURANCE_COVERAGE = [
  "Schengen", "Medical", "Trip Cancellation", "Family", "Adventure Sports", "Senior Citizen",
] as const;

export const TICKET_ROUTE_TYPES = [
  "Domestic", "International", "Umrah", "Hajj", "Umrah+Ziyarat",
] as const;

export const POPULAR_VISA_COUNTRIES = [
  "Turkey", "Thailand", "UAE", "Saudi Arabia", "Malaysia", "Singapore",
  "United Kingdom", "Schengen (Europe)", "USA", "Canada", "Azerbaijan", "China",
];

export const AIRLINES = [
  "PIA", "Emirates", "Qatar Airways", "Etihad", "Turkish Airlines",
  "Saudia", "flynas", "Air Arabia", "SereneAir", "AirBlue",
];

export const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
] as const;


export const DEFAULT_VISA_DOCS = [
  "Passport (6+ months validity)",
  "CNIC copy",
  "2 passport-size photos",
  "Bank statement (last 6 months)",
  "Family Registration Certificate (FRC)",
  "Employment / business letter",
  "Hotel booking",
  "Return flight itinerary",
];

export const DEFAULT_INSURANCE_BENEFITS = [
  "Emergency medical treatment",
  "Trip cancellation & interruption",
  "Baggage loss / delay",
  "24/7 assistance",
  "Personal liability",
];

export function formatPKR(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `₨ ${Number(v).toLocaleString("en-PK")}`;
}

/**
 * Embassy visa fees change frequently. Vendors can mark a listing as
 * "To be communicated" — we store that as price_pkr === 0 and render
 * a friendly label instead of "₨ 0".
 */
export const EMBASSY_FEE_TBC = 0;
export function isEmbassyFeeTBC(v: number | null | undefined): boolean {
  return v === null || v === undefined || Number(v) === 0;
}
export function formatEmbassyFee(v: number | null | undefined): string {
  return isEmbassyFeeTBC(v) ? "To be confirmed" : formatPKR(v);
}

export function getServiceImage(countryOrType?: string | null, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl;
  if (!countryOrType) return null;

  const key = countryOrType.toLowerCase();
  if (key.includes("uae") || key.includes("dubai")) return "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80";
  if (key.includes("saudi") || key.includes("umrah")) return "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80";
  if (key.includes("turkey") || key.includes("istanbul")) return "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80";
  if (key.includes("thailand") || key.includes("phuket")) return "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80";
  if (key.includes("schengen") || key.includes("europe")) return "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80";
  if (key.includes("uk") || key.includes("london")) return "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80";
  if (key.includes("usa") || key.includes("america")) return "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=800&q=80";
  if (key.includes("singapore")) return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80";
  if (key.includes("malaysia")) return "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80";
  if (key.includes("insurance") || key.includes("worldwide")) return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
  if (key.includes("ticket") || key.includes("flight")) return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80";

  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
}

