#!/usr/bin/env node
/**
 * Runs a SQL migration against Supabase using the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.js supabase/migrations/20260403000001_diviner_profile_fields.sql
 *
 * Get your access token at: https://supabase.com/dashboard/account/tokens
 * (Personal access token — not the service role key)
 *
 * The project ref is auto-detected from NEXT_PUBLIC_SUPABASE_URL in .env.local.
 */

const path = require("path");
const fs = require("fs");

// ─── Load .env.local ────────────────────────────────────────────────────────
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

// ─── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN; // personal access token

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL not set in .env.local");
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error("❌ Missing SUPABASE_ACCESS_TOKEN");
  console.error("   Get one at: https://supabase.com/dashboard/account/tokens");
  console.error("   Then run:");
  console.error("   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.js <file.sql>");
  process.exit(1);
}

// Extract project ref from URL: https://wyluvclvtvwptsvvtgkv.supabase.co
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
if (!projectRef) {
  console.error("❌ Could not extract project ref from SUPABASE_URL:", SUPABASE_URL);
  process.exit(1);
}

// ─── Migration file ──────────────────────────────────────────────────────────
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.js <file.sql>");
  process.exit(1);
}

const sqlPath = path.isAbsolute(migrationFile)
  ? migrationFile
  : path.join(process.cwd(), migrationFile);

if (!fs.existsSync(sqlPath)) {
  console.error("❌ File not found:", sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

// ─── Run via Management API ──────────────────────────────────────────────────
async function main() {
  console.log(`🗄️  Migration: ${path.basename(sqlPath)}`);
  console.log(`   Project:   ${projectRef}`);
  console.log(`   Endpoint:  https://api.supabase.com/v1/projects/${projectRef}/database/query\n`);

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await res.text();

  if (res.ok) {
    console.log("✅ Migration applied successfully.");
    try {
      const json = JSON.parse(body);
      if (Array.isArray(json) && json.length > 0) {
        console.log("   Result:", JSON.stringify(json, null, 2));
      }
    } catch {
      // non-JSON response is fine for DDL
    }
  } else {
    console.error(`❌ Failed (HTTP ${res.status}):`);
    try {
      const json = JSON.parse(body);
      console.error("  ", JSON.stringify(json, null, 2));
    } catch {
      console.error("  ", body);
    }

    console.error("\n💡 Fallback: paste the SQL into the Supabase SQL editor:");
    console.error(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
