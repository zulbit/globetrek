import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export interface VendorGuideSection {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
  icon_name: string;
  display_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export const FALLBACK_VENDOR_GUIDE_SECTIONS: VendorGuideSection[] = [
  {
    id: "fallback-1",
    slug: "vendor-onboarding-kyc",
    title: "Vendor Registration & Verification (KYC)",
    category: "Onboarding & Setup",
    description: "Complete guide to joining GlobeTrek PK as a verified Tour Operator, Visa Desk, Insurance Partner, or Ticketing Desk.",
    icon_name: "UserCheck",
    display_order: 1,
    is_published: true,
    content: `# Vendor Registration & Verification (KYC)

Welcome to **GlobeTrek PK** — Pakistan's premier travel marketplace. Partnering with GlobeTrek PK allows verified tour operators, visa consultants, insurance providers, and ticketing desks to reach thousands of travelers across Pakistan with 0% hidden commissions.

![GlobeTrek Partner Auth & Portal](/images/guide/auth-page.png)

---

### Step 1: Account Creation & Sign Up
1. Visit [GlobeTrek Partner Portal Sign Up](/auth).
2. Register your agency profile:
   - **Legal Business Name** (e.g., *Royal Travel & Tours Ltd*)
   - **Official Business Email** & **WhatsApp Phone Number** (for real-time lead alerts)
   - **City / Region of Operation**
3. Select your active vertical services: **Tour Packages**, **Visa Filing**, **Travel Insurance**, or **Flight/Umrah Ticketing**.

---

### Step 2: KYC & Document Audit
To maintain marketplace trust, every vendor undergoes mandatory identity and license verification before listings are published:

#### Required Verification Documents:
- **Government ID (CNIC / Passport)**: Authorized agency owner or manager.
- **DTS License / Business License**: Department of Tourist Services (DTS) license or NTN tax registration certificate.
- **Bank Account / SafePay Wallet**: Official bank IBAN for direct payout settlements.

---

### Step 3: Verification Approval & Portal Unlocking
1. Our Partner Audit Team verifies your submitted credentials within **24 hours**.
2. Upon approval, your **Vendor Operating Console** is unlocked, allowing you to list packages, receive direct customer leads, and bid on high-value Custom Tour requests.`
  },
  {
    id: "fallback-2",
    slug: "marketplace-custom-lead-bidding",
    title: "Custom Tour Requests & Lead Bidding System",
    category: "Lead Generation",
    description: "How custom group tour leads work, Max 3 vendor unlock limits, online proposal submission, and automated WhatsApp alerts.",
    icon_name: "Compass",
    display_order: 2,
    is_published: true,
    content: `# Custom Tour Requests & Lead Bidding System

Custom Tour Leads are high-intent traveler requests for group itineraries (family, corporate, honeymoon) generated directly through the GlobeTrek AI Concierge & Request Portal.

![GlobeTrek Vendor Custom Leads Marketplace](/images/guide/vendor-leads-marketplace.png)

---

### Key Lead Bidding Rules:

1. **Admin Verification Barrier**:
   - Every submitted custom tour lead is first called and vetted by GlobeTrek Admin to verify budget, travel dates, and seriousness before being published to the marketplace.

2. **Max 3 Vendor Unlock Limit**:
   - To prevent over-competition, each lead is capped at a maximum of **3 vendor unlocks**. Once 3 vendors purchase a lead for ₨ 5,000, it automatically locks and hides from the marketplace.

3. **Submitting Online Quotations**:
   - Once unlocked, vendors can click **"Submit Online Quotation"** to enter total price (PKR), hotel details, flight inclusions, and itinerary highlights.

4. **Automated WhatsApp Delivery**:
   - Submitting a quotation triggers an instant WhatsApp notification to the traveler with a direct link to compare proposals side-by-side online ('/customer/quotes?token=...').

5. **Quote Acceptance & Auto-Closure**:
   - When the traveler selects your quote, you receive an immediate WhatsApp notification with full traveler contact details, and the lead status updates to **Accepted**.`
  },
  {
    id: "fallback-3",
    slug: "vendor-dashboard-overview",
    title: "Vendor Console Navigation & 30-Day Activity Analytics",
    category: "Dashboard & Controls",
    description: "Navigating your vendor overview, tracking 30-day service-filtered lead activity line charts, and managing active listings.",
    icon_name: "LayoutDashboard",
    display_order: 3,
    is_published: true,
    content: `# Vendor Console Navigation & 30-Day Activity Analytics

Your **Vendor Console** ('/vendor') provides real-time operational visibility over customer inquiries, service listings, and analytics.

![GlobeTrek Vendor Operations Overview](/images/guide/vendor-dashboard.png)

---

### Key Dashboard Modules:

- **Service-Filtered 30-Day Lead Activity Line Chart**:
  - Automatically renders custom-colored time-series lines only for the services your agency actively offers:
    - 🟢 **Emerald Line**: Tour Package Inquiries
    - 🩵 **Sky Blue Line**: Visa Application Inquiries
    - 🟣 **Violet Line**: Travel Insurance Inquiries
    - 🟡 **Amber Line**: Flight & Umrah Ticket Inquiries
- **Custom Lead Teaser Banner**:
  - Live notification banner alerting you to available verified custom tour leads currently open for bidding.
- **Direct Leads Inbox**:
  - Real-time list of direct customer calls, WhatsApp chats, and catalog inquiries.`
  },
  {
    id: "fallback-4",
    slug: "payments-safepay-billing",
    title: "SafePay Gateway Payments, Receipts & Vendor Subscriptions",
    category: "Billing & Payouts",
    description: "Understanding vendor plan billing (Starter/Pro), SafePay payment receipts, and lead unlock transaction flows.",
    icon_name: "Wallet",
    display_order: 4,
    is_published: true,
    content: `# SafePay Gateway Payments, Receipts & Vendor Subscriptions

GlobeTrek PK integrates with **SafePay Gateway** for fast, secure PKR payment processing for vendor subscription upgrades and custom lead unlocks.

---

### 1. Subscription Tiers & Benefits
- **Starter Plan**: Standard listing access, catalog inquiry notifications.
- **Pro Plan**: Priority search placement, verified Gold vendor badge, unlimited direct customer leads, and reduced lead unlock fees.

---

### 2. Transaction Flow & Instant WhatsApp Receipts
- **Lead Unlock Fee**: ₨ 5,000 lump sum via SafePay.
- Upon successful payment verification:
  - System generates an instant database purchase record.
  - Generates an automated **WhatsApp Payment Receipt** sent directly to your registered mobile number with traveler contact details.
  - Updates your 30-day analytics line chart in real time.`
  },
  {
    id: "fallback-5",
    slug: "quality-standards-marketplace-code",
    title: "Marketplace Quality Standards & Code of Conduct",
    category: "Quality & Governance",
    description: "Required service standards for tour itineraries, visa filing timelines, and partner code of conduct.",
    icon_name: "ShieldCheck",
    display_order: 5,
    is_published: true,
    content: `# Marketplace Quality Standards & Code of Conduct

To protect traveler confidence across Pakistan, all GlobeTrek PK partner agencies adhere to strict quality standards:

---

### Mandatory Partner Commitments:
1. **Accurate Package Pricing**: Listed tour rates must reflect real total prices with clear inclusion/exclusion notes.
2. **Timely Quotations**: Custom tour lead quotations must be submitted within **12 hours** of unlocking a lead.
3. **No Unsolicited Spam**: Travelers' contact details unlocked via custom leads must be used strictly for requested travel inquiries.
4. **Honest Hotel Ratings**: Hotel star ratings listed in tour packages must match official hotel classifications.`
  }
];

// -------- Server Function: Fetch All Vendor Guide Sections --------
export const fetchVendorGuideSections = async (): Promise<VendorGuideSection[]> => {
  try {
    const { data, error } = await supabase
      .from("vendor_guide_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_VENDOR_GUIDE_SECTIONS;
    }
    return data as VendorGuideSection[];
  } catch {
    return FALLBACK_VENDOR_GUIDE_SECTIONS;
  }
};

// -------- Server Function: Create Section --------
export const createVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: Partial<VendorGuideSection>) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("vendor_guide_sections")
      .insert({
        slug: data.slug || `section-${Date.now()}`,
        title: data.title || "Untitled Section",
        category: data.category || "General",
        description: data.description || "",
        content: data.content || "",
        icon_name: data.icon_name || "BookOpen",
        display_order: data.display_order || 1,
        is_published: data.is_published ?? true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created;
  });

// -------- Server Function: Update Section --------
export const updateVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: { id: string; payload: Partial<VendorGuideSection> }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("vendor_guide_sections")
      .update(data.payload)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  });

// -------- Server Function: Delete Section --------
export const deleteVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vendor_guide_sections")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
