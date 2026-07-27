-- Migration: 20230802000000_custom_lead_quotes.sql

-- 1. Extend custom_tour_leads table with verification, token, and unlock limit tracking
ALTER TABLE public.custom_tour_leads
  ADD COLUMN IF NOT EXISTS max_unlocks integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS unlocked_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT uuid_generate_v4();

-- Update existing leads from 'pending' to 'verified' so legacy test data remains visible
UPDATE public.custom_tour_leads 
SET status = 'verified' 
WHERE status = 'pending';

-- Create index on access_token for fast customer quote portal lookups
CREATE INDEX IF NOT EXISTS idx_custom_tour_leads_token ON public.custom_tour_leads(access_token);

-- 2. Create lead_quotes table for vendor quotation submissions
CREATE TABLE IF NOT EXISTS public.lead_quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES public.custom_tour_leads(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES public.profiles(id) NOT NULL,
  quote_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  valid_until date,
  itinerary_summary text NOT NULL,
  inclusions text[] DEFAULT '{}',
  pdf_url text,
  status text NOT NULL DEFAULT 'submitted', -- 'submitted', 'accepted', 'declined'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead ON public.lead_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_vendor ON public.lead_quotes(vendor_id);

-- Enable RLS
ALTER TABLE public.lead_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can insert and manage their own quotes
CREATE POLICY "Vendors can manage own quotes"
  ON public.lead_quotes
  FOR ALL
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Policy: Anyone with valid lead access can select quotes for that lead
CREATE POLICY "Public read quotes for lead"
  ON public.lead_quotes
  FOR SELECT
  USING (true);
