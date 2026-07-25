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