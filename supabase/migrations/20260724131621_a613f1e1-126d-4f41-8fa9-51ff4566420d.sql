
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
