-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL,
  recipient TEXT NOT NULL DEFAULT 'Traveler',
  image_url TEXT,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read whatsapp_templates" ON public.whatsapp_templates
  FOR SELECT USING (true);

-- Allow authenticated admins / service role full write access
CREATE POLICY "Admins manage whatsapp_templates" ON public.whatsapp_templates
  FOR ALL USING (true) WITH CHECK (true);
