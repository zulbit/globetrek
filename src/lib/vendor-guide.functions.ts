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
  },
  {
    id: "fallback-6",
    slug: "ai-tools-itinerary-generator",
    title: "GlobeTrek AI Engine — All 4 Tools Explained",
    category: "AI Tools & Automation",
    description: "Complete guide to the GlobeTrek AI Engine: Bilingual Concierge (English & Roman Urdu), Premium AI Trip Planner, AI Embassy Fee Lookup, and the AI Partner Operational Assistant — with tier gates, monthly quotas, and step-by-step usage.",
    icon_name: "Sparkles",
    display_order: 6,
    is_published: true,
    content: `# GlobeTrek AI Engine — Complete AI Features Guide

GlobeTrek PK embeds a suite of **four production-ready AI tools** powered by OpenRouter (GPT-4o-mini via \`@ai-sdk/openai-compatible\`). Each tool is purpose-built for a different stage of the travel workflow — from real-time customer chat to automated package writing to vendor operational support.

---

## Tool 1 — Bilingual AI Travel Concierge (Customer-Facing)

**Location:** Floating chat widget on every public page | **Tier:** Available to all visitors — no login required.

The AI Concierge is the primary customer-facing intelligence layer. It answers traveler inquiries in real time across all four service verticals.

### Key Capabilities:
- **Full bilingual support — English & Roman Urdu**: The concierge detects the traveler's language automatically and responds in the same language. A traveler typing *"Turkey ka 7 din ka tour kitne ka hai?"* receives a complete reply in warm Roman Urdu with flags, pricing in ₨, and a booking prompt. A traveler typing in English receives a structured English reply.
- **Live catalog grounding**: Every response is grounded in the live Supabase database — tours, visa services, insurance plans, and flight desks. It never fabricates packages.
- **Real-time enquiry capture (Lead Generation)**: When a traveler expresses interest and provides their name and phone number, the Concierge automatically calls the \`capture_lead\` tool to write a database record — which triggers an instant WhatsApp notification to your agency.
- **Smart contextual chips**: Guides travelers through the funnel with context-aware quick-reply chips (e.g., *📝 Book / Inquire Now | ℹ️ Full Itinerary | 🌴 View Other Packages*).

### Roman Urdu Interaction Example:
> **Traveler:** *"Dubai ka 4 din ka package Karachi se chahiye, price bhi batao"*
>
> **AI:** *"🇦🇪 Dubai City Break — Karachi se!*
> *Gulf Wings Travel ka 4-Din Dubai Package aapke liye bilkul fit hai!*
> *₨ **1,65,000** mein aapko milega: Burj Khalifa At The Top, Desert Safari with dune bashing, aur Old Dubai Souks.*
> *Apna Naam aur Mobile Number type karein taake hum aapki inquiry process kar sakein! 📞"*

### How Your Agency Benefits:
1. Traveler asks about a tour you list → Concierge recommends it with your price.
2. Traveler shares their phone number → Lead is instantly written to your dashboard inbox.
3. You receive a WhatsApp alert → Call the traveler within minutes.

---

## Tool 2 — Premium AI Trip Planner (Vendor Dashboard)

**Location:** Vendor Console → Tour Management → Edit/Create Tour → **"✨ AI"** button | **Tier:** Starter (descriptions only) · Pro & Agency (full itinerary plans).

The AI Trip Planner runs directly inside the tour creation/edit workflow. It eliminates hours of manual writing for every package.

### Two Generation Modes:

#### Mode A — AI Description Generator *(Starter Plan: 10/month | Pro/Agency: Unlimited)*
- Generates a **55–75 word marketing-optimized package summary** in plain text — punchy, highlight-focused, and tailored to Pakistani travelers.
- Automatically factors in destination, departure city, duration, and price.
- **How to use:**
  1. Open any tour in your Vendor Console.
  2. Fill in Destination, Departure City, Duration, and Price fields.
  3. Click the **✨ Sparkles icon** next to the Description field.
  4. AI generates the description in 3–5 seconds. Review and save.

#### Mode B — Full AI Itinerary & Day Plan *(Pro Plan: 50/month | Agency: Unlimited)*
- Generates a **complete day-by-day itinerary** including:
  - An evocative title for each day (e.g., *"Day 1: Istanbul Arrival & Bosphorus Sunset Cruise"*)
  - 1–2 sentences of narrative detail per day
  - Timed activity slots (e.g., \`09:00 — Airport pickup & hotel check-in\`)
  - Departure from your city on Day 1 and return on the final day
  - For Europe destinations: automatically designs multi-country itineraries with border crossing/train details
- **How to use:**
  1. Open any tour in your Vendor Console.
  2. Fill in all tour fields (destination, departure city, duration).
  3. Switch the AI mode toggle to **"Full Trip Plan"**.
  4. Click **"Generate AI Plan"** — plan appears in 5–8 seconds.
  5. Review each day card, edit any day manually if needed, then save.

### Monthly Quota System:
| Plan | AI Descriptions | Full AI Trip Plans |
|------|----------------|-------------------|
| Starter | 10 / month | ❌ Not included |
| Pro | Unlimited | 50 / month |
| Agency | Unlimited | Unlimited |

> **Note:** Quota resets on the 1st of each calendar month. Usage is tracked per-account in the \`ai_usage_events\` table.

---

## Tool 3 — AI Embassy Fee Lookup (Visa Dashboard)

**Location:** Vendor Console → Visa Services → Create/Edit Visa Service → **"AI Fee Lookup"** | **Tier:** Pro & Agency only.

The AI Embassy Fee Lookup saves visa consultants hours of research. Instead of manually checking VFS/TLS portals and embassy websites, you get an AI-powered estimate in seconds.

### What It Returns:
- **Fee in PKR** (converted from USD/EUR/GBP at current typical rates — approx. PKR 280/USD, PKR 300/EUR)
- **Original fee in source currency** (e.g., *USD 185, EUR 90, GBP 127*)
- **Source note** — names the fee schedule source (e.g., *"Turkish e-Visa portal, VFS Global Schengen fee schedule for Pakistan applicants"*)
- **Confidence level** — low / medium / high based on how recent the AI's training data is for that embassy
- **Last known update period** (e.g., *"2024 Q2"*)
- **Mandatory disclaimer** reminding you to verify with the embassy before quoting the client

### How to Use:
1. Go to **Vendor Console → Visa Services**.
2. Click **Add New** or **Edit** an existing service.
3. Select the destination country and visa type.
4. Click **"🤖 AI Fee Lookup"**.
5. Review the result, cross-check with the embassy, then enter your final service fee.

> ⚠️ **Important:** The AI fee is an estimate based on last-known public data. Embassy fees change without notice. Always verify with the official embassy or VFS/TLS centre before quoting a client.

---

## Tool 4 — AI Partner Operational Assistant (Vendor Guide)

**Location:** Vendor Guide page (\`/vendor-guide\`) — the purple chat panel at the top of the content area | **Tier:** Available to all partners — no login required.

The AI Partner Assistant is your always-on operational support agent. It knows the complete GlobeTrek PK rulebook and can answer any question about running your partner account.

### Knows and Can Answer:
- **KYC & onboarding:** Document requirements, verification timelines, DTS license queries
- **Custom lead system:** Max 3 unlock cap rules, unlock fee process, quotation deadlines
- **SafePay & billing:** Payment flow, receipt delivery, payout timelines, subscription tiers
- **AI tools:** How to use the trip planner, visa lookup, and quotas
- **Marketplace rules:** Quality standards, hotel rating policies, WhatsApp lead contact rules

### Bilingual Support:
Like the customer concierge, the Partner Assistant responds in the same language you ask in.

- *"KYC ke liye konse documents chahiye?"* → Roman Urdu structured response
- *"How does the Max 3 unlock cap work?"* → English structured response
- *"SafePay payment lead unlock mein kitna time lagta hai?"* → Roman Urdu response

### Quick Prompt Examples:
- *"What documents are required for vendor KYC verification?"*
- *"How does the Max 3 lead unlock cap work?"*
- *"SafePay payment lead unlock procedure kitna time leta hai?"*
- *"How can I generate AI itineraries for my tour packages?"*
- *"Pro plan mein kitne AI itinerary plans milte hain per month?"*
- *"AI embassy fee lookup kaise use karte hain visa services mein?"*

---

## AI Engine Architecture (Technical Summary)

All four AI tools share a common backend:

| Layer | Technology |
|-------|-----------|
| **AI Provider** | OpenRouter — \`openai/gpt-4o-mini\` |
| **SDK** | Vercel AI SDK (\`@ai-sdk/openai-compatible\`) |
| **Execution** | TanStack Start \`createServerFn\` (server-side, never exposes API keys to client) |
| **Auth Guard** | \`requireSupabaseAuth\` middleware on all vendor-facing tools |
| **Quota Tracking** | \`ai_usage_events\` Supabase table (per-user, per-mode, per-month) |
| **Lead Capture** | \`capture_lead\` tool call inside concierge → writes to \`leads\` table → WhatsApp webhook |
`
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
