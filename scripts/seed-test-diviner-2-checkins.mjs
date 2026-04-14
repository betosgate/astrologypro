/**
 * Fix: seed check_ins for @test-diviner-2
 * Previous run failed because the full check-in object (including `days_ago`)
 * was spread directly into the insert payload.
 *
 * Run: node scripts/seed-test-diviner-2-checkins.mjs
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

const DIVINER_ID = "c10a225f-51f5-441f-ad0c-1487fe576b43"; // test-diviner-2

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const CHECK_INS = [
  { first_name: "Amara",    last_name: "Diallo",    email: "amara.diallo@gmail.com",    birth_date: "1990-06-15", birth_city: "Lagos",        birth_time: "08:30", days_ago: 1 },
  { first_name: "Kieran",   last_name: "Murphy",    email: "kieran.murphy@outlook.com", birth_date: "1985-11-03", birth_city: "Dublin",       birth_time: "14:15", days_ago: 2 },
  { first_name: "Valentina",last_name: "Cruz",      email: "valentina.cruz@gmail.com",  birth_date: "1993-03-22", birth_city: "Bogotá",       birth_time: "06:00", days_ago: 3 },
  { first_name: "Noah",     last_name: "Steinberg", email: "noah.steinberg@gmail.com",  birth_date: "1988-09-07", birth_city: "Tel Aviv",     birth_time: "21:45", days_ago: 4 },
  { first_name: "Isla",     last_name: "McKay",     email: "isla.mckay@icloud.com",     birth_date: "1996-12-30", birth_city: "Edinburgh",    birth_time: "03:20", days_ago: 5 },
  { first_name: "Kwame",    last_name: "Asante",    email: "kwame.asante@gmail.com",    birth_date: "1982-07-19", birth_city: "Accra",        birth_time: "11:00", days_ago: 6 },
  { first_name: "Marisol",  last_name: "Vega",      email: "marisol.vega@gmail.com",    birth_date: "1991-04-02", birth_city: "Mexico City",  birth_time: "16:30", days_ago: 7 },
];

async function seedCheckIns() {
  console.log("→ Seeding check_ins for test-diviner-2 …");

  // Only insert the columns that exist on the table
  const rows = CHECK_INS.map((c) => ({
    diviner_id: DIVINER_ID,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    birth_date: c.birth_date,
    birth_city: c.birth_city,
    birth_time: c.birth_time,
    created_at: daysAgo(c.days_ago),
  }));

  const { error } = await supabase.from("check_ins").insert(rows);
  if (error) {
    console.error("  ✗", error.message);
  } else {
    console.log(`  ✓ ${rows.length} check_ins inserted`);
  }
}

async function main() {
  console.log("=== Seeding check_ins for @test-diviner-2 ===\n");
  await seedCheckIns();
  console.log("\n=== Done ===");
}
main().catch(console.error);
