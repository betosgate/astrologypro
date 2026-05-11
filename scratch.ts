import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, status, stripe_payment_intent_id, ref_code, commission_source_campaign_id')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Error:', error);
  console.log('Recent bookings:', bookings);
}

check().catch(console.error);
