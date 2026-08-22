# 🛠️ 01_Tech_and_IP: Core Architecture & System Infrastructure

**CONFIDENTIAL DATA ROOM ASSET**  
**PROJECT:** GlobeTrek PK Platform Ecosystem  
**ENTITIES COVERED:** Core Marketplace (`globetrek`), Lead Scraper Engine (`Leads-Globetrek`), WhatsApp Outreach Server (`wa-server-gcp`)  

---

## 🧭 END-TO-END SYSTEM ARCHITECTURE

```mermaid
flowchart TB
    subgraph CLIENT_TIER["🖥️ CLIENT TIER (EDGE ROUTING)"]
        A1["Public Users & Travelers<br/>(Desktop & Mobile)"]
        A2["Verified Travel Vendors<br/>(Tour / Visa / Insurance / Tickets)"]
        A3["Platform Administrators<br/>(Executive Operating System)"]
    end

    subgraph CDN_EDGE["⚡ CDN & EDGE INGRESS"]
        B1["Cloudflare Edge Network / SSL Termination"]
        B2["DDoS Shield & Automated Rate Limiting"]
        B3["Dynamic Sitemaps & OpenGraph Meta Injector"]
    end

    subgraph COMPUTE_TIER["⚙️ APPLICATION COMPUTE & RUNTIME"]
        C1["TanStack Start Full-Stack App<br/>(React 19, TanStack Router RPC)"]
        C2["Nitro Server Engine<br/>(Cloudflare Pages / Node.js 22 Runtime)"]
        C3["Contabo Production VPS<br/>(Ubuntu 24.04 LTS, Nginx, Fail2ban)"]
    end

    subgraph DATA_SERVICES["🗄️ PERSISTENCE & DATA PIPELINE"]
        D1["Supabase Managed PostgreSQL<br/>(Row Level Security RLS, Realtime)"]
        D2["Cloudflare D1 SQLite Database<br/>(High-Volume Lead Pipeline)"]
        D3["Supabase Storage Buckets<br/>(KYC Licenses, Tour Images, Invoices)"]
    end

    subgraph EXTERNAL_INTEGRATIONS["🔌 EXTERNAL API SERVICES"]
        E1["OpenRouter AI Engine<br/>(GPT-4o-mini, DeepSeek LLM)"]
        E2["Safepay PKR Gateway<br/>(Cards, EasyPaisa, JazzCash, 1Link)"]
        E3["WhatsApp Gateway Server (GCP)<br/>(wa.yello.bid / WhatsClient REST API)"]
        E4["Apify Web Scraping Fleet<br/>(Google Maps & Facebook Leads)"]
    end

    CLIENT_TIER --> B1
    B1 --> B2
    B2 --> C1
    C1 <--> C2
    C2 <--> C3
    C1 <--> D1
    C1 <--> D3
    C2 <--> E1
    C2 <--> E2
    C2 <--> E3
    E4 --> D2
    D2 --> C1

    style CLIENT_TIER fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style CDN_EDGE fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#fff
    style COMPUTE_TIER fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style DATA_SERVICES fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style EXTERNAL_INTEGRATIONS fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
```

---

## 📦 COMPONENT SPECIFICATIONS

### 1. Core Marketplace Web Application (`globetrek`)
* **Framework:** [TanStack Start](https://tanstack.com/start) with **React 19**
* **Type-Safety:** 100% End-to-End Type Safety via TanStack Router server functions (`createServerFn`) & RPCs
* **Styling Engine:** Tailwind CSS v4 with custom dark-mode token palette
* **Geospatial Mapping:** Leaflet 1.9 + CartoDB tiles with geodesic curvature flight-arc calculations
* **State & Caching:** TanStack Query v5 with optimistic UI updates and zero waterfall rendering

### 2. Automated Lead Generation Engine (`Leads-Globetrek`)
* **Scraping Infrastructure:** Distributed Apify actors targeting Pakistani travel agencies, Hajj/Umrah operators, and visa consultants across 12 major cities.
* **Storage Layer:** Serverless Cloudflare D1 distributed database for high-throughput contact deduplication and phone normalization (+92 format).
* **Enrichment:** Automated DTS license lookup and company website health scanning.

### 3. Automated WhatsApp Server (`wa-server-gcp`)
* **Runtime:** Node.js Express server containerized on Google Cloud Platform (Cloud Run).
* **Two-Way Webhook Bridge:** Receives inbound customer quotes and dispatches instant WhatsApp notifications to verified vendor numbers.
* **Template Engine:** Dynamic chip injection (`{customer_name}`, `{destination}`, `{budget_pkr}`).

---

## 🔒 SECURITY & PRODUCTION HARDENING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION HARDENING CHECKLIST                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Row Level Security (RLS)│ Supabase RLS policies enforce isolation between│
│                            │ admins, vendors, and traveler accounts.        │
├────────────────────────────┼────────────────────────────────────────────────┤
│  ✓ Fail2ban & SSH Jails    │ VPS hardened with ed25519 keys only, custom    │
│                            │ SSH ports, and automated IP ban rules.         │
├────────────────────────────┼────────────────────────────────────────────────┤
│  ✓ DDoS & Edge Caching     │ Cloudflare Universal SSL with strict HTTPS,    │
│                            │ HTTP/3, and Brotli compression.                │
├────────────────────────────┼────────────────────────────────────────────────┤
│  ✓ Webhook HMAC Validation │ Safepay and WhatsApp webhook payloads validated│
│                            │ via cryptographic SHA-256 signatures.          │
├────────────────────────────┼────────────────────────────────────────────────┤
│  ✓ AI Rate & Cost Controls │ Token budget caps with automatic fallback to   │
│                            │ low-cost models during peak volume.            │
└────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMAS & ACCESS CONTROL

The Supabase PostgreSQL database includes **14 relational tables** with comprehensive foreign keys, indexes, and RLS security:

| Table Name | Purpose | RLS Policy Model |
|---|---|---|
| `profiles` | User accounts, account tiers, agency profiles | Public read, self update, admin all |
| `user_roles` | RBAC roles (`admin`, `vendor`, `customer`) | Admin manage, authenticated read |
| `tours` | Tour packages, itinerary arrays, inclusions | Public read active, vendor manage own |
| `visa_services` | Country visa requirements, embassy fees | Public read active, vendor manage own |
| `insurance_plans` | Travel insurance policies & medical tiers | Public read active, broker manage own |
| `ticket_services` | Flight desks & Umrah packages | Public read active, desk manage own |
| `leads` | Inbound traveler inquiries & quotes | Admin & vendor who unlocked lead |
| `lead_unlock_payments` | Pay-per-lead transactions & balance | Owner vendor & admin view |
| `payments` | Subscription & lead wallet payments | Owner view, admin ledger view |
| `payment_gateway_settings` | Gateway credentials & KYC config | Admin only access |
| `ai_usage_events` | Token analytics & query logging | Admin analytics read |
| `affiliate_referrals` | Referral tracking & click attribution | Affiliate owner & admin view |
| `affiliate_payouts` | Weekly affiliate commission payouts | Affiliate owner & admin view |
| `whatsapp_templates` | Pre-approved WhatsApp notification templates | Public read, admin manage |

---

## 🚀 BUILD & RUN VERIFICATION

```bash
# 1. Install all dependencies
npm install

# 2. Type-check & lint
npm run lint

# 3. Production Build
npm run build

# 4. Preview locally
npm run preview
```

**Build Status:** `Clean (0 warnings, 0 errors, 1.08s bundle time)`
