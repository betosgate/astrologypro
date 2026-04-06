/**
 * Seed script: mandalism_content — 10 items (2 per content type)
 *
 * Usage:
 *   node scripts/seed-mandalism-content.js
 *
 * Reads credentials from .env.local or falls back to the values below.
 * Requires Node 18+ (global fetch).
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = process.env[key] ?? val;
    }
  } catch {
    // .env.local not found — rely on already-set env vars
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
  );
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function insert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert into ${table} failed: ${err}`);
  }
  return res.json();
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const now = new Date();

function daysFromNow(n) {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const rows = [
  // ── Live Streams ─────────────────────────────────────────────────────────
  {
    content_type: "live_stream",
    title: "Mandalism Initiation Ceremony — Spring Equinox",
    description:
      "Join us live for the seasonal initiation ceremony marking the Spring Equinox transition.",
    url: "https://stream.divineinfinitebeing.com/live/spring-equinox-2026",
    start_at: daysFromNow(7),
    end_at: daysFromNow(7),
    access_control: "members",
    priority: 90,
    is_published: true,
  },
  {
    content_type: "live_stream",
    title: "Monthly Circle — March 2026 (Recording)",
    description:
      "Full replay of the March 2026 monthly Mandalism circle. Available for all members.",
    url: "https://stream.divineinfinitebeing.com/replay/circle-march-2026",
    start_at: daysFromNow(-30),
    end_at: daysFromNow(-30),
    access_control: "members",
    priority: 50,
    is_published: true,
  },

  // ── Videos ───────────────────────────────────────────────────────────────
  {
    content_type: "video",
    title: "Introduction to the 7 Rays of Consciousness",
    description:
      "A foundational session exploring the 7 rays as a framework for spiritual growth within Perennial Mandalism.",
    url: "https://cdn.divineinfinitebeing.com/videos/7-rays-intro.mp4",
    content_thumbnail_url:
      "https://images.unsplash.com/photo-1518104593124-ac2e3c50e9e1?w=400&q=80",
    duration_label: "52 min",
    access_control: "members",
    priority: 80,
    is_published: true,
  },
  {
    content_type: "video",
    title: "Sacred Geometry in Daily Practice",
    description:
      "Learn how to integrate sacred geometry principles into your everyday spiritual routines.",
    url: "https://cdn.divineinfinitebeing.com/videos/sacred-geometry-practice.mp4",
    content_thumbnail_url:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&q=80",
    duration_label: "38 min",
    access_control: "members",
    priority: 70,
    is_published: true,
  },

  // ── Documents ────────────────────────────────────────────────────────────
  {
    content_type: "document",
    title: "The Mandalist's Handbook — Volume I",
    description:
      "Comprehensive reference guide covering core principles, rituals, and the philosophy of Perennial Mandalism.",
    pdf_url: "https://cdn.divineinfinitebeing.com/docs/mandalist-handbook-vol1.pdf",
    content_thumbnail_url:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    access_control: "members",
    priority: 85,
    is_published: true,
  },
  {
    content_type: "document",
    title: "Free Preview: Introduction to Mandalism",
    description:
      "A free preview PDF introducing prospective members to the core tenets of Perennial Mandalism.",
    pdf_url: "https://cdn.divineinfinitebeing.com/docs/mandalism-intro-free.pdf",
    content_thumbnail_url:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80",
    access_control: "free",
    priority: 100,
    is_published: true,
  },

  // ── YouTube ───────────────────────────────────────────────────────────────
  {
    content_type: "youtube",
    title: "The Akashic Records — A Practical Introduction",
    description:
      "Published YouTube talk by our lead teacher on accessing and interpreting the Akashic Records.",
    url: "dQw4w9WgXcQ",
    access_control: "free",
    priority: 60,
    is_published: true,
  },
  {
    content_type: "youtube",
    title: "Breathwork for Inner Alchemy — Guided Session",
    description:
      "A 30-minute guided breathwork session designed to activate the lower three energy centers.",
    url: "9bZkp7q19f0",
    access_control: "members",
    priority: 55,
    is_published: false,
  },

  // ── Announcements ─────────────────────────────────────────────────────────
  {
    content_type: "announcement",
    title: "Welcome to the New Content Library",
    description: "Important update for all Mandalism members.",
    content_body:
      "Dear Mandalists,\n\nWe are thrilled to launch our new content library — a centralized hub for all your learning materials, live streams, and sacred documents. Everything you need for your journey is now accessible in one place.\n\nExpect new content every week. We begin with the 7 Rays series this month.\n\nIn service,\nThe Divine Infinite Being Team",
    access_control: "members",
    priority: 95,
    is_published: true,
  },
  {
    content_type: "announcement",
    title: "Spring Equinox Ceremony — Registration Now Open",
    description: "Register for the upcoming live ceremony.",
    content_body:
      "The Spring Equinox 2026 live ceremony is now open for registration. This event is exclusive to active Mandalism subscribers.\n\nDate: " +
      daysFromNow(7).split("T")[0] +
      "\nTime: 7:00 PM EDT\n\nSpace is limited. Register through your member portal before April 10th to secure your place.\n\nBlessings,\nThe Ceremony Team",
    access_control: "members",
    priority: 88,
    is_published: true,
  },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${rows.length} mandalism_content rows…`);
  const inserted = await insert("mandalism_content", rows);
  console.log(`Done. Inserted ${inserted.length} rows.`);
  for (const row of inserted) {
    console.log(`  [${row.content_type}] ${row.title} — id: ${row.id}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
