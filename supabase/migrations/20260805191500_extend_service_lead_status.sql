-- Migration to add 'converted' and 'closed' values to public.service_lead_status ENUM
ALTER TYPE public.service_lead_status ADD VALUE IF NOT EXISTS 'converted';
ALTER TYPE public.service_lead_status ADD VALUE IF NOT EXISTS 'closed';
