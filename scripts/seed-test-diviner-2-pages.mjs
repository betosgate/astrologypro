/**
 * Seed the 6 missing page-level tables for @test-diviner-2
 * (weekly_subscription_products, media_items, discount_rules,
 *  user_ritual_configurations, intake_templates, video_sessions)
 *
 * Run: node scripts/seed-test-diviner-2-pages.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DIVINER_ID = "c10a225f-51f5-441f-ad0c-1487fe576b43"; // test-diviner-2

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Weekly Subscription Product (UNIQUE per diviner)
// ─────────────────────────────────────────────────────────────────────────────
async function seedWeeklySubscriptionProduct() {
  console.log("→ Seeding weekly_subscription_products …");

  const { data: existing } = await supabase
    .from("weekly_subscription_products")
    .select("id")
    .eq("diviner_id", DIVINER_ID)
    .maybeSingle();

  if (existing) {
    console.log("  ⚠  Product already exists — skipping");
    return;
  }

  const { error } = await supabase.from("weekly_subscription_products").insert({
    diviner_id: DIVINER_ID,
    title: "Weekly Cosmic Insights",
    description: "Personalised weekly transit readings, lunar guidance, and practical timing advice for your week ahead.",
    price_cents: 2000,
    is_active: true,
  });
  if (error) console.error("  ✗", error.message);
  else console.log("  ✓ 1 weekly_subscription_products row inserted");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Media Items
// ─────────────────────────────────────────────────────────────────────────────
async function seedMediaItems() {
  console.log("→ Seeding media_items …");

  const items = [
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "North Node in Aries — Your Soul's Direction",
      description: "What it means to have your North Node in Aries and how to align with your karmic life path.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Astrology",
      platform: "youtube",
      duration_seconds: 1856,
      sort_order: 0,
      is_featured: true,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "Pluto in Aquarius — The Great Shift Explained",
      description: "How Pluto's 20-year transit through Aquarius will reshape society, technology, and your personal evolution.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Astrology",
      platform: "youtube",
      duration_seconds: 2340,
      sort_order: 1,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "audio",
      title: "Eclipse Season Meditation — Embracing Change",
      description: "A 25-minute guided meditation for navigating eclipse season with clarity and groundedness.",
      url: "https://open.spotify.com/episode/example3",
      thumbnail_url: null,
      category: "Meditation",
      platform: "spotify",
      duration_seconds: 1500,
      sort_order: 2,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "article",
      title: "How to Read Your Progressed Chart",
      description: "A step-by-step guide to secondary progressions and how your chart evolves over time.",
      url: "https://astrologypro.com/blog/progressed-chart-guide",
      thumbnail_url: null,
      category: "Education",
      platform: null,
      duration_seconds: null,
      sort_order: 3,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "The Major Arcana Explained — Card by Card",
      description: "A comprehensive walkthrough of all 22 Major Arcana cards, their symbolism, and how to interpret them in spreads.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Tarot",
      platform: "youtube",
      duration_seconds: 3120,
      sort_order: 4,
      is_featured: true,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "link",
      title: "Astro.com — Free Chart & Ephemeris Tools",
      description: "Professional-grade birth chart calculations, transit tools, and ephemeris data — free to use.",
      url: "https://astro.com",
      thumbnail_url: null,
      category: "Tools",
      platform: null,
      duration_seconds: null,
      sort_order: 5,
      is_featured: false,
      moderation_status: "approved",
    },
  ];

  const { error } = await supabase.from("media_items").insert(items);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${items.length} media_items inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Discount Rules
// ─────────────────────────────────────────────────────────────────────────────
async function seedDiscountRules() {
  console.log("→ Seeding discount_rules …");

  const rules = [
    {
      diviner_id: DIVINER_ID,
      name: "Returning Client — 3 Sessions",
      type: "session_count",
      discount_percent: 10,
      min_sessions: 3,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Dedicated Client — 8 Sessions",
      type: "session_count",
      discount_percent: 18,
      min_sessions: 8,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Transit + Natal Bundle",
      type: "package",
      discount_percent: 15,
      min_sessions: null,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Annual Deep Dive Package",
      type: "package",
      discount_percent: 22,
      min_sessions: null,
      is_active: true,
    },
  ];

  const { error } = await supabase.from("discount_rules").insert(rules);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rules.length} discount_rules inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. User Ritual Configurations (seeded against diviner's auth user_id)
// ─────────────────────────────────────────────────────────────────────────────
async function seedUserRituals() {
  console.log("→ Seeding user_ritual_configurations …");

  const { data: divinerRow } = await supabase
    .from("diviners")
    .select("user_id")
    .eq("id", DIVINER_ID)
    .single();

  if (!divinerRow?.user_id) {
    console.log("  ⚠  Could not resolve user_id — skipping");
    return;
  }

  const USER_ID = divinerRow.user_id;

  const rituals = [
    { user_id: USER_ID, community_member_id: null, ritual_name: "Eclipse Activation Ritual",        ritual_tags: ["eclipse", "activation", "solar", "intentions"] },
    { user_id: USER_ID, community_member_id: null, ritual_name: "Waxing Moon Abundance Practice",   ritual_tags: ["waxing-moon", "abundance", "prosperity", "manifestation"] },
    { user_id: USER_ID, community_member_id: null, ritual_name: "Waning Moon Cord Cutting",         ritual_tags: ["waning-moon", "cord-cutting", "release", "cleansing"] },
    { user_id: USER_ID, community_member_id: null, ritual_name: "Jupiter Expansion Ceremony",       ritual_tags: ["jupiter", "expansion", "luck", "blessings", "gratitude"] },
    { user_id: USER_ID, community_member_id: null, ritual_name: "Chiron Healing Ritual",            ritual_tags: ["chiron", "healing", "inner-wound", "shadow-work"] },
  ];

  const { error } = await supabase.from("user_ritual_configurations").insert(rituals);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rituals.length} user_ritual_configurations inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Intake Templates
// ─────────────────────────────────────────────────────────────────────────────
async function seedIntakeTemplates() {
  console.log("→ Seeding intake_templates …");

  const { randomUUID } = await import("crypto");

  const templates = [
    {
      diviner_id: DIVINER_ID,
      name: "Natal Chart / Birth Chart",
      description: "Standard intake for natal and birth chart readings.",
      is_default: true,
      fields: [
        { id: randomUUID(), type: "birth_details", label: "Birth Details", required: true, sort_order: 0 },
        { id: randomUUID(), type: "textarea", label: "What would you like to focus on?", placeholder: "e.g. career, relationships, life purpose...", required: false, sort_order: 1 },
        { id: randomUUID(), type: "textarea", label: "Any current life themes or challenges?", required: false, sort_order: 2 },
      ],
    },
    {
      diviner_id: DIVINER_ID,
      name: "Tarot Reading",
      description: "General intake for tarot sessions.",
      is_default: false,
      fields: [
        { id: randomUUID(), type: "textarea", label: "What is your main question or area of focus?", placeholder: "Be as specific as possible...", required: true, sort_order: 0 },
        { id: randomUUID(), type: "select", label: "Reading type preference", required: false, sort_order: 1, options: ["Open reading (reader's intuition)", "Specific question", "Life overview"] },
        { id: randomUUID(), type: "textarea", label: "Anything else the reader should know?", required: false, sort_order: 2 },
      ],
    },
    {
      diviner_id: DIVINER_ID,
      name: "Transit / Forecast Reading",
      description: "Intake for predictive and transit readings.",
      is_default: false,
      fields: [
        { id: randomUUID(), type: "birth_details", label: "Birth Details", required: true, sort_order: 0 },
        { id: randomUUID(), type: "select", label: "Forecast period", required: true, sort_order: 1, options: ["1 month", "3 months", "6 months", "1 year"] },
        { id: randomUUID(), type: "textarea", label: "What areas of life are most important to cover?", placeholder: "e.g. career, love, finances, health...", required: false, sort_order: 2 },
      ],
    },
  ];

  const { error } = await supabase.from("intake_templates").insert(templates);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${templates.length} intake_templates inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Video Sessions (linked to completed bookings)
// ─────────────────────────────────────────────────────────────────────────────
async function seedVideoSessions() {
  console.log("→ Seeding video_sessions …");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client_id, scheduled_at, duration_minutes")
    .eq("diviner_id", DIVINER_ID)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(5);

  const sessions = (bookings ?? []).map((b, i) => {
    const startedAt = new Date(b.scheduled_at);
    const endedAt = new Date(startedAt.getTime() + (b.duration_minutes ?? 60) * 60 * 1000);
    return {
      diviner_id: DIVINER_ID,
      booking_id: b.id,
      client_id: b.client_id,
      room_id: `room-seed-${DIVINER_ID.slice(0, 8)}-${i + 1}`,
      room_name: `Session ${i + 1}`,
      provider: "videosdk",
      status: "ended",
      phone_dial_in_enabled: false,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: (b.duration_minutes ?? 60) * 60,
      notes: null,
    };
  });

  if (!sessions.length) {
    for (let i = 0; i < 3; i++) {
      sessions.push({
        diviner_id: DIVINER_ID,
        booking_id: null,
        client_id: null,
        room_id: `room-seed-${DIVINER_ID.slice(0, 8)}-standalone-${i + 1}`,
        room_name: `Ad-hoc Session ${i + 1}`,
        provider: "videosdk",
        status: "ended",
        phone_dial_in_enabled: false,
        started_at: daysAgo(i * 7 + 2),
        ended_at: daysAgo(i * 7 + 2),
        duration_seconds: 3600,
        notes: null,
      });
    }
  }

  const { error } = await supabase.from("video_sessions").insert(sessions);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${sessions.length} video_sessions inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seeding page-level data for @test-diviner-2 ===\n");
  await seedWeeklySubscriptionProduct();
  await seedMediaItems();
  await seedDiscountRules();
  await seedUserRituals();
  await seedIntakeTemplates();
  await seedVideoSessions();
  console.log("\n=== Done ===");
}
main().catch(console.error);
