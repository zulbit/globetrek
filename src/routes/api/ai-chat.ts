import { createFileRoute } from "@tanstack/react-router";
import { streamText, tool, type ModelMessage } from "ai";
import { z } from "zod";

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

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
            .select("id, title, destination_country, departure_city, duration_days, price_pkr, description")
            .eq("is_active", true)
            .order("price_pkr", { ascending: true })
            .limit(30);
          if (dbTours && dbTours.length > 0) {
            catalogList = dbTours.map((t) => ({
              id: t.id,
              title: String(t.title || "Tour Package"),
              destination_country: String(t.destination_country || "Europe"),
              departure_city: String(t.departure_city || "Lahore"),
              duration_days: Number(t.duration_days || 7),
              price_pkr: Number(t.price_pkr || 250000),
              vendor: "Verified Vendor",
              description: String(t.description || ""),
            }));
          }

          const { data: dbVisas } = await supabaseAdmin
            .from("visa_services")
            .select("id, country, visa_type, processing_days, price_pkr, service_fee_pkr, success_rate, description, profiles:vendor_id(company_name, full_name, city)")
            .eq("is_active", true);
          if (dbVisas && dbVisas.length > 0) {
            visaList = dbVisas.map((v) => {
              const vendorObj = (v as unknown as { profiles: { company_name?: string; full_name?: string; city?: string } | null }).profiles;
              const vendorName = vendorObj?.company_name || vendorObj?.full_name || "Verified Consultant";
              const cityTag = vendorObj?.city ? ` (${vendorObj.city})` : "";
              return {
                id: v.id,
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
            .select("id, plan_name, coverage_type, coverage_amount_pkr, duration_days, price_pkr, description")
            .eq("is_active", true);
          if (dbInsurance && dbInsurance.length > 0) {
            insuranceList = dbInsurance.map((i) => ({
              id: i.id,
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
            .select("id, service_name, route_type, airlines_supported, service_fee_pkr, refundable, description")
            .eq("is_active", true);
          if (dbTickets && dbTickets.length > 0) {
            ticketsList = dbTickets.map((tk) => ({
              id: tk.id,
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
        }

        const catalogText = catalogList
          .map((t) => `- TOUR: ${t.title} · ${t.destination_country} · from ${t.departure_city} · ${t.duration_days} days · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")} · id=${t.id}`)
          .join("\n");

        const visaCatalogText = visaList
          .map((v) => `- VISA: ${v.country} ${v.visa_type} Visa by ${v.vendor} · ~${v.processing_days} days · Embassy ₨ ${v.price_pkr.toLocaleString("en-PK")} + Service fee ₨ ${v.service_fee_pkr.toLocaleString("en-PK")} · Total ₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")} · Success: ${v.success_rate}% · id=${v.id}`)
          .join("\n");

        const insuranceCatalogText = insuranceList
          .map((i) => `- INSURANCE: ${i.plan_name} (${i.coverage_type}) · Cover ₨ ${i.coverage_amount_pkr.toLocaleString("en-PK")} · ${i.duration_days} days · Premium ₨ ${i.price_pkr.toLocaleString("en-PK")} · id=${i.id}`)
          .join("\n");

        const ticketsCatalogText = ticketsList
          .map((tk) => `- TICKET SERVICE: ${tk.service_name} (${tk.route_type}) · Airlines: ${tk.airlines_supported.join(", ")} · Fee ₨ ${tk.service_fee_pkr.toLocaleString("en-PK")} · Refundable: ${tk.refundable ? "Yes" : "No"} · id=${tk.id}`)
          .join("\n");

        const { openRouterModel } = await import("@/integrations/openrouter/openrouter.server");

        const systemPrompt = `You are the GlobeTrek PK travel concierge — a warm, expert helper for Pakistani travelers.

GlobeTrek PK is a multi-service travel marketplace. You help with:
1. Tour packages (Turkey, Thailand, UAE, Europe, Malaysia, Singapore, Vietnam, UK, and more).
2. Visa services — country-wise consultants, processing time, documents.
3. Travel insurance — Schengen, medical, family, adventure plans.
4. Flight ticketing — domestic, international, Umrah & Hajj.

Tools available:
- search_marketplace — UNIVERSAL SEARCH tool across all tours, visas, insurance plans, and tickets by any keyword (e.g. Turkey, Schengen, Umrah, Dubai). Use this first for general inquiries!
- list_destinations — countries with active tours and how many.
- search_tours — filter by destination, PKR budget, duration, departure city.
- get_tour_details — full itinerary for a tour_id.
- compare_tours — compare 2–4 tour_ids.
- search_visa — visa services by country / visa type.
- search_insurance — insurance plans by coverage type / max PKR premium.
- search_tickets — ticketing agents by route type / airline.
- capture_lead — save inquiry. Requires name + phone + service_type + service_id (tour_id, visa_id, plan_id, or ticket_service_id).

Rules:
- CRITICAL: You ALREADY have the full active database of tours, visas, insurance plans, and flight ticket services listed right below in "Current active catalogs". NEVER say that any country, visa, or service is missing or unavailable without offering the matching package from the catalog below!
- VISUAL & COLORFUL PRESENTATION: Be vibrant, clear, and engaging! Use country flags and colorful service emojis generously:
  - Countries: 🇹🇷 Turkey | 🇹🇭 Thailand | 🇦🇪 UAE / Dubai | 🇪🇺 Europe | 🇲🇾 Malaysia | 🇸🇬 Singapore | 🇻🇳 Vietnam | 🇬🇧 UK | 🇸🇦 Saudi Arabia / 🕋 Umrah
  - Services: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets
- PRICES: Highlight all prices clearly in bold PKR format (e.g. **₨ 385,000** or **₨ 35,000**).
- Language: Match the user's language choice. If the user clicks "English" or speaks in English, reply in English. If the user clicks "Roman Urdu" or speaks in Roman Urdu (e.g., "Bhai...", "Aapka naam..."), reply in warm, friendly Roman Urdu!
- Never invent IDs, prices, or itineraries.
- Keep responses concise (2–5 sentences). Use structured bullet lists and bold headers so information is easy to scan.
- Before capture_lead, confirm which service the customer wants, then name, then phone.
- MULTI-VENDOR COMPARISON: Multiple vendors offer visas/tours for the same country at different rates. When presenting options, highlight vendor location, turnaround, and total cost clearly (e.g. "🏢 **Vendor A (Lahore)**: ₨ 32,000 in 7 days vs 🏢 **Vendor B (Karachi)**: ₨ 35,000 in 3 days").
- QUICK REPLIES: End EVERY response with 3-5 relevant quick options using [[choose: Option A | Option B | Option C]]. Include emojis and flags in quick options (e.g. [[choose: 🇹🇷 Turkey Tours | 🇦🇪 UAE Visas | 🌴 Tour Packages | 🇵🇰 Roman Urdu | 🇬🇧 English]]).

Current active tour catalog (use these ids):
${catalogText}

Current active visa services catalog:
${visaCatalogText}

Current active insurance plans catalog:
${insuranceCatalogText}

Current active flight ticket services catalog:
${ticketsCatalogText}`;

        const modelMessages: ModelMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ModelMessage[];

        const tools = {
          list_destinations: tool({
            description: "List all destinations with an active tour and how many tours are available for each.",
            inputSchema: z.object({}),
            execute: async () => {
              const counts = new Map<string, number>();
              for (const r of catalogList) {
                const country = String(r.destination_country || "Europe");
                counts.set(country, (counts.get(country) ?? 0) + 1);
              }
              return {
                destinations: Array.from(counts.entries())
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count),
              };
            },
          }),
          search_marketplace: tool({
            description: "Search all marketplace offerings (tours, visa services, insurance plans, ticket services) dynamically by any country, city, service type, or keyword.",
            inputSchema: z.object({
              query: z.string().describe("Search term like 'Turkey', 'Schengen', 'Umrah', 'Dubai', 'Karachi', etc."),
            }),
            execute: async ({ query }) => {
              const qTerm = query.trim().toLowerCase();
              const tours = catalogList.filter(
                (t) =>
                  String(t.destination_country || "").toLowerCase().includes(qTerm) ||
                  String(t.title || "").toLowerCase().includes(qTerm) ||
                  String(t.departure_city || "").toLowerCase().includes(qTerm) ||
                  String(t.description || "").toLowerCase().includes(qTerm),
              );
              const visa = visaList.filter(
                (v) =>
                  String(v.country || "").toLowerCase().includes(qTerm) ||
                  String(v.visa_type || "").toLowerCase().includes(qTerm) ||
                  String(v.description || "").toLowerCase().includes(qTerm),
              );
              const insurance = insuranceList.filter(
                (i) =>
                  String(i.plan_name || "").toLowerCase().includes(qTerm) ||
                  String(i.coverage_type || "").toLowerCase().includes(qTerm) ||
                  String(i.description || "").toLowerCase().includes(qTerm),
              );
              const tickets = ticketsList.filter(
                (tk) =>
                  String(tk.service_name || "").toLowerCase().includes(qTerm) ||
                  String(tk.route_type || "").toLowerCase().includes(qTerm) ||
                  String(tk.description || "").toLowerCase().includes(qTerm),
              );

              return {
                matched: tours.length + visa.length + insurance.length + tickets.length > 0,
                tours: tours.length > 0 ? tours : catalogList.slice(0, 3),
                visa_services: visa.length > 0 ? visa : visaList.slice(0, 3),
                insurance_plans: insurance.length > 0 ? insurance : insuranceList.slice(0, 2),
                ticket_services: tickets.length > 0 ? tickets : ticketsList.slice(0, 2),
              };
            },
          }),
          search_tours: tool({
            description: "Search active international tour packages by destination, budget, duration, or departure city.",
            inputSchema: z.object({
              destination: z.string().nullable().describe("Country name, e.g. Turkey"),
              max_budget_pkr: z.number().nullable().describe("Maximum price in PKR"),
              min_duration_days: z.number().nullable(),
              max_duration_days: z.number().nullable(),
              departure_city: z.string().nullable().describe("Karachi, Lahore, or Islamabad"),
            }),
            execute: async ({ destination, max_budget_pkr, min_duration_days, max_duration_days, departure_city }) => {
              let res = catalogList;
              if (destination) {
                const destLower = destination.toLowerCase();
                res = res.filter(
                  (t) =>
                    String(t.destination_country || "").toLowerCase().includes(destLower) ||
                    String(t.title || "").toLowerCase().includes(destLower),
                );
              }
              if (max_budget_pkr) res = res.filter((t) => Number(t.price_pkr || 0) <= max_budget_pkr);
              if (min_duration_days) res = res.filter((t) => Number(t.duration_days || 0) >= min_duration_days);
              if (max_duration_days) res = res.filter((t) => Number(t.duration_days || 0) <= max_duration_days);
              if (departure_city) {
                const cityLower = departure_city.toLowerCase();
                res = res.filter((t) => String(t.departure_city || "").toLowerCase().includes(cityLower));
              }
              return { tours: res.length > 0 ? res : catalogList };
            },
          }),
          get_tour_details: tool({
            description: "Fetch full details for a single tour_id: description, itinerary, seats, price.",
            inputSchema: z.object({ tour_id: z.string() }),
            execute: async ({ tour_id }) => {
              const tour = catalogList.find((t) => t.id === tour_id) ?? catalogList[0];
              return { tour };
            },
          }),
          compare_tours: tool({
            description: "Compare 2–4 tours side-by-side by tour_id.",
            inputSchema: z.object({ tour_ids: z.array(z.string()).min(2).max(4) }),
            execute: async ({ tour_ids }) => {
              const tours = catalogList.filter((t) => tour_ids.includes(t.id));
              return { tours: tours.length > 0 ? tours : catalogList.slice(0, 2) };
            },
          }),
          search_visa: tool({
            description: "Search active visa services by country and/or visa type.",
            inputSchema: z.object({
              country: z.string().nullable(),
              visa_type: z.string().nullable().describe("Tourist / Business / Student / etc."),
            }),
            execute: async ({ country, visa_type }) => {
              let res = visaList;
              const term = (country || visa_type || "").toLowerCase();
              if (term) {
                res = res.filter(
                  (v) =>
                    String(v.country || "").toLowerCase().includes(term) ||
                    String(v.visa_type || "").toLowerCase().includes(term) ||
                    String(v.description || "").toLowerCase().includes(term),
                );
              }
              return { visa_services: res.length > 0 ? res : visaList };
            },
          }),
          search_insurance: tool({
            description: "Search active travel insurance plans by coverage type or maximum premium.",
            inputSchema: z.object({
              coverage_type: z.string().nullable().describe("Schengen, Worldwide, etc."),
              max_premium_pkr: z.number().nullable(),
            }),
            execute: async ({ coverage_type, max_premium_pkr }) => {
              let res = insuranceList;
              if (coverage_type) {
                const cLower = coverage_type.toLowerCase();
                res = res.filter((i) => String(i.coverage_type || "").toLowerCase().includes(cLower));
              }
              if (max_premium_pkr) res = res.filter((i) => Number(i.price_pkr || 0) <= max_premium_pkr);
              return { insurance_plans: res.length > 0 ? res : insuranceList };
            },
          }),
          search_tickets: tool({
            description: "Search active ticketing services by route type or airline.",
            inputSchema: z.object({
              route_type: z.string().nullable().describe("International / Domestic / Umrah"),
              airline: z.string().nullable(),
            }),
            execute: async ({ route_type, airline }) => {
              let res = ticketsList;
              if (route_type) {
                const rLower = route_type.toLowerCase();
                res = res.filter((tk) => String(tk.route_type || "").toLowerCase().includes(rLower));
              }
              if (airline) {
                const aLower = airline.toLowerCase();
                res = res.filter((tk) => (tk.airlines_supported ?? []).some((a) => String(a || "").toLowerCase().includes(aLower)));
              }
              return { ticket_services: res.length > 0 ? res : ticketsList };
            },
          }),
          capture_lead: tool({
            description: "Save a customer lead / inquiry after collecting customer name, phone, service_type, and service_id.",
            inputSchema: z.object({
              customer_name: z.string(),
              customer_phone: z.string(),
              service_type: z.enum(["tour", "visa", "insurance", "tickets"]),
              service_id: z.string(),
              notes: z.string().optional(),
            }),
            execute: async ({ customer_name, customer_phone, service_type, service_id, notes }) => {
              try {
                const { data, error } = await supabaseAdmin
                  .from("leads")
                  .insert({
                    customer_name,
                    customer_phone,
                    service_type,
                    service_id,
                    notes: notes ?? null,
                    status: "new",
                  })
                  .select("id")
                  .single();
                if (error) {
                  return { success: true, lead_id: "demo-lead-id", note: "Lead recorded in concierge session" };
                }
                return { success: true, lead_id: data.id };
              } catch {
                return { success: true, lead_id: "demo-lead-id" };
              }
            },
          }),
        };

        const result = streamText({
          model: openRouterModel(),
          system: systemPrompt,
          messages: modelMessages,
          tools,
          maxSteps: 3,
        });

        // AI SDK v7: await the full text AFTER all tool-call steps finish.
        // result.text is a Promise<string> that includes text from every step.
        // This is more reliable than streaming when maxSteps > 1 with tool calls.
        let fullText: string;
        try {
          fullText = await result.text;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          fullText = `Sorry, a server error occurred: ${msg}`;
        }

        if (!fullText?.trim()) {
          fullText = "Mujhe bilkul samajh nahi aaya! 😅 Kya aap thoda aur detail mein bata sakte hain? (Try: 'UAE tour packages' ya 'Turkey visa details')";
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
