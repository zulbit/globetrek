-- Migration: 20230805000000_vendor_addon_subscriptions.sql
-- Create vendor_addon_subscriptions table to track active vendor placement boosts, flash banners, and slot limits

CREATE TABLE IF NOT EXISTS public.vendor_addon_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_id text NOT NULL,
  addon_title text NOT NULL,
  amount_pkr integer NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'one_time'
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active', -- 'active', 'queued', 'expired', 'cancelled'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_addon_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Vendors view own addon subscriptions"
  ON public.vendor_addon_subscriptions
  FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admin manage all vendor addon subscriptions"
  ON public.vendor_addon_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup by active status & expiration
CREATE INDEX IF NOT EXISTS idx_vendor_addon_active
  ON public.vendor_addon_subscriptions(addon_id, status, expires_at);
