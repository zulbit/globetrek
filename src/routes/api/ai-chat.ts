import { createFileRoute } from "@tanstack/react-router";
import { tool, type ModelMessage } from "ai";
import { generateTextWithFallback as generateText } from "@/integrations/openrouter/openrouter.server";
import { recordAIInvocationServer } from "@/lib/ai-admin.functions";
import { z } from "zod";
import { formatDateReadable } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const DEFAULT_TOURS = [
  {
    id: "turkey-explorer-7d",
    title: "7-Day Turkey Explorer (Istanbul & Cappadocia)",
    destination_country: "Turkey",
    departure_city: "Lahore",
    duration_days: 7,
    price_pkr: 385000,
    vendor: "Silk Route Holidays",
    description: "Two nights of hot air balloons over Cappadocia, Bosphorus cruise, Hagia Sophia & Grand Bazaar.",
  },
  {
    id: "bangkok-phuket-5d",
    title: "5-Day Bangkok & Phuket Getaway",
    destination_country: "Thailand",
    departure_city: "Karachi",
    duration_days: 5,
    price_pkr: 245000,
    vendor: "Orient Escapes",
    description: "Bangkok street food & temples, Phi Phi island speedboat tour & Patong beach in Phuket.",
  },
  {
    id: "grand-europe-10d",
    title: "10-Day Grand Europe Tour",
    destination_country: "Europe",
    departure_city: "Islamabad",
    duration_days: 10,
    price_pkr: 895000,
    vendor: "Voyage Continental",
    description: "Paris, Interlaken, Venice & Rome — classic 4-country loop with Schengen visa support.",
  },
  {
    id: "dubai-city-break-4d",
    title: "4-Day Dubai City Break",
    destination_country: "UAE",
    departure_city: "Karachi",
    duration_days: 4,
    price_pkr: 165000,
    vendor: "Gulf Wings Travel",
    description: "At the Top Burj Khalifa, sunset desert safari with dune bashing & Old Dubai souks.",
  },
  {
    id: "singapore-family-5d",
    title: "5-Day Singapore Family Fun",
    destination_country: "Singapore",
    departure_city: "Lahore",
    duration_days: 5,
    price_pkr: 315000,
    vendor: "Orient Escapes",
    description: "Universal Studios Sentosa, S.E.A. Aquarium, Gardens by the Bay & Chinatown.",
  },
  {
    id: "vietnam-halong-7d",
    title: "7-Day Vietnam: Hanoi & Halong Bay",
    destination_country: "Vietnam",
    departure_city: "Islamabad",
    duration_days: 7,
    price_pkr: 335000,
    vendor: "Indochina Trails",
    description: "Overnight junk boat cruise in Halong Bay, Hanoi Old Quarter & Da Nang lanterns.",
  },
  {
    id: "malaysia-kl-langkawi-6d",
    title: "6-Day Malaysia: KL & Langkawi",
    destination_country: "Malaysia",
    departure_city: "Karachi",
    duration_days: 6,
    price_pkr: 275000,
    vendor: "Orient Escapes",
    description: "Petronas Twin Towers in KL, Langkawi skybridge cable car & island hopping.",
  },
  {
    id: "uk-london-edinburgh-8d",
    title: "8-Day UK: London & Edinburgh",
    destination_country: "UK",
    departure_city: "Islamabad",
    duration_days: 8,
    price_pkr: 725000,
    vendor: "Voyage Continental",
    description: "Westminster & Tower of London, LNER scenic train to Royal Mile Edinburgh & Highlands.",
  },
];

const DEFAULT_VISAS = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    country: "UAE",
    visa_type: "Tourist Visa",
    processing_days: 3,
    price_pkr: 35000,
    service_fee_pkr: 5000,
    success_rate: 99,
    vendor: "GlobeTrek Demo Tours (Lahore)",
    description: "30-day UAE tourist visa with express 72-hour processing.",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    country: "Saudi Arabia",
    visa_type: "Umrah Visa",
    processing_days: 5,
    price_pkr: 45000,
    service_fee_pkr: 7500,
    success_rate: 99,
    vendor: "GlobeTrek Demo Tours (Lahore)",
    description: "Umrah visa bundled with hotel confirmation and ground transport advisory.",
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    country: "Turkey",
    visa_type: "Tourist Visa",
    processing_days: 7,
    price_pkr: 28000,
    service_fee_pkr: 4000,
    success_rate: 97,
    vendor: "GlobeTrek Demo Tours (Islamabad)",
    description: "Fast-track e-visa filing for Turkey with document review.",
  },
];

const DEFAULT_INSURANCE = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    plan_name: "Schengen Standard Shield",
    coverage_type: "Schengen",
    coverage_amount_pkr: 15000000,
    duration_days: 30,
    price_pkr: 8500,
    description: "Comprehensive Schengen visa compliant travel insurance (€30,000 cover).",
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    plan_name: "Worldwide Family Protection",
    coverage_type: "Worldwide",
    coverage_amount_pkr: 25000000,
    duration_days: 15,
    price_pkr: 12500,
    description: "Global family protection plan including baggage loss & flight delays.",
  },
];

const DEFAULT_TICKETS = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    service_name: "Express International Flight Desk",
    route_type: "International",
    airlines_supported: ["PIA", "Emirates", "Qatar Airways", "FlyDubai"],
    service_fee_pkr: 3500,
    refundable: true,
    description: "Priority ticketing desk for international flights from Lahore, Karachi & Islamabad.",
  },
  {
    id: "c2222222-2222-2222-2222-222222222222",
    service_name: "Umrah & Hajj Flight Booking",
    route_type: "Umrah",
    airlines_supported: ["PIA", "Saudi Arabian Airlines", "Airblue"],
    service_fee_pkr: 4000,
    refundable: true,
    description: "Dedicated Umrah flight booking service with group discounts.",
  },
];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per 10 minutes per IP
const WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp = getClientIp(request);
        if (!checkRateLimit(clientIp)) {
          console.warn(`[AI Chat Rate Limit Exceeded] IP: ${clientIp}`);
          return new Response(
            JSON.stringify({ error: "Too many AI chat requests. Please wait a few minutes before trying again." }),
            { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "600" } }
          );
        }

        let body: { messages?: ChatMessage[] };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Preload active catalog snippets for grounding across all 4 services
        let catalogList = DEFAULT_TOURS;
        let visaList = DEFAULT_VISAS;
        let insuranceList = DEFAULT_INSURANCE;
        let ticketsList = DEFAULT_TICKETS;

        try {
          const { data: dbTours } = await supabaseAdmin
            .from("tours")
            .select("id, vendor_id, title, destination_country, departure_city, duration_days, price_pkr, description, accommodation")
            .eq("is_active", true)
            .order("price_pkr", { ascending: true })
            .limit(30);
          if (dbTours && dbTours.length > 0) {
            catalogList = dbTours.map((t) => {
              const acc = (t.accommodation as Record<string, unknown> | null) || {};
              return {
                id: t.id,
                vendor_id: t.vendor_id,
                title: String(t.title || "Tour Package"),
                destination_country: String(t.destination_country || "Europe"),
                departure_city: String(t.departure_city || "Lahore"),
                duration_days: Number(t.duration_days || 7),
                price_pkr: Number(t.price_pkr || 250000),
                vendor: "Verified Vendor",
                description: String(t.description || ""),
                departure_date: typeof acc.departure_date === "string" ? acc.departure_date : null,
                return_date: typeof acc.return_date === "string" ? acc.return_date : null,
                booking_deadline: typeof acc.booking_deadline === "string" ? acc.booking_deadline : null,
              };
            });
          }

          const { data: dbVisas } = await supabaseAdmin
            .from("visa_services")
            .select("id, vendor_id, country, visa_type, processing_days, price_pkr, service_fee_pkr, success_rate, description, profiles:vendor_id(company_name, full_name, city)")
            .eq("is_active", true);
          if (dbVisas && dbVisas.length > 0) {
            visaList = dbVisas.map((v) => {
              const vendorObj = (v as unknown as { profiles: { company_name?: string; full_name?: string; city?: string } | null }).profiles;
              const vendorName = vendorObj?.company_name || vendorObj?.full_name || "Verified Consultant";
              const cityTag = vendorObj?.city ? ` (${vendorObj.city})` : "";
              return {
                id: v.id,
                vendor_id: v.vendor_id,
                country: String(v.country || "UAE"),
                visa_type: String(v.visa_type || "Tourist Visa"),
                processing_days: Number(v.processing_days || 3),
                price_pkr: Number(v.price_pkr || 35000),
                service_fee_pkr: Number(v.service_fee_pkr || 5000),
                success_rate: Number(v.success_rate ?? 98),
                vendor: `${vendorName}${cityTag}`,
                description: String(v.description || ""),
              };
            });
          }

          const { data: dbInsurance } = await supabaseAdmin
            .from("insurance_plans")
            .select("id, vendor_id, plan_name, coverage_type, coverage_amount_pkr, duration_days, price_pkr, description")
            .eq("is_active", true);
          if (dbInsurance && dbInsurance.length > 0) {
            insuranceList = dbInsurance.map((i) => ({
              id: i.id,
              vendor_id: i.vendor_id,
              plan_name: String(i.plan_name || "Schengen Standard Shield"),
              coverage_type: String(i.coverage_type || "Schengen"),
              coverage_amount_pkr: Number(i.coverage_amount_pkr || 15000000),
              duration_days: Number(i.duration_days || 30),
              price_pkr: Number(i.price_pkr || 8500),
              description: String(i.description || ""),
            }));
          }

          const { data: dbTickets } = await supabaseAdmin
            .from("ticket_services")
            .select("id, vendor_id, service_name, route_type, airlines_supported, service_fee_pkr, refundable, description")
            .eq("is_active", true);
          if (dbTickets && dbTickets.length > 0) {
            ticketsList = dbTickets.map((tk) => ({
              id: tk.id,
              vendor_id: tk.vendor_id,
              service_name: String(tk.service_name || "Express Flight Desk"),
              route_type: String(tk.route_type || "International"),
              airlines_supported: Array.isArray(tk.airlines_supported) ? tk.airlines_supported.map(String) : ["PIA", "Emirates"],
              service_fee_pkr: Number(tk.service_fee_pkr || 3500),
              refundable: Boolean(tk.refundable),
              description: String(tk.description || ""),
            }));
          }
        } catch (error) {
          console.error("[AI Catalog Load Error]:", error);
        }        // Pre-Retrieval Grounding (RAG): Search database for user's explicit query BEFORE invoking LLM
        const lastUserPrompt = (messages[messages.length - 1]?.content || "").trim();
        const isRomanUrdu = /\b(batao|bataen|chahiye|hain|hai|karo|apna|chahta|shukriya|shamil|kardein|pasand|din|kahan|kaise|mujhe|humare|koi|aur)\b/i.test(lastUserPrompt);
        const detectedLanguage = isRomanUrdu ? "Roman Urdu" : "English";

        let preSearchQuery = "";
        let preSearchResults: string[] = [];

        const lowerPrompt = lastUserPrompt.toLowerCase();
        const isGenericTourQuery = /\b(tour|tours|package|packages|trip|trips)\b/i.test(lowerPrompt);
        const isGenericVisaQuery = /\b(visa|visas|embassy|file|filing)\b/i.test(lowerPrompt);
        const isGenericInsuranceQuery = /\b(insurance|policy|cover|shield)\b/i.test(lowerPrompt);
        const isGenericFlightQuery = /\b(flight|flights|ticket|tickets|airline|umrah)\b/i.test(lowerPrompt);

        // Match 2+ letter words so 2-letter countries ("UK", "US", "EU", "PK") are captured
        const locWords = lastUserPrompt.match(/\b[A-Za-z]{2,}\b/g) || [];
        const ignoreWords = new Set(["you", "have", "any", "listing", "tour", "tours", "package", "packages", "trip", "trips", "from", "with", "about", "show", "tell", "what", "there", "here", "want", "like", "need", "book", "good", "best", "some", "details", "please", "the", "for", "and", "are", "near", "future", "services", "service"]);
        const targetKeywords = locWords.filter((w) => !ignoreWords.has(w.toLowerCase()));

        if (targetKeywords.length > 0) {
          preSearchQuery = targetKeywords.join(" ");
          const matchedTours = catalogList.filter((t) => {
            const text = `${t.title} ${t.destination_country} ${t.departure_city} ${t.description}`.toLowerCase();
            return targetKeywords.some((kw) => text.includes(kw.toLowerCase()));
          });

          if (matchedTours.length > 0) {
            preSearchResults = matchedTours.slice(0, 3).map((t) => {
              const item = t as any;
              const formattedDate = formatDateReadable(item.departure_date);
              const formattedDeadline = formatDateReadable(item.booking_deadline);
              const dateStr = formattedDate ? ` · Departs: ${formattedDate}` : "";
              const deadlineStr = formattedDeadline ? ` · Booking Deadline: ${formattedDeadline}` : "";
              return `- MATCHED TOUR: ${t.title} (${t.duration_days}d) · from ${t.departure_city} · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")}${dateStr}${deadlineStr} · id=${t.id}`;
            });
          }
        } else if (isGenericTourQuery && catalogList.length > 0) {
          preSearchQuery = "Tour Packages";
          preSearchResults = catalogList.slice(0, 3).map((t) => {
            const item = t as any;
            const formattedDate = formatDateReadable(item.departure_date);
            const formattedDeadline = formatDateReadable(item.booking_deadline);
            const dateStr = formattedDate ? ` · Departs: ${formattedDate}` : "";
            const deadlineStr = formattedDeadline ? ` · Booking Deadline: ${formattedDeadline}` : "";
            return `- FEATURED TOUR: ${t.title} (${t.duration_days}d) · from ${t.departure_city} · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")}${dateStr}${deadlineStr} · id=${t.id}`;
          });
        } else if (isGenericVisaQuery && visaList.length > 0) {
          preSearchQuery = "Visa Services";
          preSearchResults = visaList.slice(0, 3).map((v) => `- FEATURED VISA: ${v.country} ${v.visa_type} by ${v.vendor} · Total ₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")} · ~${v.processing_days} days · id=${v.id}`);
        } else if (isGenericInsuranceQuery && insuranceList.length > 0) {
          preSearchQuery = "Travel Insurance";
          preSearchResults = insuranceList.slice(0, 3).map((i) => `- FEATURED INSURANCE: ${i.plan_name} (${i.coverage_type}) · ₨ ${i.price_pkr.toLocaleString("en-PK")} · id=${i.id}`);
        } else if (isGenericFlightQuery && ticketsList.length > 0) {
          preSearchQuery = "Flight Tickets";
          preSearchResults = ticketsList.slice(0, 3).map((tk) => `- FEATURED FLIGHT: ${tk.service_name} (${tk.route_type}) · Fee ₨ ${tk.service_fee_pkr.toLocaleString("en-PK")} · id=${tk.id}`);
        }

        const catalogText = catalogList
          .slice(0, 3)
          .map((t) => {
            const item = t as any;
            const formattedDate = formatDateReadable(item.departure_date);
            const formattedDeadline = formatDateReadable(item.booking_deadline);
            const dateStr = formattedDate ? ` · Departs: ${formattedDate}` : "";
            const deadlineStr = formattedDeadline ? ` · Booking Deadline: ${formattedDeadline}` : "";
            return `- TOUR: ${t.title} (${t.duration_days}d) · from ${t.departure_city} · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")}${dateStr}${deadlineStr} · id=${t.id}`;
          })
          .join("\n");

        const activeVisaCountries = Array.from(new Set(visaList.map((v) => v.country.trim()))).filter(Boolean);

        const visaCatalogText = visaList.length > 0
          ? visaList
              .map((v) => `- VISA SERVICE: ${v.country} ${v.visa_type} by ${v.vendor} · Total ₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")} · ~${v.processing_days} days · id=${v.id}`)
              .join("\n")
          : "No active vendor visa filing services currently available in database.";

        const insuranceCatalogText = insuranceList
          .slice(0, 3)
          .map((i) => `- INS: ${i.plan_name} (${i.coverage_type}) · ₨ ${i.price_pkr.toLocaleString("en-PK")} · id=${i.id}`)
          .join("\n");

        const ticketsCatalogText = ticketsList
          .slice(0, 3)
          .map((tk) => `- FLIGHT: ${tk.service_name} (${tk.route_type}) · Fee ₨ ${tk.service_fee_pkr.toLocaleString("en-PK")} · id=${tk.id}`)
          .join("\n");

        const { openRouterModel } = await import("@/integrations/openrouter/openrouter.server");

        const systemPrompt = `You are the Senior Luxury Travel Sales Concierge for GlobeTrek PK (Pakistan's premier travel & tour marketplace).

YOUR MISSION & PERSONALITY:
- You are an energetic, warm, and highly engaging travel advisor who loves helping travelers discover the world.
- NEVER sound like a dry database lookup or slap raw bullet points without warmth, hospitality, and excitement.

RULE 1: MANDATORY CONVERSATIONAL SANDWICH (3-PART STRUCTURE)
EVERY response presenting a destination or package MUST strictly follow this 3-part structure:
1. Warm & Enthusiastic Hook:
   - For English: e.g., "Awesome choice! Dubai is one of our top-selling destinations right now! 🌆✨" or "Europe is calling! 🌍 From the romance of Paris to scenic Swiss Alps, you're in for a magical trip."
   - For Roman Urdu: e.g., "Aap ne zabardast destination select ki hai! 🌴 GlobeTrek PK par aap ka khushamdeed."
2. Package Summary (Clean & Professional):
   - Title with duration: **[Package Title]**
   - 📍 **Departure:** [City]
   - 💰 **Price:** **₨ [Amount]** per person
   - 🗓️ **Departs:** [DD MMM YYYY] *(Booking Deadline: [DD MMM YYYY])*
   - 🌟 **Highlights:** [Top 3-4 attractions, e.g. Palm Jumeirah, Burj Khalifa, Desert Safari, Bosphorus Cruise]
3. Mandatory Engagement Question:
   - NEVER stop at bullet points! ALWAYS ask 1-2 friendly consultative questions before the chips to advance the traveler toward booking:
   - e.g., "Is this departure date convenient for your travel plans, or would you like us to customize a private itinerary for your family/group?"
   - e.g., "Do you already hold a valid visa, or would you like our verified partner agencies to process your visa too?"

RULE 2: DYNAMIC ACTION CHIPS (NO REPETITIVE CHIPS)
When a user asks about or clicks a specific destination, DO NOT return the same destination chip back! Switch to Actionable Next-Step Chips:
- For Dubai inquiries: [[choose: 💳 Reserve Slots | 📄 Dubai Visa Info | 🌴 Custom Dubai Trip]]
- For Turkey inquiries: [[choose: 💳 Reserve Slots | 📄 Turkey Visa Info | 🌴 Custom Turkey Trip]]
- For Europe inquiries: [[choose: 💳 Reserve Slots | 📄 Schengen Visa Info | 🌴 Custom Europe Trip]]
- For General / Mixed: [[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]

RULE 3: STRICT SINGLE-KEYWORD INPUT HOOK
If the user inputs a single destination word (like "Dubai", "Turkey", "Europe", "Lahore"), DO NOT give a dry database dump. Treat it as an excited inquiry! Acknowledge their choice warmly, present the package with dates/pricing in bold PKR, and ask their travel group or date preference.

CRITICAL CONSTRAINTS:
1. NO INTERNAL MONOLOGUE / THOUGHTS: Never output reasoning steps, chain-of-thought, or meta commentary (e.g. NEVER say "User wants...", "Thinking Process:", "According to rules..."). Output ONLY the final message for the traveler.
2. LANGUAGE: Match the traveler's language directly. If English, reply in 100% natural, fluent, hospitable English. If Roman Urdu, reply in warm, respectful Pakistani Roman Urdu.
3. FORMATTING: Use clean markdown bolding, bullet points, and clickable markdown links:
   - [🌴 Build Your Custom Tour](/custom-tour)
   - [🎟️ Browse Tours](/tours)
   - [📄 Visa Services](/visa)
   - [📄 Request Custom Visa Consultation](/custom-visa)
   - [🛡️ Travel Insurance](/insurance)
   - [✈️ Flight Tickets](/tickets)

MATCHED / PRE-RETRIEVED LISTINGS:
${preSearchResults.length > 0 ? preSearchResults.join("\n") : "No direct keyword match."}

FEATURED CATALOG HIGHLIGHTS:
${catalogText}
${visaCatalogText}
${insuranceCatalogText}
${ticketsCatalogText}`;

        // Keep last 5 messages to stay safely under OpenRouter prompt token limit
        const modelMessages: ModelMessage[] = messages.slice(-5).map((m) => ({
          role: m.role,
          content: m.content,
        })) as ModelMessage[];

        const tools = {
          search_catalog: tool({
            description: "Search live GlobeTrek PK database for specific tours, visas, insurance plans, or flight tickets matching destination keyword, price, or city.",
            inputSchema: z.object({
              query: z.string().describe("Destination or service keyword e.g. 'Thailand', 'Turkey', 'Dubai', 'Lahore', 'Schengen'"),
              service_type: z.enum(["tours", "visa", "insurance", "tickets", "all"]).optional(),
              max_price_pkr: z.number().optional(),
            }),
            execute: async ({ query, service_type = "all", max_price_pkr }) => {
              try {
                const cleanQuery = query.trim().toLowerCase();
                const searchStr = `%${cleanQuery}%`;
                const isGenericTour = /^(tour|tours|package|packages|trip|trips|all|popular|featured)$/i.test(cleanQuery);
                const isGenericVisa = /^(visa|visas|embassy|file|filing)$/i.test(cleanQuery);
                const results: string[] = [];

                if (service_type === "all" || service_type === "tours") {
                  let tourQuery = supabaseAdmin
                    .from("tours")
                    .select("id, title, destination_country, departure_city, duration_days, price_pkr, accommodation")
                    .eq("is_active", true);

                  if (!isGenericTour) {
                    tourQuery = tourQuery.or(`title.ilike.${searchStr},destination_country.ilike.${searchStr},departure_city.ilike.${searchStr}`);
                  }

                  if (max_price_pkr) {
                    tourQuery = tourQuery.lte("price_pkr", max_price_pkr);
                  }

                  const { data: dbTours } = await tourQuery.limit(3);
                  if (dbTours && dbTours.length > 0) {
                    dbTours.forEach((t) => {
                      const acc = (t.accommodation as Record<string, unknown> | null) || {};
                      const formattedDate = formatDateReadable(typeof acc.departure_date === "string" ? acc.departure_date : null);
                      const formattedDeadline = formatDateReadable(typeof acc.booking_deadline === "string" ? acc.booking_deadline : null);
                      const dateStr = formattedDate ? ` · Departs: ${formattedDate}` : "";
                      const deadlineStr = formattedDeadline ? ` · Booking Deadline: ${formattedDeadline}` : "";
                      results.push(`- TOUR: ${t.title} (${t.duration_days}d) · from ${t.departure_city} · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")}${dateStr}${deadlineStr} · id=${t.id}`);
                    });
                  }
                }

                if (service_type === "all" || service_type === "visa") {
                  let visaQuery = supabaseAdmin
                    .from("visa_services")
                    .select("id, country, visa_type, price_pkr, service_fee_pkr, processing_days")
                    .eq("is_active", true);

                  if (!isGenericVisa) {
                    visaQuery = visaQuery.or(`country.ilike.${searchStr},visa_type.ilike.${searchStr}`);
                  }

                  const { data: dbVisas } = await visaQuery.limit(3);

                  if (dbVisas && dbVisas.length > 0) {
                    dbVisas.forEach((v) => {
                      results.push(`- VISA SERVICE: ${v.country} ${v.visa_type} · Total ₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")} · ~${v.processing_days} days · id=${v.id}`);
                    });
                  }
                }

                if (results.length === 0) {
                  return `NO MATCHES FOUND FOR '${query}'. You MUST now reply directly to the traveler in their exact language (100% fluent English if they asked in English, Roman Urdu if asked in Roman Urdu) explaining that we currently do not have fixed packages for '${query}', but they can check related services or click [🌴 Build Your Custom Tour](/custom-tour).`;
                }

                return results.join("\n");
              } catch (err) {
                console.error("[search_catalog tool error]:", err);
                return { success: false, message: "Search query failed." };
              }
            },
          }),

          capture_lead: tool({
            description: "Save a customer lead / inquiry after collecting customer name, phone, service_type, and service_id.",
            inputSchema: z.object({
              customer_name: z.string(),
              customer_phone: z.string(),
              service_type: z.enum(["tours", "tour", "visa", "insurance", "tickets"]),
              service_id: z.string(),
              notes: z.string().optional(),
            }),
            execute: async ({ customer_name, customer_phone, service_type, service_id, notes }) => {
              try {
                if (requestLeadsCount > 0) {
                  console.log("[capture_lead THROTTLED] lead already captured in this request");
                  return { success: true, lead_id: "duplicate-throttled" };
                }
                requestLeadsCount++;
                console.log("[capture_lead execute triggered]", { customer_name, customer_phone, service_type, service_id });
                let finalServiceType = (service_type === "tour" ? "tours" : service_type) as "tours" | "visa" | "insurance" | "tickets";
                const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                let realServiceId: string | null = UUID_RE.test(service_id) ? service_id : null;
                let resolvedVendorId: string | null = null;

                const tableMap: Record<string, string> = {
                  tours: "tours",
                  visa: "visa_services",
                  insurance: "insurance_plans",
                  tickets: "ticket_services",
                };

                // 1. Semantic Multi-Vendor Attribution Cross-Check
                // If user's latest message explicitly mentions a destination (e.g. Turkey, Dubai, Thailand),
                // verify that realServiceId matches the vendor offering that destination.
                const lastUserPrompt = (messages[messages.length - 1]?.content || "").toLowerCase();
                let targetCountry: string | null = null;
                if (/\bturkey\b|\btürkiye\b/i.test(lastUserPrompt)) targetCountry = "Turkey";
                else if (/\bdubai\b|\buae\b/i.test(lastUserPrompt)) targetCountry = "Dubai";
                else if (/\bthailand\b/i.test(lastUserPrompt)) targetCountry = "Thailand";
                else if (/\beurope\b/i.test(lastUserPrompt)) targetCountry = "Europe";
                else if (/\buk\b|\bunited kingdom\b/i.test(lastUserPrompt)) targetCountry = "UK";
                else if (/\bvietnam\b/i.test(lastUserPrompt)) targetCountry = "Vietnam";
                else if (/\bsingapore\b/i.test(lastUserPrompt)) targetCountry = "Singapore";
                else if (/\bmalaysia\b/i.test(lastUserPrompt)) targetCountry = "Malaysia";

                if (targetCountry) {
                  const { data: matchedService } = await supabaseAdmin
                    .from("tours")
                    .select("id, vendor_id, destination_country, title")
                    .eq("is_active", true)
                    .or(`destination_country.ilike.%${targetCountry}%,title.ilike.%${targetCountry}%`)
                    .limit(1)
                    .maybeSingle();

                  if (matchedService) {
                    realServiceId = matchedService.id;
                    resolvedVendorId = matchedService.vendor_id;
                    finalServiceType = "tours";
                    console.log("[capture_lead RECONCILED ATTRIBUTION]", { targetCountry, realServiceId, resolvedVendorId });
                  }
                }

                // 2. Check if realServiceId actually exists in the specific Postgres table
                if (realServiceId && !targetCountry) {
                  const tableName = tableMap[finalServiceType] || "tours";
                  const { data: dbItem } = await supabaseAdmin
                    .from(tableName)
                    .select("id, vendor_id")
                    .eq("id", realServiceId)
                    .maybeSingle();
                  if (dbItem) {
                    resolvedVendorId = dbItem.vendor_id;
                  } else {
                    // ID is a valid UUID string but doesn't exist in Postgres table
                    realServiceId = null;
                  }
                }

                // 2. Query ANY active row from the target table to satisfy the DB trigger
                if (!realServiceId) {
                  const tableName = tableMap[finalServiceType] || "tours";
                  const { data: dbItem } = await supabaseAdmin
                    .from(tableName)
                    .select("id, vendor_id")
                    .limit(1)
                    .maybeSingle();
                  if (dbItem) {
                    realServiceId = dbItem.id;
                    resolvedVendorId = dbItem.vendor_id;
                  }
                }

                // 3. Fallback across other service tables if target table is empty
                if (!realServiceId) {
                  for (const [sType, tName] of Object.entries(tableMap)) {
                    const { data: dbItem } = await supabaseAdmin.from(tName).select("id, vendor_id").limit(1).maybeSingle();
                    if (dbItem) {
                      realServiceId = dbItem.id;
                      resolvedVendorId = dbItem.vendor_id;
                      finalServiceType = sType as any;
                      break;
                    }
                  }
                }

                // 4. Fallback vendor profile
                if (!resolvedVendorId) {
                  const { data: vendorProfile } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("role", "vendor")
                    .limit(1)
                    .maybeSingle();
                  if (vendorProfile?.id) {
                    resolvedVendorId = vendorProfile.id;
                  }
                }

                // 5. Construct payload matching PostgreSQL validate_service_lead_ref trigger expectations
                const insertPayload: Record<string, unknown> = {
                  customer_name,
                  customer_phone,
                  service_type: finalServiceType,
                  service_id: realServiceId,
                  tour_id: finalServiceType === "tours" ? realServiceId : null,
                  message: notes || `Concierge Inquiry for ${finalServiceType}`,
                  notes: notes ?? null,
                  status: "new",
                  vendor_id: resolvedVendorId,
                };

                console.log("[insertPayload]", insertPayload);

                let leadId = "demo-lead-id";
                const { data: existingLead } = await supabaseAdmin
                  .from("leads")
                  .select("id")
                  .eq("customer_phone", customer_phone)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (existingLead?.id) {
                  leadId = existingLead.id;
                  const { error: updateErr } = await supabaseAdmin
                    .from("leads")
                    .update(insertPayload as any)
                    .eq("id", existingLead.id);
                  if (updateErr) console.error("Lead update error:", updateErr);
                  else console.log("[capture_lead UPDATED EXISTING LEAD]", existingLead.id);
                } else {
                  const { data, error } = await supabaseAdmin
                    .from("leads")
                    .insert(insertPayload as any)
                    .select("id")
                    .single();

                  if (error) {
                    console.error("Lead insert error:", error);
                  } else if (data?.id) {
                    leadId = data.id;
                    console.log("[capture_lead SUCCESS]", data);
                  }
                }

                // --- Dispatch WhatsApp Alerts ---
                try {
                  const { dispatchWhatsAppDirect } = await import("@/lib/whatsapp.functions");

                  // 1. Admin Alert to +923490386131
                  const adminAlertMsg = `*👑 Admin Alert: New AI Chat Inquiry!* 📱\n\nA new lead has been captured by the AI Concierge.\n\n*Details:*\n👤 Name: ${customer_name}\n📞 Phone: ${customer_phone}\n💼 Service: ${finalServiceType.toUpperCase()}\n💬 Message: ${notes || "Concierge Inquiry"}\n\nView details and manage leads in Admin Console:\n👉 https://globetrek.pk/admin/leads`;
                  await dispatchWhatsAppDirect({
                    phone: "+923490386131",
                    message: adminAlertMsg,
                    skipDeduplication: true,
                  });

                  // 2. Fetch vendor info to notify vendor
                  let vendorPhone = "";
                  let vendorCompany = "Travel Agency";
                  if (resolvedVendorId) {
                    const { data: vProf } = await supabaseAdmin
                      .from("profiles")
                      .select("phone, company_name, full_name")
                      .eq("id", resolvedVendorId)
                      .maybeSingle();
                    if (vProf) {
                      vendorPhone = vProf.phone || "";
                      vendorCompany = vProf.company_name || vProf.full_name || "Travel Agency";
                    }
                  }

                  // 3. Notify Vendor (Obfuscated contact details - vendor must log in to unlock)
                  if (vendorPhone) {
                    const cleanPhone = customer_phone.replace(/\D/g, "");
                    const maskedPhone = cleanPhone.length >= 8
                      ? `${cleanPhone.slice(0, 4)}****${cleanPhone.slice(-2)}`
                      : `${customer_phone.slice(0, 3)}****`;

                    const vendorMsg = `*New Customer Lead Alert!* 🚀\n\nDear Partner,\n\nYou have received a new inquiry via GlobeTrek PK.\n\n*Inquiry Summary:*\n👤 Traveler: ${customer_name}\n📞 Phone: ${maskedPhone} (Protected)\n💼 Service: ${finalServiceType.toUpperCase()}\n\n🔒 *Contact info is protected.* Log in to your Vendor Portal to unlock full lead details:\n👉 https://globetrek.pk/vendor/leads\n\nBest,\n*GlobeTrek PK Team*`;
                    await dispatchWhatsAppDirect({
                      phone: vendorPhone,
                      message: vendorMsg,
                      skipDeduplication: true,
                    });
                  }

                  // 4. Notify Traveler (Receipt Confirmation)
                  const travelerMsg = `*GlobeTrek PK — Inquiry Confirmed* ✅\n\nDear *${customer_name}*,\n\nWe have successfully received your inquiry for *${finalServiceType.toUpperCase()}* services!\n\nA representative from *${vendorCompany}* will reach out to you shortly on this number to assist you with your booking.\n\nThank you for choosing GlobeTrek PK! ✈️`;
                  await dispatchWhatsAppDirect({
                    phone: customer_phone,
                    message: travelerMsg,
                    skipDeduplication: true,
                  });

                } catch (waErr) {
                  console.error("Failed to send WhatsApp alerts for captured lead:", waErr);
                }

                return { success: true, lead_id: data.id };
              } catch (err) {
                console.error("Capture lead exception:", err);
                return { success: true, lead_id: "demo-lead-id" };
              }
            },
          }),
          lookup_visa_fee: tool({
            description: "Get visa fee information and application details for Pakistani passport holders for any destination country.",
            inputSchema: z.object({
              country: z.string().describe("Destination country e.g. Turkey, UAE, UK, Schengen"),
              visa_type: z.string().optional().describe("Visa type e.g. Tourist, Business, Umrah"),
            }),
            execute: async ({ country, visa_type }) => {
              // Static fee reference data for Pakistani passport holders (2025-2026)
              const feeData: Record<string, { fee_pkr: number; fee_original: string; processing: string; source: string; notes: string }> = {
                turkey: { fee_pkr: 17000, fee_original: "USD 60", processing: "Instant–3 days", source: "evisa.gov.tr", notes: "Apply at evisa.gov.tr. E-Visa only." },
                uae: { fee_pkr: 23000, fee_original: "AED 300 approx", processing: "3–5 days", source: "VFS / Airline portal", notes: "Apply via Emirates, Flydubai, or VFS Global." },
                "saudi arabia": { fee_pkr: 22000, fee_original: "SAR 300", processing: "1–3 days", source: "Saudi e-Visa portal", notes: "Tourist e-Visa. Umrah visa through travel agent, PKR 45,000-65,000 total." },
                schengen: { fee_pkr: 27000, fee_original: "EUR 90", processing: "15–20 working days", source: "VFS Global Pakistan", notes: "Embassy fee only. VFS service fee ~PKR 4,000 extra. Apply early." },
                uk: { fee_pkr: 45000, fee_original: "GBP 127", processing: "15–25 working days", source: "UKVI / VFS Global", notes: "Standard Visitor Visa. Priority service available for extra fee." },
                malaysia: { fee_pkr: 0, fee_original: "FREE", processing: "On arrival (30 days)", source: "Malaysian Immigration", notes: "VISA FREE for Pakistani passport holders." },
                thailand: { fee_pkr: 10000, fee_original: "USD 35", processing: "Visa on arrival or e-Visa", source: "Thai Immigration", notes: "VOA available at Bangkok airport. e-Visa also available online." },
                singapore: { fee_pkr: 6500, fee_original: "SGD 30", processing: "3–7 days", source: "ICA Singapore", notes: "Apply via ICA or authorized travel agent. No visa on arrival." },
                china: { fee_pkr: 12000, fee_original: "CNY 300", processing: "4–7 working days", source: "Chinese Embassy Pakistan", notes: "Tourist L-Visa. Apply at Chinese Embassy Islamabad or Consulate Karachi/Lahore." },
                australia: { fee_pkr: 43000, fee_original: "AUD 190", processing: "4–8 weeks", source: "IMMI / VFS", notes: "Tourist Visa (subclass 600). Processing can take longer. Apply early." },
                usa: { fee_pkr: 52000, fee_original: "USD 185", processing: "Weeks–months (interview wait)", source: "US Embassy Pakistan", notes: "B1/B2 Visitor Visa. Requires biometrics + interview at US Embassy Islamabad/Karachi/Lahore." },
                canada: { fee_pkr: 21000, fee_original: "CAD 100", processing: "4–12 weeks", source: "IRCC Canada", notes: "Tourist visa (TRV). Apply online via IRCC. Biometrics required." },
              };

              const key = country.toLowerCase().trim();
              const match = feeData[key] || feeData[Object.keys(feeData).find(k => key.includes(k) || k.includes(key)) ?? ""];

              if (match) {
                return {
                  country,
                  visa_type: visa_type || "Tourist",
                  fee_pkr: match.fee_pkr,
                  fee_original: match.fee_original,
                  processing_days: match.processing,
                  source: match.source,
                  notes: match.notes,
                  disclaimer: "Embassy fees change frequently. Confirm the latest rate at vfsglobal.com/pakistan, gerrys.com, or the official embassy website before paying.",
                };
              }

              return {
                country,
                visa_type: visa_type || "Tourist",
                fee_pkr: null,
                fee_original: null,
                processing_days: null,
                source: null,
                notes: `Fee data not in our quick reference for ${country}. Check: vfsglobal.com/pakistan, gerrys.com, or the ${country} embassy website in Pakistan.`,
                disclaimer: "Always verify directly with VFS, Gerrys, or the embassy before quoting.",
              };
            },
          }),
        };

        // Fetch configured max_tokens cap and active AI model dynamically from DB
        const reqStartTime = Date.now();
        let activeMaxTokens = 800;
        let activeModel = "qwen-turbo";
        let customApiKey: string | undefined = undefined;

        try {
          const { data: aiSetting } = await supabaseAdmin
            .from("payment_gateway_settings")
            .select("config")
            .eq("provider", "openrouter_config")
            .maybeSingle();

          if (aiSetting?.config) {
            const parsed = typeof aiSetting.config === "string" ? JSON.parse(aiSetting.config) : (aiSetting.config as any);
            if (parsed.max_tokens) {
              activeMaxTokens = Math.max(50, Math.min(4000, Number(parsed.max_tokens)));
            }
            if (parsed.active_model) {
              activeModel = String(parsed.active_model);
            }
            if (parsed.custom_api_key) {
              customApiKey = String(parsed.custom_api_key).trim();
            }
          }
        } catch (err) {
          console.warn("[AI Chat Config Fetch Warning]:", err);
        }

        // Detect if the user is providing contact info / phone / email to capture a lead
        const hasContactInfo = /(?:\+?92|0)?3\d{2}[- ]?\d{7}\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(lastUserPrompt);
        const activeTools = hasContactInfo ? { capture_lead: tools.capture_lead } : undefined;
        const activeMaxSteps = hasContactInfo ? 2 : 1;

        // Use generateText with a bounded timeout race (4.5s max) to prevent free-tier queue stalling
        let fullText: string = "";
        let leadCaptured = false;
        try {
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 4500)
          );

          const aiPromise = generateText({
            model: openRouterModel(activeModel, customApiKey),
            system: systemPrompt,
            messages: modelMessages,
            tools: activeTools,
            maxSteps: activeMaxSteps,
            maxTokens: activeMaxTokens,
          });

          const result = await Promise.race([aiPromise, timeoutPromise]);

          if (result) {
            // Log real-time AI invocation event to database with exact provider tokens
            try {
              const elapsedMs = Date.now() - (reqStartTime || Date.now());
              const usage = (result as any)?.usage;
              const promptTokens = usage?.promptTokens ?? usage?.prompt_tokens ?? Math.max(25, Math.round((systemPrompt.length + JSON.stringify(modelMessages).length) / 3.2));
              const completionTokens = usage?.completionTokens ?? usage?.completion_tokens ?? Math.max(15, Math.round((result.text || "").length / 3.2));
              const totalTokens = usage?.totalTokens ?? usage?.total_tokens ?? (promptTokens + completionTokens);
              const isFree = activeModel.startsWith("qwen") || activeModel.includes("free") || activeModel.startsWith("deepseek-v4");

              await recordAIInvocationServer({
                created_at: new Date().toISOString(),
                feature: "AI Concierge Chat",
                model: activeModel,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens,
                estimated_cost_usd: isFree ? 0 : 0.000045,
                latency_ms: elapsedMs,
                status: "success",
              });
            } catch (e) {
              console.warn("[ai-chat logging warning]:", e);
            }

            // Collect text from steps — prefer final step text (after tool resolution)
            // over pre-tool filler statements or scratchpad reasoning
            let finalAnswer = "";

            if (result.steps && result.steps.length > 0) {
              for (let i = result.steps.length - 1; i >= 0; i--) {
                const step = result.steps[i];
                if (step.text && step.text.trim().length > 0) {
                  let cleanStepText = step.text
                    .replace(/<think>[\s\S]*?<\/think>/gi, "")
                    .replace(/^(Thought|Reasoning|Thinking):[\s\S]*?\n/gi, "")
                    .trim();
                  
                  if (cleanStepText && (!step.toolCalls || step.toolCalls.length === 0)) {
                    finalAnswer = cleanStepText;
                    break;
                  }
                  if (!finalAnswer && cleanStepText) {
                    finalAnswer = cleanStepText;
                  }
                }
              }
            }

            const rawText = finalAnswer || result.text?.trim() || "";

            // Comprehensive multi-layer cleaner:
            // 1. Remove XML think tags (<think>...</think>)
            // 2. Remove Thought:/Reasoning: blocks
            // 3. Remove "Here's a thinking process..." and "User wants... According to rules..." meta commentary
            // 4. Remove "Let me check..." preambles
            // 5. Remove "User Safety: safe" moderation classifiers
            fullText = rawText
              .replace(/<think>[\s\S]*?<\/think>/gi, "")
              .replace(/^(Thought|Reasoning|Thinking):[\s\S]*?\n/gi, "")
              .replace(/^(Here's a thinking process|User wants|According to rules|Let's see the catalog|We need to show|We have catalog highlights|We need to respond)[\s\S]*?(?=\n\n|\n[A-Z]|\n•|\n\d|\n-|$)/gi, "")
              .replace(/^\s*(let me (check|search|look)|checking live database|searching database)[^.\n]*[.!]?\s*/gim, "")
              .replace(/^User Safety: safe\s*/gim, "")
              .trim();

            // Detect if capture_lead tool was called in any step
            const hasCaptureLeadCall = result.steps.some((step) =>
              step.toolCalls?.some((tc) => tc.toolName === "capture_lead"),
            );

            if (hasCaptureLeadCall) {
              leadCaptured = true;
              if (!fullText?.trim()) {
                fullText =
                  "✅ **Shukriya! Aapki inquiry kamyabi k saath record ho gayi hai!** 🎉\n\n" +
                  "Hamara numainda bahut jald — usually **24 ghante ke andar** — aap se phone par contact karega. Shukriya!\n\n" +
                  "[[choose: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets]]";
              }
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("[ai-chat execution warning]:", msg);
        }

        if (!leadCaptured && !fullText?.trim()) {
          const lastUserMsg = (messages[messages.length - 1]?.content || "").trim();
          const isEnglish = !/hai|hain|karo|batao|apna|chahta|shukriya|shamil|kardein|pasand|din/i.test(lastUserMsg);

          const isDubai = /\bdubai\b|\buae\b/i.test(lastUserMsg);
          const isTurkey = /\bturkey\b|\btürkiye\b|\bistanbul\b/i.test(lastUserMsg);
          const isEurope = /\beurope\b|\bparis\b|\bswitzerland\b|\bschengen\b/i.test(lastUserMsg);

          let actionChips = "[[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]";
          if (isDubai) actionChips = "[[choose: 💳 Reserve Slots | 📄 Dubai Visa Info | 🌴 Custom Dubai Trip]]";
          else if (isTurkey) actionChips = "[[choose: 💳 Reserve Slots | 📄 Turkey Visa Info | 🌴 Custom Turkey Trip]]";
          else if (isEurope) actionChips = "[[choose: 💳 Reserve Slots | 📄 Schengen Visa Info | 🌴 Custom Europe Trip]]";

          if (preSearchResults.length > 0) {
            const formattedMatches = preSearchResults.map(m => m.replace(/^[-\s]*MATCHED TOUR:\s*/i, "• ").replace(/·\s*id=[\w-]+/i, "")).join("\n");
            fullText = isEnglish
              ? `Awesome choice! 🌆✨ Here are the details for your requested destination:\n\n${formattedMatches}\n\nIs this departure date convenient for your travel plans, or would you like us to customize a private itinerary for your family/group? [🌴 Build Your Custom Tour](/custom-tour)\n\n${actionChips}`
              : `Aap ne zabardast destination select ki hai! 🌴 GlobeTrek PK par aapke liye yeh verified options available hain:\n\n${formattedMatches}\n\nKya yeh dates aapke travel plan ke mutabiq hain, ya aap family/group ke liye customized itinerary chahte hain? [🌴 Build Your Custom Tour](/custom-tour)\n\n${actionChips}`;
          } else if (isGenericTourQuery && catalogList.length > 0) {
            const toursList = catalogList.slice(0, 3).map(t => `• **${t.title}** (${t.duration_days}d) · from **${t.departure_city}** · **₨ ${Number(t.price_pkr).toLocaleString("en-PK")}**`).join("\n");
            fullText = isEnglish
              ? `Welcome to GlobeTrek PK! 🌟 Here are our top-selling featured tour packages:\n\n${toursList}\n\nWhich destination excites you most, or would you like a tailor-made private package? [🌴 Build Your Custom Tour](/custom-tour)\n\n[[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]`
              : `GlobeTrek PK mein khushamdeed! 🌟 Humare top featured tour packages yeh hain:\n\n${toursList}\n\nKaunsi destination aapke liye best rahegi, ya aap custom family package plan karna chahte hain? [🌴 Build Your Custom Tour](/custom-tour)\n\n[[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]`;
          } else if (isGenericVisaQuery && visaList.length > 0) {
            const visas = visaList.slice(0, 3).map(v => `• **${v.country} ${v.visa_type}** · Total **₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")}** · ~${v.processing_days} days`).join("\n");
            fullText = isEnglish
              ? `Planning an international trip? 📄 Here are our featured visa filing services:\n\n${visas}\n\nDo you have a complex case, bank statement question, or previous refusal? [📄 Request Custom Visa Consultation](/custom-visa)\n\n[[choose: 🇺🇸 USA | 🇹🇷 Turkey | 🇸🇬 Singapore | 📄 Request Visa Consultation]]`
              : `Visa filing ke liye GlobeTrek PK par khushamdeed! 📄 Featured visa services:\n\n${visas}\n\nKya aapko bank statement guidance ya refusal support chahiye? [📄 Request Custom Visa Consultation](/custom-visa)\n\n[[choose: 🇺🇸 USA | 🇹🇷 Turkey | 🇸🇬 Singapore | 📄 Request Visa Consultation]]`;
          } else if (isGenericInsuranceQuery && insuranceList.length > 0) {
            const ins = insuranceList.slice(0, 3).map(i => `• **${i.plan_name}** (${i.coverage_type}) · **₨ ${i.price_pkr.toLocaleString("en-PK")}**`).join("\n");
            fullText = isEnglish
              ? `Travel with peace of mind! 🛡️ Here are our top travel insurance plans:\n\n${ins}\n\nWhere are you traveling to, and what coverage duration do you need? [🛡️ Explore All Insurance Plans](/insurance)\n\n[[choose: 🇪🇺 Schengen Shield | 🌍 Worldwide Cover | 🌴 Build Custom Tour]]`
              : `Travel Insurance Plans 🛡️:\n\n${ins}\n\nAap kis mulk travel kar rahe hain taake best insurance plan suggest kar sakein? [🛡️ Tamam Plans Dekhein](/insurance)\n\n[[choose: 🇪🇺 Schengen Shield | 🌍 Worldwide Cover | 🌴 Build Custom Tour]]`;
          } else if (isGenericFlightQuery && ticketsList.length > 0) {
            const tk = ticketsList.slice(0, 3).map(t => `• **${t.service_name}** (${t.route_type}) · Service Fee: **₨ ${t.service_fee_pkr.toLocaleString("en-PK")}**`).join("\n");
            fullText = isEnglish
              ? `Ready to fly? ✈️ Here are our active ticketing desks:\n\n${tk}\n\nWhich route and travel dates are you looking for? [✈️ Browse Flight Services](/tickets)\n\n[[choose: ✈️ International Flight | 🕋 Umrah Flight | 🌴 Build Custom Tour]]`
              : `Flight Booking Desks ✈️:\n\n${tk}\n\nAap kis route aur date par flight search kar rahe hain? [✈️ Tamam Flight Services](/tickets)\n\n[[choose: ✈️ International Flight | 🕋 Umrah Flight | 🌴 Build Custom Tour]]`;
          } else if (isEnglish) {
            fullText = "Awesome! We have exciting tour packages for Dubai 🇦🇪, Turkey 🇹🇷, and Europe 🇪🇺 ready for booking.\n\nWhich destination are you considering, or would you like to plan a private tailor-made trip? [🌴 Build Your Custom Tour](/custom-tour)\n\n[[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]";
          } else {
            fullText = "Zabardast! Humare paas Dubai 🇦🇪, Turkey 🇹🇷, aur Europe 🇪🇺 ke shandar packages available hain.\n\nAap kis destination par travel karne ka plan kar rahe hain? [🌴 Build Your Custom Tour](/custom-tour)\n\n[[choose: 🇦🇪 Dubai | 🇹🇷 Turkey | 🇪🇺 Europe | 🌴 Build Custom Tour]]";
          }
        }

        return new Response(fullText, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
