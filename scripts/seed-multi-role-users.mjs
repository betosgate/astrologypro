#!/usr/bin/env node
/**
 * seed-multi-role-users.mjs
 *
 * Creates multi-role test users — every combination involving
 * Perennial Mandalism (PM) plus all other notable combos.
 *
 * Password for all: TestUser123!
 *
 * Run: node scripts/seed-multi-role-users.mjs
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

const PASSWORD = "TestUser123!";

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg)   { console.log(`    ${msg}`); }
function section(t) { console.log(`\n── ${t} ${"─".repeat(Math.max(0, 52 - t.length))}`); }

async function authUser(email) {
  // Try create
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  const data = await res.json();
  if (res.ok) { log(`✓ auth created: ${email}`); return data.id; }

  // Already exists — search by filter
  const searchRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&page=1&per_page=50`,
    { headers: AUTH_HEADERS }
  );
  if (searchRes.ok) {
    const sd = await searchRes.json();
    const users = sd.users ?? sd ?? [];
    const found = Array.isArray(users) ? users.find(u => u.email === email) : null;
    if (found) { log(`⏭  auth exists: ${email}`); return found.id; }
  }
  // Fallback: paginate
  for (let page = 1; page <= 10; page++) {
    const lr = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: AUTH_HEADERS }
    );
    if (!lr.ok) break;
    const list = await lr.json();
    const users = list.users ?? list ?? [];
    if (!Array.isArray(users) || users.length === 0) break;
    const found = users.find(u => u.email === email);
    if (found) { log(`⏭  auth exists: ${email}`); return found.id; }
    if (users.length < 1000) break;
  }
  throw new Error(`Failed to create or find auth user ${email}: ${JSON.stringify(data)}`);
}

async function upsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...AUTH_HEADERS, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    console.warn(`    ⚠  upsert ${table} failed (${res.status}): ${err}`);
    return false;
  }
  return true;
}

// ─── Role insert helpers ──────────────────────────────────────────────────────

async function asDiviner(uid, name, username) {
  const ok = await upsert("diviners", {
    user_id: uid, username, display_name: name,
    subscription_status: "active", is_active: true,
    onboarding_completed: true, onboarding_step: 5,
    bio: `${name} is a multi-role practitioner.`,
    tagline: "Wisdom through the stars.",
  });
  if (ok) log(`  → diviners (${username})`);
}

async function asTrainee(uid, email, name, username) {
  const ok = await upsert("trainees", {
    user_id: uid, email, name, username,
    training_status: "active", onboarding_completed: true,
    bio: "Apprentice diviner — multi-role account.",
  });
  if (ok) log(`  → trainees (${username})`);
}

async function asClient(uid, email, name) {
  const ok = await upsert("clients", { user_id: uid, email, full_name: name });
  if (ok) log(`  → clients`);
}

async function asAdvocate(uid, email, name, username) {
  const referralCode = username.toUpperCase().replace(/-/g, "").slice(0, 6) +
    Math.floor(Math.random() * 900 + 100);
  const ok = await upsert("social_advocates", {
    user_id: uid, email, name, username, referral_code: referralCode,
    is_active: true, onboarding_completed: true,
    bio: "Community advocate — multi-role account.",
  });
  if (ok) log(`  → social_advocates (${username})`);
}

async function asPM(uid, email, name) {
  const ok = await upsert("community_members", {
    user_id: uid, email, full_name: name,
    membership_type: "perennial_mandalism", membership_status: "active",
  });
  if (ok) log(`  → community_members [perennial_mandalism]`);
}

async function asMS(uid, email, name) {
  // community_members has a unique(user_id, membership_type) or similar — insert separately
  const ok = await upsert("community_members", {
    user_id: uid, email, full_name: name,
    membership_type: "mystery_school", membership_status: "active",
  });
  if (ok) log(`  → community_members [mystery_school]`);
}

// ─── User definitions ─────────────────────────────────────────────────────────
//
// Each entry describes which roles to activate for the account.
// roles: array — any subset of: diviner, trainee, client, advocate, pm, ms

const MULTI_USERS = [

  // ── PM + single role combos ────────────────────────────────────────────────
  {
    email: "pm.diviner@test.astrologypro.com",
    name:  "Solaris Patel",      username: "solaris-patel",
    roles: ["diviner", "pm"],
    portal: "/dashboard or /community",
    note: "Diviner who is also a Perennial Mandalism member",
  },
  {
    email: "pm.trainee@test.astrologypro.com",
    name:  "Wren Ashby",         username: "wren-ashby",
    roles: ["trainee", "pm"],
    portal: "/trainee or /community",
    note: "Trainee who is also a Perennial Mandalism member",
  },
  {
    email: "pm.client@test.astrologypro.com",
    name:  "Indigo Marsh",       username: null,
    roles: ["client", "pm"],
    portal: "/portal or /community",
    note: "Client who is also a Perennial Mandalism member",
  },
  {
    email: "pm.advocate@test.astrologypro.com",
    name:  "Cleo Hawthorne",     username: "cleo-hawthorne",
    roles: ["advocate", "pm"],
    portal: "/advocate or /community",
    note: "Social Advocate who is also a Perennial Mandalism member",
  },
  {
    email: "pm.ms@test.astrologypro.com",
    name:  "Dusk Mercer",        username: null,
    roles: ["pm", "ms"],
    portal: "/community",
    note: "Both Perennial Mandalism and Mystery School member",
  },

  // ── PM + two other roles ──────────────────────────────────────────────────
  {
    email: "pm.diviner.trainee@test.astrologypro.com",
    name:  "Lycan Voss",         username: "lycan-voss",
    roles: ["diviner", "trainee", "pm"],
    portal: "/switch",
    note: "Diviner + Trainee + Perennial Mandalism",
  },
  {
    email: "pm.diviner.ms@test.astrologypro.com",
    name:  "Aether Blaine",      username: "aether-blaine",
    roles: ["diviner", "pm", "ms"],
    portal: "/switch",
    note: "Diviner + Perennial Mandalism + Mystery School",
  },
  {
    email: "pm.trainee.ms@test.astrologypro.com",
    name:  "Cosima Reed",        username: "cosima-reed",
    roles: ["trainee", "pm", "ms"],
    portal: "/switch",
    note: "Trainee + Perennial Mandalism + Mystery School",
  },
  {
    email: "pm.client.advocate@test.astrologypro.com",
    name:  "Onyx Fairfax",       username: "onyx-fairfax",
    roles: ["client", "advocate", "pm"],
    portal: "/switch",
    note: "Client + Social Advocate + Perennial Mandalism",
  },
  {
    email: "pm.diviner.client@test.astrologypro.com",
    name:  "Vesper Laine",       username: "vesper-laine",
    roles: ["diviner", "client", "pm"],
    portal: "/switch",
    note: "Diviner + Client + Perennial Mandalism",
  },
  {
    email: "pm.trainee.advocate@test.astrologypro.com",
    name:  "Sage Orton",         username: "sage-orton",
    roles: ["trainee", "advocate", "pm"],
    portal: "/switch",
    note: "Trainee + Social Advocate + Perennial Mandalism",
  },

  // ── PM + three roles ──────────────────────────────────────────────────────
  {
    email: "pm.diviner.trainee.ms@test.astrologypro.com",
    name:  "Zephyr Crane",       username: "zephyr-crane",
    roles: ["diviner", "trainee", "pm", "ms"],
    portal: "/switch",
    note: "Diviner + Trainee + Perennial Mandalism + Mystery School",
  },
  {
    email: "pm.diviner.advocate.ms@test.astrologypro.com",
    name:  "Nimbus Cross",       username: "nimbus-cross",
    roles: ["diviner", "advocate", "pm", "ms"],
    portal: "/switch",
    note: "Diviner + Advocate + Perennial Mandalism + Mystery School",
  },
  {
    email: "pm.client.ms@test.astrologypro.com",
    name:  "Selene Park",        username: null,
    roles: ["client", "pm", "ms"],
    portal: "/switch",
    note: "Client + Perennial Mandalism + Mystery School",
  },

  // ── All roles ─────────────────────────────────────────────────────────────
  {
    email: "pm.all@test.astrologypro.com",
    name:  "Omni Stellaris",     username: "omni-stellaris",
    roles: ["diviner", "trainee", "client", "advocate", "pm", "ms"],
    portal: "/switch",
    note: "ALL roles — full multi-role test account",
  },

  // ── Other notable combos (no PM) ──────────────────────────────────────────
  {
    email: "diviner.trainee@test.astrologypro.com",
    name:  "Sirius Kane",        username: "sirius-kane",
    roles: ["diviner", "trainee"],
    portal: "/switch",
    note: "Diviner who is also enrolled as a Trainee",
  },
  {
    email: "diviner.advocate@test.astrologypro.com",
    name:  "Celeste Draven",     username: "celeste-draven",
    roles: ["diviner", "advocate"],
    portal: "/switch",
    note: "Diviner + Social Advocate",
  },
  {
    email: "diviner.ms@test.astrologypro.com",
    name:  "Nox Whitmore",       username: "nox-whitmore",
    roles: ["diviner", "ms"],
    portal: "/switch",
    note: "Diviner + Mystery School member",
  },
  {
    email: "trainee.ms@test.astrologypro.com",
    name:  "Aquila Frost",       username: "aquila-frost",
    roles: ["trainee", "ms"],
    portal: "/switch",
    note: "Trainee + Mystery School member",
  },
  {
    email: "trainee.advocate@test.astrologypro.com",
    name:  "Lyra Sutton",        username: "lyra-sutton",
    roles: ["trainee", "advocate"],
    portal: "/switch",
    note: "Trainee + Social Advocate",
  },
  {
    email: "client.ms@test.astrologypro.com",
    name:  "Vesper Nolan",       username: null,
    roles: ["client", "ms"],
    portal: "/switch",
    note: "Client + Mystery School member",
  },
  {
    email: "diviner.trainee.ms@test.astrologypro.com",
    name:  "Soleil Kwan",        username: "soleil-kwan",
    roles: ["diviner", "trainee", "ms"],
    portal: "/switch",
    note: "Diviner + Trainee + Mystery School",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

section("Processing multi-role users");
console.log(`\n  Total accounts to seed: ${MULTI_USERS.length}`);
console.log(`  Password for all: ${PASSWORD}\n`);

for (const u of MULTI_USERS) {
  console.log(`\n→ [${u.roles.join(" + ")}]  ${u.email}`);
  try {
    const uid = await authUser(u.email);

    if (u.roles.includes("diviner"))   await asDiviner(uid, u.name, u.username ?? u.email.split("@")[0]);
    if (u.roles.includes("trainee"))   await asTrainee(uid, u.email, u.name, u.username ?? u.email.split("@")[0]);
    if (u.roles.includes("client"))    await asClient(uid, u.email, u.name);
    if (u.roles.includes("advocate"))  await asAdvocate(uid, u.email, u.name, u.username ?? u.email.split("@")[0]);
    if (u.roles.includes("pm"))        await asPM(uid, u.email, u.name);
    if (u.roles.includes("ms"))        await asMS(uid, u.email, u.name);

    console.log(`  ✅ ${u.note}`);
  } catch (err) {
    console.error(`  ❌ Failed: ${err.message}`);
  }
}

console.log(`
${"═".repeat(58)}
  ✅  Multi-Role Seed Complete!
${"═".repeat(58)}

  ${MULTI_USERS.length} accounts seeded.  Password: ${PASSWORD}

  PM COMBOS (${MULTI_USERS.filter(u => u.roles.includes("pm")).length} accounts)
  ─────────────────────────────────────────────
${MULTI_USERS
  .filter(u => u.roles.includes("pm"))
  .map(u => `  ${u.email.padEnd(52)} [${u.roles.join("+")}]`)
  .join("\n")}

  OTHER COMBOS (${MULTI_USERS.filter(u => !u.roles.includes("pm")).length} accounts)
  ─────────────────────────────────────────────
${MULTI_USERS
  .filter(u => !u.roles.includes("pm"))
  .map(u => `  ${u.email.padEnd(52)} [${u.roles.join("+")}]`)
  .join("\n")}

${"═".repeat(58)}
`);
