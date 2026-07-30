<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project Deployment & VPS Context
- **Target Server**: `tour.testbench.shop`
- **SSH User**: `ubuntu`
- **SSH Private Key Path (Local)**: `C:\Users\Zulqarnain\Downloads\ssh-key-2026-05-29.key`
- **Live VPS Web Root / Project Path**: `/var/www/tour_testben_usr89/data/www/tour.testbench.shop/app`
- **GitHub Repository**: `https://github.com/zulbit/globetrek.git`
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`) triggers automatically on push to `main`, SSHing as `ubuntu` to pull, build, sync `.output/public/*` to Nginx root `/var/www/tour_testben_usr89/data/www/tour.testbench.shop/`, and restart PM2.

## Project Architecture & Tech Stack Context
- **Framework**: TanStack Start (React 19, Vite, TanStack Router, TanStack Query) with Nitro `node-server` preset.
- **Local Dev Server**: Runs on `http://localhost:8080` (`npm run dev -- --port 8080`).

## Database & Authentication (Supabase)
- **Project ID**: `rcldabxkcwfemnigwutk`
- **URL**: `https://rcldabxkcwfemnigwutk.supabase.co`
- **Publishable Key**: `sb_publishable_nk5WJj0qOmSimrFmwh7ZWQ_teiVWYtE`
- **Database Tables**:
  - `profiles`: Accounts, vendor tiers (`starter`, `pro`), vendor services (`tours`, `visa`, `insurance`, `tickets`), and cities.
  - `tours`: Tour packages catalog.
  - `visa_services`: Visa filing services catalog.
  - `insurance_plans`: Travel insurance policies catalog.
  - `ticket_services`: Flight ticketing desks and Umrah/Hajj packages.

## AI Integrations (OpenRouter)
- **API Provider**: OpenRouter (`openai/gpt-4o-mini`) via `@ai-sdk/openai-compatible`.
- **Primary AI Services**:
  - **AI Concierge**: Bilingual (English & Roman Urdu) travel guide & catalog assistant (`src/routes/api/ai-chat.ts`).
  - **Tour Generator**: Automated tour itinerary creator.
  - **Visa Lookup**: Embassy fee and document requirement lookup.

## Payment & Communication Integrations
- **Safepay Gateway**: Configured for PKR payments (`SAFEPAY_ENV="sandbox"`).
- **WhatsApp Integration**: Automated inquiry and booking alerts (`WHATSAPP_API_KEY`).

## Universal Search & Marketplace Fallbacks
- **Universal Search**: RPC function `search_marketplace` queries across all 4 services (`tours`, `visa_services`, `insurance_plans`, `ticket_services`).
- **Empty State Fallbacks**: Hardcoded sample listings in `src/routes/visa.index.tsx`, `insurance.index.tsx`, and `tickets.index.tsx` so pages never render empty when database tables have 0 rows.
