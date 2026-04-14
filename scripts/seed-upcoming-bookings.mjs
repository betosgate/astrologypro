/**
 * seed-upcoming-bookings.mjs
 *
 * Seeds 30 upcoming bookings for the test diviner (cosmic-aura).
 * Spread across the next 60 days, mix of confirmed/pending statuses.
 * Also upserts client_diviners for newly added clients.
 *
 * Run: node scripts/seed-upcoming-bookings.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── 1. Resolve test diviner ───────────────────────────────────────────────
const { data: diviner, error: dErr } = await supabase
  .from("diviners")
  .select("id, user_id, username")
  .eq("username", "cosmic-aura")
  .maybeSingle();

if (dErr || !diviner) {
  console.error("❌ Could not find cosmic-aura diviner:", dErr?.message);
  process.exit(1);
}
const DIVINER_ID = diviner.id;
console.log(`✓ Diviner: ${diviner.username} (${DIVINER_ID})`);

// ─── 2. Fetch services ─────────────────────────────────────────────────────
const { data: services } = await supabase
  .from("services")
  .select("id, name, base_price, duration_minutes")
  .eq("diviner_id", DIVINER_ID)
  .eq("is_active", true)
  .limit(20);

if (!services?.length) {
  console.error("❌ No active services found for this diviner. Run the page seed first.");
  process.exit(1);
}
console.log(`✓ Services: ${services.map(s => s.name).join(", ")}`);

// ─── 3. Fetch clients ──────────────────────────────────────────────────────
const { data: clients } = await supabase
  .from("clients")
  .select("id, full_name, email")
  .limit(50);

if (!clients?.length) {
  console.error("❌ No clients found in the database.");
  process.exit(1);
}
console.log(`✓ Clients available: ${clients.length}`);

// ─── 4. Helpers ─────────────────────────────────────────────────────────────
function daysFromNow(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STATUSES = [
  "confirmed", "confirmed", "confirmed",   // 3x weight
  "pending",   "pending",                   // 2x weight
];

const HOURS = [9, 10, 11, 13, 14, 15, 16, 17];
const MINUTES = [0, 30];

// Build 30 upcoming bookings spread across next 60 days
const usedSlots = new Set();

const bookings = [];
let day = 1;
let attempts = 0;

while (bookings.length < 30 && attempts < 500) {
  attempts++;
  day = Math.floor(attempts / 3) + 1; // slowly advance day
  const hour = pick(HOURS);
  const minute = pick(MINUTES);
  const slot = `${day}-${hour}-${minute}`;
  if (usedSlots.has(slot)) continue;
  usedSlots.add(slot);

  const service = pick(services);
  const client = pick(clients);
  const status = pick(STATUSES);

  bookings.push({
    diviner_id: DIVINER_ID,
    owner_id: DIVINER_ID,
    client_id: client.id,
    service_id: service.id,
    status,
    scheduled_at: daysFromNow(day, hour, minute),
    duration_minutes: service.duration_minutes ?? 60,
    base_price: service.base_price ?? 100,
    total_amount: service.base_price ?? 100,
    overage_amount: 0,
  });
}

console.log(`\n→ Inserting ${bookings.length} upcoming bookings…`);

// ─── 5. Insert bookings in batches ─────────────────────────────────────────
const BATCH = 10;
let inserted = 0;
const insertedBookings = [];

for (let i = 0; i < bookings.length; i += BATCH) {
  const batch = bookings.slice(i, i + BATCH);
  const { data, error } = await supabase
    .from("bookings")
    .insert(batch)
    .select("id, client_id, scheduled_at, status");

  if (error) {
    console.error(`❌ Batch insert failed: ${error.message}`);
    process.exit(1);
  }
  inserted += batch.length;
  insertedBookings.push(...(data ?? []));
  console.log(`  Inserted ${inserted}/${bookings.length}`);
}

// ─── 6. Upsert client_diviners ──────────────────────────────────────────────
console.log("\n→ Updating client_diviners…");

const clientMap = new Map();
for (const b of bookings) {
  if (!clientMap.has(b.client_id)) {
    clientMap.set(b.client_id, { client_id: b.client_id, diviner_id: DIVINER_ID, owner_id: DIVINER_ID });
  }
}

const cdRows = Array.from(clientMap.values());
const { error: cdErr } = await supabase
  .from("client_diviners")
  .upsert(cdRows, { onConflict: "client_id,diviner_id", ignoreDuplicates: true });

if (cdErr) {
  console.warn(`⚠  client_diviners upsert: ${cdErr.message}`);
} else {
  console.log(`  Upserted ${cdRows.length} client_diviner relationships`);
}

console.log(`\n✅  Done — ${inserted} upcoming bookings created`);
console.log(`   Spread across days 1–${day} from today`);
console.log(`   Statuses: confirmed + pending mix`);
