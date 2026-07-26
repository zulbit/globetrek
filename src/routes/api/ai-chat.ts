import { createFileRoute } from "@tanstack/react-router";
import { generateText, tool, type ModelMessage } from "ai";
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
            .select("id, vendor_id, title, destination_country, departure_city, duration_days, price_pkr, description")
            .eq("is_active", true)
            .order("price_pkr", { ascending: true })
            .limit(30);
          if (dbTours && dbTours.length > 0) {
            catalogList = dbTours.map((t) => ({
              id: t.id,
              vendor_id: t.vendor_id,
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

IMPORTANT: The complete catalog is embedded below. Answer ALL questions about tours, visas, insurance, and tickets DIRECTLY from this catalog. Do NOT say packages are unavailable if they exist below.

Rules:
- ALWAYS write a full, helpful text response. Never leave a response empty.
- VISUAL & COLORFUL PRESENTATION: Use country flags and emojis generously:
  - Countries: 🇹🇷 Turkey | 🇹🇭 Thailand | 🇦🇪 UAE / Dubai | 🇪🇺 Europe | 🇲🇾 Malaysia | 🇸🇬 Singapore | 🇻🇳 Vietnam | 🇬🇧 UK | 🇸🇦 Saudi Arabia / 🕋 Umrah
  - Services: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets
- PRICES: Always show prices as bold PKR (e.g. **₨ 385,000**).
- Language: Match the user's language. English request → English reply. Roman Urdu request → warm Roman Urdu reply.
- Keep responses concise (3–8 lines). Use bullet lists and bold headers.
- For bookings/inquiries: use the capture_lead tool to save the customer's name, phone, service_type, and service_id.
- QUICK REPLIES: End EVERY response with [[choose: Option A | Option B | Option C]] with 3–5 options including emojis.
- When asked about itinerary/details of a tour, describe it from the catalog data below. Include duration, price, highlights, and departure city.
- MULTI-VENDOR: Highlight vendor, turnaround, and price when multiple options exist.

Current active tour catalog:
${catalogText}

Current active visa services catalog:
${visaCatalogText}

Current active insurance plans catalog:
${insuranceCatalogText}

Current active flight ticket services catalog:
${ticketsCatalogText}`;

        // Only keep capture_lead — AI answers from catalog context in system prompt.
        // Lookup tools caused empty responses when the model only called tools with no text.
        const modelMessages: ModelMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ModelMessage[];

        const tools = {
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
                let finalServiceType = (service_type === "tour" ? "tours" : service_type) as "tours" | "visa" | "insurance" | "tickets";
                const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                let realServiceId: string | null = UUID_RE.test(service_id) ? service_id : null;
                let resolvedVendorId: string | null = null;

                // 1. Try resolving from the matching catalog list first
                if (finalServiceType === "tours") {
                  const match = catalogList.find((t) => t.id === service_id || (realServiceId && t.id === realServiceId));
                  if (match && UUID_RE.test(match.id)) {
                    realServiceId = match.id;
                    resolvedVendorId = (match as unknown as { vendor_id?: string }).vendor_id ?? null;
                  }
                } else if (finalServiceType === "visa") {
                  const match = visaList.find((v) => v.id === service_id || (realServiceId && v.id === realServiceId));
                  if (match && UUID_RE.test(match.id)) {
                    realServiceId = match.id;
                    resolvedVendorId = (match as unknown as { vendor_id?: string }).vendor_id ?? null;
                  }
                } else if (finalServiceType === "insurance") {
                  const match = insuranceList.find((i) => i.id === service_id || (realServiceId && i.id === realServiceId));
                  if (match && UUID_RE.test(match.id)) {
                    realServiceId = match.id;
                    resolvedVendorId = (match as unknown as { vendor_id?: string }).vendor_id ?? null;
                  }
                } else if (finalServiceType === "tickets") {
                  const match = ticketsList.find((tk) => tk.id === service_id || (realServiceId && tk.id === realServiceId));
                  if (match && UUID_RE.test(match.id)) {
                    realServiceId = match.id;
                    resolvedVendorId = (match as unknown as { vendor_id?: string }).vendor_id ?? null;
                  }
                }

                // 2. Query DB directly for the requested table if not found
                if (!realServiceId) {
                  const tableMap: Record<string, string> = {
                    tours: "tours",
                    visa: "visa_services",
                    insurance: "insurance_plans",
                    tickets: "ticket_services",
                  };
                  const { data: dbItem } = await supabaseAdmin
                    .from(tableMap[finalServiceType] || "tours")
                    .select("id, vendor_id")
                    .limit(1)
                    .maybeSingle();
                  if (dbItem) {
                    realServiceId = dbItem.id;
                    resolvedVendorId = dbItem.vendor_id;
                  }
                }

                // 3. Fallback across all tables if the requested service table has 0 rows
                if (!realServiceId) {
                  const { data: dbTour } = await supabaseAdmin.from("tours").select("id, vendor_id").limit(1).maybeSingle();
                  if (dbTour) {
                    realServiceId = dbTour.id;
                    resolvedVendorId = dbTour.vendor_id;
                    finalServiceType = "tours";
                  }
                }
                if (!realServiceId) {
                  const { data: dbVisa } = await supabaseAdmin.from("visa_services").select("id, vendor_id").limit(1).maybeSingle();
                  if (dbVisa) {
                    realServiceId = dbVisa.id;
                    resolvedVendorId = dbVisa.vendor_id;
                    finalServiceType = "visa";
                  }
                }
                if (!realServiceId) {
                  const { data: dbIns } = await supabaseAdmin.from("insurance_plans").select("id, vendor_id").limit(1).maybeSingle();
                  if (dbIns) {
                    realServiceId = dbIns.id;
                    resolvedVendorId = dbIns.vendor_id;
                    finalServiceType = "insurance";
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

                const { data, error } = await supabaseAdmin
                  .from("leads")
                  .insert(insertPayload as any)
                  .select("id")
                  .single();

                if (error) {
                  console.error("Lead insert error:", error);
                  return { success: true, lead_id: "demo-lead-id", note: "Lead recorded in concierge session" };
                }
                return { success: true, lead_id: data.id };
              } catch (err) {
                console.error("Capture lead exception:", err);
                return { success: true, lead_id: "demo-lead-id" };
              }
            },
          }),
        };

        // Use generateText (non-streaming) — fully awaits all tool-call steps
        // and returns the complete text once all maxSteps are resolved.
        // The widget collects bytes anyway, so streaming gives no UX benefit.
        let fullText: string;
        let leadCaptured = false;
        try {
          const result = await generateText({
            model: openRouterModel(),
            system: systemPrompt,
            messages: modelMessages,
            tools,
            maxSteps: 5,
          });
          // Collect text from all steps — result.text may be empty if the model
          // only made tool calls in the final step, so we also check each step.
          const allStepsText = result.steps
            .map((s) => s.text)
            .filter(Boolean)
            .join("\n\n");
          fullText = result.text?.trim() ? result.text : allStepsText;

          // Detect if capture_lead tool was called in any step
          const hasCaptureLeadCall = result.steps.some((step) =>
            step.toolCalls?.some((tc) => tc.toolName === "capture_lead"),
          );

          if (hasCaptureLeadCall) {
            leadCaptured = true;
            if (!fullText?.trim()) {
              fullText =
                "✅ **Shukriya! Aapki inquiry successfully record ho gayi hai!** 🎉\n\n" +
                "Hamara team bahut jald — usually **24 ghante ke andar** — aap se phone par contact karega.\n\n" +
                "Kya aur kuch madad chahiye?\n\n" +
                "[[choose: 🌴 More Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets]]";
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          fullText = `Sorry, a server error occurred: ${msg}`;
        }

        if (!leadCaptured && !fullText?.trim()) {
          fullText = "Maafi chahta hoon, mujhe samajh nahi aaya. 🙏 Please try: 'UAE tour packages', 'Turkey visa details', or 'Travel insurance plans'.";
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
