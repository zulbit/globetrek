
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
