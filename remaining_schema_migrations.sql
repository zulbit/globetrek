-- Remaining Supabase Schema Migrations (Migrations 2 to 18)

-- ==========================================
-- Migration: 20260721150912_615eadf4-11a1-4777-815c-ff11dd84fe50.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;


-- ==========================================
-- Migration: 20260721153941_2633dfbb-7e8e-42ff-b53d-6e0aa37eba4a.sql
-- ==========================================

-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro');

-- Add lead-gen columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  ADD COLUMN lead_credits_balance integer NOT NULL DEFAULT 3;

-- Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  message text,
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  unlocked_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone signed-in can create a lead (customer inquiry)
CREATE POLICY "Anyone authenticated can create leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (true);

-- Vendors can see leads for their tours; admins see all
CREATE POLICY "Vendors read own leads"
  ON public.leads FOR SELECT TO authenticated
  USING (vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Vendors update their leads (to unlock); admins full
CREATE POLICY "Vendors update own leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admin can update profile credits (add admin policy if missing)
CREATE POLICY "Admins update any profile credits"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Unlock lead RPC: atomic credit decrement + unlock
CREATE OR REPLACE FUNCTION public.unlock_lead(_lead_id uuid)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead public.leads;
  _tier public.subscription_tier;
  _credits integer;
BEGIN
  SELECT * INTO _lead FROM public.leads WHERE id = _lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF _lead.vendor_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _lead.is_unlocked THEN RETURN _lead; END IF;

  SELECT subscription_tier, lead_credits_balance INTO _tier, _credits
    FROM public.profiles WHERE id = _lead.vendor_id;

  IF _tier <> 'pro' THEN
    IF _credits < 1 THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
    UPDATE public.profiles SET lead_credits_balance = lead_credits_balance - 1
      WHERE id = _lead.vendor_id;
  END IF;

  UPDATE public.leads SET is_unlocked = true, unlocked_at = now()
    WHERE id = _lead_id RETURNING * INTO _lead;
  RETURN _lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_lead(uuid) TO authenticated;


-- ==========================================
-- Migration: 20260721155838_610d2544-648e-4754-9b64-bf2603f380eb.sql
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _full_name TEXT;
  _company TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'customer');
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');
  _company := NULLIF(NEW.raw_user_meta_data ->> 'company_name', '');

  INSERT INTO public.profiles (id, email, full_name, company_name, vendor_status)
  VALUES (NEW.id, NEW.email, _full_name, _company,
          (CASE WHEN _role = 'vendor' THEN 'pending' ELSE 'approved' END)::public.vendor_status);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- ==========================================
-- Migration: 20260721183841_bb3ad197-17af-4a96-a70f-a6eb8d7e418c.sql
-- ==========================================
GRANT SELECT ON public.tours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ==========================================
-- Migration: 20260721184546_a7ee7d03-8132-4f14-a1ca-99792121e947.sql
-- ==========================================
GRANT SELECT ON public.tours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

-- ==========================================
-- Migration: 20260721184612_db9b18a0-4846-4995-981a-91bf279daed4.sql
-- ==========================================
DROP POLICY IF EXISTS "Active tours are public" ON public.tours;

CREATE POLICY "Published tours are public"
ON public.tours
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Vendors can view own tours"
ON public.tours
FOR SELECT
TO authenticated
USING (vendor_id = auth.uid());

CREATE POLICY "Admins can view all tours"
ON public.tours
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

-- ==========================================
-- Migration: 20260721184709_4e9ba20b-5aa1-4f61-afb4-02dbed487e5b.sql
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.unlock_lead(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_lead(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;

-- ==========================================
-- Migration: 20260724093432_ce57e500-6bcc-4f9d-a83e-bf36ec613969.sql
-- ==========================================
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS itinerary jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ==========================================
-- Migration: 20260724093508_adcad105-a525-4f8d-8ddb-5a632a0bb47f.sql
-- ==========================================

CREATE POLICY "Authenticated can read tour-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can upload tour-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can update tour-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tour-images');
CREATE POLICY "Authenticated can delete tour-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tour-images');


-- ==========================================
-- Migration: 20260724102259_f8ebc08b-f42f-4bf5-b2e6-041486102fc8.sql
-- ==========================================

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS requirements jsonb,
  ADD COLUMN IF NOT EXISTS accommodation jsonb,
  ADD COLUMN IF NOT EXISTS extra_notes text;


-- ==========================================
-- Migration: 20260724111707_8bb93f0f-1940-4a42-b205-fb2012674c05.sql
-- ==========================================

CREATE TYPE public.ai_usage_kind AS ENUM ('description', 'plan');

CREATE TABLE public.ai_usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.ai_usage_kind NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ai_usage_events_user_created_idx ON public.ai_usage_events (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI usage" ON public.ai_usage_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own AI usage" ON public.ai_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all AI usage" ON public.ai_usage_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ==========================================
-- Migration: 20260724114025_1f033b28-93cf-444b-9f42-c11d85541316.sql
-- ==========================================
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'starter' BEFORE 'pro';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'agency' AFTER 'pro';

-- ==========================================
-- Migration: 20260724115253_3e675fde-0a74-4c86-94ac-92ee07887d4c.sql
-- ==========================================

-- 1. Service type enum
CREATE TYPE public.service_type AS ENUM ('tours', 'visa', 'insurance', 'tickets');
CREATE TYPE public.service_lead_status AS ENUM ('new', 'contacted', 'won', 'lost');

-- 2. Extend profiles with vendor_services array
ALTER TABLE public.profiles
  ADD COLUMN vendor_services public.service_type[] NOT NULL DEFAULT ARRAY['tours']::public.service_type[];

-- Backfill: existing vendors keep 'tours'
UPDATE public.profiles SET vendor_services = ARRAY['tours']::public.service_type[]
  WHERE vendor_services IS NULL OR array_length(vendor_services, 1) IS NULL;

-- 3. Visa services table
CREATE TABLE public.visa_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  visa_type TEXT NOT NULL,
  processing_days INTEGER NOT NULL DEFAULT 15,
  price_pkr INTEGER NOT NULL,
  service_fee_pkr INTEGER NOT NULL DEFAULT 0,
  success_rate INTEGER,
  documents_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  extra_notes TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.visa_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_services TO authenticated;
GRANT ALL ON public.visa_services TO service_role;
ALTER TABLE public.visa_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active visa services" ON public.visa_services
  FOR SELECT USING (is_active = true OR auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Vendors manage own visa services" ON public.visa_services
  FOR ALL TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER visa_services_updated_at BEFORE UPDATE ON public.visa_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Insurance plans table
CREATE TABLE public.insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  coverage_type TEXT NOT NULL,
  coverage_amount_pkr BIGINT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price_pkr INTEGER NOT NULL,
  age_min INTEGER NOT NULL DEFAULT 0,
  age_max INTEGER NOT NULL DEFAULT 99,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.insurance_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_plans TO authenticated;
GRANT ALL ON public.insurance_plans TO service_role;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active insurance plans" ON public.insurance_plans
  FOR SELECT USING (is_active = true OR auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Vendors manage own insurance plans" ON public.insurance_plans
  FOR ALL TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER insurance_plans_updated_at BEFORE UPDATE ON public.insurance_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Ticket services table
CREATE TABLE public.ticket_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  route_type TEXT NOT NULL,
  airlines_supported JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_fee_pkr INTEGER NOT NULL,
  refundable BOOLEAN NOT NULL DEFAULT false,
  sample_routes JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ticket_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_services TO authenticated;
GRANT ALL ON public.ticket_services TO service_role;
ALTER TABLE public.ticket_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ticket services" ON public.ticket_services
  FOR SELECT USING (is_active = true OR auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Vendors manage own ticket services" ON public.ticket_services
  FOR ALL TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = vendor_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER ticket_services_updated_at BEFORE UPDATE ON public.ticket_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Extend leads for polymorphic references
ALTER TABLE public.leads
  ADD COLUMN service_type public.service_type NOT NULL DEFAULT 'tours',
  ADD COLUMN service_id UUID,
  ADD COLUMN status public.service_lead_status NOT NULL DEFAULT 'new',
  ADD COLUMN notes TEXT;

-- Make tour_id nullable (needed for non-tour leads); existing tour leads keep values
ALTER TABLE public.leads ALTER COLUMN tour_id DROP NOT NULL;

-- Backfill service_id for existing tour leads
UPDATE public.leads SET service_id = tour_id WHERE service_type = 'tours' AND service_id IS NULL;

-- Validation trigger: enforce service_id points at correct table
CREATE OR REPLACE FUNCTION public.validate_service_lead_ref()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.service_type = 'tours' THEN
    IF NEW.service_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.tours WHERE id = NEW.service_id) THEN
      RAISE EXCEPTION 'Invalid tour reference';
    END IF;
    NEW.tour_id := NEW.service_id;
  ELSIF NEW.service_type = 'visa' THEN
    IF NEW.service_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.visa_services WHERE id = NEW.service_id) THEN
      RAISE EXCEPTION 'Invalid visa service reference';
    END IF;
    NEW.tour_id := NULL;
  ELSIF NEW.service_type = 'insurance' THEN
    IF NEW.service_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.insurance_plans WHERE id = NEW.service_id) THEN
      RAISE EXCEPTION 'Invalid insurance plan reference';
    END IF;
    NEW.tour_id := NULL;
  ELSIF NEW.service_type = 'tickets' THEN
    IF NEW.service_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.ticket_services WHERE id = NEW.service_id) THEN
      RAISE EXCEPTION 'Invalid ticket service reference';
    END IF;
    NEW.tour_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_service_lead_ref_trg
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_lead_ref();

-- Helper: set vendor_id from service_id for non-tour leads at capture time
CREATE OR REPLACE FUNCTION public.resolve_lead_vendor()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.vendor_id IS NULL THEN
    IF NEW.service_type = 'tours' THEN
      SELECT vendor_id INTO NEW.vendor_id FROM public.tours WHERE id = NEW.service_id;
    ELSIF NEW.service_type = 'visa' THEN
      SELECT vendor_id INTO NEW.vendor_id FROM public.visa_services WHERE id = NEW.service_id;
    ELSIF NEW.service_type = 'insurance' THEN
      SELECT vendor_id INTO NEW.vendor_id FROM public.insurance_plans WHERE id = NEW.service_id;
    ELSIF NEW.service_type = 'tickets' THEN
      SELECT vendor_id INTO NEW.vendor_id FROM public.ticket_services WHERE id = NEW.service_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER resolve_lead_vendor_trg
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.resolve_lead_vendor();

-- Allow public (anon + authenticated customers) to INSERT leads
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Indexes for lead lookups
CREATE INDEX IF NOT EXISTS leads_service_idx ON public.leads (service_type, service_id);
CREATE INDEX IF NOT EXISTS visa_services_active_idx ON public.visa_services (is_active, country);
CREATE INDEX IF NOT EXISTS insurance_plans_active_idx ON public.insurance_plans (is_active, coverage_type);
CREATE INDEX IF NOT EXISTS ticket_services_active_idx ON public.ticket_services (is_active, route_type);


-- ==========================================
-- Migration: 20260724115324_418ad005-d255-41fd-bdd8-5fcd8843aab5.sql
-- ==========================================

-- Prevent RPC-callable exposure of trigger helpers
REVOKE EXECUTE ON FUNCTION public.validate_service_lead_ref() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_lead_vendor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten leads INSERT policy: require a service reference (trigger validates existence)
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    service_id IS NOT NULL
    AND customer_name IS NOT NULL
    AND customer_phone IS NOT NULL
    AND length(customer_name) BETWEEN 2 AND 120
    AND length(customer_phone) BETWEEN 6 AND 30
  );


-- ==========================================
-- Migration: 20260724124249_fc8a078c-7b4d-463f-b16e-96ee1048905e.sql
-- ==========================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
UPDATE public.profiles SET city = 'Lahore' WHERE city IS NULL AND email = 'vendor.demo@globetrek.pk';


-- ==========================================
-- Migration: 20260724131621_a613f1e1-126d-4f41-8fa9-51ff4566420d.sql
-- ==========================================

-- Marketplace SELECT policies must not call has_role() under the anon role
-- (has_role is granted EXECUTE only to authenticated). Split into a purely
-- public "active rows" policy + an authenticated "owner/admin" policy.

DROP POLICY IF EXISTS "Public can view active visa services" ON public.visa_services;
DROP POLICY IF EXISTS "Public can view active insurance plans" ON public.insurance_plans;
DROP POLICY IF EXISTS "Public can view active ticket services" ON public.ticket_services;

CREATE POLICY "Anyone can view active visa services"
  ON public.visa_services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Vendors and admins view own visa services"
  ON public.visa_services FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active insurance plans"
  ON public.insurance_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Vendors and admins view own insurance plans"
  ON public.insurance_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active ticket services"
  ON public.ticket_services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Vendors and admins view own ticket services"
  ON public.ticket_services FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id OR public.has_role(auth.uid(), 'admin'::app_role));


-- ==========================================
-- Migration: 20260724185148_1fcc063f-630e-44bf-8f17-707ecaa044e7.sql
-- ==========================================

-- Payments ledger
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR',
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payments(owner_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Vendors view payments for their tours" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.tours t ON t.id = b.tour_id
      WHERE b.id = payments.booking_id AND t.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Payment gateway settings (admin toggle)
CREATE TABLE IF NOT EXISTS public.payment_gateway_settings (
  provider TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_gateway_settings TO anon, authenticated;
GRANT ALL ON public.payment_gateway_settings TO service_role;

ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gateway settings" ON public.payment_gateway_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage gateway settings" ON public.payment_gateway_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_gateway_settings_set_updated_at
  BEFORE UPDATE ON public.payment_gateway_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_gateway_settings (provider, enabled)
VALUES ('safepay', false)
ON CONFLICT (provider) DO NOTHING;


