#!/usr/bin/env node
/**
 * Create the admin test user for AstrologyPro.
 *
 * Usage:
 *   node scripts/create-admin-user.js
 *
 * Creates: test-diviner@astrologypro.com / TestDiviner123!
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

const EMAIL = "test-diviner@astrologypro.com";
const PASSWORD = "TestDiviner123!";

async function createAdminUser() {
  console.log("🌟 AstrologyPro — Create Admin User");
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Email: ${EMAIL}\n`);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin" },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.msg || data?.message || JSON.stringify(data);
    if (msg.includes("already") || msg.includes("registered")) {
      console.log(`  ⏭  ${EMAIL} already exists — no action needed`);
      return;
    }
    console.error(`  ❌ Failed to create user:`, msg);
    process.exit(1);
  }

  console.log(`  ✅ Created: ${EMAIL}`);
  console.log(`  ID: ${data.id}`);
  console.log(`\n✅ Done!`);
  console.log(`\nAdmin credentials:`);
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
}

createAdminUser().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
