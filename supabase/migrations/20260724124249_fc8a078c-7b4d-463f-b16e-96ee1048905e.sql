
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
UPDATE public.profiles SET city = 'Lahore' WHERE city IS NULL AND email = 'vendor.demo@globetrek.pk';
