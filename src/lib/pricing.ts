import { Sparkles, Zap, Crown, Rocket, Ticket, Shield, FileCheck, Globe2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ServiceCategory = "tours" | "visa" | "insurance" | "tickets";

export type PricingTier = {
  /** Stable enum value stored in profiles.subscription_tier */
  id: "free" | "starter" | "pro" | "agency";
  name: string;
  price_pkr: number;
  tagline: string;
  /** One-line "who is this for" archetype description */
  archetype: string;
  icon: LucideIcon;
  accent: string;
  highlight?: boolean;
  /** Which service categories this plan is optimised for */
  covers: ServiceCategory[];
  features: string[];
  limits: {
    listings: string;
    services: string;
    leadCredits: string;
    aiDrafts: string;
    aiPlans: string;
    placement: string;
    support: string;
  };
};

/**
 * Option C — Vendor archetype pricing.
 * The underlying DB enum stays free / starter / pro / agency; the UI relabels
 * each tier around the real business type it targets.
 */
/**
 * PLANNED MONETIZATION & ADVERTISING EXTENSIONS (FUTURE ROADMAP):
 * ---------------------------------------------------------------
 * Do not create active plan records for these in the database yet.
 * 
 * 1. Placement Subscription Plans:
 *    - Search Placement Plan: Top placement boost in /tours, /visa, /insurance, /tickets search results.
 *    - AI Placement Plan: Priority recommendations by bilingual Roman Urdu AI Concierge (/api/ai-chat).
 *    - Landing Page Placement Plan: Featured Agency Spotlight badge & top slider on the main landing page.
 * 
 * 2. Flash Banner Advertisement Plan (1-Week Campaign):
 *    - 7-Day Flash Banner on landing page hero section for seasonal campaigns (e.g. Baku Winter Sale, Umrah Specials, Summer Deals).
 */

export const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price_pkr: 0,
    tagline: "Trial account",
    archetype: "Trying the marketplace",
    icon: Sparkles,
    accent: "muted-foreground",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "3 active listings — any category",
      "5 lead credits / month",
      "Basic public profile",
      "Community support",
    ],
    limits: {
      listings: "3 total",
      services: "Any 1 category",
      leadCredits: "5 / month",
      aiDrafts: "—",
      aiPlans: "—",
      placement: "Standard",
      support: "Community",
    },
  },
  {
    id: "starter", // remapped to "Travel Desk"
    name: "Travel Desk",
    price_pkr: 4000,
    tagline: "Visa · Insurance · Tickets",
    archetype: "Ticketing desks, visa agents & insurance specialists",
    icon: Zap,
    accent: "sky-400",
    covers: ["visa", "insurance", "tickets"],
    features: [
      "Up to 30 active service listings",
      "60 lead credits / month",
      "Visa · Insurance · Tickets categories",
      "10 AI listing descriptions / month",
      "Email support (48h)",
    ],
    limits: {
      listings: "30 total",
      services: "Visa · Insurance · Tickets",
      leadCredits: "60 / month",
      aiDrafts: "10 / month",
      aiPlans: "—",
      placement: "Standard",
      support: "Email · 48h",
    },
  },
  {
    id: "pro", // remapped to "Tour Operator"
    name: "Tour Operator",
    price_pkr: 7500,
    tagline: "Tour packages + AI planner",
    archetype: "Tour operators building international packages",
    icon: Crown,
    accent: "primary",
    highlight: true,
    covers: ["tours"],
    features: [
      "Unlimited tour listings",
      "🗺️ OpenStreetMap Interactive Map & Flight Paths",
      "100 lead credits / month",
      "Unlimited AI descriptions",
      "50 AI full-trip plans / month",
      "Priority placement in search",
      "Verified vendor badge",
      "Priority email support (12h)",
    ],
    limits: {
      listings: "Unlimited",
      services: "Tours only",
      leadCredits: "100 / month",
      aiDrafts: "Unlimited",
      aiPlans: "50 / month",
      placement: "Priority + Interactive Map",
      support: "Priority · 12h",
    },
  },
  {
    id: "agency", // remapped to "Full Agency"
    name: "Full Agency",
    price_pkr: 12000,
    tagline: "Everything, unified",
    archetype: "Full-service agencies selling tours + visa + insurance + tickets",
    icon: Rocket,
    accent: "amber-400",
    covers: ["tours", "visa", "insurance", "tickets"],
    features: [
      "Unlimited listings across all 4 categories",
      "🗺️ OpenStreetMap Interactive Map & Animated Flight Paths",
      "300 lead credits / month",
      "Unlimited AI plans & descriptions",
      "Featured homepage placement",
      "Multi-seat team + dedicated account manager",
      "API + CSV bulk operations",
    ],
    limits: {
      listings: "Unlimited + team",
      services: "Tours · Visa · Insurance · Tickets",
      leadCredits: "300 / month",
      aiDrafts: "Unlimited",
      aiPlans: "Unlimited",
      placement: "Featured + Interactive Map",
      support: "Dedicated AM",
    },
  },
];

export const formatTierPrice = (pkr: number) =>
  pkr === 0 ? "Free" : `₨ ${pkr.toLocaleString("en-PK")}`;

/** Per-lead pay-as-you-go unlock cost by category (credits deducted). */
export const SERVICE_UNLOCK_COST_PKR: Record<ServiceCategory, number> = {
  tours: 500,
  visa: 300,
  insurance: 200,
  tickets: 150,
};

export const SERVICE_LABELS: Record<
  ServiceCategory,
  { label: string; short: string; icon: LucideIcon; accent: string; path: string }
> = {
  tours:     { label: "Tour packages",    short: "Tours",     icon: Globe2,    accent: "primary",     path: "/tours" },
  visa:      { label: "Visa services",    short: "Visa",      icon: FileCheck, accent: "sky-400",     path: "/visa" },
  insurance: { label: "Travel insurance", short: "Insurance", icon: Shield,    accent: "emerald-400", path: "/insurance" },
  tickets:   { label: "Flight tickets",   short: "Tickets",   icon: Ticket,    accent: "amber-400",   path: "/tickets" },
};
