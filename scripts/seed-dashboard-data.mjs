#!/usr/bin/env node
/**
 * seed-dashboard-data.mjs
 *
 * Creates 3 fully-populated test accounts for QA across all dashboards:
 *
 *   Diviner  →  diviner.test@astrologypro.com  /  DivinerTest2026!
 *   Trainee  →  trainee.test@astrologypro.com  /  TraineeTest2026!
 *   Admin    →  admin.test@astrologypro.com    /  AdminTest2026!
 *   Client   →  client.test@astrologypro.com   /  ClientTest2026!
 *
 * Run: node scripts/seed-dashboard-data.mjs
 *
 * Pre-requisites:
 *   - seed-training.mjs must have been run first (training programs/lessons must exist)
 *   - seed.ts may have been run (existing diviners are fine — they contribute to admin KPIs)
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ─────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const BASE_HEADERS = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: "return=representation",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg)    { console.log(`  ${msg}`); }
function section(t)  { console.log(`\n── ${t} ${"─".repeat(Math.max(0, 50 - t.length))}`); }

function isoAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoFromNow(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Returns ISO string for the Nth-months-ago month, on the given day */
function isoMonth(monthsAgo, dayOfMonth = 15, hour = 10) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, dayOfMonth);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function rest(method, table, body, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = { method, headers: BASE_HEADERS };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`REST ${method} ${table}${query}: ${err}`);
  }
  if (method === "DELETE" || res.status === 204) return [];
  return res.json();
}

const insert    = (table, rows) => rest("POST",   table, rows);
const upsert    = (table, rows, on) => rest("POST", table, rows, `?on_conflict=${on}`);
const del       = (table, filter)  => rest("DELETE", table, undefined, `?${filter}`);
const select    = (table, query)   => rest("GET",    table, undefined, `?${query}`);
const selectOne = async (table, q) => { const rows = await select(table, q); return rows[0] ?? null; };

async function authUser(email, password) {
  const authHeaders = { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  // Try create
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (res.ok) { log(`✓ auth created: ${email}  (${data.id})`); return data.id; }
  // Already exists — look up by email filter
  const searchRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&page=1&per_page=50`,
    { headers: authHeaders }
  );
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    const users = searchData.users ?? searchData ?? [];
    const found = Array.isArray(users) ? users.find(u => u.email === email) : null;
    if (found) { log(`⏭  auth exists: ${email}  (${found.id})`); return found.id; }
  }
  // Fallback: page through all users
  for (let page = 1; page <= 10; page++) {
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: authHeaders }
    );
    if (!listRes.ok) break;
    const list = await listRes.json();
    const users = list.users ?? list ?? [];
    if (!Array.isArray(users) || users.length === 0) break;
    const found = users.find(u => u.email === email);
    if (found) { log(`⏭  auth exists: ${email}  (${found.id})`); return found.id; }
    if (users.length < 1000) break;
  }
  throw new Error(`Failed to create or find auth user ${email}: ${JSON.stringify(data)}`);
}

// ─── 0. Auth users ───────────────────────────────────────────────────────────
section("0. Auth users");

const [divinerUserId, traineeUserId, adminUserId, clientUserId] = await Promise.all([
  authUser("diviner.test@astrologypro.com", "DivinerTest2026!"),
  authUser("trainee.test@astrologypro.com", "TraineeTest2026!"),
  authUser("admin.test@astrologypro.com",   "AdminTest2026!"),
  authUser("client.test@astrologypro.com",  "ClientTest2026!"),
]);

// Extra clients (for admin KPI totals)
const extraClientEmails = [
  "alex.kumar@example.com","priya.sharma@example.com","james.wilson@example.com",
  "sofia.rodriguez@example.com","david.park@example.com","nina.patel@example.com",
  "carlos.mendez@example.com","lisa.nguyen@example.com","omar.hassan@example.com",
  "rachel.kim@example.com","ben.taylor@example.com","isabelle.martin@example.com",
];
const extraClientUserIds = [];
for (const em of extraClientEmails) {
  const id = await authUser(em, "ClientTest2026!");
  extraClientUserIds.push({ email: em, userId: id });
}

// Extra diviners (for admin KPI totals)
const extraDivinerDefs = [
  { email: "diviner.extra1@astrologypro.com", username: "aurora-mystic",    name: "Aurora Mystique" },
  { email: "diviner.extra2@astrologypro.com", username: "sol-oracle",       name: "Sol Oracle" },
  { email: "diviner.extra3@astrologypro.com", username: "celestine-reads",  name: "Celestine Reads" },
];
const extraDivinerUserIds = [];
for (const d of extraDivinerDefs) {
  const id = await authUser(d.email, "DivinerTest2026!");
  extraDivinerUserIds.push({ ...d, userId: id });
}

// Extra trainees (for admin KPI totals)
const extraTraineeDefs = [
  { email: "trainee.extra1@astrologypro.com", username: "novice-stargaze",  name: "Olivia Stargaze" },
  { email: "trainee.extra2@astrologypro.com", username: "apprentice-moon",  name: "Ethan Moonrise" },
];
const extraTraineeUserIds = [];
for (const t of extraTraineeDefs) {
  const id = await authUser(t.email, "TraineeTest2026!");
  extraTraineeUserIds.push({ ...t, userId: id });
}

// ─── 1. Admin user ───────────────────────────────────────────────────────────
section("1. Admin user");

await del("admin_users", `user_id=eq.${adminUserId}`);
await insert("admin_users", [{ user_id: adminUserId, email: "admin.test@astrologypro.com" }]);
log("✓ admin_users row created");

// ─── 2. Main diviner profile ─────────────────────────────────────────────────
section("2. Diviner profile");

await del("diviners", `user_id=eq.${divinerUserId}`);
const [diviner] = await insert("diviners", [{
  user_id:              divinerUserId,
  username:             "cosmic-aura",
  display_name:         "Cosmic Aura",
  bio:                  "With 12 years of practice in Vedic and Western astrology, Cosmic Aura brings depth and clarity to every chart reading. Specialising in natal charts, synastry, and solar return forecasts, she has guided over 800 clients through major life transitions. Every session is a blend of ancient cosmic wisdom and practical, actionable insight.",
  tagline:              "Your Stars. Your Story. Your Clarity.",
  specialties:          ["vedic-astrology", "western-astrology", "natal-chart", "synastry", "tarot"],
  timezone:             "America/Chicago",
  onboarding_completed: true,
  onboarding_step:      5,
  subscription_status:  "active",
  is_active:            true,
  is_certified:         true,
  created_at:           isoAgo(120),
}]);
const divinerId = diviner.id;
log(`✓ diviner "${diviner.display_name}" → ${divinerId}`);

// ─── 3. Extra diviner profiles (admin KPIs) ──────────────────────────────────
section("3. Extra diviners");

for (const d of extraDivinerUserIds) {
  await del("diviners", `user_id=eq.${d.userId}`);
}
const extraDivinerInserts = extraDivinerUserIds.map((d, i) => ({
  user_id:              d.userId,
  username:             d.username,
  display_name:         d.name,
  bio:                  "Experienced practitioner with deep roots in esoteric traditions.",
  tagline:              "Wisdom through the stars.",
  specialties:          ["astrology", "tarot"],
  timezone:             "America/New_York",
  onboarding_completed: true,
  onboarding_step:      5,
  subscription_status:  "active",
  is_active:            true,
  created_at:           isoAgo(60 - i * 10),
}));
const extraDiviners = await insert("diviners", extraDivinerInserts);
log(`✓ ${extraDiviners.length} extra diviners created`);

const allDivinerIds = [divinerId, ...extraDiviners.map(d => d.id)];

// ─── 4. Services ─────────────────────────────────────────────────────────────
section("4. Services");

await del("services", `diviner_id=eq.${divinerId}`);

const templates = await select("service_templates", "select=*&order=sort_order");
if (!templates.length) {
  log("⚠  No service_templates found — skipping service seed. Run seed.ts first.");
} else {
  const picks = ["natal-chart","romantic-relationships","solar-return","monthly-transit",
                 "10-card-celtic-cross","3-card-basic","7-card-horseshoe","yearly-forecast"];
  const featured = ["natal-chart","romantic-relationships","10-card-celtic-cross","solar-return"];
  const serviceInserts = picks
    .map(slug => templates.find(t => t.slug === slug))
    .filter(Boolean)
    .map(tpl => ({
      diviner_id:         divinerId,
      category:           tpl.category,
      name:               tpl.name,
      slug:               tpl.slug,
      description:        tpl.description,
      duration_minutes:   tpl.duration_minutes,
      base_price:         tpl.base_price,
      overage_rate:       tpl.overage_rate,
      is_primary:         tpl.is_primary,
      is_featured:        featured.includes(tpl.slug),
      requires_birth_data:tpl.requires_birth_data,
      trigger_event:      tpl.trigger_event,
      sort_order:         tpl.sort_order,
      is_active:          true,
    }));
  const services = await insert("services", serviceInserts);
  log(`✓ ${services.length} services created`);

  // Build a slug→id map for use in bookings
  globalThis.__serviceMap = Object.fromEntries(services.map(s => [s.slug, s]));

  // Create 2 basic services per extra diviner so their bookings have valid service_ids
  const basicTemplate = templates.find(t => t.slug === "natal-chart") ?? templates[0];
  if (basicTemplate) {
    for (const ed of extraDiviners) {
      await del("services", `diviner_id=eq.${ed.id}`);
      const [edSvc] = await insert("services", [{
        diviner_id: ed.id,
        category: basicTemplate.category,
        name: basicTemplate.name,
        slug: basicTemplate.slug,
        description: basicTemplate.description,
        duration_minutes: basicTemplate.duration_minutes,
        base_price: basicTemplate.base_price,
        overage_rate: basicTemplate.overage_rate,
        is_primary: true,
        is_featured: false,
        requires_birth_data: basicTemplate.requires_birth_data,
        trigger_event: basicTemplate.trigger_event,
        sort_order: 1,
        is_active: true,
      }]);
      ed.__serviceId = edSvc.id;
    }
    log(`✓ 1 service created per extra diviner`);
  }
}

// ─── 5. Availability slots ───────────────────────────────────────────────────
section("5. Availability");

await del("availability_slots", `diviner_id=eq.${divinerId}`);
const slots = [];
for (let day = 1; day <= 6; day++) { // Mon–Sat
  slots.push({ diviner_id: divinerId, day_of_week: day, start_time: "09:00", end_time: "18:00", is_active: true });
}
await insert("availability_slots", slots);
log(`✓ ${slots.length} availability slots (Mon–Sat 9am–6pm)`);

// ─── 6. Clients ──────────────────────────────────────────────────────────────
section("6. Clients");

// Main test client
await del("clients", `user_id=eq.${clientUserId}`);
const [mainClient] = await insert("clients", [{
  user_id:          clientUserId,
  email:            "client.test@astrologypro.com",
  full_name:        "Jordan Rivers",
  phone:            "+1 312 555 0101",
  birth_date:       "1992-08-14",
  birth_time:       "07:22",
  birth_city:       "Chicago, IL",
  birth_lat:        41.8781,
  birth_lng:        -87.6298,
  birth_timezone:   "America/Chicago",
  created_at:       isoAgo(90),
}]);
log(`✓ main client: ${mainClient.full_name} → ${mainClient.id}`);

// Extra clients
const extraClientDefs = [
  { full_name: "Aria Bloom",      email: "alex.kumar@example.com",       birth_date: "1988-03-21", birth_city: "Austin, TX",          birth_lat: 30.2672, birth_lng: -97.7431, tz: "America/Chicago" },
  { full_name: "Priya Sharma",    email: "priya.sharma@example.com",     birth_date: "1994-07-09", birth_city: "San Jose, CA",         birth_lat: 37.3387, birth_lng: -121.8853, tz: "America/Los_Angeles" },
  { full_name: "James Wilson",    email: "james.wilson@example.com",     birth_date: "1980-11-30", birth_city: "Boston, MA",           birth_lat: 42.3601, birth_lng: -71.0589, tz: "America/New_York" },
  { full_name: "Sofia Rodriguez", email: "sofia.rodriguez@example.com",  birth_date: "1998-05-17", birth_city: "Miami, FL",            birth_lat: 25.7617, birth_lng: -80.1918, tz: "America/New_York" },
  { full_name: "David Park",      email: "david.park@example.com",       birth_date: "1991-09-03", birth_city: "Seattle, WA",          birth_lat: 47.6062, birth_lng: -122.3321, tz: "America/Los_Angeles" },
  { full_name: "Nina Patel",      email: "nina.patel@example.com",       birth_date: "1996-01-25", birth_city: "Phoenix, AZ",          birth_lat: 33.4484, birth_lng: -112.074, tz: "America/Phoenix" },
  { full_name: "Carlos Mendez",   email: "carlos.mendez@example.com",    birth_date: "1985-06-12", birth_city: "Houston, TX",          birth_lat: 29.7604, birth_lng: -95.3698, tz: "America/Chicago" },
  { full_name: "Lisa Nguyen",     email: "lisa.nguyen@example.com",      birth_date: "1990-12-04", birth_city: "Los Angeles, CA",      birth_lat: 34.0522, birth_lng: -118.2437, tz: "America/Los_Angeles" },
  { full_name: "Omar Hassan",     email: "omar.hassan@example.com",      birth_date: "1987-04-28", birth_city: "Denver, CO",           birth_lat: 39.7392, birth_lng: -104.9903, tz: "America/Denver" },
  { full_name: "Rachel Kim",      email: "rachel.kim@example.com",       birth_date: "1993-10-16", birth_city: "Portland, OR",         birth_lat: 45.5051, birth_lng: -122.675, tz: "America/Los_Angeles" },
  { full_name: "Ben Taylor",      email: "ben.taylor@example.com",       birth_date: "1982-02-08", birth_city: "Nashville, TN",        birth_lat: 36.1627, birth_lng: -86.7816, tz: "America/Chicago" },
  { full_name: "Isabelle Martin", email: "isabelle.martin@example.com",  birth_date: "1997-08-22", birth_city: "Atlanta, GA",          birth_lat: 33.749, birth_lng: -84.388, tz: "America/New_York" },
];

const insertedClients = [];
for (let i = 0; i < extraClientDefs.length; i++) {
  const c = extraClientDefs[i];
  const uid = extraClientUserIds[i]?.userId;
  if (!uid) continue;
  await del("clients", `user_id=eq.${uid}`);
  const [row] = await insert("clients", [{
    user_id: uid, email: c.email, full_name: c.full_name,
    birth_date: c.birth_date, birth_city: c.birth_city,
    birth_lat: c.birth_lat, birth_lng: c.birth_lng, birth_timezone: c.tz,
    created_at: isoAgo(90 - i * 5),
  }]);
  insertedClients.push(row);
}
log(`✓ ${insertedClients.length} extra clients created`);

// Pool of client IDs to use in bookings (exclude main test client from diviner's roster)
const clientPool = [mainClient, ...insertedClients].map(c => c.id);

// ─── 7. Client–Diviner relationships ─────────────────────────────────────────
section("7. client_diviners");

await del("client_diviners", `diviner_id=eq.${divinerId}`);
const cdRows = clientPool.map((cid, i) => ({
  client_id:        cid,
  diviner_id:       divinerId,
  total_sessions:   Math.floor(Math.random() * 4) + 1,
  total_spent:      (Math.floor(Math.random() * 4) + 1) * 100,
  created_at:       isoAgo(85 - i * 5),
}));
await insert("client_diviners", cdRows);
log(`✓ ${cdRows.length} client–diviner relationships`);

// ─── 8. Bookings (6-month revenue chart + upcoming) ──────────────────────────
section("8. Bookings");

await del("bookings", `diviner_id=eq.${divinerId}`);

const svcMap = globalThis.__serviceMap ?? {};
const svcIds = Object.values(svcMap).map(s => s.id);

// Month helper: random client from pool
const rc = () => clientPool[Math.floor(Math.random() * clientPool.length)];
const rs = () => svcIds[Math.floor(Math.random() * svcIds.length)];
if (!svcIds.length) throw new Error("No services found — cannot create bookings with NOT NULL service_id. Run seed.ts first.");

/** Normalize a partial booking row so all rows share identical keys (PGRST102) */
function bk(row) {
  return {
    diviner_id: row.diviner_id ?? null,
    client_id: row.client_id ?? null,
    service_id: row.service_id ?? null,
    status: row.status ?? "pending",
    scheduled_at: row.scheduled_at ?? new Date().toISOString(),
    created_at: row.created_at ?? new Date().toISOString(),
    duration_minutes: row.duration_minutes ?? 60,
    actual_duration_minutes: row.actual_duration_minutes ?? null,
    base_price: row.base_price ?? 0,
    total_amount: row.total_amount ?? row.base_price ?? 0,
    overage_amount: row.overage_amount ?? null,
    stripe_payment_status: row.stripe_payment_status ?? null,
    session_notes: row.session_notes ?? null,
    booking_notes: row.booking_notes ?? null,
  };
}

const bookingRows = [];

// ── 6 months of completed bookings (drives revenue chart & MoM KPIs) ──────
const monthPrices = [
  [100, 80, 100],                          // month 5 → ~$280
  [100, 80, 100, 80, 100],                 // month 4 → ~$460
  [100, 100, 80, 100, 80, 100],            // month 3 → ~$560
  [100, 80, 100, 100, 80, 100, 80],        // month 2 → ~$640
  [100, 100, 80, 100, 100, 80, 100, 100],  // month 1 (last) → ~$760
  [100, 80, 100, 100, 80],                 // month 0 (this) → ~$460
];
const sessionNotes = [
  "Session completed. Client highly satisfied.",
  "Deep natal chart exploration.",
  "Client gained strong clarity on upcoming life decisions.",
  "Synastry reading with detailed relationship insights.",
  "Full solar return reading with yearly forecast.",
  "Excellent session — client requested follow-up.",
];

for (let m = 5; m >= 0; m--) {
  const prices = monthPrices[5 - m];
  for (let i = 0; i < prices.length; i++) {
    const dayOff = m === 0 ? i * 4 + 2 : null;
    bookingRows.push(bk({
      diviner_id: divinerId, client_id: rc(), service_id: rs(),
      status: "completed",
      scheduled_at: m === 0 ? isoAgo(dayOff, 10) : isoMonth(m, 3 + i * 3, 10),
      created_at:   m === 0 ? isoAgo(dayOff + 1, 9) : isoMonth(m, 2 + i * 3, 9),
      duration_minutes: 60, actual_duration_minutes: 61,
      base_price: prices[i], total_amount: prices[i],
      stripe_payment_status: "paid",
      session_notes: sessionNotes[5 - m],
    }));
  }
}

// Upcoming confirmed
bookingRows.push(bk({
  diviner_id: divinerId, client_id: mainClient.id,
  service_id: svcMap["natal-chart"]?.id || rs(),
  status: "confirmed", scheduled_at: isoFromNow(3, 14),
  created_at: isoAgo(5), duration_minutes: 60, base_price: 100, total_amount: 100,
  stripe_payment_status: "paid",
  booking_notes: "I'd like to focus on my career direction and Midheaven placements.",
}));
bookingRows.push(bk({
  diviner_id: divinerId, client_id: insertedClients[0]?.id || mainClient.id,
  service_id: svcMap["romantic-relationships"]?.id || rs(),
  status: "confirmed", scheduled_at: isoFromNow(7, 11),
  created_at: isoAgo(4), duration_minutes: 60, base_price: 100, total_amount: 100,
  stripe_payment_status: "paid",
  booking_notes: "Synastry reading for my partner and me.",
}));
// Pending
bookingRows.push(bk({
  diviner_id: divinerId, client_id: insertedClients[1]?.id || mainClient.id,
  service_id: svcMap["3-card-basic"]?.id || rs(),
  status: "pending", scheduled_at: isoFromNow(10, 15),
  created_at: isoAgo(2), duration_minutes: 30, base_price: 50, total_amount: 50,
  stripe_payment_status: "pending",
}));
// Today's session (for "today's sessions" panel)
const today = new Date();
today.setHours(15, 0, 0, 0);
bookingRows.push(bk({
  diviner_id: divinerId, client_id: mainClient.id,
  service_id: svcMap["solar-return"]?.id || rs(),
  status: "confirmed", scheduled_at: today.toISOString(),
  created_at: isoAgo(3), duration_minutes: 60, base_price: 100, total_amount: 100,
  stripe_payment_status: "paid",
  booking_notes: "Birthday solar return — please review my 10th house emphasis.",
}));

await insert("bookings", bookingRows);
log(`✓ ${bookingRows.length} bookings (6-month history + upcoming + today)`);

// Extra completed bookings for extra diviners (admin revenue KPIs)
for (const ed of extraDiviners) {
  const prices = [100, 80, 100, 100, 80];
  const edSvcId = ed.__serviceId ?? rs();
  const extraBookings = prices.map((p, i) => bk({
    diviner_id: ed.id, client_id: clientPool[i % clientPool.length],
    service_id: edSvcId,
    status: "completed", scheduled_at: isoAgo(30 + i * 10, 10),
    created_at: isoAgo(31 + i * 10, 9),
    duration_minutes: 60, base_price: p, total_amount: p,
    stripe_payment_status: "paid",
  }));
  await insert("bookings", extraBookings);
}
log(`✓ ${extraDiviners.length * 5} extra diviner bookings (admin revenue)`);

// ─── 9. Testimonials ──────────────────────────────────────────────────────────
section("9. Testimonials");

await del("testimonials", `diviner_id=eq.${divinerId}`);
const testimonials = [
  { client_name: "Jordan R.",    rating: 5, featured: true,  text: "Cosmic Aura's natal chart reading was the most precise and emotionally resonant I've ever experienced. She identified patterns in my life I had never consciously connected to my chart. Truly exceptional.",  service_type: "Natal Chart Reading" },
  { client_name: "Aria B.",      rating: 5, featured: true,  text: "The synastry reading transformed how my partner and I understand each other. Cosmic Aura framed every tension not as a problem but as an opportunity for growth. We left the session feeling closer than ever.",  service_type: "Romantic Relationship Reading" },
  { client_name: "James W.",     rating: 5, featured: true,  text: "I was going through a major career upheaval when I booked my solar return reading. Cosmic Aura saw it all in the chart and gave me an exact framework for navigating the next 12 months. I follow it to this day.", service_type: "Solar Return Reading" },
  { client_name: "Priya S.",     rating: 5, featured: false, text: "Booked the monthly transit forecast and left completely grounded about what to expect over the next 30 days. She explains planetary movements in plain language that actually applies to everyday decisions.", service_type: "Monthly Transit Forecast" },
  { client_name: "Sofia R.",     rating: 4, featured: false, text: "The 3-card tarot pull I got alongside my astrology session was surprisingly accurate. She connected the cards to my birth chart in a way I didn't expect. A genuinely holistic reading experience.", service_type: "3-Card Basic Spread" },
  { client_name: "Nina P.",      rating: 5, featured: true,  text: "I've had readings from five different astrologers and Cosmic Aura is in another league. Her yearly forecast for 2026 has been accurate month by month. I refer everyone I know to her.", service_type: "Yearly Astrology Forecast" },
];
await insert("testimonials", testimonials.map((t, i) => ({
  diviner_id:    divinerId,
  client_id:     clientPool[i % clientPool.length],
  client_name:   t.client_name,
  rating:        t.rating,
  text:          t.text,
  service_type:  t.service_type,
  status:        "approved",
  is_featured:   t.featured,
  created_at:    isoAgo(60 - i * 7),
})));
log(`✓ ${testimonials.length} testimonials (all approved, 4 featured)`);

// ─── 10. Page views (diviner landing traffic) ─────────────────────────────────
section("10. Page views");

await del("page_views", `diviner_id=eq.${divinerId}`);
const paths = ["/cosmic-aura","/cosmic-aura/book","/cosmic-aura/services",
               "/cosmic-aura/about","/cosmic-aura/book/natal-chart",
               "/cosmic-aura/book/romantic-relationships"];
const sources = ["google","direct","instagram","facebook","referral"];
const cities  = ["Chicago","New York","Los Angeles","Houston","Phoenix"];
const pvRows  = [];
for (let i = 0; i < 180; i++) {
  pvRows.push({
    diviner_id:     divinerId,
    path:           paths[i % paths.length],
    traffic_source: sources[i % sources.length],
    city:           cities[i % cities.length],
    country_code:   "US",
    created_at:     isoAgo(Math.floor(Math.random() * 30), Math.floor(Math.random() * 20)),
  });
}
// Insert in batches of 50
for (let b = 0; b < pvRows.length; b += 50) {
  await insert("page_views", pvRows.slice(b, b + 50));
}
log(`✓ ${pvRows.length} page views (last 30 days)`);

// ─── 11. Diviner activity events ──────────────────────────────────────────────
section("11. Diviner activity events");

await del("diviner_activity_events", `diviner_id=eq.${divinerId}`);
const activityTypes = ["page_view","booking_checkout_started","booking_checkout_started",
                       "page_view","page_view","booking_checkout_started"];
const aeRows = [];
for (let i = 0; i < 60; i++) {
  aeRows.push({
    diviner_id:    divinerId,
    activity_type: activityTypes[i % activityTypes.length],
    path:          paths[i % paths.length],
    traffic_source:sources[i % sources.length],
    country_code:  "US",
    city:          cities[i % cities.length],
    metadata:      JSON.stringify({}),
    created_at:    isoAgo(Math.floor(Math.random() * 30), Math.floor(Math.random() * 20)),
  });
}
for (let b = 0; b < aeRows.length; b += 50) {
  await insert("diviner_activity_events", aeRows.slice(b, b + 50));
}
log(`✓ ${aeRows.length} diviner activity events`);

// ─── 12. Community members (admin KPI: perennial + mystery school) ─────────────
section("12. Community members");

// Use a few of the extra client user IDs for community members
const pmUserIds  = extraClientUserIds.slice(0, 5);
const msUserIds  = extraClientUserIds.slice(5, 8);

for (const u of [...pmUserIds, ...msUserIds]) {
  try { await del("community_members", `user_id=eq.${u.userId}`); } catch {}
}

const cmRows = [
  ...pmUserIds.map(u => ({
    user_id: u.userId, email: u.email, full_name: "Member",
    membership_type: "perennial_mandalism", membership_status: "active",
    joined_at: isoAgo(30), created_at: isoAgo(30),
  })),
  ...msUserIds.map(u => ({
    user_id: u.userId, email: u.email, full_name: "Member",
    membership_type: "mystery_school", membership_status: "active",
    joined_at: isoAgo(45), created_at: isoAgo(45),
  })),
];
await insert("community_members", cmRows);
log(`✓ ${pmUserIds.length} Perennial Mandalism + ${msUserIds.length} Mystery School members`);

// ─── 13. Trainee profile ──────────────────────────────────────────────────────
section("13. Trainee profile");

await del("trainees", `user_id=eq.${traineeUserId}`);
const [trainee] = await insert("trainees", [{
  user_id:              traineeUserId,
  mentor_diviner_id:    divinerId,
  name:                 "Zara Nightsky",
  email:                "trainee.test@astrologypro.com",
  username:             "zara-nightsky",
  bio:                  "Dedicated student of Vedic and Western astrology, fascinated by timing techniques and predictive methods. Working toward Diviner Certification.",
  specialties:          ["vedic-astrology","natal-chart","transit-forecasting"],
  training_status:      "active",
  onboarding_completed: true,
  created_at:           isoAgo(75),
}]);
log(`✓ trainee "${trainee.name}" → ${trainee.id}`);

// Extra trainees (admin KPI)
for (const et of extraTraineeUserIds) {
  await del("trainees", `user_id=eq.${et.userId}`);
}
if (extraTraineeUserIds.length) {
  await insert("trainees", extraTraineeUserIds.map((et, i) => ({
    user_id:              et.userId,
    mentor_diviner_id:    divinerId,
    name:                 et.name,
    email:                et.email,
    username:             et.username,
    bio:                  "Eager astrology student on the certification track.",
    specialties:          ["astrology"],
    training_status:      "active",
    onboarding_completed: true,
    created_at:           isoAgo(55 - i * 10),
  })));
  log(`✓ ${extraTraineeUserIds.length} extra trainee records`);
}

// ─── 14. Trainee progress data ────────────────────────────────────────────────
section("14. Trainee progress");

// Fetch training programs and lessons
const programs = await select("training_programs", "select=id,name&order=priority");
if (!programs.length) {
  log("⚠  No training programs found — run seed-training.mjs first");
} else {
  const mainProgram = programs[0]; // Diviner Certification Program
  log(`  Using program: "${mainProgram.name}"`);

  // Fetch all categories for this program
  const categories = await select("training_categories",
    `select=id,name,priority&training_id=eq.${mainProgram.id}&order=priority`);

  // Fetch all lessons
  const lessons = await select("training_lessons",
    `select=id,title,priority,category_id&order=priority`);

  // Filter to lessons that belong to this program's categories
  const catIds = new Set(categories.map(c => c.id));
  const programLessons = lessons.filter(l => catIds.has(l.category_id));

  log(`  Found ${programLessons.length} lessons across ${categories.length} categories`);

  if (programLessons.length > 0) {
    // Complete 65% of lessons
    const toComplete = Math.ceil(programLessons.length * 0.65);
    const completedLessons = programLessons.slice(0, toComplete);

    // Clean up
    await del("lesson_completions", `user_id=eq.${traineeUserId}`);
    await del("lesson_progress",    `user_id=eq.${traineeUserId}`);
    await del("quiz_attempts",      `user_id=eq.${traineeUserId}`);
    await del("program_enrollments",`user_id=eq.${traineeUserId}`);

    // lesson_completions
    const lcRows = completedLessons.map((l, i) => ({
      user_id:    traineeUserId,
      lesson_id:  l.id,
      completed_at: isoAgo(65 - i * 1),
      started_at:   isoAgo(66 - i * 1),
      time_spent_seconds: 1200 + Math.floor(Math.random() * 600),
    }));
    for (let b = 0; b < lcRows.length; b += 50) {
      await insert("lesson_completions", lcRows.slice(b, b + 50));
    }
    log(`✓ ${lcRows.length} lesson_completions (65% complete)`);

    // lesson_progress (include in-progress lessons too)
    const progressRows = programLessons.slice(0, toComplete + 3).map((l, i) => ({
      user_id:           traineeUserId,
      lesson_id:         l.id,
      started_at:        isoAgo(66 - i),
      last_active_at:    i < toComplete ? isoAgo(65 - i) : isoAgo(1),
      completed_at:      i < toComplete ? isoAgo(65 - i) : null,
      time_spent_seconds: 1200 + Math.floor(Math.random() * 600),
    }));
    for (let b = 0; b < progressRows.length; b += 50) {
      await insert("lesson_progress", progressRows.slice(b, b + 50));
    }
    log(`✓ ${progressRows.length} lesson_progress rows (~5 hours total)`);

    // quiz_attempts: 10 attempts, 8 passed, avg score ~78%
    const quizLessons = completedLessons.slice(0, Math.min(10, completedLessons.length));
    const qaRows = quizLessons.map((l, i) => {
      const passed = i < 8;
      const score  = passed ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 3) + 4;
      return {
        user_id:          traineeUserId,
        lesson_id:        l.id,
        score,
        total_questions:  10,
        passed,
        attempted_at:     isoAgo(65 - i * 6),
        time_taken_seconds: 300 + Math.floor(Math.random() * 300),
        answers:          JSON.stringify({}),
      };
    });
    await insert("quiz_attempts", qaRows);
    log(`✓ ${qaRows.length} quiz_attempts (8 passed, 2 failed, avg ~78%)`);

    // program_enrollment
    await insert("program_enrollments", [{
      user_id:           traineeUserId,
      program_id:        mainProgram.id,
      enrolled_at:       isoAgo(75),
      started_at:        isoAgo(70),
      time_spent_seconds: progressRows.reduce((s, r) => s + r.time_spent_seconds, 0),
    }]);
    log(`✓ program_enrollment for main program`);
  }
}

// ─── 15. Client portal bookings ───────────────────────────────────────────────
section("15. Client portal bookings");

// 2 past completed bookings + 2 upcoming (visible in /portal)
const portalBookings = [
  bk({
    diviner_id: divinerId, client_id: mainClient.id,
    service_id: svcMap["natal-chart"]?.id || null,
    status: "completed", scheduled_at: isoAgo(45, 10), created_at: isoAgo(46),
    duration_minutes: 60, actual_duration_minutes: 65,
    base_price: 100, total_amount: 100, stripe_payment_status: "paid",
    session_notes: "Excellent natal chart session. Client asked about 2nd house.",
  }),
  bk({
    diviner_id: divinerId, client_id: mainClient.id,
    service_id: svcMap["3-card-basic"]?.id || null,
    status: "completed", scheduled_at: isoAgo(20, 14), created_at: isoAgo(21),
    duration_minutes: 30, actual_duration_minutes: 31,
    base_price: 80, total_amount: 80, stripe_payment_status: "paid",
    session_notes: "Quick clarity reading. All three cards pointed to change.",
  }),
  bk({
    diviner_id: divinerId, client_id: mainClient.id,
    service_id: svcMap["solar-return"]?.id || null,
    status: "confirmed", scheduled_at: isoFromNow(5, 14), created_at: isoAgo(5),
    duration_minutes: 60, base_price: 100, total_amount: 100,
    stripe_payment_status: "paid",
    booking_notes: "Solar return for my upcoming birthday — very excited!",
  }),
  bk({
    diviner_id: divinerId, client_id: mainClient.id,
    service_id: svcMap["monthly-transit"]?.id || null,
    status: "confirmed", scheduled_at: isoFromNow(12, 11), created_at: isoAgo(3),
    duration_minutes: 30, base_price: 80, total_amount: 80,
    stripe_payment_status: "paid",
    booking_notes: "Monthly check-in for May.",
  }),
];
await insert("bookings", portalBookings);
log(`✓ ${portalBookings.length} portal client bookings (2 past, 2 upcoming)`);

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`
${"═".repeat(58)}
  ✅  Dashboard Seed Complete!
${"═".repeat(58)}

  DIVINER DASHBOARD
  ─────────────────
  Email:    diviner.test@astrologypro.com
  Password: DivinerTest2026!
  Route:    /dashboard

  KPIs populated:
  • 6-month revenue chart (month 5→0: ~280/460/560/640/760/460)
  • This month vs last month bookings + revenue (MoM %)
  • 5 upcoming sessions (3 confirmed + 1 pending + today)
  • 8 active services, 6 approved testimonials (4 featured)
  • 180 page views, 60 activity events (last 30 days)
  • Profile: certified, fully onboarded, availability Mon–Sat

  TRAINEE DASHBOARD
  ─────────────────
  Email:    trainee.test@astrologypro.com
  Password: TraineeTest2026!
  Route:    /trainee

  KPIs populated:
  • 65% overall progress (lesson completions)
  • 10 quiz attempts — 8 passed, avg score ~78%
  • ~5 hours total study time
  • Mentor: Cosmic Aura (diviner.test@)
  • Recent completions + in-progress lessons visible

  ADMIN DASHBOARD
  ───────────────
  Email:    admin.test@astrologypro.com
  Password: AdminTest2026!
  Route:    /admin

  KPIs populated:
  • 5 total diviners (3 active subscriptions)
  • 13+ clients, 3 trainees, 8 community members
  • 40+ completed bookings with real revenue totals
  • Recent diviners list, top diviners by revenue
  • Page views + activity events in 30d window

  CLIENT PORTAL
  ─────────────
  Email:    client.test@astrologypro.com
  Password: ClientTest2026!
  Route:    /portal

  KPIs populated:
  • 2 upcoming confirmed sessions
  • 2 past completed sessions
  • Birth data pre-filled for astro readings

${"═".repeat(58)}
`);
