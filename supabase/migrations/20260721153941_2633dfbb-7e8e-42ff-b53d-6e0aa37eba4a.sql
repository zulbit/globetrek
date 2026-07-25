
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
