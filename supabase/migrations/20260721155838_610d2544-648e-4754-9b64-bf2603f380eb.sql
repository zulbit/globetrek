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