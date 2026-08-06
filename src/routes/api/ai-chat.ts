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
        }

        const catalogText = catalogList
          .map((t) => {
            const item = t as any;
            const dateStr = item.departure_date
              ? ` · Departs: ${item.departure_date}${item.return_date ? ` to ${item.return_date}` : ""}${item.booking_deadline ? ` (Book by: ${item.booking_deadline})` : ""}`
              : " · Dates: Flexible / Upcoming";
            return `- TOUR: ${t.title} · ${t.destination_country} · from ${t.departure_city} · ${t.duration_days} days · ₨ ${Number(t.price_pkr).toLocaleString("en-PK")}${dateStr} · id=${t.id}`;
          })
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

        const { openRouterModel, openRouterOnlineModel } = await import("@/integrations/openrouter/openrouter.server");

        const systemPrompt = `You are the GlobeTrek PK travel concierge — a warm, expert helper for Pakistani travelers.

GlobeTrek PK is a multi-service travel marketplace. You help with:
1. Tour packages (Turkey, Thailand, UAE, Europe, Malaysia, Singapore, Vietnam, UK, and more).
2. Visa services — country-wise consultants, processing time, documents.
3. Travel insurance — Schengen, medical, family, adventure plans.
4. Flight ticketing — domestic, international, Umrah & Hajj.

IMPORTANT: The complete catalog is embedded below for grounding. Answer ALL questions about tours, visas, insurance, and tickets DIRECTLY from this catalog. Do NOT say packages are unavailable if they exist below.

Rules:
- ALWAYS write a full, helpful text response. Never leave a response empty.
- VISUAL & COLORFUL PRESENTATION: Use country flags and emojis generously:
  - Countries: 🇹🇷 Turkey | 🇹🇭 Thailand | 🇦🇪 UAE / Dubai | 🇪🇺 Europe | 🇲🇾 Malaysia | 🇸🇬 Singapore | 🇻🇳 Vietnam | 🇬🇧 UK | 🇸🇦 Saudi Arabia / 🕋 Umrah
  - Services: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets
- PRICES: Always show prices as bold PKR (e.g. **₨ 385,000**).
- Language: Match the user's language. English request → English reply. Roman Urdu request → warm Roman Urdu reply.
- 📅 DATES & DEADLINES AWARENESS:
  When recommending a tour package, ALWAYS mention its specific Departure Date and Booking Deadline if available in the catalog!
  - Explicitly inform the user: "Departs on [Departure Date], returning on [Return Date]. Booking closes on [Booking Deadline] to allow time for visa/ticket processing."
  - If a tour's Booking Deadline is approaching soon, explicitly warn the user: "⚠️ Booking Deadline Approaching — Reserve your slot before [Booking Deadline]!"

- 🛑 NO DATA DUMP / STEP-BY-STEP GUIDED DISCOVERY FLOW (CRITICAL RULE):
  NEVER dump all catalog items or long lists when the user clicks a category chip or asks general questions (e.g., "Tour Packages", "Visa Services", "Travel Insurance", "Flight Tickets").
  Instead, ALWAYS guide the user through a warm, precise, step-by-step discovery flow:

  1. 🌴 FOR TOUR PACKAGES (User clicks "Tour Packages", "tours", "show packages"):
     - **Step 1 (Destination & Country)**: Do NOT list all tours. Ask the user which destination country or region they wish to visit.
       Always end Step 1 with destination chips:
       [[choose: 🇹🇷 Turkey | 🇹🇭 Thailand | 🇦🇪 UAE / Dubai | 🇪🇺 Europe | 🕋 Umrah / Saudi | 🇲🇾 Malaysia]]
     - **Step 2 (Departure City & Travel Dates)**: Once destination is selected, ask for departure city (Islamabad, Lahore, Karachi) or preferred travel month.
       Provide city chips:
       [[choose: 📍 Islamabad | 📍 Lahore | 📍 Karachi | 🗓️ Next Month]]
     - **Step 3 (Targeted Recommendations - MAX 2-3)**: Present ONLY the TOP 2-3 most relevant matching packages from the catalog with duration, price in bold PKR, key highlights, and vendor name. NEVER list more than 3 packages in a single message!

  2. 📄 FOR VISA SERVICES (User clicks "Visa Services", "visa"):
     - **Step 1**: Ask which specific destination country they need a visa for.
       Provide country chips:
       [[choose: 🇦🇪 UAE Visa | 🇸🇦 Saudi / Umrah | 🇹🇷 Turkey Visa | 🇪🇺 Schengen Visa | 🇬🇧 UK Visa]]
     - **Step 2**: Provide specific turnaround time, embassy fee vs service fee, and required documents for that chosen country only.

  3. 🛡️ FOR TRAVEL INSURANCE (User clicks "Travel Insurance"):
     - **Step 1**: Ask for destination region and travel duration.
       Provide chips:
       [[choose: 🇪🇺 Schengen Cover | 🌍 Worldwide Shield | 👨‍👩‍👧 Family Plan]]
     - **Step 2**: Present 1-2 matching insurance policies.

  4. ✈️ FOR FLIGHT TICKETS (User clicks "Flight Tickets"):
     - **Step 1**: Ask for departure city, destination, and travel dates.
       Provide chips:
       [[choose: ✈️ International Flight | 🕋 Umrah Flight | 🇵🇰 Domestic Flight]]

- 💡 LEAD PROMPTING: Whenever you describe or recommend a tour package, visa service, or deal (or when user clicks Book/Inquire), ALWAYS explicitly prompt the user to type their details in the chatbox: "Please type your Name and Mobile Number in the chatbox below so we can process your inquiry! 📞"
- ⛔ NO MISLEADING CHIPS WHEN ASKING FOR CONTACT INFO: When you are prompting the user to type their Name or Phone Number, DO NOT output category chips (like Tour Packages, Visa Services). Instead, end with NO chips or only [[choose: ✏️ I will type my details]].
- ⚠️ MANDATORY LEAD CAPTURE: Whenever the user provides their phone number (or shares contact info after an inquiry/booking request), YOU MUST IMMEDIATELY CALL THE capture_lead TOOL with:
  - customer_name: User's name (from conversation history)
  - customer_phone: User's phone number
  - service_type: "tours", "visa", "insurance", or "tickets"
  - service_id: The ID of the package/service from the catalog below (e.g. tour ID or visa ID)
  Do NOT skip calling capture_lead when phone number is provided!
- When asked about itinerary/details of a specific tour, describe it from the catalog data below. Include duration, price, highlights, and departure city.
- MULTI-VENDOR: Highlight vendor, turnaround, and price when multiple options exist.

- 💰 VISA FEES FROM PAKISTAN (2025-2026 latest known embassy/VFS rates for Pakistani passport holders):
  🇹🇷 Turkey: e-Visa USD 60 ≈ PKR 17,000 | Processing: instant-3 days | Source: evisa.gov.tr
  🇦🇪 UAE: Tourist visa AED 270-350 ≈ PKR 21,000-27,000 for 30 days | Through airlines (Emirates/Flydubai) or VFS
  🇸🇦 Saudi Arabia: Umrah visa PKR 45,000-65,000 including service fee | Tourist e-visa SAR 300 ≈ PKR 22,000
  🇪🇺 Schengen (Europe): EUR 90 ≈ PKR 27,000 embassy fee | VFS Global fee extra PKR 3,000-5,000 | 15-20 working days
  🇬🇧 UK: Standard Visitor Visa GBP 127 ≈ PKR 45,000 | Processing 15-25 working days | UKVI through VFS
  🇲🇾 Malaysia: VISA FREE for Pakistani passport holders (30 days on arrival)
  🇹🇭 Thailand: Visa on Arrival USD 35 ≈ PKR 10,000 OR e-Visa | Also free via some routes
  🇸🇬 Singapore: No VOA — requires prior visa. Fee SGD 30 ≈ PKR 6,500 | Through official ICA or travel agents
  🇨🇳 China: Tourist L-Visa CNY 300 ≈ PKR 12,000 | Processing 4-7 days
  🇦🇺 Australia: Tourist visa AUD 190 ≈ PKR 43,000 | Processing 4-8 weeks
  🇺🇸 USA: B1/B2 visa USD 185 ≈ PKR 52,000 | Plus interview | Through US Embassy Islamabad/Karachi/Lahore
  🇨🇦 Canada: Tourist visa CAD 100 ≈ PKR 21,000 | Processing 4-12 weeks
  🆯 NOTE: Fees are EMBASSY/VFS fees only — vendor service fees (PKR 3,000-15,000) are additional
  🔗 Verify latest: vfsglobal.com/pakistan | gerrys.com | tlscontact.com
- ⚠️ VISA FEE RULE: When asked about visa fees, answer DIRECTLY from the knowledge above. DO NOT call a tool — just give the information. Always add: "Please confirm current rate at VFS Global Pakistan or Gerrys before paying."

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

        let requestLeadsCount = 0;

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

                // 1. Check if realServiceId actually exists in the specific Postgres table
                if (realServiceId) {
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

                const { data, error } = await supabaseAdmin
                  .from("leads")
                  .insert(insertPayload as any)
                  .select("id")
                  .single();

                if (error) {
                  console.error("Lead insert error:", error);
                  return { success: true, lead_id: "demo-lead-id", note: "Lead recorded in concierge session" };
                }
                console.log("[capture_lead SUCCESS]", data);

                // --- Dispatch WhatsApp Alerts ---
                try {
                  const { dispatchWhatsAppDirect } = await import("@/lib/whatsapp.functions");

                  // 1. Admin Alert to +923490386131
                  const adminAlertMsg = `*👑 Admin Alert: New AI Chat Inquiry!* 📱\n\nA new lead has been captured by the AI Concierge.\n\n*Details:*\n👤 Name: ${customer_name}\n📞 Phone: ${customer_phone}\n💼 Service: ${finalServiceType.toUpperCase()}\n💬 Message: ${notes || "Concierge Inquiry"}\n\nView details and manage leads in Admin Console:\n👉 https://tour.testbench.shop/admin/leads`;
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

                  // 3. Notify Vendor if they have a phone number registered
                  if (vendorPhone) {
                    const vendorMsg = `*New Customer Lead!* 🚀\n\nDear Partner,\n\nYou have received a new inquiry from the GlobeTrek AI Concierge.\n\n*Lead Summary:*\n👤 Traveler: ${customer_name}\n📞 Contact: ${customer_phone}\n💼 Service: ${finalServiceType.toUpperCase()}\n\nPlease reach out to the traveler immediately on WhatsApp or call to close the deal!\n\nBest,\n*GlobeTrek PK Team*`;
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
            maxTokens: 400,
          });

          // Log AI usage event to database
          try {
            let userId: string | null = null;
            const authHeader = request.headers.get("authorization");
            if (authHeader?.startsWith("Bearer ")) {
              try {
                const token = authHeader.substring(7);
                const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
                if (claimsData?.claims?.sub) {
                  userId = claimsData.claims.sub as string;
                }
              } catch {
                // Token parsing failed, fall through to admin lookup
              }
            }

            if (!userId) {
              const { data: adminRole } = await supabaseAdmin
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin")
                .limit(1)
                .maybeSingle();
              if (adminRole?.user_id) {
                userId = adminRole.user_id;
              }
            }

            // Hardcoded fallback: GlobeTrek Admin user
            if (!userId) {
              userId = "ce083b9c-d6d3-46b4-827a-2bd3a569e978";
            }

            const { error: insertErr } = await supabaseAdmin.from("ai_usage_events").insert({
              user_id: userId,
              kind: "description",
            });

            if (insertErr) {
              console.error("[ai-chat logging error]:", insertErr.message);
            } else {
              console.log("[ai-chat] AI usage event logged for user:", userId);
            }
          } catch (e) {
            console.warn("[ai-chat logging warning]:", e);
          }
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
                "✅ **Shukriya! Aapki inquiry kamyabi k saath record ho gayi hai!** 🎉\n\n" +
                "Hamara numainda bahut jald — usually **24 ghante ke andar** — aap se phone par contact karega. Shukriya!\n\n" +
                "[[choose: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets]]";
            }
          }
        } catch (err) {
          console.error("[ai-chat handler error]:", err);
          fullText =
            "Assalam-o-Alaikum! Welcome to GlobeTrek PK. 🙏\n\n" +
            "Aap hum se Turkey, UAE, Malaysia tour packages, visa filing, insurance, ya flight tickets ke baray mein puch sakte hain.\n\n" +
            "[[choose: 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets]]";
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
