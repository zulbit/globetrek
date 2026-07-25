
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
