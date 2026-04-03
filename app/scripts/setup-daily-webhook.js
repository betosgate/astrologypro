#!/usr/bin/env node
/**
 * One-time setup script: registers the Daily.co webhook for AstrologyPro.
 * Run once after deployment. Safe to re-run — it checks for existing webhooks first.
 *
 * Usage:
 *   node scripts/setup-daily-webhook.js
 *
 * Requires DAILY_API_KEY in .env.local (or environment).
 */

const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com";

if (!DAILY_API_KEY || DAILY_API_KEY === "your-daily-api-key") {
  console.error("❌ DAILY_API_KEY not set. Add it to .env.local and re-run.");
  process.exit(1);
}

const WEBHOOK_URL = `${APP_URL.replace("http://localhost:3000", "https://astrologypro.com")}/api/daily/webhook`;

const EVENT_TYPES = [
  "recording.ready-to-download",
  "meeting.started",
  "meeting.ended",
  "participant.joined",
  "participant.left",
];

async function dailyRequest(method, path, body) {
  const res = await fetch(`https://api.daily.co/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Daily API ${method} ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("🔍 Checking existing Daily.co webhooks...");

  // List existing webhooks
  const existing = await dailyRequest("GET", "/webhooks");
  const hooks = existing.data || [];

  const alreadyRegistered = hooks.find((h) => h.url === WEBHOOK_URL);
  if (alreadyRegistered) {
    console.log(`✅ Webhook already registered (id: ${alreadyRegistered.id})`);
    console.log(`   URL: ${alreadyRegistered.url}`);
    console.log(`   Events: ${alreadyRegistered.event_types?.join(", ")}`);
    return;
  }

  console.log(`📡 Registering webhook: ${WEBHOOK_URL}`);
  console.log(`   Events: ${EVENT_TYPES.join(", ")}`);

  const result = await dailyRequest("POST", "/webhooks", {
    url: WEBHOOK_URL,
  });

  console.log("✅ Webhook registered successfully!");
  console.log(`   ID:     ${result.id}`);
  console.log(`   URL:    ${result.url}`);
  console.log(`   Events: ${result.event_types?.join(", ")}`);
  console.log("");
  console.log("💡 If Daily.co provides a webhook secret, add it to Vercel env as:");
  console.log("   DAILY_WEBHOOK_SECRET=<value from Daily.co dashboard>");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
