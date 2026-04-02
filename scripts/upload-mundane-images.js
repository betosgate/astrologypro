#!/usr/bin/env node
/**
 * One-time script: uploads all MundaneAstrology images to Supabase Storage.
 * Creates bucket "mundane-images" (public) and uploads all .jpg files.
 * Safe to re-run — uses upsert so existing files are overwritten.
 *
 * Usage: node scripts/upload-mundane-images.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const IMAGES_DIR = path.join(__dirname, "../../MundaneAstrology");
const BUCKET = "mundane-images";

async function supabaseStorageRequest(method, storagePath, fileBuffer) {
  const url = `${SUPABASE_URL}/storage/v1${storagePath}`;
  const headers = {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
  };
  if (fileBuffer) {
    headers["Content-Type"] = "image/jpeg";
    headers["x-upsert"] = "true";
  } else {
    headers["Content-Type"] = "application/json";
  }

  const opts = { method, headers };
  if (fileBuffer) opts.body = fileBuffer;

  const res = await fetch(url, opts);
  return res;
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ MundaneAstrology folder not found at: ${IMAGES_DIR}`);
    console.error(
      "   Expected path: C:\\Users\\Admin\\OneDrive\\Documents\\ClaudeProjects\\AstrologyPro\\MundaneAstrology"
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".jpg"));
  console.log(`📂 Found ${files.length} images in MundaneAstrology folder`);

  // Create bucket (409 = already exists, that's fine)
  console.log("🪣 Creating/verifying storage bucket...");
  const bucketRes = await supabaseStorageRequest(
    "POST",
    "/bucket",
    Buffer.from(
      JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: 10485760,
      })
    )
  );
  if (bucketRes.ok) {
    console.log("  ✓ Bucket created");
  } else if (bucketRes.status === 409) {
    console.log("  ✓ Bucket already exists");
  } else {
    const t = await bucketRes.text();
    console.error(`  ❌ Bucket error: ${t}`);
  }

  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = path.join(IMAGES_DIR, filename);
    const fileBuffer = fs.readFileSync(filepath);

    process.stdout.write(
      `  [${String(i + 1).padStart(3)}/${files.length}] ${filename}...`
    );

    const res = await supabaseStorageRequest(
      "POST",
      `/object/${BUCKET}/${encodeURIComponent(filename)}`,
      fileBuffer
    );

    if (res.ok) {
      process.stdout.write(" ✓\n");
      uploaded++;
    } else {
      const t = await res.text();
      process.stdout.write(` ❌ (${res.status}: ${t.slice(0, 60)})\n`);
      errors++;
    }
  }

  const bucketUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
  console.log(
    `\n✅ Upload complete: ${uploaded} uploaded, ${errors} errors out of ${files.length} total`
  );
  console.log(`\n📷 Images accessible at:`);
  console.log(`   ${bucketUrl}/mars-in-capricorn.jpg`);
  console.log(`   ${bucketUrl}/mercury-retrograde.jpg`);
  console.log(`   ${bucketUrl}/jupiter-sextile-mercury.jpg`);
  console.log(
    `\n💡 Next step: run the Supabase migration to create mundane_event_log table.`
  );
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
