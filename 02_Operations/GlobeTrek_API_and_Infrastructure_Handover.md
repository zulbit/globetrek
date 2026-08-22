# 🔑 GlobeTrek PK — API & Infrastructure Handover Master Sheet

**DOCUMENT REF:** `OPS-GTK-2026-HANDOVER`  
**CONFIDENTIALITY LEVEL:** High (Shared only under signed NDA & Active Escrow)  

---

## 🧭 CREDENTIALS & SERVICE TRANSFER MATRIX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE & API TRANSFER MATRIX                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  SERVICE               │ PURPOSE                    │ TRANSFER METHOD       │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  1. GitHub             │ 3 Core Source Repositories │ Organization / Repo   │
│                        │ (globetrek, Leads, WA-GCP) │ Transfer to Buyer ID  │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  2. Domain Registrar   │ globetrek.pk Domain Asset  │ EPP Auth Code / Push  │
│                        │                            │ to Buyer Registrar    │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  3. Supabase           │ PostgreSQL Database, RLS,  │ Project Owner Invite  │
│                        │ Auth & File Storage        │ & Transfer Ownership  │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  4. Cloudflare         │ DNS, SSL Edge, CDN &       │ Account Invite / DNS  │
│                        │ D1 Serverless SQLite DB    │ Nameserver delegation │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  5. Safepay Gateway    │ PKR Fintech Escrow Checkout│ API Secret Rotation & │
│                        │ & Webhook Processing       │ Merchant Account Sync │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  6. OpenRouter AI      │ Bilingual AI Concierge     │ API Key Update & Org  │
│                        │ (GPT-4o-mini & DeepSeek)   │ Account Transfer      │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  7. Apify Fleet        │ Automated Lead Scraper for │ API Token Transfer &  │
│                        │ Pakistani Travel Agencies  │ Actor Run Templates   │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  8. WhatsApp Gateway   │ wa.yello.bid / WhatsClient │ API Token & Sender    │
│                        │ Live Notification Server   │ Phone Re-association  │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  9. Google Cloud (GCP) │ wa-server-gcp Webhook      │ GCP Project Transfer  │
│                        │ Container (Cloud Run)      │ or Docker Deployment  │
├────────────────────────┼────────────────────────────┼───────────────────────┤
│  10. Production VPS    │ Ubuntu 24.04 Nginx Server  │ Root SSH Key Handover │
│                        │ with Fail2ban Security     │ & Password Reset      │
└────────────────────────┴────────────────────────────┴───────────────────────┘
```

---

## 📋 ENVIRONMENT VARIABLE CHECKLIST FOR BUYER

When deploying or taking over the production instance, configure `.env` with the following variables:

```env
# 1. Supabase (Database & Auth)
VITE_SUPABASE_URL="https://rcldabxkcwfemnigwutk.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# 2. AI Engine (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
DEEPSEEK_API_KEY="your-deepseek-key"

# 3. Fintech (Safepay PKR Gateway)
SAFEPAY_ENV="production" # or "sandbox"
SAFEPAY_API_KEY="your-safepay-api-key"
SAFEPAY_WEBHOOK_SECRET="your-safepay-webhook-secret"

# 4. WhatsApp Gateway
WHATSAPP_API_KEY="10e916da76bac02be1ac10635b9a04735450d8e2"
WHATSAPP_DEVICE_ID="03293089377"

# 5. Lead Engine (Apify & Cloudflare D1)
APIFY_API_TOKEN="your-apify-token"
CLOUDFLARE_D1_DATABASE_ID="your-d1-uuid"
```

---

## ⚡ 48-HOUR CUTOVER TIMELINE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP-BY-STEP TRANSITION SCHEDULE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Day 1 (Hours 0–24)    │ • Transfer GitHub repositories to Buyer.           │
│                        │ • Initiate globetrek.pk domain auth transfer.      │
│                        │ • Invite Buyer email as Owner on Supabase & Cloud. │
├────────────────────────┼────────────────────────────────────────────────────┤
│  Day 2 (Hours 24–48)   │ • Rotate API keys for Safepay, OpenRouter, & Apify.│
│                        │ • Verify production build deployment on live URL.  │
│                        │ • Complete 30-day technical support onboarding.    │
└────────────────────────┴────────────────────────────────────────────────────┘
```
