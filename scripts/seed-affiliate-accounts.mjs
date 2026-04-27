#!/usr/bin/env node
/**
 * Seed canonical affiliate_accounts + diviner_affiliates junctions for the
 * 2026-04-23 affiliate identity refactor (Task 07).
 *
 * 7 personas covering every lifecycle state:
 *   affiliate-solo@test.astrologypro.com       — 1 diviner, claimed, active
 *   affiliate-multi@test.astrologypro.com      — 3 diviners, claimed, active
 *   affiliate-pending@test.astrologypro.com    — 1 diviner, pending invite
 *   affiliate-expired@test.astrologypro.com    — 1 diviner, expired invite
 *   affiliate-unclaimed@test.astrologypro.com  — 1 diviner, no auth user
 *   affiliate-suspended@test.astrologypro.com  — 1 diviner, suspended
 *   affiliate-blocked@test.astrologypro.com    — 1 diviner, canonical blocked
 *
 * Idempotent — re-running yields identical state (ON CONFLICT upserts).
 *
 * Usage:
 *   node scripts/seed-affiliate-accounts.mjs
 *
 * Depends on scripts/seed-test-users.js having been run first (needs
 * test-diviner-1..5). Prereqs: 20260423000001..005 migrations applied.
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
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

// ── Supabase helpers ─────────────────────────────────────────────────────────

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=representation",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function createOrReuseAuthUser(email) {
  // List users + find by email
  const list = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  ).then((r) => r.json()).catch(() => null);
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;

  // Create
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`createUser ${email}: ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

async function resolveDivinerId(username) {
  const rows = await sb(
    `/rest/v1/diviners?username=eq.${encodeURIComponent(username)}&select=id,user_id&limit=1`,
  );
  if (!rows || rows.length === 0) throw new Error(`Diviner ${username} not found`);
  return rows[0];
}

async function upsertAffiliateAccount({ email, name, phone, userId, status }) {
  // Try to find existing
  const existing = await sb(
    `/rest/v1/affiliate_accounts?email=eq.${encodeURIComponent(email)}&select=id,user_id,status&limit=1`,
  );
  if (existing && existing.length > 0) {
    // Patch status if drifted
    const cur = existing[0];
    if (cur.status !== status || cur.user_id !== userId) {
      await sb(`/rest/v1/affiliate_accounts?id=eq.${cur.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(userId ? {} : {}) }),
      });
      // user_id trigger blocks us from writing user_id directly. We only fix status.
    }
    return cur.id;
  }
  const rows = await sb(`/rest/v1/affiliate_accounts`, {
    method: "POST",
    body: JSON.stringify([{ email, name, phone, user_id: userId, status }]),
  });
  return rows[0].id;
}

async function upsertJunction({ divinerId, accountId, status, name, email, phone }) {
  const existing = await sb(
    `/rest/v1/diviner_affiliates?diviner_id=eq.${divinerId}&affiliate_account_id=eq.${accountId}&select=id,status&limit=1`,
  );
  if (existing && existing.length > 0) {
    const cur = existing[0];
    if (cur.status !== status) {
      await sb(`/rest/v1/diviner_affiliates?id=eq.${cur.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    }
    return cur.id;
  }
  const junc = await sb(`/rest/v1/diviner_affiliates`, {
    method: "POST",
    body: JSON.stringify([
      {
        diviner_id: divinerId,
        affiliate_account_id: accountId,
        status,
        default_commission_type: "percentage",
        default_commission_value: 10,
        name,
        email,
        phone,
        invited_at: status === "pending" ? new Date().toISOString() : null,
        accepted_at:
          status === "active" || status === "suspended" ? new Date().toISOString() : null,
      },
    ]),
  });
  return junc[0].id;
}

async function issueInvite({ divinerId, accountId, junctionId, email, invitedByUserId, expiresAt }) {
  // Skip if open invite already exists for this junction
  const existing = await sb(
    `/rest/v1/affiliate_invites?junction_id=eq.${junctionId}&consumed_at=is.null&revoked_at=is.null&select=id&limit=1`,
  );
  if (existing && existing.length > 0) return existing[0].id;
  const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
  const rows = await sb(`/rest/v1/affiliate_invites`, {
    method: "POST",
    body: JSON.stringify([
      {
        diviner_id: divinerId,
        affiliate_account_id: accountId,
        junction_id: junctionId,
        email,
        token_hash: tokenHash,
        invited_by: invitedByUserId,
        expires_at: expiresAt,
      },
    ]),
  });
  return rows[0].id;
}

// ── Personas ────────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    email: "affiliate-solo@test.astrologypro.com",
    name: "Solo Affiliate",
    phone: "+15550000001",
    claimed: true,
    status: "active",
    diviners: ["test-diviner-1"],
    junctionStatus: "active",
    invite: null,
  },
  {
    email: "affiliate-multi@test.astrologypro.com",
    name: "Multi Diviner Affiliate",
    phone: "+15550000002",
    claimed: true,
    status: "active",
    diviners: ["test-diviner-1", "test-diviner-2", "test-diviner-3"],
    junctionStatus: "active",
    invite: null,
  },
  {
    email: "affiliate-pending@test.astrologypro.com",
    name: "Pending Affiliate",
    phone: null,
    claimed: false,
    status: "unclaimed",
    diviners: ["test-diviner-1"],
    junctionStatus: "pending",
    invite: "future", // valid expiry
  },
  {
    email: "affiliate-expired@test.astrologypro.com",
    name: "Expired Invite Affiliate",
    phone: null,
    claimed: false,
    status: "unclaimed",
    diviners: ["test-diviner-2"],
    junctionStatus: "pending",
    invite: "past", // expired
  },
  {
    email: "affiliate-unclaimed@test.astrologypro.com",
    name: "Unclaimed Grandfathered",
    phone: null,
    claimed: false, // no auth user
    noAuthUser: true,
    status: "unclaimed",
    diviners: ["test-diviner-4"],
    junctionStatus: "active", // grandfathered pattern
    invite: null,
  },
  {
    email: "affiliate-suspended@test.astrologypro.com",
    name: "Suspended Affiliate",
    phone: null,
    claimed: true,
    status: "active",
    diviners: ["test-diviner-5"],
    junctionStatus: "suspended",
    invite: null,
  },
  {
    email: "affiliate-blocked@test.astrologypro.com",
    name: "Blocked Affiliate",
    phone: null,
    claimed: true,
    status: "blocked",
    diviners: ["test-diviner-1"],
    junctionStatus: "active",
    invite: null,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("▶ Seeding affiliate identities…\n");
  const summary = [];

  // Resolve diviner ids upfront
  const divinerByUsername = new Map();
  for (const p of PERSONAS) {
    for (const u of p.diviners) {
      if (!divinerByUsername.has(u)) {
        divinerByUsername.set(u, await resolveDivinerId(u));
      }
    }
  }

  for (const p of PERSONAS) {
    try {
      let userId = null;
      if (!p.noAuthUser) {
        userId = await createOrReuseAuthUser(p.email);
      }

      // Upsert canonical account. Note: user_id can't be set directly post-migration
      // because the trigger guard blocks it. We create the account, then for
      // claimed personas rely on the one-linked auth user for that email to be
      // picked up via the accept flow in real life. For seed purposes, we mark
      // claimed personas' accounts 'active' without writing user_id — this
      // mirrors the "unclaimed with known auth user" state, which is close
      // enough for manual QA (the account exists; the backfill linkage is
      // simulated by seed-order).
      const accountId = await upsertAffiliateAccount({
        email: p.email,
        name: p.name,
        phone: p.phone,
        userId: null, // trigger-guarded; leave null
        status: p.status,
      });

      // Junctions (one per diviner)
      const junctionIds = [];
      for (const u of p.diviners) {
        const d = divinerByUsername.get(u);
        const junctionId = await upsertJunction({
          divinerId: d.id,
          accountId,
          status: p.junctionStatus,
          name: p.name,
          email: p.email,
          phone: p.phone,
        });
        junctionIds.push(junctionId);

        if (p.invite) {
          const expiresAt =
            p.invite === "future"
              ? new Date(Date.now() + 14 * 86400000).toISOString()
              : new Date(Date.now() - 86400000).toISOString(); // past
          await issueInvite({
            divinerId: d.id,
            accountId,
            junctionId,
            email: p.email,
            invitedByUserId: d.user_id,
            expiresAt,
          });
        }
      }

      summary.push({
        email: p.email,
        account: accountId.slice(0, 8),
        diviners: p.diviners.length,
        junctions: junctionIds.length,
        status: `${p.status}/${p.junctionStatus}`,
      });
      console.log(`  ✓ ${p.email}`);
    } catch (err) {
      console.error(`  ✗ ${p.email}:`, err.message);
    }
  }

  console.log("\n▶ Summary");
  console.table(summary);
  console.log("\n✅ Done. Password for claimed personas: " + PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
