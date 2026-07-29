import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/* ─── Supabase Admin (service role) ─── */
function getAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ─── Auto-generate referral code ─── */
function generateCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5)
    .padEnd(3, "X");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `REF-${prefix}${suffix}`;
}

/* ──────────────────────────────────────────
   GET AFFILIATE SETTINGS (commission rate, min payout, payout day)
   ────────────────────────────────────────── */
export const getAffiliateSettings = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getAdmin();
  const { data } = await admin
    .from("affiliate_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // defaults if no row
  return data ?? {
    commission_pct: 20,
    upgrade_commission_pct: 20,
    min_payout_pkr: 1000,
    payout_day: "friday",
  };
});

/* ──────────────────────────────────────────
   UPDATE AFFILIATE SETTINGS (admin only)
   ────────────────────────────────────────── */
export const updateAffiliateSettings = createServerFn({ method: "POST" })
  .validator((d: { commission_pct: number; upgrade_commission_pct: number; min_payout_pkr: number; payout_day: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    // upsert single settings row
    const { error } = await admin
      .from("affiliate_settings")
      .upsert({ id: 1, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ──────────────────────────────────────────
   REGISTER AS AFFILIATE (auto-approved)
   ────────────────────────────────────────── */
export const registerAffiliate = createServerFn({ method: "POST" })
  .validator((d: { userId: string; fullName: string; phone: string; cnic: string; city: string; email: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    // Check not already registered
    const { data: existing } = await admin
      .from("affiliates")
      .select("id, referral_code")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (existing) return { ok: true, referral_code: existing.referral_code, already: true };

    const code = generateCode(data.fullName);
    const { data: inserted, error } = await admin
      .from("affiliates")
      .insert({
        user_id: data.userId,
        full_name: data.fullName,
        phone: data.phone,
        cnic: data.cnic,
        city: data.city,
        email: data.email,
        referral_code: code,
        status: "approved",
        total_earned: 0,
        total_paid: 0,
      })
      .select("id, referral_code")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, referral_code: inserted.referral_code, already: false };
  });

/* ──────────────────────────────────────────
   GET AFFILIATE DASHBOARD DATA
   ────────────────────────────────────────── */
export const getAffiliateDashboard = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    const { data: aff } = await admin
      .from("affiliates")
      .select("*")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!aff) return null;

    const [refsRes, postsRes] = await Promise.all([
      admin
        .from("affiliate_referrals")
        .select("*, profiles!affiliate_referrals_vendor_user_id_fkey(company_name, email)")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false }),
      admin
        .from("affiliate_social_posts")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false }),
    ]);

    return { affiliate: aff, referrals: refsRes.data ?? [], socialPosts: postsRes.data ?? [] };
  });

/* ──────────────────────────────────────────
   VALIDATE REFERRAL CODE (called before vendor pays)
   ────────────────────────────────────────── */
export const validateReferralCode = createServerFn({ method: "POST" })
  .validator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    const { data: aff } = await admin
      .from("affiliates")
      .select("id, full_name, referral_code, status")
      .eq("referral_code", data.code.trim().toUpperCase())
      .eq("status", "approved")
      .maybeSingle();
    if (!aff) return { valid: false };
    return { valid: true, affiliate_name: aff.full_name };
  });

/* ──────────────────────────────────────────
   SAVE REFERRAL CODE TO VENDOR PROFILE
   ────────────────────────────────────────── */
export const saveReferralCodeToProfile = createServerFn({ method: "POST" })
  .validator((d: { userId: string; referralCode: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    // Only save if no code already saved (can't add retroactively)
    const { data: profile } = await admin
      .from("profiles")
      .select("referral_code_used")
      .eq("id", data.userId)
      .maybeSingle();
    if (profile?.referral_code_used) return { ok: true, already_set: true };
    const { error } = await admin
      .from("profiles")
      .update({ referral_code_used: data.referralCode.trim().toUpperCase() })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true, already_set: false };
  });

/* ──────────────────────────────────────────
   SUBMIT SOCIAL POST PROOF (affiliate)
   ────────────────────────────────────────── */
export const submitSocialPostProof = createServerFn({ method: "POST" })
  .validator((d: { userId: string; platform: string; postUrl: string; screenshotUrl?: string; captionSnippet?: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    const { data: aff } = await admin
      .from("affiliates")
      .select("id")
      .eq("user_id", data.userId)
      .single();
    if (!aff) throw new Error("Affiliate record not found");

    const { data: inserted, error } = await admin
      .from("affiliate_social_posts")
      .insert({
        affiliate_id: aff.id,
        platform: data.platform,
        post_url: data.postUrl,
        screenshot_url: data.screenshotUrl || null,
        caption_snippet: data.captionSnippet || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, post: inserted };
  });

/* ──────────────────────────────────────────
   ADMIN: GET ALL SOCIAL POST PROOFS FOR VERIFICATION
   ────────────────────────────────────────── */
export const getAdminSocialPosts = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getAdmin();
  const { data } = await admin
    .from("affiliate_social_posts")
    .select(`
      *,
      affiliates!affiliate_social_posts_affiliate_id_fkey(full_name, phone, referral_code, city, email)
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
});

/* ──────────────────────────────────────────
   ADMIN: VERIFY / REJECT SOCIAL POST PROOF
   ────────────────────────────────────────── */
export const verifySocialPost = createServerFn({ method: "POST" })
  .validator((d: { postId: string; status: "verified" | "rejected"; adminNotes?: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    const { error } = await admin
      .from("affiliate_social_posts")
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        verified_at: data.status === "verified" ? new Date().toISOString() : null,
      })
      .eq("id", data.postId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ──────────────────────────────────────────
   ADMIN: GET ALL REFERRALS FOR PAYOUT
   ────────────────────────────────────────── */
export const getAdminAffiliateReferrals = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getAdmin();
  const { data } = await admin
    .from("affiliate_referrals")
    .select(`
      *,
      affiliates!affiliate_referrals_affiliate_id_fkey(full_name, phone, cnic, city, referral_code, total_earned, total_paid),
      profiles!affiliate_referrals_vendor_user_id_fkey(company_name, email)
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
});

/* ──────────────────────────────────────────
   ADMIN: MARK REFERRAL AS PAID
   ────────────────────────────────────────── */
export const markReferralPaid = createServerFn({ method: "POST" })
  .validator((d: { referralId: string; paymentRef: string; affiliateId: string; commissionPkr: number }) => d)
  .handler(async ({ data }) => {
    const admin = getAdmin();
    const { error: e1 } = await admin
      .from("affiliate_referrals")
      .update({ status: "paid", paid_at: new Date().toISOString(), admin_note: data.paymentRef })
      .eq("id", data.referralId);
    if (e1) throw new Error(e1.message);
    // Update total_paid on affiliate
    const { data: aff } = await admin
      .from("affiliates")
      .select("total_paid")
      .eq("id", data.affiliateId)
      .single();
    const newPaid = (aff?.total_paid ?? 0) + data.commissionPkr;
    await admin.from("affiliates").update({ total_paid: newPaid }).eq("id", data.affiliateId);
    return { ok: true };
  });

/* ──────────────────────────────────────────
   AFFILIATE COMMISSION TRIGGER (called from webhook)
   Called after a successful subscription payment
   ────────────────────────────────────────── */
export async function triggerAffiliateCommission({
  vendorUserId,
  planName,
  planAmountPkr,
  paymentRef,
  isUpgrade,
}: {
  vendorUserId: string;
  planName: string;
  planAmountPkr: number;
  paymentRef: string;
  isUpgrade: boolean;
}) {
  const admin = getAdmin();

  // 1. Get referral code used by vendor
  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code_used")
    .eq("id", vendorUserId)
    .maybeSingle();
  if (!profile?.referral_code_used) return { skipped: "no referral code" };

  // 2. Find affiliate with that code
  const { data: aff } = await admin
    .from("affiliates")
    .select("id, status, total_earned")
    .eq("referral_code", profile.referral_code_used)
    .eq("status", "approved")
    .maybeSingle();
  if (!aff) return { skipped: "affiliate not found or not approved" };

  // 3. Check for existing referral to prevent double-credit (non-upgrade)
  if (!isUpgrade) {
    const { data: existing } = await admin
      .from("affiliate_referrals")
      .select("id")
      .eq("affiliate_id", aff.id)
      .eq("vendor_user_id", vendorUserId)
      .eq("is_upgrade", false)
      .maybeSingle();
    if (existing) return { skipped: "already credited for initial signup" };
  }

  // 4. Get commission rate from settings
  const { data: settings } = await admin
    .from("affiliate_settings")
    .select("commission_pct, upgrade_commission_pct")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const pct = isUpgrade
    ? (settings?.upgrade_commission_pct ?? 20)
    : (settings?.commission_pct ?? 20);
  const commissionPkr = Math.round(planAmountPkr * (pct / 100));

  // 5. Insert referral record
  await admin.from("affiliate_referrals").insert({
    affiliate_id: aff.id,
    vendor_user_id: vendorUserId,
    plan: planName,
    plan_amount_pkr: planAmountPkr,
    commission_pkr: commissionPkr,
    commission_pct: pct,
    status: "pending",
    payment_ref: paymentRef,
    is_upgrade: isUpgrade,
  });

  // 6. Update affiliate total_earned
  await admin
    .from("affiliates")
    .update({ total_earned: (aff.total_earned ?? 0) + commissionPkr })
    .eq("id", aff.id);

  return { ok: true, commission_pkr: commissionPkr };
}
