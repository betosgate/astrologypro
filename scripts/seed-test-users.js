#!/usr/bin/env node
/**
 * Seed test users for every role in AstrologyPro.
 *
 * Usage:
 *   node scripts/seed-test-users.js
 *
 * Reads .env.local automatically.
 * Creates 44 users (30 single-role + 14 multi-role) in Supabase.
 * All passwords: TestUser123!
 */

const path = require("path");
const fs = require("fs");

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
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const PASSWORD = "TestUser123!";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function supabaseAdmin(path, body, method = "POST") {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function dbQuery(sql) {
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "sbp_1874cdc24ab679684b564c35e7103a66c39f29e2";
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  try { return { ok: res.ok, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, data: text }; }
}

async function createAuthUser(email, role) {
  const result = await supabaseAdmin("/users", {
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });
  if (!result.ok) {
    if (result.data?.msg?.includes("already been registered") || result.data?.message?.includes("already")) {
      console.log(`  ⏭  ${email} already exists, skipping auth create`);
      // Try to fetch existing user
      const listRes = await supabaseAdmin(`/users?email=${encodeURIComponent(email)}`, null, "GET");
      if (listRes.ok && listRes.data?.users?.length > 0) return listRes.data.users[0];
      return null;
    }
    console.error(`  ❌ Failed to create auth user ${email}:`, result.data);
    return null;
  }
  return result.data;
}

function randomReferralCode(username) {
  return username.toUpperCase().replace(/-/g, "").slice(0, 8) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
}

// ─── Role creators ────────────────────────────────────────────────────────────

async function insertDiviner(userId, username, displayName) {
  const r = await dbQuery(`
    INSERT INTO diviners (user_id, username, display_name, subscription_status, is_active, onboarding_completed)
    VALUES ('${userId}', '${username}', '${displayName}', 'active', true, true)
    ON CONFLICT (user_id) DO NOTHING;
  `);
  if (!r.ok) console.error(`    ❌ diviner insert failed:`, r.data);
}

async function insertClient(userId, email, fullName) {
  const r = await dbQuery(`
    INSERT INTO clients (user_id, email, full_name)
    VALUES ('${userId}', '${email}', '${fullName}')
    ON CONFLICT (user_id) DO NOTHING;
  `);
  if (!r.ok) console.error(`    ❌ client insert failed:`, r.data);
}

async function insertAdvocate(userId, username, name, email) {
  const referralCode = randomReferralCode(username);
  const r = await dbQuery(`
    INSERT INTO social_advocates (user_id, username, name, email, referral_code, is_active, onboarding_completed)
    VALUES ('${userId}', '${username}', '${name}', '${email}', '${referralCode}', true, true)
    ON CONFLICT (user_id) DO NOTHING;
  `);
  if (!r.ok) console.error(`    ❌ advocate insert failed:`, r.data);
}

async function insertCommunityMember(userId, email, fullName, membershipType) {
  const r = await dbQuery(`
    INSERT INTO community_members (user_id, email, full_name, membership_type, membership_status)
    VALUES ('${userId}', '${email}', '${fullName}', '${membershipType}', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  `);
  if (!r.ok) console.error(`    ❌ community_member (${membershipType}) insert failed:`, r.data);
}

async function insertTrainee(userId, username, name, email) {
  const r = await dbQuery(`
    INSERT INTO trainees (user_id, username, name, email, training_status, onboarding_completed)
    VALUES ('${userId}', '${username}', '${name}', '${email}', 'active', true)
    ON CONFLICT (user_id) DO NOTHING;
  `);
  if (!r.ok) console.error(`    ❌ trainee insert failed:`, r.data);
}

// ─── User definitions ─────────────────────────────────────────────────────────

const SINGLE_ROLE_USERS = [
  // Diviners
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `diviner${i + 1}@test.astrologypro.com`,
    role: "diviner",
    label: `Test Diviner ${i + 1}`,
    username: `test-diviner-${i + 1}`,
    portal: "/dashboard",
  })),
  // Clients
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `client${i + 1}@test.astrologypro.com`,
    role: "client",
    label: `Test Client ${i + 1}`,
    portal: "/portal",
  })),
  // Social Advocates
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `advocate${i + 1}@test.astrologypro.com`,
    role: "social_advo",
    label: `Test Advocate ${i + 1}`,
    username: `test-advocate-${i + 1}`,
    portal: "/advocate",
  })),
  // Perennial Mandalism
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `perennial${i + 1}@test.astrologypro.com`,
    role: "perennial_mandalism",
    label: `Test Perennial ${i + 1}`,
    portal: "/community",
  })),
  // Mystery School
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `mysteryschool${i + 1}@test.astrologypro.com`,
    role: "mystery_school",
    label: `Test Mystery School ${i + 1}`,
    portal: "/community",
  })),
  // Trainees
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `trainee${i + 1}@test.astrologypro.com`,
    role: "trainee",
    label: `Test Trainee ${i + 1}`,
    username: `test-trainee-${i + 1}`,
    portal: "/trainee",
  })),
];

const MULTI_ROLE_USERS = [
  { email: "multi-client-advo@test.astrologypro.com",       roles: ["client", "social_advo"],                              label: "Client + Social Advocate",                    portal: "/portal (also /advocate)" },
  { email: "multi-diviner-pm@test.astrologypro.com",        roles: ["diviner", "perennial_mandalism"],                     label: "Diviner + Perennial Mandalism",               portal: "/switch" },
  { email: "multi-diviner-ms@test.astrologypro.com",        roles: ["diviner", "mystery_school"],                          label: "Diviner + Mystery School",                    portal: "/switch" },
  { email: "multi-advo-pm@test.astrologypro.com",           roles: ["social_advo", "perennial_mandalism"],                 label: "Advocate + Perennial Mandalism",              portal: "/switch" },
  { email: "multi-advo-ms@test.astrologypro.com",           roles: ["social_advo", "mystery_school"],                     label: "Advocate + Mystery School",                   portal: "/switch" },
  { email: "multi-client-pm@test.astrologypro.com",         roles: ["client", "perennial_mandalism"],                     label: "Client + Perennial Mandalism",                portal: "/switch" },
  { email: "multi-client-ms@test.astrologypro.com",         roles: ["client", "mystery_school"],                          label: "Client + Mystery School",                     portal: "/switch" },
  { email: "multi-trainee-pm@test.astrologypro.com",        roles: ["trainee", "perennial_mandalism"],                    label: "Trainee + Perennial Mandalism",               portal: "/switch" },
  { email: "multi-trainee-ms@test.astrologypro.com",        roles: ["trainee", "mystery_school"],                         label: "Trainee + Mystery School",                    portal: "/switch" },
  { email: "multi-diviner-pm-ms@test.astrologypro.com",     roles: ["diviner", "perennial_mandalism", "mystery_school"],  label: "Diviner + PM + Mystery School",               portal: "/switch" },
  { email: "multi-client-advo-pm@test.astrologypro.com",    roles: ["client", "social_advo", "perennial_mandalism"],      label: "Client + Advocate + PM",                      portal: "/switch" },
  { email: "multi-diviner-trainee-ms@test.astrologypro.com",roles: ["diviner", "trainee", "mystery_school"],              label: "Diviner + Trainee + Mystery School",          portal: "/switch" },
  { email: "multi-advo-pm-ms@test.astrologypro.com",        roles: ["social_advo", "perennial_mandalism", "mystery_school"], label: "Advocate + PM + Mystery School",           portal: "/switch" },
  { email: "multi-all@test.astrologypro.com",               roles: ["diviner", "client", "social_advo", "perennial_mandalism", "mystery_school", "trainee"], label: "All Roles", portal: "/switch" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function processSingleUser(u) {
  console.log(`\n→ ${u.email} [${u.role}]`);
  const authUser = await createAuthUser(u.email, u.role);
  if (!authUser) return null;
  const uid = authUser.id;
  const name = u.label;

  if (u.role === "diviner")              await insertDiviner(uid, u.username, name);
  if (u.role === "client")               await insertClient(uid, u.email, name);
  if (u.role === "social_advo")          await insertAdvocate(uid, u.username, name, u.email);
  if (u.role === "perennial_mandalism")  await insertCommunityMember(uid, u.email, name, "perennial_mandalism");
  if (u.role === "mystery_school")       await insertCommunityMember(uid, u.email, name, "mystery_school");
  if (u.role === "trainee")              await insertTrainee(uid, u.username, name, u.email);

  console.log(`  ✅ Created`);
  return uid;
}

async function processMultiUser(u) {
  console.log(`\n→ ${u.email} [${u.roles.join(" + ")}]`);
  const primaryRole = u.roles[0];
  const authUser = await createAuthUser(u.email, primaryRole);
  if (!authUser) return null;
  const uid = authUser.id;
  const slug = u.email.split("@")[0];
  const name = u.label;

  for (const role of u.roles) {
    if (role === "diviner")             await insertDiviner(uid, `${slug}-div`, name);
    if (role === "client")              await insertClient(uid, u.email, name);
    if (role === "social_advo")         await insertAdvocate(uid, `${slug}-adv`, name, u.email);
    if (role === "perennial_mandalism") await insertCommunityMember(uid, u.email, name, "perennial_mandalism");
    if (role === "mystery_school")      await insertCommunityMember(uid, u.email, name, "mystery_school");
    if (role === "trainee")             await insertTrainee(uid, `${slug}-tr`, name, u.email);
  }

  console.log(`  ✅ Created`);
  return uid;
}

async function main() {
  console.log("🌟 AstrologyPro — Test User Seed");
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Password for all: ${PASSWORD}\n`);

  console.log("── Single-role users (30) ──────────────────────────────────");
  for (const u of SINGLE_ROLE_USERS) await processSingleUser(u);

  console.log("\n── Multi-role users (14) ───────────────────────────────────");
  for (const u of MULTI_ROLE_USERS) await processMultiUser(u);

  console.log("\n✅ Done! All test users created.");
  console.log("   See docs/test-users.md for the full credential list.\n");
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
