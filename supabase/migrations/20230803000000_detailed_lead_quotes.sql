-- Migration: 20230803000000_detailed_lead_quotes.sql
-- Add detailed quote fields to lead_quotes table

ALTER TABLE public.lead_quotes
  ADD COLUMN IF NOT EXISTS hotel_details text,
  ADD COLUMN IF NOT EXISTS flight_details text,
  ADD COLUMN IF NOT EXISTS exclusions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terms_and_conditions text,
  ADD COLUMN IF NOT EXISTS perks text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS advance_deposit_percent integer DEFAULT 30;
