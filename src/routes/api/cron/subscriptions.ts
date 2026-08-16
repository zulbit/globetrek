import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWhatsAppMessage } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/api/cron/subscriptions")({
  APIRoute: {
    loader: async ({ request }) => {
      // Protect the endpoint
      const url = new URL(request.url);
      const cronSecret = url.searchParams.get("secret");
      
      // Using a fallback for local testing, in production this must match env
      const expectedSecret = process.env.CRON_SECRET || "globetrek-cron-secret";
      if (cronSecret !== expectedSecret) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        console.log("[Cron] Starting subscription checks...");
        const now = new Date();
        const results = {
          processed: 0,
          downgraded: 0,
          warnings3Days: 0,
          warningsToday: 0,
          errors: 0
        };

        // 1. Fetch all active vendors (exclude free tier since they don't expire)
        const { data: vendors, error: vErr } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, subscription_tier")
          .neq("subscription_tier", "free");

        if (vErr) throw vErr;
        
        // 2. Fetch all subscription payments for these vendors to compute expiry
        const { data: subPayments } = await supabaseAdmin
          .from("payments")
          .select("owner_id, created_at")
          .eq("status", "paid")
          .contains("metadata", { type: "subscription" })
          .order("created_at", { ascending: false });

        const subExpiryMap = new Map<string, Date>();
        if (subPayments) {
          subPayments.forEach((p) => {
            if (p.owner_id && !subExpiryMap.has(p.owner_id)) {
              const d = new Date(p.created_at);
              d.setDate(d.getDate() + 30);
              subExpiryMap.set(p.owner_id, d);
            }
          });
        }

        // 3. Process each vendor
        for (const vendor of vendors || []) {
          results.processed++;
          const expiryDate = subExpiryMap.get(vendor.id);
          
          if (!expiryDate) continue; // If no payment found, skip auto-downgrade to be safe

          const msDiff = expiryDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
          const phone = vendor.phone;
          const name = vendor.full_name || "Vendor Partner";

          // Trigger 3: Post-Expiry Downgrade
          if (daysDiff < 0) {
            console.log(`[Cron] Downgrading vendor ${vendor.id} (Expired ${Math.abs(daysDiff)} days ago)`);
            const { error: updateErr } = await supabaseAdmin
              .from("profiles")
              .update({ subscription_tier: "free" as never })
              .eq("id", vendor.id);
            
            if (updateErr) {
              console.error("[Cron] Failed to downgrade:", updateErr);
              results.errors++;
            } else {
              results.downgraded++;
              if (phone) {
                const msg = `⚠️ *GlobeTrek PK — Subscription Expired!*\n\nDear *${name}*,\n\nYour *${(vendor.subscription_tier as string).toUpperCase()}* subscription has expired, and your account has been transitioned to the *Free Tier*.\n\n_Note: You have been placed in "Graceful Degradation" mode. Your existing listings remain active, but you cannot edit them or add new ones until you renew or reduce your active listings to 3._\n\nRenew your plan now to regain access:\nhttps://globetrek.pk/vendor/billing`;
                await sendWhatsAppMessage({ data: { phone, message: msg, skipDeduplication: true } }).catch(() => {});
              }
            }
          } 
          // Trigger 1: Exactly 3 days before
          else if (daysDiff === 3) {
            results.warnings3Days++;
            if (phone) {
              const msg = `⏰ *GlobeTrek PK — Renewal Reminder*\n\nDear *${name}*,\n\nYour *${(vendor.subscription_tier as string).toUpperCase()}* subscription will expire in exactly *3 days*.\n\nAvoid any dashboard lockouts and keep all your listings fully editable by renewing early.\n\nRenew your plan here:\nhttps://globetrek.pk/vendor/billing`;
              await sendWhatsAppMessage({ data: { phone, message: msg, skipDeduplication: true } }).catch(() => {});
            }
          }
          // Trigger 2: Exactly Day Of Expiry
          else if (daysDiff === 0) {
            results.warningsToday++;
            if (phone) {
              const msg = `🚨 *GlobeTrek PK — Subscription Expires TODAY!*\n\nDear *${name}*,\n\nYour *${(vendor.subscription_tier as string).toUpperCase()}* subscription expires today. If you do not renew, you will lose edit access to your active listings tomorrow.\n\nRenew your plan now to maintain uninterrupted access:\nhttps://globetrek.pk/vendor/billing`;
              await sendWhatsAppMessage({ data: { phone, message: msg, skipDeduplication: true } }).catch(() => {});
            }
          }
        }

        console.log("[Cron] Finished processing:", results);
        return Response.json({ ok: true, results });

      } catch (err: any) {
        console.error("[Cron Exception]:", err);
        return Response.json({ ok: false, error: err.message }, { status: 500 });
      }
    },
  },
});
