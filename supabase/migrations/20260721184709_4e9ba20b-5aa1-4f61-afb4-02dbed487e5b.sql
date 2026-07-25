REVOKE EXECUTE ON FUNCTION public.unlock_lead(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_lead(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;