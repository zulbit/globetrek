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
  password?: string;
  userId?: string;
  specialRequests?: string;
}

// -------- Submit custom tour lead (creates/links traveler account) --------
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
    if (input.password && input.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean phone → +92
    const digits = data.contactPhone.replace(/\D/g, "").replace(/^0+/, "");
    const phone = digits.startsWith("92") ? `+${digits}` : `+92${digits}`;

    let registeredUserId: string | null = data.userId || null;
    let accountCreated = false;

    // 1. If password provided, register/ensure customer account in Supabase
    if (data.password && data.password.trim().length >= 6) {
      try {
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: data.contactEmail,
          password: data.password.trim(),
          email_confirm: true,
          user_metadata: {
            full_name: data.contactName,
            role: "customer",
            phone: phone,
          },
        });

        if (newUser?.user) {
          registeredUserId = newUser.user.id;
          accountCreated = true;

          // Create/update profiles entry
          await supabaseAdmin.from("profiles").upsert({
            id: registeredUserId,
            email: data.contactEmail,
            full_name: data.contactName || null,
            vendor_status: "approved",
            subscription_tier: "free",
          });

          // Create user_roles entry
          await supabaseAdmin.from("user_roles").upsert({
            user_id: registeredUserId,
            role: "customer",
          });
        } else if (createErr) {
          // If user already exists in auth, update their password so they can log in with what they just typed
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const existing = userList?.users?.find(
            (u) => u.email?.toLowerCase() === data.contactEmail.toLowerCase()
          );

          if (existing) {
            registeredUserId = existing.id;
            accountCreated = true;

            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              password: data.password.trim(),
              email_confirm: true,
              user_metadata: {
                full_name: data.contactName,
                role: "customer",
                phone: phone,
              },
            });

            await supabaseAdmin.from("profiles").upsert({
              id: existing.id,
              email: data.contactEmail,
              full_name: data.contactName || null,
              vendor_status: "approved",
              subscription_tier: "free",
            });

            await supabaseAdmin.from("user_roles").upsert({
              user_id: existing.id,
              role: "customer",
            });
          }
        }
      } catch (authErr) {
        console.warn("[CustomTourLead] Account creation caught:", authErr);
      }
    }

    // 2. Insert custom tour lead record
    const { data: lead, error } = await supabaseAdmin
      .from("custom_tour_leads")
      .insert({
        traveler_id: registeredUserId || null,
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
      throw new Error(error.message || "Failed to submit your request. Please try again.");
    }

    // 3. Try sending WhatsApp alerts asynchronously (non-blocking)
    try {
      const { dispatchWhatsAppDirect } = await import("@/lib/whatsapp.functions");

      const inclusions = [
        data.flightClass ? `${data.flightClass} flights` : null,
        data.visaNeeded ? "visa assistance" : null,
        data.insuranceNeeded ? "travel insurance" : null,
      ].filter(Boolean).join(", ") || "Custom package only";

      // Build customer WhatsApp message with Portal Login info
      let customerMsg = `*GlobeTrek PK — Custom Tour Request & Traveler Portal* 🌴\n\nDear *${data.contactName}*,\n\nThank you for choosing GlobeTrek PK! We have received your custom tour request for *${data.destination}*, and your **Registered Traveler Profile** is now active.\n\n*Request Summary:*\n✈️ Departure: ${data.departureCity}\n📅 Travel Month: ${data.travelMonth}\n⏳ Duration: ${data.durationDays} Days\n👨‍👩‍👧‍👦 Group: ${data.groupSize} (${data.groupType})\n🏨 Hotel: ${data.hotelTier.replace("star", " ★")}\n💼 Inclusions: ${inclusions}\n`;

      if (data.password) {
        customerMsg += `\n*🔑 Your Traveler Portal Credentials:*\n✉️ Email: ${data.contactEmail}\n🔒 Password: ${data.password.trim()}\n👉 Login to compare quotes: https://globetrek.pk/auth\n`;
      } else {
        customerMsg += `\n*🔑 Traveler Portal:*\n👉 Access your portal: https://globetrek.pk/customer\n`;
      }

      customerMsg += `\n*What happens next?*\nVerified Pakistani travel agencies are now preparing custom quotes. You will be able to review bids in your dashboard and receive agency contact via WhatsApp!\n\nBest regards,\n*GlobeTrek PK Team* ✈️`;

      await dispatchWhatsAppDirect({
        phone: phone,
        message: customerMsg,
        skipDeduplication: true,
      });

      // Send notification alert to the Admin
      const adminPhone = "+923490386131";
      const adminMsg = `*👑 Admin Alert: New Custom Tour Request!* 🌴\n\nA traveler has submitted a custom tour request.\n\n*Request details:*\n👤 Name: ${data.contactName}\n📞 Phone: ${phone}\n✉️ Email: ${data.contactEmail}\n✈️ Trip: ${data.departureCity} → ${data.destination}\n📅 Travel Month: ${data.travelMonth} (${data.durationDays} Days)\n👨‍👩‍👧‍👦 Group: ${data.groupSize} (${data.groupType})\n🛡️ Traveler Profile: ${accountCreated ? "✅ New Account Created" : (data.userId ? "✅ Existing Account" : "Registered Email")}\n\nReview & publish lead for vendor bidding:\n👉 https://globetrek.pk/admin/custom-leads`;

      await dispatchWhatsAppDirect({
        phone: adminPhone,
        message: adminMsg,
        skipDeduplication: true,
      });
    } catch (waErr) {
      console.error("WhatsApp alert failed:", waErr);
    }

    return {
      ok: true,
      leadId: lead.id,
      accountCreated,
      email: data.contactEmail,
    };
  });
