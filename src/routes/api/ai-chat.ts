import { createFileRoute } from "@tanstack/react-router";
import { streamText, stepCountIs, tool, type ModelMessage } from "ai";
import { z } from "zod";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type TourRow = {
  id: string;
  title: string;
  destination_country: string;
  departure_city: string | null;
  duration_days: number | null;
  price_pkr: number;
  vendor_id?: string | null;
};

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
        let catalogText = "(no active tours currently listed)";
        let visaCatalogText = "(no active visa services currently listed)";
        let insuranceCatalogText = "(no active insurance plans currently listed)";
        let ticketsCatalogText = "(no active ticket services currently listed)";
        try {
          const { data: catalog } = await supabaseAdmin
            .from("tours")
            .select("id, title, destination_country, departure_city, duration_days, price_pkr")
            .eq("is_active", true)
            .order("price_pkr", { ascending: true })
            .limit(30);
          if (catalog && catalog.length > 0) {
            catalogText = catalog
              .map(
                (t) =>
                  `- TOUR: ${t.title} · ${t.destination_country} · from ${t.departure_city ?? "?"} · ${t.duration_days ?? "?"} days · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")} · id=${t.id}`,
              )
              .join("\n");
          }

          const { data: visas } = await supabaseAdmin
            .from("visa_services")
            .select("id, country, visa_type, processing_days, price_pkr, service_fee_pkr, success_rate, profiles:vendor_id(company_name, full_name, city)")
            .eq("is_active", true);
          if (visas && visas.length > 0) {
            visaCatalogText = visas
              .map(
                (v) => {
                  const vendorObj = (v as unknown as { profiles: { company_name?: string; full_name?: string; city?: string } | null }).profiles;
                  const vendorName = vendorObj?.company_name || vendorObj?.full_name || "Verified Consultant";
                  const cityTag = vendorObj?.city ? ` (${vendorObj.city})` : "";
                  return `- VISA: ${v.country} ${v.visa_type} Visa by ${vendorName}${cityTag} · ~${v.processing_days} days · Embassy ₨ ${v.price_pkr.toLocaleString("en-PK")} + Service fee ₨ ${v.service_fee_pkr.toLocaleString("en-PK")} · Total ₨ ${(v.price_pkr + v.service_fee_pkr).toLocaleString("en-PK")} · Success: ${v.success_rate ?? 98}% · id=${v.id}`;
                },
              )
              .join("\n");
          }

          const { data: insurance } = await supabaseAdmin
            .from("insurance_plans")
            .select("id, plan_name, coverage_type, coverage_amount_pkr, duration_days, price_pkr")
            .eq("is_active", true);
          if (insurance && insurance.length > 0) {
            insuranceCatalogText = insurance
              .map(
                (i) =>
                  `- INSURANCE: ${i.plan_name} (${i.coverage_type}) · Cover ₨ ${i.coverage_amount_pkr.toLocaleString("en-PK")} · ${i.duration_days} days · Premium ₨ ${i.price_pkr.toLocaleString("en-PK")} · id=${i.id}`,
              )
              .join("\n");
          }

          const { data: tickets } = await supabaseAdmin
            .from("ticket_services")
            .select("id, service_name, route_type, airlines_supported, service_fee_pkr, refundable")
            .eq("is_active", true);
          if (tickets && tickets.length > 0) {
            ticketsCatalogText = tickets
              .map(
                (tk) =>
                  `- TICKET SERVICE: ${tk.service_name} (${tk.route_type}) · Airlines: ${Array.isArray(tk.airlines_supported) ? tk.airlines_supported.join(", ") : "Various"} · Fee ₨ ${tk.service_fee_pkr.toLocaleString("en-PK")} · Refundable: ${tk.refundable ? "Yes" : "No"} · id=${tk.id}`,
              )
              .join("\n");
          }
        } catch (error) {
          console.error("[AI Catalog Load Error]:", error);
        }

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
- CRITICAL: You ALREADY have the full active database of tours, visas, insurance plans, and flight ticket services listed right below in "Current active catalogs". Before replying that any country, visa, or service is unavailable or missing, ALWAYS check the preloaded catalogs below first! If a matching item is in the preloaded catalog, provide its exact details (processing time, embassy fee, service fee, total cost in PKR) IMMEDIATELY!
- VISUAL & COLORFUL PRESENTATION: Be vibrant, clear, and engaging! Use country flags and colorful service emojis generously:
  - Countries: 🇹🇷 Turkey | 🇹🇭 Thailand | 🇦🇪 UAE / Dubai | 🇪🇺 Europe | 🇲🇾 Malaysia | 🇸🇬 Singapore | 🇻🇳 Vietnam | 🇬🇧 UK | 🇸🇦 Saudi Arabia / 🕋 Umrah
  - Services: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets
- PRICES: Highlight all prices clearly in bold PKR format (e.g. **₨ 385,000** or **₨ 35,000**).
- Language: Match the user's language choice. If the user clicks "English" or speaks in English, reply in English. If the user clicks "Roman Urdu" or speaks in Roman Urdu (e.g., "Bhai...", "Aapka naam..."), reply in warm, friendly Roman Urdu!
- Never invent IDs, prices, or itineraries.
- Keep responses concise (2–5 sentences). Use structured bullet lists and bold headers so information is easy to scan.
- Before capture_lead, confirm which service the customer wants, then name, then phone.
- MULTI-VENDOR COMPARISON: Multiple vendors offer visas/tours for the same country at different rates. When presenting options, highlight vendor location, turnaround, and total cost clearly (e.g. "🏢 **Vendor A (Lahore)**: ₨ 32,000 in 7 days vs 🏢 **Vendor B (Karachi)**: ₨ 35,000 in 3 days").
- QUICK REPLIES: End EVERY response with 3-5 relevant quick options using [[choose: Option A | Option B | Option C]]. Include emojis and flags in quick options (e.g. [[choose: 🇹🇷 Turkey Tours | 🇦🇪 UAE Visas | 🇵🇰 Roman Urdu | 🇬🇧 English]]).

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
              const { data, error } = await supabaseAdmin
                .from("tours")
                .select("destination_country")
                .eq("is_active", true);
              if (error) return { error: error.message };
              const counts = new Map<string, number>();
              for (const r of data ?? []) {
                counts.set(r.destination_country, (counts.get(r.destination_country) ?? 0) + 1);
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
              const qTerm = `%${query.trim()}%`;

              const [toursRes, visaRes, insRes, ticketRes] = await Promise.all([
                supabaseAdmin.from("tours")
                  .select("id, title, destination_country, departure_city, duration_days, price_pkr, description")
                  .eq("is_active", true)
                  .or(`destination_country.ilike.${qTerm},title.ilike.${qTerm},departure_city.ilike.${qTerm},description.ilike.${qTerm}`)
                  .limit(5),
                supabaseAdmin.from("visa_services")
                  .select("id, country, visa_type, processing_days, price_pkr, service_fee_pkr, success_rate, description")
                  .eq("is_active", true)
                  .or(`country.ilike.${qTerm},visa_type.ilike.${qTerm},description.ilike.${qTerm}`)
                  .limit(5),
                supabaseAdmin.from("insurance_plans")
                  .select("id, plan_name, coverage_type, coverage_amount_pkr, duration_days, price_pkr, description")
                  .eq("is_active", true)
                  .or(`plan_name.ilike.${qTerm},coverage_type.ilike.${qTerm},description.ilike.${qTerm}`)
                  .limit(5),
                supabaseAdmin.from("ticket_services")
                  .select("id, service_name, route_type, airlines_supported, service_fee_pkr, refundable, description")
                  .eq("is_active", true)
                  .or(`service_name.ilike.${qTerm},route_type.ilike.${qTerm},description.ilike.${qTerm}`)
                  .limit(5),
              ]);

              const tours = toursRes.data ?? [];
              const visa = visaRes.data ?? [];
              const insurance = insRes.data ?? [];
              const tickets = ticketRes.data ?? [];

              const totalMatches = tours.length + visa.length + insurance.length + tickets.length;

              if (totalMatches === 0) {
                // Return fallback active listings so AI can still guide user
                return {
                  matched: false,
                  message: `No exact matches for '${query}'. Try searching broader terms like country name or service type.`,
                };
              }

              return {
                matched: true,
                tours,
                visa_services: visa,
                insurance_plans: insurance,
                ticket_services: tickets,
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
              let q = supabaseAdmin
                .from("tours")
                .select("id, title, destination_country, departure_city, duration_days, price_pkr")
                .eq("is_active", true)
                .order("price_pkr", { ascending: true })
                .limit(10);
              if (destination) q = q.or(`destination_country.ilike.%${destination}%,title.ilike.%${destination}%`);
              if (max_budget_pkr) q = q.lte("price_pkr", max_budget_pkr);
              if (min_duration_days) q = q.gte("duration_days", min_duration_days);
              if (max_duration_days) q = q.lte("duration_days", max_duration_days);
              if (departure_city) q = q.ilike("departure_city", `%${departure_city}%`);
              const { data, error } = await q;
              if (error) return { error: error.message };
              return { tours: data ?? [] };
            },
          }),
          get_tour_details: tool({
            description: "Fetch full details for a single tour_id: description, itinerary, seats, price.",
            inputSchema: z.object({ tour_id: z.string().uuid() }),
            execute: async ({ tour_id }) => {
              const { data, error } = await supabaseAdmin
                .from("tours")
                .select("id, title, description, destination_country, departure_city, duration_days, price_pkr, total_seats, itinerary, is_active")
                .eq("id", tour_id)
                .maybeSingle();
              if (error) return { error: error.message };
              if (!data) return { error: "Tour not found" };
              return { tour: data };
            },
          }),
          compare_tours: tool({
            description: "Compare 2–4 tours side-by-side by tour_id.",
            inputSchema: z.object({ tour_ids: z.array(z.string().uuid()).min(2).max(4) }),
            execute: async ({ tour_ids }) => {
              const { data, error } = await supabaseAdmin
                .from("tours")
                .select("id, title, destination_country, departure_city, duration_days, price_pkr, total_seats")
                .in("id", tour_ids)
                .eq("is_active", true);
              if (error) return { error: error.message };
              return { tours: data ?? [] };
            },
          }),
          search_visa: tool({
            description: "Search active visa services by country and/or visa type.",
            inputSchema: z.object({
              country: z.string().nullable(),
              visa_type: z.string().nullable().describe("Tourist / Business / Student / etc."),
            }),
            execute: async ({ country, visa_type }) => {
              let q = supabaseAdmin.from("visa_services")
                .select("id, country, visa_type, processing_days, price_pkr, service_fee_pkr, success_rate, description")
                .eq("is_active", true).order("processing_days", { ascending: true }).limit(8);
              const term = country || visa_type;
              if (term) {
                q = q.or(`country.ilike.%${term}%,visa_type.ilike.%${term}%,description.ilike.%${term}%`);
              }
              const { data, error } = await q;
              if (error) return { error: error.message };
              return { visa_services: data ?? [] };
            },
          }),
          search_insurance: tool({
            description: "Search travel insurance plans by coverage type and/or max premium in PKR.",
            inputSchema: z.object({
              coverage_type: z.string().nullable(),
              max_price_pkr: z.number().nullable(),
              duration_days: z.number().nullable(),
            }),
            execute: async ({ coverage_type, max_price_pkr, duration_days }) => {
              let q = supabaseAdmin.from("insurance_plans")
                .select("id, plan_name, coverage_type, coverage_amount_pkr, duration_days, price_pkr")
                .eq("is_active", true).order("price_pkr", { ascending: true }).limit(8);
              if (coverage_type) q = q.ilike("coverage_type", `%${coverage_type}%`);
              if (max_price_pkr) q = q.lte("price_pkr", max_price_pkr);
              if (duration_days) q = q.gte("duration_days", duration_days);
              const { data, error } = await q;
              if (error) return { error: error.message };
              return { insurance_plans: data ?? [] };
            },
          }),
          search_tickets: tool({
            description: "Search ticketing services by route type or airline.",
            inputSchema: z.object({
              route_type: z.string().nullable().describe("Domestic / International / Umrah / Hajj"),
              airline: z.string().nullable(),
            }),
            execute: async ({ route_type, airline }) => {
              let q = supabaseAdmin.from("ticket_services")
                .select("id, service_name, route_type, airlines_supported, service_fee_pkr, refundable")
                .eq("is_active", true).order("service_fee_pkr", { ascending: true }).limit(8);
              if (route_type) q = q.ilike("route_type", `%${route_type}%`);
              if (airline) q = q.contains("airlines_supported", [airline]);
              const { data, error } = await q;
              if (error) return { error: error.message };
              return { ticket_services: data ?? [] };
            },
          }),
          capture_lead: tool({
            description: "Save the customer's inquiry as a lead. Works for tours, visa, insurance and tickets — pass service_type + service_id.",
            inputSchema: z.object({
              customer_name: z.string().min(2),
              customer_phone: z.string().min(6),
              service_type: z.enum(["tours", "visa", "insurance", "tickets"]),
              service_id: z.string().uuid(),
              message: z.string().nullable(),
            }),
            execute: async ({ customer_name, customer_phone, service_type, service_id, message }) => {
              const table = service_type === "tours" ? "tours"
                : service_type === "visa" ? "visa_services"
                : service_type === "insurance" ? "insurance_plans"
                : "ticket_services";
              const { data: row, error: rErr } = await supabaseAdmin
                .from(table).select("id, vendor_id").eq("id", service_id).eq("is_active", true).maybeSingle();
              if (rErr) return { error: rErr.message };
              if (!row) return { success: false, error: "Service not found or inactive" };
              const { error } = await supabaseAdmin.from("leads").insert({
                service_type, service_id: row.id,
                tour_id: service_type === "tours" ? row.id : null,
                vendor_id: (row as { vendor_id: string }).vendor_id,
                customer_name, customer_phone,
                message: message ?? null, is_unlocked: false,
              });
              if (error) return { error: error.message };
              return {
                success: true,
                message: `Inquiry sent to the provider. They'll reach out on ${customer_phone} shortly.`,
              };
            },
          }),

        } as const;

        try {
          const result = streamText({
            model: openRouterModel(),
            system: systemPrompt,
            messages: modelMessages,
            tools,
            stopWhen: stepCountIs(8),
          });

          // Stream plain text tokens as a chunked response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.textStream) {
                  controller.enqueue(encoder.encode(chunk));
                }
              } catch (err) {
                console.error("[ai-chat stream] error", err);
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (err) {
          console.error("[ai-chat main catch error]:", err);
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(
            `Sorry — I hit an issue reaching the concierge (${msg}). Please try again in a moment.`,
            { headers: { "Content-Type": "text/plain; charset=utf-8" } },
          );
        }
      },
    },
  },
});

// Keep TourRow export shape referenced elsewhere without breaking imports.
export type { TourRow };
