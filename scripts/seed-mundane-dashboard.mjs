#!/usr/bin/env node
/**
 * seed-mundane-dashboard.mjs
 *
 * Seeds /dashboard/mundane for a target user by calling the Mundane AI Lambda
 * to generate realistic content, then inserting into Supabase.
 *
 * Populates:
 *   - mundane_watchlists        (per-user)
 *   - mundane_astro_events      (global, next 7 days)
 *   - mundane_alert_notifications (per-user, unread)
 *   - mundane_research_projects (per-user, active)
 *   - mundane_project_notes     (per-user, linked to projects)
 *   - mundane_forecasts         (global, open, next 7 days)
 *
 * Idempotent-ish: existing user rows are deleted first (scoped to user).
 * Global tables are additive.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load .env.local manually (Node 22 --env-file also works but we want explicit path)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const TARGET_USER_ID = process.env.SEED_USER_ID || "99cbfaa5-35c0-4244-b703-189dd4decc69"; // test-diviner-2
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LAMBDA_URL = process.env.MUNDANE_AI_LAMBDA_URL;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env");
if (!LAMBDA_URL) throw new Error("Missing MUNDANE_AI_LAMBDA_URL");

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Date helpers ──────────────────────────────────────────────────────────
const now = new Date();
const iso = (d) => d.toISOString();
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);

// ─── Lambda call (with retry) ───────────────────────────────────────────────
async function callMundaneAIOnce(prompt, systemInstruction) {
  const body = {
    prompt: {
      instruction: systemInstruction,
      response_schema: { type: "object", properties: { text: { type: "string" } } },
      inputs: {
        with_values: {
          user_prompt: prompt,
          subject_label: "Dashboard seed",
          context: "",
          aspect_type: "general",
        },
      },
      rules: [
        "Respond ONLY with a valid JSON object. No prose, no markdown fences.",
        "Use realistic mundane astrology terminology.",
        "All dates in ISO 8601 UTC.",
      ],
    },
    skip_kb: true,
    structured_validate_fallback: true,
    confidence_threshold: 0,
    max_tokens: 4000,
    cache_version: "mundane-ai-general-v1",
    cache_nonce: randomUUID(),
    force_openai: true,
  };

  const res = await fetch(LAMBDA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const env = await res.json();
  if (!res.ok || !env.ok) {
    throw new Error(`Lambda error: ${JSON.stringify(env).slice(0, 4000)}`);
  }
  let text = env.data?.response ?? env.data?.answer ?? "";
  text = String(text).replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  // Unwrap up to 3 layers: string → {text:"..."} → {...actual payload}
  let val = text;
  for (let i = 0; i < 3; i++) {
    if (typeof val === "string") {
      const s = val.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      try {
        val = JSON.parse(s);
      } catch {
        break;
      }
    } else if (val && typeof val === "object" && typeof val.text === "string" && Object.keys(val).length === 1) {
      val = val.text;
    } else {
      break;
    }
  }
  if (!val || typeof val !== "object") {
    throw new Error("AI returned non-JSON: " + String(text).slice(0, 400));
  }
  return val;
}

async function callMundaneAI(prompt, systemInstruction, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await callMundaneAIOnce(prompt, systemInstruction);
    } catch (e) {
      lastErr = e;
      console.log(`    retry ${i}/${attempts} after: ${String(e.message).slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

// ─── Build prompt ──────────────────────────────────────────────────────────
async function main() {
  console.log("→ Fetching existing entities…");
  const { data: entityRows, error: eErr } = await sb
    .from("mundane_entities")
    .select("id,name,entity_type,flag_emoji")
    .eq("is_active", true)
    .order("name");
  if (eErr) throw eErr;

  // De-dup by name, prefer the e1* IDs (primary seed)
  const byName = new Map();
  for (const e of entityRows) {
    const existing = byName.get(e.name);
    if (!existing || e.id.startsWith("e1000000")) byName.set(e.name, e);
  }
  const entities = Array.from(byName.values());
  console.log(`  Found ${entities.length} unique entities`);

  const entityNames = entities.map((e) => e.name);
  const entityByName = (n) => entities.find((e) => e.name === n);

  const today = now.toISOString().slice(0, 10);
  const in7 = addDays(now, 7).toISOString().slice(0, 10);

  const sysInstr = "You are a mundane astrology analyst. Respond with ONLY a valid JSON object matching the requested schema. No markdown, no commentary.";

  // ── Call 1: astro_events + alerts + watchlist picks ──
  console.log("→ AI call 1/3: watchlist + astro_events + alerts…");
  const prompt1 = `Period: ${today} to ${in7}. Available entities: ${entityNames.join(", ")}.

Return JSON:
{
  "watchlist_entity_names": [5 names from the list above],
  "astro_events": [
    {"title":"...", "event_type":"conjunction|ingress|lunation|eclipse|opposition|station|retrograde|direct|great_conjunction|return|custom", "planet_primary":"Mars", "planet_secondary":"Saturn or null", "sign":"Pisces or null", "event_datetime_utc":"ISO UTC within window", "notes":"1 sentence"}
  ],
  "alerts": [
    {"title":"...", "message":"1 paragraph", "priority":"low|medium|high|critical", "entity_name":"from watchlist"}
  ]
}
Produce 6 astro_events spread across the 7 days (2 on ${today}), 4 alerts. JSON only.`;
  const ai1 = await callMundaneAI(prompt1, sysInstr);

  // ── Call 2: projects + notes ──
  console.log("→ AI call 2/3: projects + notes…");
  const wlNames = (ai1.watchlist_entity_names || []).slice(0, 5).join(", ");
  const prompt2 = `Generate research projects for a mundane astrologer watching: ${wlNames}.

Return JSON:
{
  "projects": [
    {"title":"...", "description":"2 sentences", "project_type":"country_forecast|election|geopolitical|commodity|weather|retrospective|general", "status":"active"}
  ],
  "notes": [
    {"project_index":0, "title":"...", "body":"2-4 sentences with astrological detail", "note_type":"observation"}
  ]
}
Produce 3 projects and 5 notes (distribute across the 3 projects). JSON only.`;
  const ai2 = await callMundaneAI(prompt2, sysInstr);

  // ── Call 3: forecasts ──
  console.log("→ AI call 3/3: forecasts…");
  const prompt3 = `Period: ${today} to ${in7}. Watchlist: ${wlNames}.

Return JSON:
{
  "forecasts": [
    {"title":"...", "entity_name":"from watchlist", "forecast_type":"political|economic|weather|social|market|general", "forecast_period_start":"YYYY-MM-DD within window", "forecast_period_end":"YYYY-MM-DD within window", "confidence_level":"high|medium|low|speculative", "narrative_summary":"1 sentence", "astrology_basis":"1 sentence"}
  ]
}
Produce 5 forecasts across at least 3 entities. JSON only.`;
  const ai3 = await callMundaneAI(prompt3, sysInstr);

  const ai = { ...ai1, ...ai2, ...ai3 };
  console.log(`  ← Combined keys: ${Object.keys(ai).join(", ")}`);

  // ─── Resolve watchlist ────────────────────────────────────────────────────
  const watchlistEntities = (ai.watchlist_entity_names || [])
    .map(entityByName)
    .filter(Boolean);
  if (watchlistEntities.length === 0) throw new Error("No valid watchlist entities from AI");
  console.log(`  Watchlist: ${watchlistEntities.map((e) => e.name).join(", ")}`);

  // ─── Clean existing user rows ─────────────────────────────────────────────
  console.log("→ Clearing existing user rows…");
  await sb.from("mundane_project_notes").delete().eq("created_by", TARGET_USER_ID);
  await sb.from("mundane_research_projects").delete().eq("created_by", TARGET_USER_ID);
  await sb.from("mundane_alert_notifications").delete().eq("user_id", TARGET_USER_ID);
  await sb.from("mundane_watchlists").delete().eq("user_id", TARGET_USER_ID);

  // ─── Insert watchlist ─────────────────────────────────────────────────────
  const wlRes = await sb
    .from("mundane_watchlists")
    .insert({
      user_id: TARGET_USER_ID,
      name: "My Watchlist",
      entity_ids: watchlistEntities.map((e) => e.id),
    })
    .select();
  if (wlRes.error) throw wlRes.error;
  console.log(`  ✓ watchlist inserted (${watchlistEntities.length} entities)`);

  // ─── Insert astro events (global, additive) ───────────────────────────────
  const VALID_EVENT_TYPES = new Set([
    "ingress", "lunation", "eclipse", "conjunction", "opposition",
    "station", "retrograde", "direct", "great_conjunction", "return",
    "solar_arc", "custom",
  ]);
  const astroRows = (ai.astro_events || []).map((ev) => ({
    title: ev.title,
    event_type: VALID_EVENT_TYPES.has(ev.event_type) ? ev.event_type : "custom",
    planet_primary: ev.planet_primary,
    planet_secondary: ev.planet_secondary || null,
    sign: ev.sign || null,
    event_datetime_utc: ev.event_datetime_utc,
    notes: ev.notes || null,
    is_verified: false,
  }));
  if (astroRows.length) {
    const r = await sb.from("mundane_astro_events").insert(astroRows).select("id");
    if (r.error) throw r.error;
    console.log(`  ✓ astro_events inserted: ${r.data.length}`);
  }

  // ─── Insert alerts ────────────────────────────────────────────────────────
  const alertRows = (ai.alerts || []).map((a) => {
    const ent = entityByName(a.entity_name);
    return {
      user_id: TARGET_USER_ID,
      title: a.title,
      message: a.message,
      entity_id: ent?.id || null,
      priority: a.priority,
      is_read: false,
      triggered_at: addDays(now, -Math.random()).toISOString(),
    };
  });
  if (alertRows.length) {
    const r = await sb.from("mundane_alert_notifications").insert(alertRows).select("id");
    if (r.error) throw r.error;
    console.log(`  ✓ alerts inserted: ${r.data.length}`);
  }

  // ─── Insert projects ──────────────────────────────────────────────────────
  const VALID_PROJECT_TYPES = new Set([
    "country_forecast", "election", "geopolitical", "commodity",
    "weather", "retrospective", "general",
  ]);
  const projectRows = (ai.projects || []).map((p) => ({
    title: p.title,
    description: p.description,
    project_type: VALID_PROJECT_TYPES.has(p.project_type) ? p.project_type : "general",
    status: p.status || "active",
    entity_ids: watchlistEntities.slice(0, 3).map((e) => e.id),
    created_by: TARGET_USER_ID,
    is_public: false,
  }));
  let projectIds = [];
  if (projectRows.length) {
    const r = await sb.from("mundane_research_projects").insert(projectRows).select("id");
    if (r.error) throw r.error;
    projectIds = r.data.map((d) => d.id);
    console.log(`  ✓ projects inserted: ${projectIds.length}`);
  }

  // ─── Insert notes ─────────────────────────────────────────────────────────
  const noteRows = (ai.notes || [])
    .filter((n) => projectIds[n.project_index])
    .map((n) => ({
      project_id: projectIds[n.project_index],
      title: n.title,
      body: n.body,
      note_type: n.note_type || "observation",
      created_by: TARGET_USER_ID,
    }));
  if (noteRows.length) {
    const r = await sb.from("mundane_project_notes").insert(noteRows).select("id");
    if (r.error) throw r.error;
    console.log(`  ✓ notes inserted: ${r.data.length}`);
  }

  // ─── Insert forecasts ─────────────────────────────────────────────────────
  const VALID_FORECAST_TYPES = new Set([
    "political", "economic", "weather", "social", "market", "general",
  ]);
  const forecastRows = (ai.forecasts || []).map((f) => {
    const ent = entityByName(f.entity_name);
    return {
      title: f.title,
      entity_id: ent?.id || null,
      forecast_type: VALID_FORECAST_TYPES.has(f.forecast_type) ? f.forecast_type : "general",
      forecast_period_start: f.forecast_period_start,
      forecast_period_end: f.forecast_period_end,
      narrative_summary: f.narrative_summary || null,
      astrology_basis: f.astrology_basis || null,
      content: [f.narrative_summary, f.astrology_basis].filter(Boolean).join(" ") || f.title,
      confidence_level: f.confidence_level || "medium",
      outcome_status: "open",
      is_published: true,
      is_public: true,
      created_by: TARGET_USER_ID,
    };
  });
  if (forecastRows.length) {
    const r = await sb.from("mundane_forecasts").insert(forecastRows).select("id");
    if (r.error) throw r.error;
    console.log(`  ✓ forecasts inserted: ${r.data.length}`);
  }

  console.log("\n✅ Done. Visit /dashboard/mundane as test-diviner-2.");
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
