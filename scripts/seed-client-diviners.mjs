#!/usr/bin/env node
/**
 * seed-client-diviners.mjs
 *
 * Backfills client_diviners rows from existing bookings.
 * For every unique (client_id, diviner_id) pair in bookings, computes:
 *   - total_sessions  (count of completed bookings)
 *   - total_spent     (sum of base_price on completed bookings)
 *   - last_session_at (max scheduled_at of completed bookings)
 *   - first_session_at (min scheduled_at of all bookings)
 *
 * Safe to run multiple times — uses upsert with conflict on (client_id, diviner_id).
 *
 * Run: node scripts/seed-client-diviners.mjs
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const BASE = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: "return=representation",
};

async function api(path, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { ...opts, headers: { ...BASE, ...(opts.headers ?? {}) } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log("\n── Backfilling client_diviners from bookings ──────────────────");

  // 1. Fetch all bookings with a client_id and diviner_id
  const bookings = await api(
    "bookings?select=id,client_id,diviner_id,status,scheduled_at,base_price&client_id=not.is.null&diviner_id=not.is.null&limit=2000"
  );
  console.log(`  Found ${bookings.length} bookings with client + diviner`);

  // 2. Group by (client_id, diviner_id)
  const map = new Map();
  for (const b of bookings) {
    const key = `${b.client_id}::${b.diviner_id}`;
    if (!map.has(key)) {
      map.set(key, {
        client_id: b.client_id,
        diviner_id: b.diviner_id,
        owner_id: b.diviner_id,
        all_dates: [],
        completed_dates: [],
        total_sessions: 0,
        total_spent: 0,
      });
    }
    const entry = map.get(key);
    entry.all_dates.push(b.scheduled_at);
    if (b.status === "completed") {
      entry.completed_dates.push(b.scheduled_at);
      entry.total_sessions += 1;
      entry.total_spent += Number(b.base_price ?? 0);
    }
  }

  // 3. Build upsert rows
  const rows = [];
  for (const entry of map.values()) {
    entry.all_dates.sort();
    entry.completed_dates.sort();
    rows.push({
      client_id: entry.client_id,
      diviner_id: entry.diviner_id,
      owner_id: entry.owner_id,
      total_sessions: entry.total_sessions,
      total_spent: Number(entry.total_spent.toFixed(2)),
      first_session_at: entry.all_dates[0] ?? null,
      last_session_at: entry.completed_dates[entry.completed_dates.length - 1] ?? null,
    });
  }

  console.log(`  Computed ${rows.length} unique client–diviner relationships`);

  if (rows.length === 0) {
    console.log("  Nothing to upsert.");
    return;
  }

  // 4. Upsert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await api("client_diviners?on_conflict=client_id,diviner_id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(batch),
    });
    inserted += batch.length;
    console.log(`  Upserted ${inserted}/${rows.length}`);
  }

  console.log(`\n✅  Done — ${rows.length} client_diviners rows seeded`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
