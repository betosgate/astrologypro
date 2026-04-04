#!/usr/bin/env node
/**
 * Bulk seed 3000 realistic test users for AstrologyPro.
 *
 * Distribution:
 *   400 diviners, 1500 clients, 300 advocates,
 *   200 community (perennial_mandalism), 200 community (mystery_school),
 *   400 trainees
 *
 * Email pattern: firstname.lastname.{i}@seed.astrologypro.com
 * Password for all: TestUser123!
 *
 * Usage:
 *   node scripts/seed-3000-users.js
 */

const path = require("path");
const fs = require("fs");

// ─── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const TOKEN      = "sbp_bfa7070edbed8263b96467bed22c9886c135f853";
const PROJECT    = "wyluvclvtvwptsvvtgkv";
const MGMT_API   = `https://api.supabase.com/v1/projects/${PROJECT}/database/query`;
// Pre-computed bcrypt hash of "TestUser123!"
const PWD_HASH   = "$2a$10$diaIU3qGr1D3733J1D8IJuBMom0BAS.oEuWaMCYfx9BAAy.u486G2";

// ─── SQL executor ─────────────────────────────────────────────────────────────
async function runSQL(label, sql) {
  process.stdout.write(`  [${label}] `);
  const res = await fetch(MGMT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED (${res.status})`);
    console.error(text.slice(0, 800));
    throw new Error(`SQL "${label}" failed`);
  }
  console.log("OK");
  return text;
}

// ─── Name arrays — 50 first × 60 last = 3 000 unique combinations ─────────────
const FIRST_NAMES = [
  "James",       "John",        "Robert",      "Michael",     "William",
  "David",       "Richard",     "Joseph",      "Thomas",      "Charles",
  "Christopher", "Daniel",      "Matthew",     "Anthony",     "Mark",
  "Donald",      "Steven",      "Paul",        "Andrew",      "Joshua",
  "Mary",        "Patricia",    "Jennifer",    "Linda",       "Barbara",
  "Elizabeth",   "Susan",       "Jessica",     "Sarah",       "Karen",
  "Lisa",        "Nancy",       "Betty",       "Margaret",    "Sandra",
  "Ashley",      "Dorothy",     "Kimberly",    "Emily",       "Donna",
  "Luna",        "Celeste",     "Aurora",      "Phoenix",     "River",
  "Sage",        "Aria",        "Nova",        "Ember",       "Felix",
];

const LAST_NAMES = [
  "Smith",     "Johnson",   "Williams",  "Brown",     "Jones",
  "Garcia",    "Miller",    "Davis",     "Rodriguez", "Martinez",
  "Hernandez", "Lopez",     "Gonzalez",  "Wilson",    "Anderson",
  "Thomas",    "Taylor",    "Moore",     "Jackson",   "Martin",
  "Lee",       "Perez",     "Thompson",  "White",     "Harris",
  "Sanchez",   "Clark",     "Ramirez",   "Lewis",     "Robinson",
  "Walker",    "Young",     "Allen",     "King",      "Wright",
  "Scott",     "Torres",    "Nguyen",    "Hill",      "Flores",
  "Green",     "Adams",     "Nelson",    "Baker",     "Hall",
  "Rivera",    "Campbell",  "Mitchell",  "Carter",    "Roberts",
  "Gomez",     "Phillips",  "Evans",     "Turner",    "Diaz",
  "Parker",    "Cruz",      "Edwards",   "Collins",   "Reyes",
];

// ─── Build the seed SQL ────────────────────────────────────────────────────────
function buildSQL() {
  const fnArr = FIRST_NAMES.map((n) => `'${n}'`).join(", ");
  const lnArr = LAST_NAMES.map((n)  => `'${n}'`).join(", ");

  return `
DO $$
DECLARE
  v_now        timestamptz := now();
  v_pwd        text        := '${PWD_HASH}';
  first_names  text[]      := ARRAY[${fnArr}];
  last_names   text[]      := ARRAY[${lnArr}];
  v_count      int;
BEGIN

  /* ── 1. Generate seed data ─────────────────────────────────────────────── */
  CREATE TEMP TABLE IF NOT EXISTS _seed_bulk (
    i     int,
    uid   uuid,
    fn    text,
    ln    text,
    email text,
    role  text,
    phone text
  );

  -- Clear if re-running in the same session
  DELETE FROM _seed_bulk;

  INSERT INTO _seed_bulk (i, uid, fn, ln, email, role, phone)
  SELECT
    i,
    gen_random_uuid(),
    first_names[((i - 1) % 50) + 1],
    last_names [((i - 1) / 50) + 1],
    lower(first_names[((i - 1) % 50) + 1])
      || '.' || lower(last_names[((i - 1) / 50) + 1])
      || '.' || i
      || '@seed.astrologypro.com',
    CASE
      WHEN i <=  400 THEN 'diviner'
      WHEN i <= 1900 THEN 'client'
      WHEN i <= 2200 THEN 'advocate'
      WHEN i <= 2400 THEN 'perennial_mandalism'
      WHEN i <= 2600 THEN 'mystery_school'
      ELSE                'trainee'
    END,
    '+1' || (2025550000 + i)::text
  FROM generate_series(1, 3000) AS i;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Generated % seed rows', v_count;

  /* ── 2. auth.users ─────────────────────────────────────────────────────── */
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  SELECT
    s.uid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    s.email,
    v_pwd,
    v_now - (s.i * interval '1 second'),
    v_now - (s.i * interval '1 second'),
    v_now,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', s.role),
    false,
    '', '', '', ''
  FROM _seed_bulk s
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = s.email);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % auth.users rows', v_count;

  /* ── 3. Diviners (i 1-400) ─────────────────────────────────────────────── */
  INSERT INTO diviners (
    user_id, username, display_name, phone,
    subscription_status, is_active, onboarding_completed, onboarding_step,
    bio, tagline, created_at
  )
  SELECT
    s.uid,
    lower(s.fn) || '-' || lower(s.ln) || '-s' || s.i,
    s.fn || ' ' || s.ln,
    s.phone,
    'active', true, true, 5,
    s.fn || ' ' || s.ln
      || ' is an experienced diviner specialising in natal charts and cosmic guidance.',
    'Illuminating your path with cosmic wisdom',
    v_now - (s.i * interval '1 second')
  FROM _seed_bulk s
  WHERE s.role = 'diviner'
    AND NOT EXISTS (SELECT 1 FROM diviners d WHERE d.user_id = s.uid);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % diviners', v_count;

  /* ── 4. Clients (i 401-1900) ───────────────────────────────────────────── */
  INSERT INTO clients (user_id, email, full_name, phone, created_at)
  SELECT
    s.uid, s.email, s.fn || ' ' || s.ln, s.phone,
    v_now - (s.i * interval '1 second')
  FROM _seed_bulk s
  WHERE s.role = 'client'
    AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.user_id = s.uid);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % clients', v_count;

  /* ── 5. Social Advocates (i 1901-2200) ─────────────────────────────────── */
  INSERT INTO social_advocates (
    user_id, email, name, username, phone,
    referral_code, is_active, onboarding_completed, bio, created_at
  )
  SELECT
    s.uid, s.email, s.fn || ' ' || s.ln,
    lower(s.fn) || '-' || lower(s.ln) || '-s' || s.i,
    s.phone,
    upper(substring(lower(s.fn), 1, 3) || substring(lower(s.ln), 1, 3)) || s.i,
    true, true,
    s.fn || ' ' || s.ln || ' is an active community advocate for AstrologyPro.',
    v_now - (s.i * interval '1 second')
  FROM _seed_bulk s
  WHERE s.role = 'advocate'
    AND NOT EXISTS (SELECT 1 FROM social_advocates a WHERE a.user_id = s.uid);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % social_advocates', v_count;

  /* ── 6. Community Members (i 2201-2600, split 50/50) ───────────────────── */
  INSERT INTO community_members (
    user_id, email, full_name, phone,
    membership_type, membership_status, joined_at
  )
  SELECT
    s.uid, s.email, s.fn || ' ' || s.ln, s.phone,
    s.role::community_membership_type,
    'active'::text,
    v_now - (s.i * interval '1 second')
  FROM _seed_bulk s
  WHERE s.role IN ('perennial_mandalism', 'mystery_school')
    AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.user_id = s.uid);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % community_members', v_count;

  /* ── 7. Trainees (i 2601-3000) ─────────────────────────────────────────── */
  INSERT INTO trainees (
    user_id, email, name, username, phone,
    training_status, onboarding_completed, bio, created_at
  )
  SELECT
    s.uid, s.email, s.fn || ' ' || s.ln,
    lower(s.fn) || '-' || lower(s.ln) || '-s' || s.i,
    s.phone,
    'active', true,
    s.fn || ' ' || s.ln
      || ' is an apprentice diviner in training, learning the art of cosmic readings.',
    v_now - (s.i * interval '1 second')
  FROM _seed_bulk s
  WHERE s.role = 'trainee'
    AND NOT EXISTS (SELECT 1 FROM trainees t WHERE t.user_id = s.uid);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % trainees', v_count;

  DROP TABLE IF EXISTS _seed_bulk;

END $$;
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌟 AstrologyPro — Bulk Seed 3000 Users");
  console.log("   50 first names × 60 last names = 3 000 unique full names");
  console.log("   Distribution:");
  console.log("     400  diviners           (i   1–400)");
  console.log("   1 500  clients             (i 401–1900)");
  console.log("     300  advocates           (i 1901–2200)");
  console.log("     200  perennial community (i 2201–2400)");
  console.log("     200  mystery school      (i 2401–2600)");
  console.log("     400  trainees            (i 2601–3000)");
  console.log("   Password: TestUser123!\n");

  const sql = buildSQL();
  console.log(`SQL size: ${sql.length.toLocaleString()} chars\n`);

  try {
    await runSQL("bulk-seed", sql);
    console.log("\n✅ 3 000 seed users inserted successfully.");
    console.log("\nEmail pattern: firstname.lastname.{1..3000}@seed.astrologypro.com");
    console.log("Password: TestUser123!");
  } catch (err) {
    console.error("\n❌ Fatal:", err.message);
    process.exit(1);
  }
}

main();
