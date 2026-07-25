
-- 1. app_role enum + status enum
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'customer');
CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'banned');

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  company_name TEXT,
  vendor_status public.vendor_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. has_role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5. current_user_role helper (returns highest role)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'vendor' THEN 2 ELSE 3 END
  LIMIT 1;
$$;

-- 6. profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. user_roles policies
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. tours
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  destination_country TEXT NOT NULL,
  departure_city TEXT NOT NULL DEFAULT 'Karachi',
  duration_days INT NOT NULL DEFAULT 5,
  price_pkr BIGINT NOT NULL CHECK (price_pkr >= 0),
  total_seats INT NOT NULL DEFAULT 20,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active tours are public"
  ON public.tours FOR SELECT USING (is_active = true OR vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors insert own tours"
  ON public.tours FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors update own tours"
  ON public.tours FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid()) WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Vendors delete own tours"
  ON public.tours FOR DELETE TO authenticated
  USING (vendor_id = auth.uid());
CREATE POLICY "Admins manage all tours"
  ON public.tours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guests INT NOT NULL DEFAULT 1 CHECK (guests > 0),
  total_pkr BIGINT NOT NULL CHECK (total_pkr >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND t.vendor_id = auth.uid())
  );
CREATE POLICY "Customers create own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins manage bookings"
  ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Auto-provision profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
          CASE WHEN _role = 'vendor' THEN 'pending' ELSE 'approved' END);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tours_updated BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
