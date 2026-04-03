#!/usr/bin/env node
/**
 * Runs a SQL migration against Supabase using the service role key.
 * Usage: node scripts/run-migration.js <migration-file.sql>
 */

const path = require("path");
const fs = require("fs");

// Load .env.local (same pattern as setup-daily-webhook.js)
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\n$/, "")
      .trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Usage: node scripts/run-migration.js <migration-file.sql>");
  process.exit(1);
}

const sqlPath = path.isAbsolute(migrationFile)
  ? migrationFile
  : path.join(process.cwd(), migrationFile);

if (!fs.existsSync(sqlPath)) {
  console.error("❌ Migration file not found:", sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

async function main() {
  console.log("🗄️  Running migration:", path.basename(sqlPath));
  console.log("   Supabase:", SUPABASE_URL.slice(0, 40) + "...");

  // Split SQL into statements and run each via the pg REST endpoint
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`   ${statements.length} statements to execute`);

  let ok = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ";";
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}...`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ query: stmt }),
    });

    if (res.ok) {
      process.stdout.write(" ✓\n");
      ok++;
    } else {
      const body = await res.text();
      // Ignore "already exists" errors gracefully
      if (
        body.includes("already exists") ||
        body.includes("duplicate") ||
        body.includes("SQLSTATE 42P07") ||
        body.includes("SQLSTATE 42701")
      ) {
        process.stdout.write(" ✓ (already exists)\n");
        ok++;
      } else {
        process.stdout.write(` ❌ (${res.status}: ${body.slice(0, 100)})\n`);
        errors++;
      }
    }
  }

  if (errors === 0) {
    console.log(`\n✅ Migration complete: ${ok} statements succeeded`);
  } else {
    console.log(`\n⚠️  Migration finished with ${errors} errors, ${ok} succeeded`);
    // Try alternative: Supabase SQL editor API
    console.log("\n💡 If errors persist, apply this migration manually in the Supabase dashboard SQL editor:");
    console.log("   https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new");
    console.log("\nSQL to run:\n");
    console.log(sql);
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
