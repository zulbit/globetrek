-- Migration: 20230803000000_vendor_guide_sections.sql

CREATE TABLE IF NOT EXISTS public.vendor_guide_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  icon_name TEXT DEFAULT 'BookOpen',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendor_guide_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to vendor_guide_sections" ON public.vendor_guide_sections;
DROP POLICY IF EXISTS "Allow admin write access to vendor_guide_sections" ON public.vendor_guide_sections;

-- Create policies
CREATE POLICY "Allow public read access to vendor_guide_sections" ON public.vendor_guide_sections
  FOR SELECT TO public USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow admin write access to vendor_guide_sections" ON public.vendor_guide_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at_vendor_guide()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vendor_guide_updated_at ON public.vendor_guide_sections;
CREATE TRIGGER set_vendor_guide_updated_at
  BEFORE UPDATE ON public.vendor_guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_vendor_guide();
