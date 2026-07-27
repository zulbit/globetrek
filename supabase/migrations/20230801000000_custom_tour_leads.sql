-- Migration: 20230801000000_custom_tour_leads.sql

-- Table: custom_tour_leads
CREATE TABLE IF NOT EXISTS public.custom_tour_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id uuid REFERENCES profiles(id),  -- nullable for guest submissions
  departure_city text NOT NULL,
  destination text NOT NULL,
  travel_month text NOT NULL,
  duration_days integer NOT NULL,
  group_size integer NOT NULL DEFAULT 1,
  group_type text NOT NULL DEFAULT 'family',  -- family, friends, corporate, solo
  hotel_tier text NOT NULL DEFAULT '4star',    -- 3star, 4star, 5star
  visa_needed boolean NOT NULL DEFAULT false,
  insurance_needed boolean NOT NULL DEFAULT false,
  flight_class text NOT NULL DEFAULT 'economy', -- economy, business
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  special_requests text,
  status text NOT NULL DEFAULT 'pending',  -- pending, matched, closed
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_custom_tour_leads_status ON public.custom_tour_leads(status);
CREATE INDEX IF NOT EXISTS idx_custom_tour_leads_created_at ON public.custom_tour_leads(created_at);

-- Table: lead_unlock_payments
CREATE TABLE IF NOT EXISTS public.lead_unlock_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES custom_tour_leads(id) NOT NULL,
  vendor_id uuid REFERENCES profiles(id) NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL,
  payment_intent_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_unlock_payments_status ON public.lead_unlock_payments(status);

-- Table: vendor_lead_purchases
CREATE TABLE IF NOT EXISTS public.vendor_lead_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES custom_tour_leads(id) NOT NULL,
  vendor_id uuid REFERENCES profiles(id) NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_lead_purchases_vendor ON public.vendor_lead_purchases(vendor_id);

-- RLS policies
ALTER TABLE public.custom_tour_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_unlock_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_lead_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a custom tour lead (guest submissions)
CREATE POLICY "Anyone can submit custom tour lead"
  ON public.custom_tour_leads FOR INSERT
  WITH CHECK (true);

-- Vendors can read leads (marketplace)
CREATE POLICY "Authenticated users can read leads"
  ON public.custom_tour_leads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Vendors can read their own purchases
CREATE POLICY "Vendors can read own purchases"
  ON public.vendor_lead_purchases FOR SELECT
  USING (auth.uid() = vendor_id);

-- Vendors can insert purchases
CREATE POLICY "Vendors can insert purchases"
  ON public.vendor_lead_purchases FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

-- Vendors can read own payment records
CREATE POLICY "Vendors can read own payments"
  ON public.lead_unlock_payments FOR SELECT
  USING (auth.uid() = vendor_id);

-- Vendors can insert payment records
CREATE POLICY "Vendors can insert payments"
  ON public.lead_unlock_payments FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);
