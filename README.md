# 🌍 GlobeTrek PK — Enterprise B2B/B2C Travel Marketplace & AI Operating System

[![Production Status](https://img.shields.io/badge/Status-Production%20Live-emerald?style=for-the-badge&logo=fastapi)](https://globetrek.pk)
[![Framework](https://img.shields.io/badge/Framework-TanStack%20Start%20(React%2019)-blue?style=for-the-badge&logo=react)](https://tanstack.com/start)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Payments](https://img.shields.io/badge/Fintech-Safepay%20PKR%20Escrow-orange?style=for-the-badge)](https://getsafepay.com)
[![AI Engine](https://img.shields.io/badge/AI-OpenRouter%20%2F%20GPT--4o--Mini-purple?style=for-the-badge&logo=openai)](https://openrouter.ai)

> **GlobeTrek PK** (`globetrek.pk`) is an end-to-end, enterprise-grade digital travel marketplace and AI operating system purpose-built for the South Asian and international travel industry. It unifies **licensed Tour Operators**, **Visa Filing Desks**, **Travel Insurance Brokers**, and **IATA Flight Desks** under a modern B2B/B2C commerce platform with automated PKR escrow payments, bilingual AI travel concierges, and dynamic lead monetization.

---

## 🌟 Executive Overview & Platform Pillars

GlobeTrek PK replaces fragmented WhatsApp groups, unverified Facebook ads, and manual paper processing with a high-trust digital ecosystem:

```
                                 ┌────────────────────────┐
                                 │   🌍 GlobeTrek PK      │
                                 │   Universal Gateway    │
                                 └───────────┬────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
┌──────────────┐  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  🗺️ Tours    │  │  🛂 Visa     │   │  🛡️ Insurance │   │  ✈️ Flight    │   │  🤖 AI Conc. │
│  Marketplace │  │  Consulting  │   │  Coverage     │   │  & Umrah     │   │  & Discovery │
└──────────────┘  └──────────────┘   └───────────────┘   └──────────────┘   └──────────────┘
```

---

## 🚀 Key Platform Features

### 1. 🌍 4-in-1 Unified Travel Marketplace
- **Tour Packages Catalog:** Dynamic itineraries, Pakistani departure hubs (`KHI`, `LHE`, `ISB`), inclusion tags, hotel tiers, and seasonal discount badges.
- **Visa Consulting Desks:** Country-by-country embassy fees, document check requirements, validity trackers, and fast-track processing services.
- **Travel Insurance Brokerage:** Schengen-compliant, Gulf, and Worldwide travel medical insurance policies with instant policy quote generation.
- **Flight & Umrah Desks:** IATA group allocations, Umrah VIP/Executive packages, direct inquiry routing, and custom quote builders.

### 2. 🤖 Bilingual AI Concierge (OpenRouter / GPT-4o & DeepSeek)
- **Natural Language Inquiry:** Speaks fluent **English** and **Roman Urdu** to assist travelers with visa requirements, customized itineraries, and price estimations.
- **Dynamic Catalog Search:** Real-time AI embeddings search across active marketplace listings with direct booking links.
- **Automated Token & Cost Tracking:** Admin analytics panel monitoring per-user token consumption, API latency, and model switching.

### 3. 💳 PKR Fintech & Escrow Payment Infrastructure
- **Safepay Gateway Integration:** Native support for Pakistani Debit/Credit Cards, **EasyPaisa**, **JazzCash**, and **1Link** Bank Transfers.
- **Webhook Handlers:** Automated transaction reconciliation, instant lead unlocks, subscription renewals, and invoice generation.
- **Wallet & Lead Credit System:** Vendors purchase prepaid lead bundles with instant balance deduction upon lead acquisition.

### 4. 🏢 B2B Vendor Portal & KYC Compliance Engine
- **Government Compliance (DTS & NTN):** Formal verification of Department of Tourist Services (DTS) travel licenses and FBR NTN tax registration.
- **Flexible Subscription Tiers:**
  - `Free Tier`: Profile listing with basic inquiry forms.
  - `Travel Desk (₨ 4,000 / mo)`: Specialized visa, insurance, and ticketing desks.
  - `Tour Operator (₨ 7,500 / mo)`: Full tour publishing, Leaflet map placement, priority lead alerts.
  - `Full Agency (₨ 12,000 / mo)`: Multi-service publishing across all 4 verticals.
- **Lead Bidding & Instant Routing:** Pay-per-lead marketplace with verified phone numbers, travel dates, and passenger counts.

### 5. 🗺️ Geospatial Flight & Itinerary Visualizer
- **Interactive OpenStreetMap + Leaflet:** Split-screen map engine rendering curved geodesic flight arcs between Pakistan and global destination airports (`DXB`, `IST`, `BKK`, `CDG`, `JED`, etc.).
- **Multi-Hop Day-by-Day Route Tracking:** Pinpoints hotels, attractions, and transit legs on interactive map popups.

### 6. 📲 Automated WhatsApp Business Gateway
- **Instant SMS/WhatsApp Alerts:** Integrates with WhatsApp Gateway (`wa.yello.bid`) for instant lead dispatches, booking confirmations, and vendor onboarding links.
- **Custom Dynamic Templates:** Variable chips (`{customer_name}`, `{destination}`, `{price_pkr}`) for automated customer re-engagement.

### 7. 🤝 Affiliate & Growth Engine
- **Affiliate Portal (`/affiliate`):** Custom referral link generation, real-time click tracking, commission tracking (20% recurring), and automated weekly payout ledger.

### 8. 🛡️ Enterprise Platform Administration (`/admin`)
- **Executive Analytics:** Active MRR projections, verified vendor counts, traveler demographics, and lead velocity charts.
- **CMS Engines:** Visual Landing Page CMS, KYC Requirement CMS, and Vendor Operational Guide CMS.
- **Automated SEO Generator:** Real-time OpenGraph meta generation, canonical URL management, and dynamic XML sitemap generation.

---

## 🛠️ Technology Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [TanStack Start](https://tanstack.com/start) (React 19, TanStack Router, TanStack Query) |
| **Server Engine** | Nitro Server (`node-server` & Cloudflare Pages edge runtime) |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security RLS, Realtime channels, Storage) |
| **Fintech Payments** | Safepay PKR Gateway (Credit/Debit Cards, JazzCash, EasyPaisa, 1Link) |
| **AI SDK** | OpenRouter (`@ai-sdk/openai-compatible`, GPT-4o-mini, DeepSeek) |
| **Styling & Design** | Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Recharts |
| **Geospatial Maps** | Leaflet, CartoDB Dark/Voyager Tiles, Geodesic Curvature Engine |
| **Messaging** | WhatsApp Business Gateway API (`wa.yello.bid`) |

---

## 💰 Monetization Model & Commercial Value

GlobeTrek PK is architected with multiple recurring revenue streams:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Platform Revenue Streams                           │
├────────────────────────────────────────────────────────────────────────┤
│  1. SaaS Subscriptions   │  Monthly recurring fees from Travel Desks   │
│                          │  and Tour Operators (₨ 4,000 - 12,000/mo)   │
├──────────────────────────┼─────────────────────────────────────────────┤
│  2. Lead Unlock Fees     │  Pay-per-lead marketplace: ₨ 5,000 for tours │
│                          │  and ₨ 750 for custom visa quote leads      │
├──────────────────────────┼─────────────────────────────────────────────┤
│  3. Featured Placements  │  Sponsored badge listings & OpenStreetMap   │
│                          │  top-tier card highlighting                 │
├──────────────────────────┼─────────────────────────────────────────────┤
│  4. Affiliate Growth     │  20% commission on partner-referred agency  │
│                          │  subscriptions                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
globetrek/
├── public/                 # Static assets, logos, sitemaps, manifests
├── src/
│   ├── components/         # Reusable UI primitives, cards, shells, navbars
│   │   ├── ui/             # Radix UI + Tailwind component library
│   │   ├── site-shell.tsx  # Global responsive navigation & footer
│   │   └── dashboard-shell.tsx # Admin & Vendor workspace shell
│   ├── integrations/       # Supabase client & server connection pools
│   ├── lib/                # Business logic, pricing, AI, payments, SEO
│   │   ├── ai.functions.ts # OpenRouter AI concierge orchestrator
│   │   ├── safepay.ts      # Safepay checkout & webhook verification
│   │   ├── whatsapp.functions.ts # WhatsApp Gateway integration
│   │   └── vendors.functions.ts  # Vendor KYC and lead bidding logic
│   └── routes/             # TanStack Start File-Based Routing
│       ├── _authenticated/ # Protected Admin & Vendor workspaces
│       │   ├── admin.tsx   # Admin control panel (Analytics, Users, CMS)
│       │   ├── admin.whatsapp.tsx # WhatsApp notification console
│       │   └── vendor.tsx  # Vendor lead portal, tour manager, billing
│       ├── tours/          # Tours catalog & detail view with Leaflet map
│       ├── visa/           # Visa services directory & quote forms
│       ├── insurance/      # Travel insurance plans catalog
│       ├── tickets/        # Flight & Umrah desks
│       └── index.tsx       # Main conversion landing page
├── supabase/               # SQL migrations, RLS policies, seed schema
└── vite.config.ts          # Vite & Nitro compilation configuration
```

---

## ⚡ Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: `v22.0.0` or higher
- **npm** or **pnpm**
- **Supabase Account** with PostgreSQL database

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/zulbit/globetrek.git

# Navigate into the project directory
cd globetrek

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://rcldabxkcwfemnigwutk.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# AI Integrations (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
DEEPSEEK_API_KEY="your-deepseek-key"

# Safepay Payment Gateway
SAFEPAY_ENV="sandbox" # or "production"
SAFEPAY_API_KEY="your-safepay-api-key"
SAFEPAY_WEBHOOK_SECRET="your-safepay-secret"

# WhatsApp Notification Gateway
WHATSAPP_API_KEY="your-whatsapp-gateway-key"
WHATSAPP_DEVICE_ID="your-device-number"
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

### 5. Production Build

```bash
# Build for production with Nitro Server
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Enterprise Deployment

The repository includes pre-configured **GitHub Actions CI/CD workflows** (`.github/workflows/deploy.yml`) for zero-downtime deployments to modern VPS servers and cloud providers:

- **Target Server:** Linux VPS / Docker / Cloudflare Pages
- **Server Preset:** Nitro `node-server`
- **Reverse Proxy:** Nginx / Cloudflare SSL Edge

---

## 📄 License & Commercial Inquiries

This project is proprietary software. For commercial licensing, platform acquisition, or white-label partnerships, please contact the development team directly or visit [GlobeTrek PK](https://globetrek.pk).
