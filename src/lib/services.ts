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

