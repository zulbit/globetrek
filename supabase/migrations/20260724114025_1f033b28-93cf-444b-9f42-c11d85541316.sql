ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'starter' BEFORE 'pro';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'agency' AFTER 'pro';