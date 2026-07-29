-- Migration: 20230804000000_subscription_plans_and_toggles.sql
-- Create subscription_plans table with plan_type, is_enabled toggle, and pre-populate base & ad placement plans

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  plan_type text NOT NULL DEFAULT 'base', -- 'base', 'placement', 'advertisement'
  price_pkr integer NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'one_time'
  tagline text,
  archetype text,
  icon_name text DEFAULT 'Sparkles',
  accent text DEFAULT 'primary',
  covers text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  limits jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read enabled subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Admin manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert or upsert default Base Plans, Placement Subscription Plans, and 1-Week Flash Banner Ad Plans
INSERT INTO public.subscription_plans (
  id, name, plan_type, price_pkr, billing_period, tagline, archetype, icon_name, accent, covers, features, limits, is_enabled, display_order
) VALUES
  (
    'free', 'Free Trial', 'base', 0, 'monthly',
    'Trial account', 'Trying the marketplace', 'Sparkles', 'muted-foreground',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['3 active listings — any category', '5 lead credits / month', 'Basic public profile', 'Community support'],
    '{"listings": "3 total", "services": "Any 1 category", "leadCredits": "5 / month", "aiDrafts": "—", "aiPlans": "—", "placement": "Standard", "support": "Community"}'::jsonb,
    true, 1
  ),
  (
    'starter', 'Travel Desk', 'base', 4000, 'monthly',
    'Visa · Insurance · Tickets', 'Ticketing desks, visa agents & insurance specialists', 'Zap', 'sky-400',
    ARRAY['visa', 'insurance', 'tickets'],
    ARRAY['Up to 30 active service listings', '60 lead credits / month', 'Visa · Insurance · Tickets categories', '10 AI listing descriptions / month', 'Email support (48h)'],
    '{"listings": "30 total", "services": "Visa · Insurance · Tickets", "leadCredits": "60 / month", "aiDrafts": "10 / month", "aiPlans": "—", "placement": "Standard", "support": "Email · 48h"}'::jsonb,
    true, 2
  ),
  (
    'pro', 'Tour Operator', 'base', 7500, 'monthly',
    'Tour packages + AI planner', 'Tour operators building international packages', 'Crown', 'primary',
    ARRAY['tours'],
    ARRAY['Unlimited tour listings', '100 lead credits / month', 'Unlimited AI descriptions', '50 AI full-trip plans / month', 'Priority placement in search', 'Verified vendor badge', 'Priority email support (12h)'],
    '{"listings": "Unlimited", "services": "Tours only", "leadCredits": "100 / month", "aiDrafts": "Unlimited", "aiPlans": "50 / month", "placement": "Priority", "support": "Priority · 12h"}'::jsonb,
    true, 3
  ),
  (
    'agency', 'Full Agency', 'base', 12000, 'monthly',
    'Everything, unified', 'Full-service agencies selling tours + visa + insurance + tickets', 'Rocket', 'amber-400',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['Unlimited listings across all 4 categories', '300 lead credits / month', 'Unlimited AI plans & descriptions', 'Featured homepage placement', 'Multi-seat team + dedicated account manager', 'API + CSV bulk operations'],
    '{"listings": "Unlimited + team", "services": "Tours · Visa · Insurance · Tickets", "leadCredits": "300 / month", "aiDrafts": "Unlimited", "aiPlans": "Unlimited", "placement": "Featured", "support": "Dedicated AM"}'::jsonb,
    true, 4
  ),
  (
    'placement_search', 'Search Placement Boost', 'placement', 8000, 'monthly',
    'Top-of-search ranking', 'Boost your packages to #1 position in search queries', 'Search', 'emerald-400',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['Top 3 search placement boost', 'Featured badge on search results', '4x average click-through rate', 'Priority customer lead routing'],
    '{"listings": "All listings", "services": "Search Boost", "leadCredits": "+50 / month", "placement": "Top #1-#3 Search"}'::jsonb,
    true, 5
  ),
  (
    'placement_ai', 'AI Concierge Recommendation', 'placement', 12000, 'monthly',
    'AI Concierge Spotlight', 'Get recommended by bilingual AI Concierge in Roman Urdu & English', 'Bot', 'purple-400',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['Direct AI recommendation priority in Roman Urdu & English', 'AI Concierge booking link placement', 'High-trust customer lead conversions', 'Weekly AI recommendation stats'],
    '{"listings": "AI Recommended", "services": "AI Chat Spotlight", "leadCredits": "+100 / month", "placement": "AI Concierge Priority"}'::jsonb,
    true, 6
  ),
  (
    'placement_landing', 'Landing Page Spotlight', 'placement', 15000, 'monthly',
    'Featured Agency Spotlight', 'Spotlight your agency logo & packages on main landing page', 'Globe2', 'amber-400',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['Featured Agency Spotlight card on landing page', 'Top hero slider package placement', 'Maximum brand exposure & trust', 'Dedicated profile showcase'],
    '{"listings": "Homepage Spotlight", "services": "Landing Page", "leadCredits": "+150 / month", "placement": "Homepage Top Slider"}'::jsonb,
    true, 7
  ),
  (
    'ad_flash_banner_1w', '1-Week Flash Hero Banner Ad', 'advertisement', 15000, 'weekly',
    '7-Day Promotional Banner', 'High-impact 7-day flash campaign banner on landing page hero', 'Sparkles', 'rose-400',
    ARRAY['tours', 'visa', 'insurance', 'tickets'],
    ARRAY['7-Day Exclusive Hero Banner Ad on Landing Page', 'Custom call-to-action link to your package or store', 'Ideal for seasonal sales (Umrah, Baku Winter, Eid Specials)', 'Dedicated campaign analytics report'],
    '{"listings": "Hero Banner", "services": "1-Week Ad", "leadCredits": "+100 / campaign", "placement": "7-Day Hero Banner"}'::jsonb,
    true, 8
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  price_pkr = EXCLUDED.price_pkr,
  billing_period = EXCLUDED.billing_period,
  tagline = EXCLUDED.tagline,
  archetype = EXCLUDED.archetype,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  display_order = EXCLUDED.display_order;
