
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
