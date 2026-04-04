#!/usr/bin/env node
/**
 * review-legacy-users.js
 *
 * READ-ONLY — connects to the legacy MongoDB and prints a summary of all
 * users by role. No writes to Supabase.
 *
 * Usage:
 *   node scripts/review-legacy-users.js                   # dev DB (divine_infinity)
 *   node scripts/review-legacy-users.js --db divine_infinity_prod  # prod DB
 *   node scripts/review-legacy-users.js --csv             # output CSV to stdout
 */

"use strict";

const { MongoClient } = require("mongodb");

// Set LEGACY_MONGO_URI in your shell or .env.local before running
const MONGO_URI = process.env.LEGACY_MONGO_URI || "mongodb+srv://divine-infinity:0dtI9dxKMlBFcJiR@cluster0.pti1fnw.mongodb.net/";
const MONGO_DB  = process.argv.includes("--db")
  ? process.argv[process.argv.indexOf("--db") + 1]
  : "divine_infinity";
const CSV_MODE  = process.argv.includes("--csv");

// ─── Role label ───────────────────────────────────────────────────────────────

function roleLabel(doc) {
  const t   = (doc.user_type || "").trim();
  const out = [];
  if (t === "is_astrologer")             out.push("Diviner (Astrology)");
  if (t === "is_tarotreader")            out.push("Diviner (Tarot)");
  if (t === "is_astrologer_tarotreader") out.push("Diviner (Both)");
  if (doc.is_diviner === 1 && !out.length) out.push("Diviner");
  if (t === "is_customer")              out.push("Client");
  if (t === "is_customer_socialadvo")   out.push("Client + Advocate");
  if (t === "is_social_advo")           out.push("Social Advocate");
  if (t === "is_affiliate")             out.push("Affiliate/Advocate");
  if (t === "is_Perennial_Mandalism" || doc.is_perennial_mandalism === 1) out.push("Perennial Mandalism");
  if (doc.is_mystery_school === 1)      out.push("Mystery School");
  if (t === "is_admin")                 out.push("Admin");
  return out.length ? out.join(" / ") : `Unknown (${t || "no type"})`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!CSV_MODE) {
    console.log(`\n🔌 Connecting to MongoDB: ${MONGO_DB}`);
  }

  const mongo = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await mongo.connect();

  const col = mongo.db(MONGO_DB).collection("cognito_user_data");

  const all = await col
    .find({}, { sort: { created_at: 1 } })
    .project({ email: 1, firstname: 1, lastname: 1, name: 1, user_type: 1,
               is_diviner: 1, is_mystery_school: 1, is_perennial_mandalism: 1,
               status: 1, isDeleted: 1, created_at: 1, phone: 1, city: 1, state: 1 })
    .toArray();

  await mongo.close();

  if (!CSV_MODE) {
    // ── Role breakdown ─────────────────────────────────────────────────────────
    const roleBucket = {};
    for (const doc of all) {
      const label = roleLabel(doc);
      roleBucket[label] = (roleBucket[label] || 0) + 1;
    }

    const active   = all.filter(d => d.isDeleted !== 1 && d.status !== 0).length;
    const deleted  = all.filter(d => d.isDeleted === 1).length;
    const noEmail  = all.filter(d => !d.email).length;

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Legacy MongoDB — User Snapshot (${MONGO_DB})`);
    console.log(`${"─".repeat(60)}`);
    console.log(`  Total records    : ${all.length}`);
    console.log(`  Active (not del) : ${active}`);
    console.log(`  Soft-deleted     : ${deleted}`);
    console.log(`  Missing email    : ${noEmail}`);
    console.log(`\n  By Role:`);
    for (const [label, count] of Object.entries(roleBucket).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${label.padEnd(35)} ${count}`);
    }

    // ── Sample table — first 20 non-admin, non-deleted ─────────────────────────
    const sample = all
      .filter(d => d.isDeleted !== 1 && (d.user_type || "") !== "is_admin" && d.email)
      .slice(0, 30);

    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Sample (first 30 non-admin users):`);
    console.log(`${"─".repeat(60)}`);
    console.log(
      "  " +
      "Email".padEnd(38) +
      "Role".padEnd(28) +
      "Joined"
    );
    console.log("  " + "─".repeat(80));
    for (const doc of sample) {
      const email = (doc.email || "—").padEnd(38);
      const role  = roleLabel(doc).padEnd(28);
      const date  = fmtDate(doc.created_at);
      console.log(`  ${email}${role}${date}`);
    }
    console.log(`\n  Run with --csv for full export.\n`);

  } else {
    // ── CSV mode ───────────────────────────────────────────────────────────────
    const cols = ["email","name","phone","city","state","role","status","joined","deleted"];
    console.log(cols.join(","));
    for (const doc of all) {
      const row = [
        doc.email || "",
        ([doc.firstname, doc.lastname].filter(Boolean).join(" ") || doc.name || "").replace(/,/g, " "),
        (doc.phone || "").replace(/,/g, ""),
        (doc.city  || "").replace(/,/g, ""),
        (doc.state || "").replace(/,/g, ""),
        roleLabel(doc).replace(/,/g, " / "),
        doc.status ?? "",
        fmtDate(doc.created_at),
        doc.isDeleted === 1 ? "yes" : "no",
      ];
      console.log(row.join(","));
    }
  }
}

main().catch(err => {
  console.error("\n❌", err.message);
  process.exit(1);
});
