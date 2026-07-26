import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL="([^"]+)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);

if (!urlMatch || !keyMatch) {
  console.error('Could not parse .env file');
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);
const backup = JSON.parse(fs.readFileSync('lovable_supabase_backup.json', 'utf8'));

async function seed() {
  console.log('Seeding profiles...');
  for (const prof of backup.profiles) {
    const { error } = await supabase.from('profiles').upsert(prof);
    if (error) console.error('Error profile:', prof.email, error.message);
    else console.log('Seeded profile:', prof.email);
  }

  console.log('Seeding tours...');
  for (const tour of backup.tours) {
    const { error } = await supabase.from('tours').upsert(tour);
    if (error) console.error('Error tour:', tour.title, error.message);
    else console.log('Seeded tour:', tour.title);
  }

  const visaServices = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      country: 'UAE',
      visa_type: 'Tourist Visa',
      processing_days: 3,
      price_pkr: 35000,
      service_fee_pkr: 5000,
      success_rate: 99,
      description: '30-day UAE tourist visa with express 72-hour processing. Great for Dubai stopovers and family visits.',
      is_active: true,
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      country: 'Saudi Arabia',
      visa_type: 'Umrah Visa',
      processing_days: 5,
      price_pkr: 45000,
      service_fee_pkr: 7500,
      success_rate: 99,
      description: 'Umrah visa issuance bundled with Makkah/Madinah hotel confirmation and ground transport advisory.',
      is_active: true,
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      country: 'Turkey',
      visa_type: 'Tourist Visa',
      processing_days: 7,
      price_pkr: 28000,
      service_fee_pkr: 4000,
      success_rate: 97,
      description: 'Fast-track e-visa filing for Turkey with document review and appointment booking.',
      is_active: true,
    },
  ];

  console.log('Seeding visa services...');
  for (const visa of visaServices) {
    const { error } = await supabase.from('visa_services').upsert(visa);
    if (error) console.error('Error visa:', visa.country, error.message);
    else console.log('Seeded visa:', visa.country);
  }

  const insurancePlans = [
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      plan_name: 'Schengen Standard Shield',
      coverage_type: 'Schengen',
      coverage_amount_pkr: 15000000,
      duration_days: 30,
      price_pkr: 8500,
      description: 'Comprehensive Schengen visa compliant travel insurance covering medical emergencies up to €30,000.',
      is_active: true,
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      plan_name: 'Worldwide Family Protection',
      coverage_type: 'Worldwide',
      coverage_amount_pkr: 25000000,
      duration_days: 15,
      price_pkr: 12500,
      description: 'Global family protection plan including baggage loss, flight delays, and emergency medical evacuation.',
      is_active: true,
    },
  ];

  console.log('Seeding insurance plans...');
  for (const plan of insurancePlans) {
    const { error } = await supabase.from('insurance_plans').upsert(plan);
    if (error) console.error('Error insurance plan:', plan.plan_name, error.message);
    else console.log('Seeded insurance plan:', plan.plan_name);
  }

  const ticketServices = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      service_name: 'Express International Flight Desk',
      route_type: 'International',
      airlines_supported: ['PIA', 'Emirates', 'Qatar Airways', 'FlyDubai'],
      service_fee_pkr: 3500,
      refundable: true,
      description: 'Priority ticketing desk for international flights from Lahore, Karachi & Islamabad.',
      is_active: true,
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      vendor_id: 'b4d084bb-566d-49b6-8439-bc8b47886bbf',
      service_name: 'Umrah & Hajj Flight Booking',
      route_type: 'Umrah',
      airlines_supported: ['PIA', 'Saudi Arabian Airlines', 'Airblue'],
      service_fee_pkr: 4000,
      refundable: true,
      description: 'Dedicated Umrah flight booking service with group discounts and baggage allowance.',
      is_active: true,
    },
  ];

  console.log('Seeding ticket services...');
  for (const ticket of ticketServices) {
    const { error } = await supabase.from('ticket_services').upsert(ticket);
    if (error) console.error('Error ticket service:', ticket.service_name, error.message);
    else console.log('Seeded ticket service:', ticket.service_name);
  }
}

seed();
