#!/usr/bin/env node
/**
 * seed-sessions-planetary.mjs
 *
 * Seeds:
 *   1. 5 clients with birth dates calculated to trigger planetary returns
 *      within the next 30 days (Saturn, Jupiter, Mars).
 *   2. client_diviners links for each client.
 *   3. Bookings spread across the next 90 days (confirmed + pending sessions).
 *
 * Target: test-diviner-2 (user_id 99cbfaa5-35c0-4244-b703-189dd4decc69,
 *                          diviner_id c10a225f-51f5-441f-ad0c-1487fe576b43)
 *
 * Idempotent — cleans up seeded records before re-inserting.
 *
 * Run: node scripts/seed-sessions-planetary.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ─── Env ──────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env vars");

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const DIVINER_ID = "c10a225f-51f5-441f-ad0c-1487fe576b43";
const DIVINER_USER_ID = "99cbfaa5-35c0-4244-b703-189dd4decc69";

/**
 * Birth dates pre-computed so that each client has a planetary return within
 * the next 30 days from April 15, 2026:
 *
 * Emma Richardson  1996-11-15  → 1st Saturn Return  in ~16 days  (~May 1)
 * Marcus Chen      2002-08-10  → 2nd Jupiter Return in ~16 days  (~May 1)
 * Priya Sharma     1990-10-01  → 3rd Jupiter Return in ~18 days  (~May 3)
 * Sophia Williams  2018-10-20  → 4th Mars Return    in ~14 days  (~Apr 29)
 * James O'Brien    2016-12-01  → 5th Mars Return    in ~14 days  (~Apr 29)
 */
const SEED_CLIENTS = [
  {
    email: "seed.emma.richardson@test-diviner.invalid",
    full_name: "Emma Richardson",
    birth_date: "1996-11-15",
    birth_city: "Edinburgh, UK",
    phone: "+447700900001",
  },
  {
    email: "seed.marcus.chen@test-diviner.invalid",
    full_name: "Marcus Chen",
    birth_date: "2002-08-10",
    birth_city: "Singapore",
    phone: "+6591234567",
  },
  {
    email: "seed.priya.sharma@test-diviner.invalid",
    full_name: "Priya Sharma",
    birth_date: "1990-10-01",
    birth_city: "Mumbai, India",
    phone: "+919876543210",
  },
  {
    email: "seed.sophia.williams@test-diviner.invalid",
    full_name: "Sophia Williams",
    birth_date: "2018-10-20",
    birth_city: "Melbourne, Australia",
    phone: "+61412345678",
  },
  {
    email: "seed.james.obrien@test-diviner.invalid",
    full_name: "James O'Brien",
    birth_date: "2016-12-01",
    birth_city: "Dublin, Ireland",
    phone: "+353861234567",
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function sessionAt(daysAhead, hour = 10) {
  const d = daysFromNow(daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== seed-sessions-planetary ===\n");

  // 1. Ensure a service exists for this diviner
  // ──────────────────────────────────────────
  console.log("1. Ensuring service exists…");

  const { data: existingServices } = await sb
    .from("services")
    .select("id, name")
    .eq("diviner_id", DIVINER_ID)
    .eq("is_active", true)
    .limit(1);

  let serviceId;
  let serviceName;
  let servicePrice;
  let serviceDuration;

  if (existingServices && existingServices.length > 0) {
    serviceId = existingServices[0].id;
    serviceName = existingServices[0].name;
    console.log(`   ✓ Using existing service: "${serviceName}" (${serviceId})`);

    // Fetch full details
    const { data: svc } = await sb
      .from("services")
      .select("base_price, duration_minutes")
      .eq("id", serviceId)
      .single();
    servicePrice = svc?.base_price ?? 150;
    serviceDuration = svc?.duration_minutes ?? 60;
  } else {
    // Create a seed service
    const { data: newSvc, error: svcErr } = await sb
      .from("services")
      .insert({
        diviner_id: DIVINER_ID,
        category: "astrology",
        name: "Natal Chart Reading",
        slug: "natal-chart-reading",
        description: "A comprehensive natal chart reading covering your sun, moon, rising and all major planetary placements.",
        duration_minutes: 60,
        base_price: 150.00,
        is_active: true,
        is_primary: true,
        sort_order: 1,
      })
      .select("id")
      .single();

    if (svcErr) throw new Error(`Service insert failed: ${svcErr.message}`);
    serviceId = newSvc.id;
    serviceName = "Natal Chart Reading";
    servicePrice = 150;
    serviceDuration = 60;
    console.log(`   ✓ Created service: "${serviceName}" (${serviceId})`);
  }

  // 2. Clean up previous seed clients
  // ──────────────────────────────────
  console.log("\n2. Cleaning up previous seed clients…");
  const seedEmails = SEED_CLIENTS.map((c) => c.email);

  // Find existing auth users with seed emails
  const { data: existingAuthUsers } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const toDelete = (existingAuthUsers?.users ?? []).filter((u) =>
    seedEmails.includes(u.email)
  );
  for (const u of toDelete) {
    await sb.auth.admin.deleteUser(u.id);
    console.log(`   ✗ Deleted auth user: ${u.email}`);
  }

  // 3. Create clients
  // ─────────────────
  console.log("\n3. Creating clients…");
  const clientIds = [];

  for (const c of SEED_CLIENTS) {
    // Create auth user
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: c.email,
      password: "SeedPass123!",
      email_confirm: true,
      user_metadata: { full_name: c.full_name },
    });

    if (authErr) throw new Error(`Auth user creation failed for ${c.email}: ${authErr.message}`);
    const authUserId = authData.user.id;

    // Create client record
    const { data: clientData, error: clientErr } = await sb
      .from("clients")
      .insert({
        user_id: authUserId,
        email: c.email,
        full_name: c.full_name,
        phone: c.phone,
        birth_date: c.birth_date,
        birth_city: c.birth_city,
      })
      .select("id")
      .single();

    if (clientErr) throw new Error(`Client insert failed for ${c.email}: ${clientErr.message}`);
    clientIds.push({ clientId: clientData.id, authUserId, ...c });
    console.log(`   ✓ Client: ${c.full_name} (birth: ${c.birth_date})`);
  }

  // 4. Create client_diviners links
  // ─────────────────────────────────
  console.log("\n4. Linking clients to diviner…");

  for (const { clientId, full_name } of clientIds) {
    const { error } = await sb.from("client_diviners").upsert(
      {
        client_id: clientId,
        diviner_id: DIVINER_ID,
        total_sessions: Math.floor(Math.random() * 5) + 1,
        total_spent: (Math.floor(Math.random() * 5) + 1) * 150,
        first_session_at: daysFromNow(-Math.floor(Math.random() * 180)).toISOString(),
      },
      { onConflict: "client_id,diviner_id" }
    );
    if (error) throw new Error(`client_diviners upsert failed: ${error.message}`);
    console.log(`   ✓ Linked: ${full_name}`);
  }

  // 5. Clean up previous seed bookings
  // ────────────────────────────────────
  console.log("\n5. Cleaning up previous seed bookings…");
  const clientIdList = clientIds.map((c) => c.clientId);
  const { error: delBookErr } = await sb
    .from("bookings")
    .delete()
    .in("client_id", clientIdList);
  if (delBookErr) console.warn("   ⚠ Could not delete old bookings:", delBookErr.message);
  else console.log("   ✓ Cleared old seed bookings");

  // 6. Seed bookings — next 90 days
  // ──────────────────────────────────
  console.log("\n6. Seeding bookings across 90 days…");

  // Sessions spread: 2-3 per week, varied clients, varied times
  // Covers today (Apr 15) through Jul 14, 2026
  const schedule = [
    // Week 1 (today)
    { daysAhead: 0,  hour: 10, clientIdx: 0, status: "confirmed" },
    { daysAhead: 2,  hour: 14, clientIdx: 1, status: "confirmed" },
    { daysAhead: 4,  hour: 11, clientIdx: 2, status: "confirmed" },
    // Week 2
    { daysAhead: 7,  hour: 10, clientIdx: 3, status: "confirmed" },
    { daysAhead: 9,  hour: 15, clientIdx: 4, status: "confirmed" },
    { daysAhead: 11, hour: 10, clientIdx: 0, status: "confirmed" },
    // Week 3
    { daysAhead: 14, hour: 11, clientIdx: 1, status: "confirmed" },
    { daysAhead: 16, hour: 14, clientIdx: 2, status: "pending"   },
    // Week 4
    { daysAhead: 21, hour: 10, clientIdx: 3, status: "confirmed" },
    { daysAhead: 23, hour: 11, clientIdx: 4, status: "pending"   },
    { daysAhead: 25, hour: 15, clientIdx: 0, status: "confirmed" },
    // Week 5-6
    { daysAhead: 28, hour: 10, clientIdx: 1, status: "confirmed" },
    { daysAhead: 32, hour: 14, clientIdx: 2, status: "pending"   },
    { daysAhead: 35, hour: 11, clientIdx: 3, status: "confirmed" },
    // Week 7-8
    { daysAhead: 38, hour: 10, clientIdx: 4, status: "confirmed" },
    { daysAhead: 42, hour: 14, clientIdx: 0, status: "pending"   },
    { daysAhead: 45, hour: 11, clientIdx: 1, status: "confirmed" },
    // Week 9-10
    { daysAhead: 49, hour: 10, clientIdx: 2, status: "confirmed" },
    { daysAhead: 52, hour: 15, clientIdx: 3, status: "pending"   },
    { daysAhead: 56, hour: 10, clientIdx: 4, status: "confirmed" },
    // Week 11-12
    { daysAhead: 60, hour: 11, clientIdx: 0, status: "confirmed" },
    { daysAhead: 63, hour: 14, clientIdx: 1, status: "pending"   },
    { daysAhead: 67, hour: 10, clientIdx: 2, status: "confirmed" },
    // Week 13
    { daysAhead: 70, hour: 11, clientIdx: 3, status: "confirmed" },
    { daysAhead: 74, hour: 14, clientIdx: 4, status: "pending"   },
    // Week 14-15 (approaching 90-day mark)
    { daysAhead: 77, hour: 10, clientIdx: 0, status: "confirmed" },
    { daysAhead: 81, hour: 15, clientIdx: 1, status: "confirmed" },
    { daysAhead: 84, hour: 11, clientIdx: 2, status: "pending"   },
    { daysAhead: 88, hour: 10, clientIdx: 3, status: "confirmed" },
  ];

  const bookings = schedule.map(({ daysAhead, hour, clientIdx, status }) => {
    const client = clientIds[clientIdx];
    return {
      diviner_id: DIVINER_ID,
      client_id: client.clientId,
      service_id: serviceId,
      status,
      scheduled_at: sessionAt(daysAhead, hour),
      duration_minutes: serviceDuration,
      base_price: servicePrice,
      total_amount: servicePrice,
    };
  });

  const { error: bookErr } = await sb.from("bookings").insert(bookings);
  if (bookErr) throw new Error(`Bookings insert failed: ${bookErr.message}`);
  console.log(`   ✓ Inserted ${bookings.length} bookings (next 90 days)`);
  console.log(`     Today (daysAhead=0): ${schedule.filter(s => s.daysAhead === 0).length} session(s)`);
  console.log(`     Confirmed: ${schedule.filter(s => s.status === "confirmed").length}`);
  console.log(`     Pending:   ${schedule.filter(s => s.status === "pending").length}`);

  // 7. Summary
  // ──────────
  console.log("\n=== DONE ===");
  console.log("\nPlanetary Returns (visible in widget within 30 days):");
  console.log("  Emma Richardson  (1996-11-15) → 1st Saturn Return  ~16 days");
  console.log("  Marcus Chen      (2002-08-10) → 2nd Jupiter Return ~16 days");
  console.log("  Priya Sharma     (1990-10-01) → 3rd Jupiter Return ~18 days");
  console.log("  Sophia Williams  (2018-10-20) → 4th Mars Return    ~14 days");
  console.log("  James O'Brien    (2016-12-01) → 5th Mars Return    ~14 days");
  console.log("\nToday's Sessions: 1 session seeded for today");
  console.log("Bookings total: 29 sessions across 90 days");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
