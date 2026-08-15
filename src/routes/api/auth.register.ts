import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchWhatsAppDirect } from "@/lib/whatsapp.functions";

type SignupBody = {
  email?: string;
  password?: string;
  full_name?: string;
  role?: "customer" | "vendor";
  company_name?: string;
  phone?: string;
  referral_code?: string | null;
};

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: SignupBody;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { email, password, full_name, role = "customer", company_name, phone, referral_code } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email and password are required." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (password.length < 6) {
          return new Response(JSON.stringify({ error: "Password must be at least 6 characters." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (role === "vendor" && !phone) {
          return new Response(JSON.stringify({ error: "Official WhatsApp number is required for vendor registration." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          // 1. Create user via Supabase Admin API with email_confirm: true
          const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name,
              role,
              company_name: role === "vendor" ? company_name : null,
              phone: phone || null,
            },
          });

          if (adminErr) {
            return new Response(JSON.stringify({ error: adminErr.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = adminData.user.id;

          // 2. Ensure profile record exists with valid columns
          await supabaseAdmin.from("profiles").upsert({
            id: userId,
            email,
            full_name: full_name || null,
            company_name: role === "vendor" ? company_name || null : null,
            vendor_status: role === "vendor" ? "pending" : "approved",
            subscription_tier: "free",
            referral_code_used: role === "vendor" && referral_code ? referral_code.toUpperCase() : null,
          });

          // Store initial vendor contact draft in payment_gateway_settings if vendor
          if (role === "vendor" && phone) {
            await supabaseAdmin.from("payment_gateway_settings").upsert({
              provider: `vendor_kyc_${userId}`,
              is_enabled: true,
              settings: JSON.stringify({
                userId,
                is_submitted: false,
                status: "not_submitted",
                registeredAt: new Date().toISOString(),
                fields: {
                  company_name: company_name || null,
                  phone,
                },
              }),
              updated_at: new Date().toISOString(),
            });
          }

          // 3. Ensure role mapping exists
          await supabaseAdmin.from("user_roles").upsert({
            user_id: userId,
            role: role === "vendor" ? "vendor" : "customer",
          });

          // 4. If vendor registration, dispatch WhatsApp notifications
          if (role === "vendor" && phone) {
            // Send Vendor Signup Confirmation to Agency
            dispatchWhatsAppDirect({
              phone,
              message: `*GlobeTrek PK — Vendor Account Received* 💼\n\nDear *${full_name || "Partner"}* (${company_name || "Agency"}),\n\nThank you for applying to join Pakistan's premier B2B travel marketplace!\n\nYour agency account is currently under review by our vendor verification team (KYC & registration check).\n\n*Status:* Pending Verification (24h SLA)\n\nOnce approved, you will receive full access to publish tour packages, visa services, and bid on custom traveler requests!\n\n*GlobeTrek PK Team*`,
              skipDeduplication: true,
            }).catch((err) => console.warn("[WhatsApp] Failed vendor signup notification:", err));

            // Send Vendor Signup Admin Alert to Platform Admin
            dispatchWhatsAppDirect({
              phone: "+923490386131",
              message: `*👑 Admin Alert: New Vendor Application!* 🏢\n\nA new travel agency has registered on GlobeTrek PK.\n\n*Agency Details:*\n🏢 Agency: ${company_name || "N/A"}\n👤 Contact Person: ${full_name || "N/A"}\n📞 WhatsApp: ${phone}\n✉️ Email: ${email}\n🎟️ Referral Code Used: ${referral_code || "None"}\n\nReview & approve agency KYC status in Admin Console:\n👉 https://globetrek.pk/admin/vendors`,
              skipDeduplication: true,
            }).catch((err) => console.warn("[WhatsApp] Failed vendor admin alert notification:", err));
          }

          return new Response(
            JSON.stringify({
              success: true,
              user_id: userId,
              message: "Account created and auto-confirmed successfully.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          console.error("[Register API Error]:", err);
          return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
