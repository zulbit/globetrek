
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS requirements jsonb,
  ADD COLUMN IF NOT EXISTS accommodation jsonb,
  ADD COLUMN IF NOT EXISTS extra_notes text;
