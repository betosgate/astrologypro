#!/usr/bin/env node
/**
 * seed-role-data.mjs
 *
 * Populates KPI + activity data for ALL single-role test accounts, role by role:
 *
 *   1. Diviners   → services, availability, clients, bookings, testimonials, page views
 *   2. Trainees   → lesson completions, quiz attempts, program enrollment
 *   3. Clients    → bookings (past + upcoming) against the main seed diviner
 *   4. Advocates  → affiliate_referrals
 *
 * Run: node scripts/seed-role-data.mjs [role]
 *   role = diviner | trainee | client | advocate | all (default: all)
 *
 * Idempotent — safe to re-run; deletes existing data for each account first.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ──────────────────────────────────────────────────────────
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

const H = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: "return=representation",
};

// ─── REST helpers ─────────────────────────────────────────────────────────────

async function rest(method, table, body, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = { method, headers: H };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`REST ${method} ${table}${query}: ${err}`);
  }
  if (method === "DELETE" || res.status === 204) return [];
  return res.json();
}

const insert    = (t, rows) => rest("POST",   t, rows);
const del       = (t, f)    => rest("DELETE", t, undefined, `?${f}`);
const select    = (t, q)    => rest("GET",    t, undefined, `?${q}`);
const selectOne = async (t, q) => { const r = await select(t, q); return r[0] ?? null; };

// ─── Auth user lookup ─────────────────────────────────────────────────────────

async function getUserId(email) {
  const authH = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  // filter search
  const sr = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&page=1&per_page=50`,
    { headers: authH }
  );
  if (sr.ok) {
    const sd = await sr.json();
    const users = sd.users ?? sd ?? [];
    const found = Array.isArray(users) ? users.find(u => u.email === email) : null;
    if (found) return found.id;
  }
  // paginate fallback
  for (let page = 1; page <= 10; page++) {
    const lr = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: authH }
    );
    if (!lr.ok) break;
    const list = await lr.json();
    const users = list.users ?? list ?? [];
    if (!Array.isArray(users) || !users.length) break;
    const found = users.find(u => u.email === email);
    if (found) return found.id;
    if (users.length < 1000) break;
  }
  return null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function isoMonth(monthsAgo, dayOfMonth = 10, hour = 10) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, dayOfMonth);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function isoFromNow(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── bk() normalizer (identical keys → avoids PGRST102) ─────────────────────

function bk(row) {
  return {
    diviner_id:              row.diviner_id              ?? null,
    client_id:               row.client_id               ?? null,
    service_id:              row.service_id              ?? null,
    status:                  row.status                  ?? "pending",
    scheduled_at:            row.scheduled_at            ?? new Date().toISOString(),
    created_at:              row.created_at              ?? new Date().toISOString(),
    duration_minutes:        row.duration_minutes        ?? 60,
    actual_duration_minutes: row.actual_duration_minutes ?? null,
    base_price:              row.base_price              ?? 0,
    total_amount:            row.total_amount            ?? row.base_price ?? 0,
    overage_amount:          row.overage_amount          ?? null,
    stripe_payment_status:   row.stripe_payment_status   ?? null,
    session_notes:           row.session_notes           ?? null,
    booking_notes:           row.booking_notes           ?? null,
  };
}

// ─── Shared service templates ─────────────────────────────────────────────────

let _templates = null;
async function getServiceTemplates() {
  if (!_templates) _templates = await select("service_templates", "select=*&order=sort_order");
  return _templates;
}

// ─── 1. DIVINER population ────────────────────────────────────────────────────

const DIVINERS = [
  // From original numeric seed (seed.ts / old seed)
  { email: "diviner1@test.astrologypro.com", username: "test-diviner-1", name: "Test Diviner 1" },
  { email: "diviner2@test.astrologypro.com", username: "test-diviner-2", name: "Test Diviner 2" },
  { email: "diviner3@test.astrologypro.com", username: "test-diviner-3", name: "Test Diviner 3" },
  { email: "diviner4@test.astrologypro.com", username: "test-diviner-4", name: "Test Diviner 4" },
  { email: "diviner5@test.astrologypro.com", username: "test-diviner-5", name: "Test Diviner 5" },
  // From seed-test-users.js (named accounts)
  { email: "luna.brightwell@test.astrologypro.com",   username: "luna-brightwell",   name: "Luna Brightwell"   },
  { email: "celeste.moonridge@test.astrologypro.com", username: "celeste-moonridge", name: "Celeste Moonridge" },
  { email: "serena.stardust@test.astrologypro.com",   username: "serena-stardust",   name: "Serena Stardust"   },
  { email: "aurora.vega@test.astrologypro.com",       username: "aurora-vega",       name: "Aurora Vega"       },
  { email: "iris.solaris@test.astrologypro.com",      username: "iris-solaris",      name: "Iris Solaris"      },
];

const DIVINER_BIOS = [
  "Specialising in natal charts and life-path guidance through Vedic and Western astrology.",
  "Tarot and astrology combined — bringing clarity to relationships, career, and life transitions.",
  "Certified astrologer with 10+ years illuminating karmic patterns and soul purpose.",
  "Solar return, transit forecasting, and synastry are my specialties.",
  "Combining Jungian depth psychology with astrological insight for transformative readings.",
  "Western astrology focused on timing and predictive techniques.",
  "Intuitive tarot reader and natal chart specialist.",
  "Vedic astrology, moon cycles, and chakra-based readings.",
  "Relationship astrology and composite charts.",
  "Evolutionary astrology and life-purpose guidance.",
];

const TESTIMONIAL_TEXTS = [
  "An incredibly accurate and emotionally resonant reading. I left with total clarity on my path forward.",
  "The natal chart reading uncovered patterns I'd never consciously noticed. Truly exceptional.",
  "My solar return reading was spot-on — I refer everyone to this diviner.",
  "Transformed how I understand my relationships. The synastry reading was life-changing.",
  "Explained planetary movements in plain language. Practical and deeply insightful.",
];

async function seedDiviner(d, index) {
  console.log(`\n  → ${d.email}`);

  const userId = await getUserId(d.email);
  if (!userId) { console.log(`    ⚠  auth user not found — skipping`); return; }

  // Ensure diviner profile exists — look up by user_id first, then username
  let diviner = await selectOne("diviners", `user_id=eq.${userId}&select=id`);
  if (!diviner) diviner = await selectOne("diviners", `username=eq.${d.username}&select=id`);
  if (!diviner) {
    try {
      const rows = await insert("diviners", [{
        user_id:              userId,
        username:             d.username,
        display_name:         d.name,
        bio:                  DIVINER_BIOS[index % DIVINER_BIOS.length],
        tagline:              "Illuminating your path through the cosmos.",
        specialties:          ["astrology", "tarot"],
        timezone:             "America/New_York",
        onboarding_completed: true,
        onboarding_step:      5,
        subscription_status:  "active",
        is_active:            true,
        created_at:           isoAgo(90 + index * 5),
      }]);
      diviner = rows[0];
      console.log(`    ✓ diviner profile created`);
    } catch {
      // Last resort — fetch by username after failed insert
      diviner = await selectOne("diviners", `username=eq.${d.username}&select=id`);
      if (diviner) console.log(`    ⏭  diviner profile found after retry`);
    }
  } else {
    console.log(`    ⏭  diviner profile exists`);
  }
  if (!diviner) { console.log(`    ❌  could not find or create diviner — skipping`); return; }

  const divinerId = diviner.id;

  // Delete bookings first (FK: bookings.service_id → services.id)
  await del("bookings", `diviner_id=eq.${divinerId}`);

  // Services
  await del("services", `diviner_id=eq.${divinerId}`);
  const templates = await getServiceTemplates();
  const picks = ["natal-chart", "3-card-basic", "romantic-relationships", "solar-return"];
  const serviceInserts = picks
    .map(slug => templates.find(t => t.slug === slug))
    .filter(Boolean)
    .map((tpl, i) => ({
      diviner_id:          divinerId,
      category:            tpl.category,
      name:                tpl.name,
      slug:                tpl.slug,
      description:         tpl.description,
      duration_minutes:    tpl.duration_minutes,
      base_price:          tpl.base_price,
      overage_rate:        tpl.overage_rate,
      is_primary:          i === 0,
      is_featured:         i < 2,
      requires_birth_data: tpl.requires_birth_data,
      trigger_event:       tpl.trigger_event,
      sort_order:          i + 1,
      is_active:           true,
    }));
  const services = serviceInserts.length ? await insert("services", serviceInserts) : [];
  const svcIds = services.map(s => s.id);
  const rs = () => svcIds[Math.floor(Math.random() * svcIds.length)];
  console.log(`    ✓ ${services.length} services`);

  // Availability slots (Mon–Sat)
  await del("availability_slots", `diviner_id=eq.${divinerId}`);
  const slots = [];
  for (let day = 1; day <= 6; day++) {
    slots.push({ diviner_id: divinerId, day_of_week: day, start_time: "09:00", end_time: "18:00", is_active: true });
  }
  await insert("availability_slots", slots);
  console.log(`    ✓ availability (Mon–Sat 9–6)`);

  // Reuse the existing named client accounts (already in auth.users + clients table)
  await del("client_diviners", `diviner_id=eq.${divinerId}`);
  const allClients = await select("clients",
    "select=id,email&order=created_at&limit=10");
  // pick 3 clients offset by index so each diviner gets a slightly different set
  const insertedClients = allClients.length >= 3
    ? [0, 1, 2].map(n => allClients[(index * 3 + n) % allClients.length])
    : allClients;
  if (!insertedClients.length) { console.log(`    ⚠  no clients found — run seed-test-users.js first`); return; }
  // client_diviners relationships (ignore conflict if already linked)
  try {
    await insert("client_diviners", insertedClients.map((c, i) => ({
      client_id:      c.id,
      diviner_id:     divinerId,
      total_sessions: i + 2,
      total_spent:    (i + 2) * 100,
      created_at:     isoAgo(70 - i * 10),
    })));
  } catch { /* already linked */ }
  console.log(`    ✓ ${insertedClients.length} clients linked`);

  // Bookings — 6-month history + upcoming
  if (!svcIds.length) { console.log(`    ⚠  no services — skipping bookings`); return; }
  const rc = () => insertedClients[Math.floor(Math.random() * insertedClients.length)].id;
  const monthRevenues = [[100, 80], [100, 80, 100], [100, 100, 80], [100, 80, 100, 80], [100, 100, 80, 100], [100, 80]];
  const bookings = [];

  for (let m = 5; m >= 0; m--) {
    const prices = monthRevenues[5 - m];
    for (let i = 0; i < prices.length; i++) {
      bookings.push(bk({
        diviner_id: divinerId, client_id: rc(), service_id: rs(),
        status: "completed",
        scheduled_at: m === 0 ? isoAgo(i * 5 + 3, 10) : isoMonth(m, 3 + i * 4, 10),
        created_at:   m === 0 ? isoAgo(i * 5 + 4, 9)  : isoMonth(m, 2 + i * 4, 9),
        duration_minutes: 60, actual_duration_minutes: 62,
        base_price: prices[i], total_amount: prices[i],
        stripe_payment_status: "paid",
        session_notes: "Session completed. Client was satisfied.",
      }));
    }
  }
  // 2 upcoming
  bookings.push(bk({
    diviner_id: divinerId, client_id: insertedClients[0].id, service_id: svcIds[0],
    status: "confirmed", scheduled_at: isoFromNow(3 + index, 14),
    created_at: isoAgo(4), duration_minutes: 60,
    base_price: 100, total_amount: 100, stripe_payment_status: "paid",
    booking_notes: "Looking forward to my natal chart reading.",
  }));
  bookings.push(bk({
    diviner_id: divinerId, client_id: insertedClients[1].id, service_id: rs(),
    status: "pending", scheduled_at: isoFromNow(8 + index, 11),
    created_at: isoAgo(2), duration_minutes: 30,
    base_price: 80, total_amount: 80, stripe_payment_status: "pending",
  }));
  await insert("bookings", bookings);
  console.log(`    ✓ ${bookings.length} bookings (6-month history + 2 upcoming)`);

  // Testimonials (2 approved)
  await del("testimonials", `diviner_id=eq.${divinerId}`);
  await insert("testimonials", [
    {
      diviner_id: divinerId, client_id: insertedClients[0].id,
      client_name: "Jordan R.", rating: 5, status: "approved", is_featured: true,
      text: TESTIMONIAL_TEXTS[index % TESTIMONIAL_TEXTS.length],
      service_type: "Natal Chart Reading",
      created_at: isoAgo(20),
    },
    {
      diviner_id: divinerId, client_id: insertedClients[1].id,
      client_name: "Alex M.", rating: 5, status: "approved", is_featured: false,
      text: TESTIMONIAL_TEXTS[(index + 1) % TESTIMONIAL_TEXTS.length],
      service_type: "3-Card Tarot Spread",
      created_at: isoAgo(10),
    },
  ]);
  console.log(`    ✓ 2 testimonials`);

  // Page views (30 days)
  await del("page_views", `diviner_id=eq.${divinerId}`);
  const pvRows = [];
  const paths = [`/${d.username}`, `/${d.username}/book`, `/${d.username}/services`];
  const sources = ["google", "direct", "instagram", "facebook"];
  for (let i = 0; i < 40; i++) {
    pvRows.push({
      diviner_id: divinerId, path: paths[i % paths.length],
      traffic_source: sources[i % sources.length],
      country_code: "US", city: "Chicago",
      created_at: isoAgo(Math.floor(Math.random() * 30), Math.floor(Math.random() * 20)),
    });
  }
  for (let b = 0; b < pvRows.length; b += 50) await insert("page_views", pvRows.slice(b, b + 50));
  console.log(`    ✓ 40 page views`);
}

// ─── 2. TRAINEE population ────────────────────────────────────────────────────

const TRAINEES = [
  { email: "trainee1@test.astrologypro.com", username: "test-trainee-1", name: "Test Trainee 1" },
  { email: "trainee2@test.astrologypro.com", username: "test-trainee-2", name: "Test Trainee 2" },
  { email: "trainee3@test.astrologypro.com", username: "test-trainee-3", name: "Test Trainee 3" },
  { email: "trainee4@test.astrologypro.com", username: "test-trainee-4", name: "Test Trainee 4" },
  { email: "trainee5@test.astrologypro.com", username: "test-trainee-5", name: "Test Trainee 5" },
  { email: "felix.drake@test.astrologypro.com",   username: "felix-drake",   name: "Felix Drake"   },
  { email: "aria.chen@test.astrologypro.com",     username: "aria-chen",     name: "Aria Chen"     },
  { email: "caden.mills@test.astrologypro.com",   username: "caden-mills",   name: "Caden Mills"   },
  { email: "zara.quinn@test.astrologypro.com",    username: "zara-quinn",    name: "Zara Quinn"    },
  { email: "theo.sinclair@test.astrologypro.com", username: "theo-sinclair", name: "Theo Sinclair" },
];

async function seedTrainee(t, index) {
  console.log(`\n  → ${t.email}`);

  const userId = await getUserId(t.email);
  if (!userId) { console.log(`    ⚠  auth user not found — skipping`); return; }

  // Ensure trainee row exists — look up by user_id first, then username
  let trainee = await selectOne("trainees", `user_id=eq.${userId}&select=id`);
  if (!trainee) trainee = await selectOne("trainees", `username=eq.${t.username}&select=id`);
  if (!trainee) {
    try {
      const rows = await insert("trainees", [{
        user_id:              userId,
        name:                 t.name,
        email:                t.email,
        username:             t.username,
        bio:                  "Aspiring astrologer on the certification path.",
        specialties:          ["astrology"],
        training_status:      "active",
        onboarding_completed: true,
        created_at:           isoAgo(60 + index * 5),
      }]);
      trainee = rows[0];
      console.log(`    ✓ trainee record created`);
    } catch {
      trainee = await selectOne("trainees", `username=eq.${t.username}&select=id`);
      if (trainee) console.log(`    ⏭  trainee found after retry`);
    }
  } else {
    console.log(`    ⏭  trainee record exists`);
  }
  if (!trainee) { console.log(`    ❌  could not find or create trainee — skipping`); return; }

  // Training programs + lessons
  const programs = await select("training_programs", "select=id,name&order=priority");
  if (!programs.length) { console.log(`    ⚠  no training programs — run seed-training.mjs first`); return; }
  const mainProgram = programs[0];

  const categories = await select("training_categories",
    `select=id,name,priority&training_id=eq.${mainProgram.id}&order=priority`);
  const lessons = await select("training_lessons", "select=id,title,category_id&order=priority");
  const catIds = new Set(categories.map(c => c.id));
  const programLessons = lessons.filter(l => catIds.has(l.category_id));

  if (!programLessons.length) { console.log(`    ⚠  no lessons — run seed-training.mjs first`); return; }

  // Each trainee has a different completion % (30-80%, staggered by index)
  const pct = 0.3 + (index % 6) * 0.1;
  const toComplete = Math.max(1, Math.ceil(programLessons.length * pct));
  const completedLessons = programLessons.slice(0, toComplete);

  // Clean up
  await del("lesson_completions",  `user_id=eq.${userId}`);
  await del("lesson_progress",     `user_id=eq.${userId}`);
  await del("quiz_attempts",       `user_id=eq.${userId}`);
  await del("program_enrollments", `user_id=eq.${userId}`);

  // lesson_completions
  const lcRows = completedLessons.map((l, i) => ({
    user_id:            userId, lesson_id: l.id,
    completed_at:       isoAgo(toComplete - i + 1),
    started_at:         isoAgo(toComplete - i + 2),
    time_spent_seconds: 900 + Math.floor(Math.random() * 900),
  }));
  for (let b = 0; b < lcRows.length; b += 50) await insert("lesson_completions", lcRows.slice(b, b + 50));

  // lesson_progress (completed + next 2 in-progress)
  const progressRows = programLessons.slice(0, toComplete + 2).map((l, i) => ({
    user_id:            userId, lesson_id: l.id,
    started_at:         isoAgo(toComplete - i + 2),
    last_active_at:     i < toComplete ? isoAgo(toComplete - i + 1) : isoAgo(1),
    completed_at:       i < toComplete ? isoAgo(toComplete - i + 1) : null,
    time_spent_seconds: 900 + Math.floor(Math.random() * 900),
  }));
  for (let b = 0; b < progressRows.length; b += 50) await insert("lesson_progress", progressRows.slice(b, b + 50));

  // quiz_attempts (for completed lessons, mix of pass/fail)
  const quizLessons = completedLessons.slice(0, Math.min(8, completedLessons.length));
  const passCount = Math.ceil(quizLessons.length * 0.75);
  const qaRows = quizLessons.map((l, i) => {
    const passed = i < passCount;
    const score  = passed ? 7 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 3);
    return {
      user_id:            userId, lesson_id: l.id,
      score, total_questions: 10, passed,
      attempted_at:       isoAgo(toComplete - i + 1),
      time_taken_seconds: 240 + Math.floor(Math.random() * 360),
      answers:            JSON.stringify({}),
    };
  });
  if (qaRows.length) await insert("quiz_attempts", qaRows);

  // program_enrollment
  const totalTime = progressRows.reduce((s, r) => s + r.time_spent_seconds, 0);
  await insert("program_enrollments", [{
    user_id:            userId,
    program_id:         mainProgram.id,
    enrolled_at:        isoAgo(60 + index * 5),
    started_at:         isoAgo(55 + index * 5),
    time_spent_seconds: totalTime,
  }]);

  const avgScore = qaRows.length
    ? Math.round(qaRows.reduce((s, q) => s + q.score, 0) / qaRows.length * 10)
    : 0;

  console.log(`    ✓ ${lcRows.length} completions (${Math.round(pct * 100)}%), ${qaRows.length} quizzes, avg ${avgScore}%, ~${Math.round(totalTime / 3600 * 10) / 10}h`);
}

// ─── 3. CLIENT population ─────────────────────────────────────────────────────

const CLIENTS = [
  { email: "client1@test.astrologypro.com", name: "Test Client 1" },
  { email: "client2@test.astrologypro.com", name: "Test Client 2" },
  { email: "client3@test.astrologypro.com", name: "Test Client 3" },
  { email: "client4@test.astrologypro.com", name: "Test Client 4" },
  { email: "client5@test.astrologypro.com", name: "Test Client 5" },
  { email: "michael.torres@test.astrologypro.com",  name: "Michael Torres"   },
  { email: "jennifer.walsh@test.astrologypro.com",  name: "Jennifer Walsh"   },
  { email: "david.kim@test.astrologypro.com",       name: "David Kim"        },
  { email: "sarah.blackwood@test.astrologypro.com", name: "Sarah Blackwood"  },
  { email: "james.chen@test.astrologypro.com",      name: "James Chen"       },
];

async function seedClient(c, index) {
  console.log(`\n  → ${c.email}`);

  const userId = await getUserId(c.email);
  if (!userId) { console.log(`    ⚠  auth user not found — skipping`); return; }

  // Ensure client record exists
  let client = await selectOne("clients", `user_id=eq.${userId}&select=id`);
  if (!client) {
    const rows = await insert("clients", [{
      user_id:        userId,
      email:          c.email,
      full_name:      c.name,
      birth_date:     `199${(index % 9) + 1}-0${(index % 9) + 1}-${10 + index}`,
      birth_city:     "New York, NY",
      birth_lat:      40.7128,
      birth_lng:      -74.006,
      birth_timezone: "America/New_York",
      created_at:     isoAgo(70 + index * 4),
    }]);
    client = rows[0];
    console.log(`    ✓ client record created`);
  } else {
    console.log(`    ⏭  client record exists`);
  }

  // Find the main seed diviner (cosmic-aura) to book against
  const diviner = await selectOne("diviners", `username=eq.cosmic-aura&select=id`);
  if (!diviner) { console.log(`    ⚠  main diviner not found — run seed-dashboard-data.mjs first`); return; }

  const services = await select("services", `diviner_id=eq.${diviner.id}&select=id&limit=2`);
  if (!services.length) { console.log(`    ⚠  no services on main diviner`); return; }
  const svcId  = services[0].id;
  const svcId2 = (services[1] ?? services[0]).id;

  // Clean up this client's bookings on main diviner
  await del("bookings", `client_id=eq.${client.id}&diviner_id=eq.${diviner.id}`);

  const clientBookings = [
    bk({
      diviner_id: diviner.id, client_id: client.id, service_id: svcId,
      status: "completed",
      scheduled_at: isoAgo(30 + index * 4, 10), created_at: isoAgo(31 + index * 4),
      duration_minutes: 60, actual_duration_minutes: 63,
      base_price: 100, total_amount: 100, stripe_payment_status: "paid",
      session_notes: "Completed. Client was engaged throughout.",
    }),
    bk({
      diviner_id: diviner.id, client_id: client.id, service_id: svcId2,
      status: "completed",
      scheduled_at: isoAgo(10 + index * 2, 14), created_at: isoAgo(11 + index * 2),
      duration_minutes: 30, actual_duration_minutes: 32,
      base_price: 80, total_amount: 80, stripe_payment_status: "paid",
      session_notes: "Follow-up session. All questions addressed.",
    }),
    bk({
      diviner_id: diviner.id, client_id: client.id, service_id: svcId,
      status: "confirmed",
      scheduled_at: isoFromNow(5 + index, 11), created_at: isoAgo(3),
      duration_minutes: 60, base_price: 100, total_amount: 100,
      stripe_payment_status: "paid",
      booking_notes: "Looking forward to my upcoming reading!",
    }),
  ];
  await insert("bookings", clientBookings);
  console.log(`    ✓ 3 bookings (2 past completed + 1 upcoming)`);
}

// ─── 4. ADVOCATE population ──────────────────────────────────────────────────

const ADVOCATES = [
  { email: "advocate1@test.astrologypro.com", username: "test-advocate-1", name: "Test Advocate 1" },
  { email: "advocate2@test.astrologypro.com", username: "test-advocate-2", name: "Test Advocate 2" },
  { email: "advocate3@test.astrologypro.com", username: "test-advocate-3", name: "Test Advocate 3" },
  { email: "advocate4@test.astrologypro.com", username: "test-advocate-4", name: "Test Advocate 4" },
  { email: "advocate5@test.astrologypro.com", username: "test-advocate-5", name: "Test Advocate 5" },
  { email: "piper.hartley@test.astrologypro.com",    username: "piper-hartley",    name: "Piper Hartley"    },
  { email: "zoe.ravenswood@test.astrologypro.com",   username: "zoe-ravenswood",   name: "Zoe Ravenswood"   },
  { email: "mia.solano@test.astrologypro.com",       username: "mia-solano",       name: "Mia Solano"       },
  { email: "kai.ashford@test.astrologypro.com",      username: "kai-ashford",      name: "Kai Ashford"      },
  { email: "sage.winters@test.astrologypro.com",     username: "sage-winters",     name: "Sage Winters"     },
];

async function seedAdvocate(a, index) {
  console.log(`\n  → ${a.email}`);

  const userId = await getUserId(a.email);
  if (!userId) { console.log(`    ⚠  auth user not found — skipping`); return; }

  // Ensure advocate record exists
  let advocate = await selectOne("social_advocates", `user_id=eq.${userId}&select=id,referral_code`);
  if (!advocate) {
    console.log(`    ⚠  social_advocates record not found — run seed-test-users.js first`);
    return;
  }

  // Commission rate
  try {
    await rest("PATCH", "social_advocates",
      { commission_percent: 10, total_referrals: 3 + index, total_earned: (3 + index) * 50, total_paid: index * 50 },
      `?user_id=eq.${userId}`
    );
  } catch { /* column may not exist */ }

  // affiliate_referrals
  await del("affiliate_referrals", `affiliate_id=eq.${advocate.id}`);
  const referralStatuses = ["paid", "paid", "pending", "paid", "pending"];
  const referralRows = referralStatuses.slice(0, 3 + index % 3).map((status, i) => ({
    affiliate_id:      advocate.id,
    referral_code:     advocate.referral_code,
    commission_amount: 50,
    status,
    created_at:        isoAgo(20 - i * 5),
    paid_at:           status === "paid" ? isoAgo(10 - i * 3) : null,
  }));
  try {
    await insert("affiliate_referrals", referralRows);
    console.log(`    ✓ ${referralRows.length} referrals seeded`);
  } catch (err) {
    console.log(`    ⚠  affiliate_referrals: ${err.message.slice(0, 80)}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const targetRole = process.argv[2] ?? "all";
const runDiviner  = targetRole === "all" || targetRole === "diviner";
const runTrainee  = targetRole === "all" || targetRole === "trainee";
const runClient   = targetRole === "all" || targetRole === "client";
const runAdvocate = targetRole === "all" || targetRole === "advocate";

console.log(`\n${"═".repeat(58)}`);
console.log(`  AstrologyPro — Role Data Seed   [${targetRole}]`);
console.log(`${"═".repeat(58)}`);

if (runDiviner) {
  console.log(`\n\n╔══ DIVINERS (${DIVINERS.length}) ${"═".repeat(40)}`);
  for (let i = 0; i < DIVINERS.length; i++) {
    await seedDiviner(DIVINERS[i], i);
  }
  console.log(`\n  ✅ Diviners done`);
}

if (runTrainee) {
  console.log(`\n\n╔══ TRAINEES (${TRAINEES.length}) ${"═".repeat(40)}`);
  for (let i = 0; i < TRAINEES.length; i++) {
    await seedTrainee(TRAINEES[i], i);
  }
  console.log(`\n  ✅ Trainees done`);
}

if (runClient) {
  console.log(`\n\n╔══ CLIENTS (${CLIENTS.length}) ${"═".repeat(41)}`);
  for (let i = 0; i < CLIENTS.length; i++) {
    await seedClient(CLIENTS[i], i);
  }
  console.log(`\n  ✅ Clients done`);
}

if (runAdvocate) {
  console.log(`\n\n╔══ ADVOCATES (${ADVOCATES.length}) ${"═".repeat(40)}`);
  for (let i = 0; i < ADVOCATES.length; i++) {
    await seedAdvocate(ADVOCATES[i], i);
  }
  console.log(`\n  ✅ Advocates done`);
}

console.log(`
${"═".repeat(58)}
  ✅  Role Data Seed Complete!
${"═".repeat(58)}

  To seed a specific role only:
    node scripts/seed-role-data.mjs diviner
    node scripts/seed-role-data.mjs trainee
    node scripts/seed-role-data.mjs client
    node scripts/seed-role-data.mjs advocate

${"═".repeat(58)}
`);
