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
    id: "fallback-0",
    slug: "introduction-ecosystem-overview",
    title: "Introduction to the GlobeTrek Ecosystem",
    category: "Onboarding & Setup",
    description: "Welcome to GlobeTrek PK — understanding the vision, digital architecture, operating model, and commercial benefits for Pakistani travel agencies.",
    icon_name: "BookOpen",
    display_order: 1,
    is_published: true,
    content: `# Introduction to the GlobeTrek Ecosystem

Welcome to **GlobeTrek PK** — Pakistan's premier digital B2B marketplace and AI-powered travel ecosystem. Built specifically for verified Pakistani tour operators, visa consultants, travel insurance brokers, and ticketing desks, GlobeTrek PK bridges the traditional gap between ambitious travel agencies and digital-first travelers across Pakistan and the international diaspora.

---

### What is the GlobeTrek Portal & Ecosystem?

GlobeTrek PK is a unified digital infrastructure designed to modernize travel commerce in Pakistan. Historically, travel agencies faced high customer acquisition costs, fragmented WhatsApp communication, manual quotation crafting, and payment collection friction. 

GlobeTrek PK unifies these operations into a single, high-performance web platform featuring transparent pricing in Pakistani Rupees (**PKR**), automated bilingual AI concierges, real-time custom lead bidding, and direct SafePay digital settlements.

> [!NOTE]
> **The GlobeTrek Core Philosophy**: We do not compete with travel agencies — we empower them. GlobeTrek PK operates on a partner-first model where verified agencies maintain direct client relationships while leveraging enterprise-grade AI and automated lead generation.

---

### How the Ecosystem Operates

The platform operates across four synchronized pillars to drive continuous lead flow and agency efficiency:

1. **Marketplace Discovery & Universal Search**: Travelers browse multi-category services (Tour Packages, Visas, Travel Insurance, and Flights) categorized by country, departure city, and budget in PKR with 0% hidden FX conversion fees.
2. **AI-Powered Lead Engine**: Our built-in bilingual (English & Roman Urdu) AI Concierge engages web visitors 24/7, answering destination questions, providing visa guidance, and capturing qualified customer contact leads.
3. **Custom Lead Bidding Desk**: Travelers requesting bespoke group itineraries submit custom requests. Verified vendors receive real-time alerts and submit structured online quotations directly to traveler WhatsApp inboxes.
4. **Verified Partner Governance**: Every agency undergoes rigorous Department of Tourist Services (**DTS**) and NTN verification, building immense traveler trust and ensuring a high-quality marketplace standard.

---

### Key Commercial Benefits for GlobeTrek Vendors

Partnering with GlobeTrek PK grants your travel agency an unfair competitive advantage in the Pakistani market:

#### 1. High-Intent Direct Customer Leads
Eliminate wasted ad spend. GlobeTrek PK delivers pre-qualified traveler leads directly to your vendor dashboard and WhatsApp inbox with full travel dates, group size, and PKR budget details.

#### 2. AI-Driven Tour Generation & Efficiency
Cut itinerary creation time from hours to seconds. Our integrated AI tools generate day-by-day itineraries, lookup live embassy visa requirements, and draft compelling package descriptions.

#### 3. Transparent PKR Pricing & Fast SafePay Payouts
Build instant customer confidence with transparent PKR pricing. Process debit/credit card and mobile wallet payments seamlessly through integrated SafePay QuickLinks V2 with zero hidden FX markup.

#### 4. Tiered Growth & Scalable Subscription Plans
Whether you are a specialized visa desk (Starter Plan) or a national tour operator (Pro/Agency Plan), select flexible subscription tiers designed to match your agency scale and lead requirements.

---

### Navigating This Operating Manual

This guide provides step-by-step procedures for every operational facet of the platform. Use the chapter sidebar to explore **KYC Verification**, **Custom Lead Bidding**, **Dashboard Analytics**, **SafePay Payouts**, **Quality Standards**, and **AI Engine Tools**. You can also ask any operational question to the **AI Partner Assistant** embedded above.`
  },
  {
    id: "fallback-1",
    slug: "vendor-onboarding-kyc",
    title: "Vendor Registration & Verification (KYC)",
    category: "Onboarding & Setup",
    description: "Complete guide to joining GlobeTrek PK as a verified Tour Operator, Visa Desk, Insurance Partner, or Ticketing Desk.",
    icon_name: "UserCheck",
    display_order: 2,
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
    id: "fallback-6",
    slug: "ai-tools-itinerary-generator",
    title: "GlobeTrek AI Engine — All 4 Tools Explained",
    category: "AI Tools & Automation",
    description: "Complete guide to the GlobeTrek AI Engine: Bilingual Concierge (English & Roman Urdu), Premium AI Trip Planner, AI Embassy Fee Lookup, and the AI Partner Operational Assistant — with tier gates, monthly quotas, and step-by-step vendor workflows.",
    icon_name: "Sparkles",
    display_order: 3,
    is_published: true,
    content: `# GlobeTrek AI Engine — Complete AI Features Guide

GlobeTrek PK embeds a suite of **four production-ready AI tools** powered by OpenRouter (GPT-4o-mini via \`@ai-sdk/openai-compatible\`). Each tool is purpose-built for a different stage of the travel workflow — from real-time customer chat to automated package writing to vendor operational support.

---

## Tool 1 — Bilingual AI Travel Concierge (Customer-Facing)

**Location:** Floating chat widget on every public page | **Tier:** Available to all visitors — no login required.

The AI Travel Concierge greets visitors, answers destination and package questions in English or Roman Urdu, and captures high-intent customer leads.

### Capabilities:
- **Bilingual Conversations:** Responds fluently in the visitor's preferred language.
- **Catalog-Grounded Answers:** Answers queries using live listings from the GlobeTrek database.
- **Interactive Choice Chips:** Renders tap-to-select pills (\`[[choose: 🇦🇪 Dubai \| 🇹🇷 Turkey]]\`) for quick navigation.
- **Lead Capture Integration:** Asks for customer name and WhatsApp number when booking intent is expressed, firing the \`capture_lead\` tool to store the lead and alert vendors via WhatsApp.

---

## Tool 2 — Premium AI Trip Planner (Vendor Console)

**Location:** Vendor Console → Tours Catalog → **"Generate with AI"** | **Tier:** Starter & Pro Tier vendors.

The AI Trip Planner creates complete, day-by-day tour itineraries in under 10 seconds.

### Inputs Required:
- Destination Country & Departure City
- Duration in Days & Target PKR Budget
- Travel Style (Family, Honeymoon, Luxury, Budget)

### Outputs Generated:
- **Day-by-Day Itinerary** with morning/afternoon/evening activities
- **Inclusions & Exclusions** checklist
- **Hotel & Transport Recommendations**
- **Recommended PKR Price Range**

---

## Tool 3 — AI Embassy Fee Lookup (Visa Dashboard)

**Location:** Vendor Console → Visa Services → Create/Edit Visa Service → **"AI Fee Lookup"** | **Tier:** Pro & Agency only.

Provides instant estimates of embassy fees in PKR and source currency for Schengen, UK, USA, Turkey, and Gulf visas.

---

## Tool 4 — AI Partner Operational Assistant (Vendor Guide)

**Location:** Vendor Guide page (\`/vendor-guide\`) — embedded assistant panel | **Tier:** Free for all partners.

Answers partner operational queries regarding DTS license verification, lead bidding caps, SafePay payouts, and subscription plans.`
  },
  {
    id: "fallback-2",
    slug: "marketplace-custom-lead-bidding",
    title: "Custom Tour Requests & Lead Bidding System",
    category: "Lead Generation",
    description: "How custom group tour leads work, Max 3 vendor unlock limits, online proposal submission, and automated WhatsApp alerts.",
    icon_name: "Compass",
    display_order: 4,
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
    id: "fallback-2b",
    slug: "custom-visa-leads-marketplace",
    title: "Custom Visa Leads & Refusal Rectification Engine",
    category: "Lead Generation",
    description: "High-converting B2B visa consultation leads, ₨ 750 SafePay unlock fee, 5-quotation cap, refusal case appeals, and Gerry's/VFS biometric drop-box handling.",
    icon_name: "FileCheck",
    display_order: 5,
    is_published: true,
    content: `# Custom Visa Leads & Refusal Rectification Engine

In the Pakistani travel market, visa inquiries and refusal rectifications (particularly for **Schengen**, **United Kingdom**, **United States**, **Canada**, and **Turkey**) represent the highest-intent, highest-margin commercial opportunity. 

GlobeTrek PK operates a specialized **Custom Visa Intake & Lead Bidding Engine** connecting applicants directly with verified Pakistani visa consultants, immigration lawyers, and former embassy officers.

![Custom Visa Leads Marketplace](/images/guide/vendor-custom-visa-leads.png)

---

### Key Operating Principles & Architecture

#### 1. Instant Auto-Verification (Zero Admin Bottleneck)
Unlike tour leads, visa inquiries are **auto-verified and published instantly** to the B2B marketplace upon applicant submission. This ensures vendors can contact anxious travelers within minutes of inquiry generation.

#### 2. Accessible ₨ 750 Lead Unlock Fee
Any verified visa consultant on GlobeTrek PK can unlock full applicant contact details (Name, WhatsApp Number, Email, Submission Office, Resident City, Bank Statement Status, and Refusal Clauses) for **₨ 750** via integrated SafePay QuickLink V2.

#### 3. Competitive 5-Quotation Limit per Lead
To ensure healthy competition without overwhelming the traveler, each custom visa lead is strictly capped at **5 vendor unlocks**:
- The card displays a live counter (e.g. \`2/5 Agencies Unlocked · 3 Slots Left\`).
- Once 5 agencies unlock the lead, it transitions to \`🔒 Sold Out\` and prevents further payments.

#### 4. Refusal Case Categorization & Re-Application File Preparation
Leads are clearly tagged with applicant case profiles:
- 🚨 **Prior Refusal Case**: Includes specific refusal clauses (e.g. *Paragraph V4.2(a)/(c)*, *214(b)*, or justification of purpose/finances).
- 🟢 **Fresh Passport / First-Time Traveler**: Applicants needing complete file compilation and tie-back documentation.
- 🔵 **Embassy Interview & Slot Assistance**: Mock coaching and biometric appointment booking.

#### 5. Local City Match Badging
When an applicant's resident city matches your agency's verified branch city (e.g. Islamabad, Lahore, Karachi, Rawalpindi, Peshawar, Faisalabad, Sialkot), the card displays a highlighted **📍 Local Client** badge, giving you an advantage for in-person office visits.

---

### Structured Proposal Builder & Traveler Delivery

Once unlocked, vendors use the built-in **Proposal Submission Modal** to enter:
1. **Agency Service / Consultancy Fee (PKR)**
2. **Estimated Embassy / Drop-Box Fee (PKR)**
3. **Turnaround Timeline (e.g. 5-7 Business Days)**
4. **Consultation Mode Offered**: 🏢 *In-Person Office Visit* or 🌐 *100% Online Remote E-Filing*
5. **Standard Inclusions**: *Complete Document Audit, Cover Letter Drafting, Appointment Slot Booking, Mock Interview Coaching, Tax/FBR Verification, Bank Statement Tie-Back Review*.

> [!TIP]
> **Instant WhatsApp Traveler Notification**: When you submit or revise a proposal, GlobeTrek PK automatically dispatches a formatted WhatsApp alert to the traveler with a secure link to your live proposal page (\`/customer/visa-quotes?token=...\`) and direct one-click WhatsApp chat button.`
  },
  {
    id: "fallback-3",
    slug: "vendor-dashboard-overview",
    title: "Vendor Console Navigation & 30-Day Activity Analytics",
    category: "Dashboard & Controls",
    description: "Navigating your vendor overview, tracking 30-day service-filtered lead activity line charts, and managing active listings.",
    icon_name: "LayoutDashboard",
    display_order: 6,
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
    - 🌹 **Coral Rose Line (#f43f5e)**: Purchased Custom Tour & Visa Leads
- **Custom Lead Teaser Banners**:
  - Live notification cards alerting you to newly submitted Custom Tour & Visa inquiries open for bidding in real-time.
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
4. **Honest Hotel Ratings**: Hotel star ratings listed in tour packages must match official hotel classifications.

---

### How Your Business Rating is Carried Out

Every partner agency on GlobeTrek PK receives a public trust rating (e.g. ⭐ **4.8 / 5.0**) displayed on package listings and agency profile cards. Ratings are computed and updated through three transparent mechanisms:

1. **Verified Traveler Reviews**: After completing a booked tour or custom trip, travelers submit post-trip ratings (1 to 5 stars) evaluating hotel accuracy, itinerary fulfillment, punctuality, and tour guide quality.
2. **Platform Admin & KYC Accreditation**: During partner onboarding, GlobeTrek Admins audit official Department of Tourist Services (**DTS**) licenses, NTN tax registrations, and office credentials. Verified agencies receive an accredited baseline score (e.g. ⭐ 4.8 Verified Vendor) until organic customer reviews accumulate.
3. **Automated Operational Governance**: GlobeTrek system algorithms continuously monitor partner performance metrics:
   - **Quotation Speed**: Submitting custom lead quotes within **12 hours**.
   - **Listing Integrity**: Strict compliance with Honest Hotel Ratings (3-Star / 4-Star / 5-Star accuracy).
   - **Dispute Ratio**: SafePay refund and transaction dispute history.

---

### Verified Partner Trust Badges 🛡️

Upon passing KYC document audit (DTS License + NTN Tax ID), your agency automatically unlocks official platform trust badges displayed across marketplace listings and quotation cards:

1. 🛡️ **"Verified Partner" Badge**: Displayed on all tour packages, visa services, and custom lead quotations to prove government registration.
2. 🥇 **"Gold Tier Vendor" Badge**: Awarded to **Pro** and **Agency** subscription plans maintaining a 4.5+ star rating, granting priority placement in universal search.
3. ⚡ **"Fast Responder" Badge**: Automatically earned by partner agencies maintaining an average quote submission time under **6 hours**.`
  },
  {
    id: "fallback-7",
    slug: "image-moderation-contact-shield",
    title: "Cover Image Policy & Qwen-VL Contact Shield",
    category: "Quality Standards & Rules",
    description: "Guidelines on tour and service cover photography, automated AI vision moderation, and strict prohibition of direct contact info or phone numbers.",
    icon_name: "ShieldCheck",
    display_order: 8,
    is_published: true,
    content: `# Cover Image Guidelines & Qwen-VL Contact Shield 🛡️

To maintain a premium B2B travel marketplace and protect platform integrity, GlobeTrek PK deploys an automated **Qwen-VL Visual Contact Shield** that inspects all cover photos and banner uploads in real time.

---

### What is the Qwen-VL Visual Contact Shield?

When you upload or replace a cover photo in the **Vendor Tours Console**, GlobeTrek PK passes the image through our multimodal **Qwen-VL Vision AI model** before it is published.

The AI inspects the visual canvas for:
1. **Pakistani Mobile & Landline Digits** (e.g. \`03xx-xxxxxxx\`, \`+92300\`, landline numbers).
2. **WhatsApp Logos & Call-to-Action Badges** (e.g. *"WhatsApp us for booking"*, *"Call now 0321..."*).
3. **External Agency URLs & Social Handles** (e.g. \`www.agency.com\`, \`@travelagency\`).
4. **Promotional Watermarks or Banners** designed to bypass marketplace lead flows.

---

### Why Direct Contact Info is Blocked on Cover Images

GlobeTrek PK operates on a structured B2B lead generation model:
- **Fair Marketplace Distribution**: High-intent travelers interact through verified lead forms, instant WhatsApp lead alerts, and secure SafePay checkouts.
- **Brand Protection**: Travelers trust clean, uncluttered, high-definition scenery and hotel photography rather than promotional classified-style flyers.
- **Accreditation Safeguard**: Verified partner badges and agency contact channels are cleanly presented in official quote cards once a booking lead is unlocked.

---

### What Happens if Contact Details are Detected?

If your uploaded image contains phone numbers or WhatsApp contact graphics:
1. The upload is **instantly blocked** with a warning message.
2. The AI provides a constructive reason (e.g. *"Detected phone digits: 0300-1234567"*).
3. Your listing draft remains safe — simply replace the file with clean destination or hotel photography.

---

### Best Practices for Listing Cover Photos 📸

To maximize traveler clicks and conversion rates:
- **Resolution**: Use high-resolution horizontal photos (minimum 1200 × 800 px).
- **Subject Matter**: Showcase iconic landmarks (e.g. Hunza Valley, Bosphorus Istanbul, Baku Boulevard, Swiss Alps), verified hotel rooms, or comfortable transport vehicles.
- **Format**: JPG, PNG, or WebP (under 20MB — automatically optimized to under ~1600px upon upload).
- **Clarity**: Keep images free of heavy text, borders, or low-resolution collages.`
  }
];

// Helper: Fallback persistence via app_config table when Postgres table is unmigrated or unavailable
async function saveToAppConfigFallback(sections: VendorGuideSection[]): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("app_config").upsert(
      {
        key: "vendor_guide_sections",
        value: JSON.stringify(sections),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("[saveToAppConfigFallback Warning]:", err);
  }
}

async function getFromAppConfigFallback(): Promise<VendorGuideSection[] | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "vendor_guide_sections")
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value) as VendorGuideSection[];
    }
  } catch {}
  return null;
}

// -------- Server Function: Fetch All Vendor Guide Sections --------
export const fetchVendorGuideSections = async (): Promise<VendorGuideSection[]> => {
  try {
    const { data, error } = await supabase
      .from("vendor_guide_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as VendorGuideSection[];
    }
  } catch {}

  const fallbackAppConfig = await getFromAppConfigFallback();
  if (fallbackAppConfig && fallbackAppConfig.length > 0) {
    return fallbackAppConfig;
  }

  return FALLBACK_VENDOR_GUIDE_SECTIONS;
};

// -------- Server Function: Create Section --------
export const createVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: Partial<VendorGuideSection>) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newId = `sec-${Date.now()}`;
    const payload = {
      slug: data.slug || `section-${Date.now()}`,
      title: data.title || "Untitled Section",
      category: data.category || "General",
      description: data.description || "",
      content: data.content || "",
      icon_name: data.icon_name || "BookOpen",
      display_order: data.display_order || 1,
      is_published: data.is_published ?? true,
    };

    try {
      const { data: created, error } = await supabaseAdmin
        .from("vendor_guide_sections")
        .insert(payload)
        .select()
        .single();

      if (!error && created) {
        return created;
      }
    } catch {}

    // Fallback: Save to app_config table
    const currentSections = (await getFromAppConfigFallback()) || FALLBACK_VENDOR_GUIDE_SECTIONS;
    const createdSection: VendorGuideSection = {
      id: newId,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    currentSections.push(createdSection);
    await saveToAppConfigFallback(currentSections);
    return createdSection;
  });

// -------- Server Function: Update Section --------
export const updateVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: { id: string; payload: Partial<VendorGuideSection> }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Try vendor_guide_sections table if ID is a valid UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_RE.test(data.id)) {
      try {
        const { data: updated, error } = await supabaseAdmin
          .from("vendor_guide_sections")
          .update(data.payload)
          .eq("id", data.id)
          .select()
          .maybeSingle();

        if (!error && updated) {
          return updated;
        }
      } catch {}
    }

    // 2. Fail-safe Fallback: Persist to app_config table
    const currentSections = (await getFromAppConfigFallback()) || FALLBACK_VENDOR_GUIDE_SECTIONS;
    let targetIndex = currentSections.findIndex((s) => s.id === data.id);

    if (targetIndex === -1 && data.payload.slug) {
      targetIndex = currentSections.findIndex((s) => s.slug === data.payload.slug);
    }

    if (targetIndex !== -1) {
      currentSections[targetIndex] = {
        ...currentSections[targetIndex],
        ...data.payload,
        updated_at: new Date().toISOString(),
      };
    } else {
      const newSec: VendorGuideSection = {
        id: data.id || `sec-${Date.now()}`,
        slug: data.payload.slug || `section-${Date.now()}`,
        title: data.payload.title || "Untitled Section",
        category: data.payload.category || "General",
        description: data.payload.description || "",
        content: data.payload.content || "",
        icon_name: data.payload.icon_name || "BookOpen",
        display_order: data.payload.display_order || currentSections.length + 1,
        is_published: data.payload.is_published ?? true,
        updated_at: new Date().toISOString(),
      };
      currentSections.push(newSec);
      targetIndex = currentSections.length - 1;
    }

    await saveToAppConfigFallback(currentSections);
    return currentSections[targetIndex];
  });

// -------- Server Function: Delete Section --------
export const deleteVendorGuideSection = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_RE.test(data.id)) {
      try {
        await supabaseAdmin
          .from("vendor_guide_sections")
          .delete()
          .eq("id", data.id);
      } catch {}
    }

    const currentSections = (await getFromAppConfigFallback()) || FALLBACK_VENDOR_GUIDE_SECTIONS;
    const filtered = currentSections.filter((s) => s.id !== data.id);
    await saveToAppConfigFallback(filtered);
    return { ok: true };
  });
