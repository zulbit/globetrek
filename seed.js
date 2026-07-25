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
}

seed();
