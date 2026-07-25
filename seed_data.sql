-- Seed Data SQL Script for GlobeTrek.pk (rcldabxkcwfemnigwutk)

-- 1. Insert dummy/seed auth users into Supabase auth.users table first
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES
  ('1f985a36-facf-4e14-bbac-cb9dec2efbfe', '00000000-0000-0000-0000-000000000000', 'customer.demo@globetrek.pk', '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Traveler","role":"customer"}', '2026-07-21 15:59:01.545206+00', '2026-07-21 15:59:01.545206+00', 'authenticated', 'authenticated'),
  ('ce083b9c-d6d3-46b4-827a-2bd3a569e978', '00000000-0000-0000-0000-000000000000', 'admin.demo@globetrek.pk', '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"GlobeTrek Admin","role":"admin"}', '2026-07-23 21:36:40.042253+00', '2026-07-23 21:36:41.046994+00', 'authenticated', 'authenticated'),
  ('b4d084bb-566d-49b6-8439-bc8b47886bbf', '00000000-0000-0000-0000-000000000000', 'vendor.demo@globetrek.pk', '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Vendor","company_name":"GlobeTrek Demo Tours","role":"vendor"}', '2026-07-21 15:59:59.870181+00', '2026-07-24 12:42:54.041938+00', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2. Update profiles table with subscription and extra metadata
INSERT INTO public.profiles (id, email, full_name, company_name, vendor_status, created_at, updated_at, subscription_tier, lead_credits_balance, vendor_services, city)
VALUES
  ('1f985a36-facf-4e14-bbac-cb9dec2efbfe', 'customer.demo@globetrek.pk', 'Demo Traveler', NULL, 'approved', '2026-07-21 15:59:01.545206+00', '2026-07-21 15:59:01.545206+00', 'free', 3, '{"tours"}', NULL),
  ('ce083b9c-d6d3-46b4-827a-2bd3a569e978', 'admin.demo@globetrek.pk', 'GlobeTrek Admin', NULL, 'approved', '2026-07-23 21:36:40.042253+00', '2026-07-23 21:36:41.046994+00', 'free', 3, '{"tours"}', NULL),
  ('b4d084bb-566d-49b6-8439-bc8b47886bbf', 'vendor.demo@globetrek.pk', 'Demo Vendor', 'GlobeTrek Demo Tours', 'approved', '2026-07-21 15:59:59.870181+00', '2026-07-24 12:42:54.041938+00', 'starter', 4, '{"tours","visa","insurance","tickets"}', 'Lahore')
ON CONFLICT (id) DO UPDATE SET
  vendor_status = EXCLUDED.vendor_status,
  subscription_tier = EXCLUDED.subscription_tier,
  lead_credits_balance = EXCLUDED.lead_credits_balance,
  vendor_services = EXCLUDED.vendor_services,
  city = EXCLUDED.city;

-- 3. User Roles
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('ce083b9c-d6d3-46b4-827a-2bd3a569e978', 'admin'),
  ('b4d084bb-566d-49b6-8439-bc8b47886bbf', 'vendor'),
  ('1f985a36-facf-4e14-bbac-cb9dec2efbfe', 'customer')
ON CONFLICT DO NOTHING;

-- 4. Tours
INSERT INTO public.tours (id, vendor_id, title, description, destination_country, departure_city, duration_days, price_pkr, total_seats, image_url, is_active, created_at, updated_at)
VALUES
  ('0c7c6f15-99ea-48eb-a9f4-feb4b525b510', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '7-Day Turkey Explorer (Istanbul & Cappadocia)', 'Hot air balloons over Cappadocia, Bosphorus cruise in Istanbul, and Grand Bazaar shopping. Flights, 4-star hotels, and daily breakfast included.', 'Turkey', 'LHE', 7, 285000, 20, NULL, true, '2026-07-21 16:00:14.541386+00', '2026-07-21 16:00:14.541386+00'),
  ('fcba171c-b65d-4ae6-a000-e98aa0fb59f9', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '5-Day Bangkok & Phuket Getaway', 'City tour of Bangkok, Phi Phi island hopping, and beachfront stay in Phuket. Return flights from Karachi included.', 'Thailand', 'KHI', 5, 195000, 24, NULL, true, '2026-07-21 16:00:14.541386+00', '2026-07-21 16:00:14.541386+00'),
  ('94fa17a9-2c23-4f55-b402-ce48c0553efa', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '10-Day Grand Europe Tour', 'Paris, Interlaken, Venice, and Rome — the classic four-country loop.', 'Europe', 'Islamabad', 10, 850000, 16, NULL, true, '2026-07-21 16:16:03.698048+00', '2026-07-21 16:16:03.698048+00'),
  ('db779cd1-36b2-45ed-b3da-857cf3c495ef', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '4-Day Dubai City Break', 'Burj Khalifa, desert safari and Old Dubai in a quick long-weekend escape.', 'UAE', 'Karachi', 4, 165000, 25, NULL, true, '2026-07-21 18:17:46.029597+00', '2026-07-21 18:17:46.029597+00'),
  ('4752e217-4f98-4d72-a953-7bb40839bcde', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '5-Day Singapore Family Fun', 'Universal Studios, S.E.A. Aquarium and Gardens by the Bay — built for families.', 'Singapore', 'Lahore', 5, 285000, 20, NULL, true, '2026-07-21 18:17:46.029597+00', '2026-07-21 18:17:46.029597+00'),
  ('a8d52e03-1e27-44a8-a495-82217c752ac6', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '7-Day Vietnam: Hanoi & Halong Bay', 'Old Quarter street food, an overnight junk cruise and lantern-lit Hoi An.', 'Vietnam', 'Islamabad', 7, 245000, 18, NULL, true, '2026-07-21 18:17:46.029597+00', '2026-07-21 18:17:46.029597+00'),
  ('de994f77-2489-47f0-929a-2ffb9d160ed9', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '6-Day Malaysia: KL & Langkawi', 'Petronas Towers, Batu Caves and island hopping around Langkawi.', 'Malaysia', 'Karachi', 6, 215000, 22, NULL, true, '2026-07-21 18:17:46.029597+00', '2026-07-21 18:17:46.029597+00'),
  ('5253eb91-0429-4dca-bef5-6a07570c675c', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '8-Day UK: London & Edinburgh', 'Royal London, Windsor, Edinburgh Castle and a Scottish Highlands day trip.', 'UK', 'Islamabad', 8, 585000, 15, NULL, true, '2026-07-21 18:17:46.029597+00', '2026-07-21 18:17:46.029597+00'),
  ('462916c5-5fab-4aa4-afd8-2e808a046fdf', 'b4d084bb-566d-49b6-8439-bc8b47886bbf', '5 Days USA ', '4 Nights in Los Angeles', 'USA', 'Karachi', 5, 150000, 20, NULL, true, '2026-07-24 09:35:07.303177+00', '2026-07-24 09:35:07.303177+00')
ON CONFLICT (id) DO NOTHING;
