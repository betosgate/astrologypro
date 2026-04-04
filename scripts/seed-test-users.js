#!/usr/bin/env node
/**
 * Seed test users for every role in AstrologyPro.
 *
 * Usage:
 *   node scripts/seed-test-users.js
 *
 * Reads .env.local automatically.
 * Password for all users: TestUser123!
 *
 * Prerequisite: run the phone migration first:
 *   ALTER TABLE social_advocates ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
 *   ALTER TABLE community_members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
 *   ALTER TABLE trainees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
 */

const path = require("path");
const fs = require("fs");

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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const PASSWORD = "TestUser123!";

// ─── Auth helper (create user via Supabase Auth Admin API) ───────────────────

async function createAuthUser(email, role) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role },
    }),
  });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.msg || data?.message || JSON.stringify(data);
    if (msg.includes("already") || msg.includes("registered")) {
      // Already exists — fetch their ID
      const listRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        }
      );
      const list = await listRes.json();
      const existing = list?.users?.[0] || list?.[0];
      if (existing) {
        console.log(`  ⏭  ${email} already exists`);
        return existing;
      }
    }
    console.error(`  ❌ Auth user creation failed for ${email}:`, msg);
    return null;
  }
  return data;
}

// ─── PostgREST insert helper (uses service role key — no Management API needed) ─

async function insertRow(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok && res.status !== 409) {
    console.error(`    ❌ insert ${table} failed (${res.status}):`, await res.text());
    return false;
  }
  return true;
}

// ─── Role-specific insert helpers ─────────────────────────────────────────────

async function insertDiviner(userId, displayName, username, phone) {
  // Note: diviners table has no email column — email lives in auth.users
  return insertRow("diviners", {
    user_id: userId,
    username,
    display_name: displayName,
    phone,
    subscription_status: "active",
    is_active: true,
    onboarding_completed: true,
    onboarding_step: 5,
    bio: `${displayName} is an experienced diviner specialising in natal charts and tarot readings.`,
    tagline: "Illuminating your path with cosmic wisdom",
  });
}

async function insertClient(userId, email, fullName, phone) {
  return insertRow("clients", {
    user_id: userId,
    email,
    full_name: fullName,
    phone,
  });
}

async function insertAdvocate(userId, email, name, username, phone) {
  const referralCode = username.toUpperCase().replace(/-/g, "").slice(0, 6) + Math.floor(Math.random() * 900 + 100);
  // phone column added by migration 20260404000024 — include if migration ran, omit otherwise
  const row = { user_id: userId, name, email, username, referral_code: referralCode, is_active: true, onboarding_completed: true, bio: "Community advocate helping spread the word about AstrologyPro." };
  const result = await insertRow("social_advocates", { ...row, phone });
  if (!result) {
    // Retry without phone (migration not yet applied)
    return insertRow("social_advocates", row);
  }
  return result;
}

async function insertCommunityMember(userId, email, fullName, phone, membershipType) {
  const row = { user_id: userId, email, full_name: fullName, membership_type: membershipType, membership_status: "active" };
  const result = await insertRow("community_members", { ...row, phone });
  if (!result) return insertRow("community_members", row);
  return result;
}

async function insertTrainee(userId, email, name, username, phone) {
  const row = { user_id: userId, name, email, username, training_status: "active", onboarding_completed: true, bio: "Apprentice diviner in training, learning the art of cosmic readings." };
  const result = await insertRow("trainees", { ...row, phone });
  if (!result) return insertRow("trainees", row);
  return result;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const USERS = [
  // ── Diviners ──────────────────────────────────────────────────────────────
  { email: "luna.brightwell@test.astrologypro.com",  role: "diviner",            name: "Luna Brightwell",   username: "luna-brightwell",   phone: "+12025550101" },
  { email: "celeste.moonridge@test.astrologypro.com",role: "diviner",            name: "Celeste Moonridge", username: "celeste-moonridge", phone: "+13105550102" },
  { email: "serena.stardust@test.astrologypro.com",  role: "diviner",            name: "Serena Stardust",   username: "serena-stardust",   phone: "+17185550103" },
  { email: "aurora.vega@test.astrologypro.com",      role: "diviner",            name: "Aurora Vega",       username: "aurora-vega",       phone: "+14155550104" },
  { email: "iris.solaris@test.astrologypro.com",     role: "diviner",            name: "Iris Solaris",      username: "iris-solaris",      phone: "+13125550105" },

  // ── Clients ───────────────────────────────────────────────────────────────
  { email: "michael.torres@test.astrologypro.com",   role: "client",             name: "Michael Torres",    phone: "+12025550201" },
  { email: "jennifer.walsh@test.astrologypro.com",   role: "client",             name: "Jennifer Walsh",    phone: "+13105550202" },
  { email: "david.kim@test.astrologypro.com",        role: "client",             name: "David Kim",         phone: "+17185550203" },
  { email: "sarah.blackwood@test.astrologypro.com",  role: "client",             name: "Sarah Blackwood",   phone: "+14155550204" },
  { email: "james.chen@test.astrologypro.com",       role: "client",             name: "James Chen",        phone: "+13125550205" },

  // ── Social Advocates ──────────────────────────────────────────────────────
  { email: "piper.hartley@test.astrologypro.com",    role: "social_advo",        name: "Piper Hartley",     username: "piper-hartley",     phone: "+12025550301" },
  { email: "zoe.ravenswood@test.astrologypro.com",   role: "social_advo",        name: "Zoe Ravenswood",    username: "zoe-ravenswood",    phone: "+13105550302" },
  { email: "mia.solano@test.astrologypro.com",       role: "social_advo",        name: "Mia Solano",        username: "mia-solano",        phone: "+17185550303" },
  { email: "kai.ashford@test.astrologypro.com",      role: "social_advo",        name: "Kai Ashford",       username: "kai-ashford",       phone: "+14155550304" },
  { email: "sage.winters@test.astrologypro.com",     role: "social_advo",        name: "Sage Winters",      username: "sage-winters",      phone: "+13125550305" },

  // ── Perennial Mandalism (Community) ───────────────────────────────────────
  { email: "river.ashton@test.astrologypro.com",     role: "perennial_mandalism",name: "River Ashton",      phone: "+12025550401" },
  { email: "fern.nightingale@test.astrologypro.com", role: "perennial_mandalism",name: "Fern Nightingale",  phone: "+13105550402" },
  { email: "atlas.moore@test.astrologypro.com",      role: "perennial_mandalism",name: "Atlas Moore",       phone: "+17185550403" },
  { email: "willow.cross@test.astrologypro.com",     role: "perennial_mandalism",name: "Willow Cross",      phone: "+14155550404" },
  { email: "echo.vance@test.astrologypro.com",       role: "perennial_mandalism",name: "Echo Vance",        phone: "+13125550405" },

  // ── Mystery School (Community) ────────────────────────────────────────────
  { email: "orion.blake@test.astrologypro.com",      role: "mystery_school",     name: "Orion Blake",       phone: "+12025550501" },
  { email: "lyra.holloway@test.astrologypro.com",    role: "mystery_school",     name: "Lyra Holloway",     phone: "+13105550502" },
  { email: "cassian.wright@test.astrologypro.com",   role: "mystery_school",     name: "Cassian Wright",    phone: "+17185550503" },
  { email: "nova.sterling@test.astrologypro.com",    role: "mystery_school",     name: "Nova Sterling",     phone: "+14155550504" },
  { email: "ember.thorne@test.astrologypro.com",     role: "mystery_school",     name: "Ember Thorne",      phone: "+13125550505" },

  // ── Trainees ──────────────────────────────────────────────────────────────
  { email: "felix.drake@test.astrologypro.com",      role: "trainee",            name: "Felix Drake",       username: "felix-drake",       phone: "+12025550601" },
  { email: "aria.chen@test.astrologypro.com",        role: "trainee",            name: "Aria Chen",         username: "aria-chen",         phone: "+13105550602" },
  { email: "caden.mills@test.astrologypro.com",      role: "trainee",            name: "Caden Mills",       username: "caden-mills",       phone: "+17185550603" },
  { email: "zara.quinn@test.astrologypro.com",       role: "trainee",            name: "Zara Quinn",        username: "zara-quinn",        phone: "+14155550604" },
  { email: "theo.sinclair@test.astrologypro.com",    role: "trainee",            name: "Theo Sinclair",     username: "theo-sinclair",     phone: "+13125550605" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function processUser(u) {
  console.log(`\n→ ${u.email} [${u.role}]`);
  const authUser = await createAuthUser(u.email, u.role);
  if (!authUser) return;

  const uid = authUser.id;

  if (u.role === "diviner") {
    await insertDiviner(uid, u.name, u.username, u.phone);
  } else if (u.role === "client") {
    await insertClient(uid, u.email, u.name, u.phone);
  } else if (u.role === "social_advo") {
    await insertAdvocate(uid, u.email, u.name, u.username, u.phone);
  } else if (u.role === "perennial_mandalism") {
    await insertCommunityMember(uid, u.email, u.name, u.phone, "perennial_mandalism");
  } else if (u.role === "mystery_school") {
    await insertCommunityMember(uid, u.email, u.name, u.phone, "mystery_school");
  } else if (u.role === "trainee") {
    await insertTrainee(uid, u.email, u.name, u.username, u.phone);
  }

  console.log(`  ✅ Done`);
}

async function main() {
  console.log("🌟 AstrologyPro — Test User Seed");
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log(`   Users to seed: ${USERS.length}\n`);

  for (const u of USERS) {
    await processUser(u);
  }

  console.log("\n\n✅ Seed complete!");
  console.log("\nTest credentials (all password: TestUser123!):");
  console.log("  Diviners:  luna.brightwell@test.astrologypro.com … iris.solaris@test.astrologypro.com");
  console.log("  Clients:   michael.torres@test.astrologypro.com … james.chen@test.astrologypro.com");
  console.log("  Advocates: piper.hartley@test.astrologypro.com … sage.winters@test.astrologypro.com");
  console.log("  Community: river.ashton@test.astrologypro.com … ember.thorne@test.astrologypro.com");
  console.log("  Trainees:  felix.drake@test.astrologypro.com … theo.sinclair@test.astrologypro.com");
  console.log("\n  Original test accounts:");
  console.log("  Admin/Diviner: test-diviner@astrologypro.com / TestDiviner123!");
  console.log("  Client:        test-client@astrologypro.com / TestClient123!");
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
