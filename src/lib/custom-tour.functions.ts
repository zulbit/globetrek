import { createServerFn } from "@tanstack/react-start";

// -------- Types --------
export interface CustomTourLeadInput {
  departureCity: string;
  destination: string;
  travelMonth: string;
  durationDays: number;
  groupSize: number;
  groupType: "family" | "friends" | "corporate" | "solo";
  hotelTier: "3star" | "4star" | "5star";
  visaNeeded: boolean;
  insuranceNeeded: boolean;
  flightClass: "economy" | "business";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
}

// -------- Submit custom tour lead (no auth required) --------
export const submitCustomTourLead = createServerFn({ method: "POST" })
  .validator((input: CustomTourLeadInput) => {
    if (!input.departureCity) throw new Error("Departure city is required");
    if (!input.destination) throw new Error("Destination is required");
    if (!input.travelMonth) throw new Error("Travel month is required");
    if (!input.durationDays || input.durationDays < 1) throw new Error("Duration must be at least 1 day");
    if (!input.groupSize || input.groupSize < 1) throw new Error("Group size must be at least 1");
    if (!input.contactName) throw new Error("Contact name is required");
    if (!input.contactEmail) throw new Error("Contact email is required");
    if (!input.contactPhone) throw new Error("Contact phone is required");
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)) {
      throw new Error("Invalid email address");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean phone → +92
    const digits = data.contactPhone.replace(/\D/g, "").replace(/^0+/, "");
    const phone = digits.startsWith("92") ? `+${digits}` : `+92${digits}`;

    const { data: lead, error } = await supabaseAdmin
      .from("custom_tour_leads")
      .insert({
        departure_city: data.departureCity,
        destination: data.destination,
        travel_month: data.travelMonth,
        duration_days: data.durationDays,
        group_size: data.groupSize,
        group_type: data.groupType,
        hotel_tier: data.hotelTier,
        visa_needed: data.visaNeeded,
        insurance_needed: data.insuranceNeeded,
        flight_class: data.flightClass,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: phone,
        special_requests: data.specialRequests || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[CustomTourLead] Insert error:", error);
      throw new Error("Failed to submit your request. Please try again.");
    }

    // Try sending WhatsApp alerts asynchronously (non-blocking)
    try {
      const { dispatchWhatsAppDirect } = await import("@/lib/whatsapp.functions");

      const inclusions = [
        data.flightClass ? `${data.flightClass} flights` : null,
        data.visaNeeded ? "visa assistance" : null,
        data.insuranceNeeded ? "travel insurance" : null,
      ].filter(Boolean).join(", ") || "Custom package only";

      // 1. Send confirmation to the Customer
      const customerMsg = `*GlobeTrek PK — Custom Tour Request* 🌴\n\nDear *${data.contactName}*,\n\nThank you for choosing GlobeTrek PK. We have successfully received your request for a custom package to *${data.destination}*!\n\n*Request Summary:*\n✈️ Departure: ${data.departureCity}\n📅 Travel Month: ${data.travelMonth}\n⏳ Duration: ${data.durationDays} Days\n👨‍👩‍👧‍👦 Group: ${data.groupSize} (${data.groupType})\n🏨 Hotel: ${data.hotelTier.replace("star", " ★")}\n💼 Services: ${inclusions}\n\n*What happens next?*\nVerified Pakistani agencies are now preparing custom quotes. They will contact you directly on WhatsApp or phone shortly!\n\nBest regards,\n*GlobeTrek PK Team* ✈️`;
      
      await dispatchWhatsAppDirect({
        phone: phone,
        message: customerMsg,
        skipDeduplication: true,
      });

      // 2. Send notification alert to the Admin
      const adminPhone = "+923490386131"; // Updated admin connection number
      const adminMsg = `*👑 Admin Alert: New Custom Tour Request!*\n\nA traveler has submitted a custom tour request.\n\n*Request details:*\n👤 Name: ${data.contactName}\n📞 Phone: ${phone}\n✉️ Email: ${data.contactEmail}\n✈️ Trip: ${data.departureCity} → ${data.destination}\n📅 Travel Month: ${data.travelMonth} (${data.durationDays} Days)\n👨‍👩‍👧‍👦 Group: ${data.groupSize} (${data.groupType})\n\nView details and manage leads in the admin panel:\n👉 https://tour.testbench.shop/admin/custom-leads`;

      await dispatchWhatsAppDirect({
        phone: adminPhone,
        message: adminMsg,
        skipDeduplication: true,
      });
    } catch (waErr) {
      console.error("WhatsApp alert failed:", waErr);
    }

    return { ok: true, leadId: lead.id };
  });
