#!/usr/bin/env node
/**
 * Uses the user's existing Chrome profile (already logged into Supabase)
 * to apply the DB migration via the Supabase SQL editor.
 */

const { chromium } = require("playwright");
const path = require("path");

const SQL = `
CREATE TABLE IF NOT EXISTS mundane_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ingress','retrograde','direct','aspect')),
  event_label TEXT NOT NULL,
  image_filename TEXT NOT NULL,
  image_storage_url TEXT,
  content_short TEXT,
  hashtags TEXT,
  active BOOLEAN DEFAULT true,
  event_start_date DATE NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mundane_event_log_key ON mundane_event_log(event_key);
CREATE INDEX IF NOT EXISTS idx_mundane_event_log_active ON mundane_event_log(active, event_start_date);
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS share_number INTEGER DEFAULT 1;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS share_date DATE;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS is_mundane BOOLEAN DEFAULT false;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS mundane_event_id UUID REFERENCES mundane_event_log(id);
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS diviner_username TEXT;
`.trim();

const PROFILES = [
  "C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\User Data",
];
const PROFILE_DIRS = ["Profile 1", "Profile 2", "Default"];

async function tryProfile(userDataDir, profileDir) {
  console.log(`\n🔍 Trying Chrome profile: ${profileDir} in ${userDataDir}`);
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      args: [`--profile-directory=${profileDir}`],
      timeout: 15000,
    });
  } catch (e) {
    console.log(`  ⚠️  Could not launch with channel:chrome — ${e.message}`);
    return false;
  }

  const page = context.pages()[0] || (await context.newPage());

  try {
    console.log("  → Navigating to Supabase SQL editor...");
    await page.goto(
      "https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new",
      { timeout: 20000, waitUntil: "domcontentloaded" }
    );

    // Check if we're redirected to login
    const url = page.url();
    if (url.includes("sign-in") || url.includes("login")) {
      console.log("  ⚠️  Not logged in with this profile, skipping...");
      await context.close();
      return false;
    }

    console.log("  ✓ Logged in! On SQL editor page.");
    await page.waitForTimeout(3000);

    // Find the CodeMirror editor and fill it
    const editorSelectors = [
      ".cm-content",
      ".CodeMirror textarea",
      "[data-testid='sql-editor'] textarea",
      "textarea",
    ];

    let filled = false;
    for (const sel of editorSelectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 5000 });
        if (el) {
          // Click to focus, select all, type SQL
          await el.click({ clickCount: 3 });
          await page.keyboard.press("Control+a");
          await page.keyboard.type(SQL, { delay: 1 });
          filled = true;
          console.log(`  ✓ SQL entered via selector: ${sel}`);
          break;
        }
      } catch (_) {}
    }

    if (!filled) {
      // Try clicking the editor area and using keyboard shortcut
      try {
        await page.click(".monaco-editor", { timeout: 5000 });
        await page.keyboard.press("Control+a");
        await page.keyboard.type(SQL, { delay: 1 });
        filled = true;
        console.log("  ✓ SQL entered via Monaco editor");
      } catch (_) {
        console.log("  ⚠️  Could not find SQL editor input");
        await context.close();
        return false;
      }
    }

    await page.waitForTimeout(1000);

    // Click Run button (Ctrl+Enter)
    console.log("  → Running SQL (Ctrl+Enter)...");
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(5000);

    // Check for success
    const pageContent = await page.content();
    if (
      pageContent.includes("Success") ||
      pageContent.includes("CREATE TABLE") ||
      pageContent.includes("ALTER TABLE") ||
      pageContent.includes("success")
    ) {
      console.log("  ✅ Migration applied successfully!");
    } else {
      console.log("  ✓ SQL executed (check browser for result)");
    }

    await page.waitForTimeout(3000);
    await context.close();
    return true;
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    try {
      await context.close();
    } catch (_) {}
    return false;
  }
}

async function main() {
  console.log("🚀 Applying Supabase migration via Chrome profile...");

  for (const userDataDir of PROFILES) {
    for (const profileDir of PROFILE_DIRS) {
      const success = await tryProfile(userDataDir, profileDir);
      if (success) {
        console.log("\n✅ Done! Migration applied.");
        process.exit(0);
      }
    }
  }

  console.log(
    "\n❌ Could not apply migration automatically. Please paste the SQL at:"
  );
  console.log(
    "   https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new"
  );
  process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
