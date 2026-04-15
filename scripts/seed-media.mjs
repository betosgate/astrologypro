#!/usr/bin/env node
/**
 * seed-media.mjs
 *
 * Populates media_items for diviner c10a225f with rich astrology content:
 *   - Videos (YouTube)
 *   - Audio (meditations + podcast)
 *   - Articles
 *   - Images (across 2 albums)
 *   - Links
 *
 * Idempotent — deletes previously seeded records first (by seed marker UUIDs).
 *
 * Run: node scripts/seed-media.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DIVINER_ID = "c10a225f-51f5-441f-ad0c-1487fe576b43";

// Stable UUIDs for idempotency
const IDS = {
  v1: "c0100001-0000-0000-0000-000000000001",
  v2: "c0100001-0000-0000-0000-000000000002",
  v3: "c0100001-0000-0000-0000-000000000003",
  v4: "c0100001-0000-0000-0000-000000000004",
  v5: "c0100001-0000-0000-0000-000000000005",
  a1: "c0200001-0000-0000-0000-000000000001",
  a2: "c0200001-0000-0000-0000-000000000002",
  a3: "c0200001-0000-0000-0000-000000000003",
  ar1: "c0300001-0000-0000-0000-000000000001",
  ar2: "c0300001-0000-0000-0000-000000000002",
  ar3: "c0300001-0000-0000-0000-000000000003",
  i1: "c0400001-0000-0000-0000-000000000001",
  i2: "c0400001-0000-0000-0000-000000000002",
  i3: "c0400001-0000-0000-0000-000000000003",
  i4: "c0400001-0000-0000-0000-000000000004",
  i5: "c0400001-0000-0000-0000-000000000005",
  l1: "c0500001-0000-0000-0000-000000000001",
  l2: "c0500001-0000-0000-0000-000000000002",
};

// ── YouTube thumbnail helper ───────────────────────────────────────────────────
const yt = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

// ── Unsplash thumbnails for articles / audio ──────────────────────────────────
// Using Unsplash source URLs — free, no auth, reliable
const ARTICLE_THUMB_1 = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop"; // galaxy/stars
const ARTICLE_THUMB_2 = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop"; // cosmos
const ARTICLE_THUMB_3 = "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800&auto=format&fit=crop"; // milky way

// ── Workshop / Reading room images ────────────────────────────────────────────
const IMG_WORKSHOP_1  = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop"; // group workshop
const IMG_WORKSHOP_2  = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop"; // people gathered
const IMG_WORKSHOP_3  = "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1200&auto=format&fit=crop"; // crystals & candles
const IMG_READING_1   = "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&auto=format&fit=crop"; // tarot cards
const IMG_READING_2   = "https://images.unsplash.com/photo-1600132806608-231446b2e7af?w=1200&auto=format&fit=crop"; // astrology chart

// ── Audio cover art ───────────────────────────────────────────────────────────
const AUDIO_THUMB_1 = "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&auto=format&fit=crop"; // new moon
const AUDIO_THUMB_2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop"; // meditation
const AUDIO_THUMB_3 = "https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=800&auto=format&fit=crop"; // podcast mic

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function main() {
  console.log("=== seed-media ===\n");

  // ── Clean previous seed rows ────────────────────────────────────────────────
  const allSeedIds = Object.values(IDS);
  const { error: delErr } = await sb.from("media_items").delete().in("id", allSeedIds);
  if (delErr) console.warn("Cleanup warning:", delErr.message);
  else console.log("Cleaned previous seed rows\n");

  // ── Rows to insert ──────────────────────────────────────────────────────────
  const rows = [

    // ── VIDEOS ──────────────────────────────────────────────────────────────
    {
      id: IDS.v1,
      diviner_id: DIVINER_ID,
      type: "video",
      platform: "youtube",
      category: "Astrology",
      url: "https://www.youtube.com/watch?v=Wm6ULwrphEA",
      thumbnail_url: yt("Wm6ULwrphEA"),
      title: "Mercury Retrograde Survival Guide — What You Must Know",
      description: "Mercury retrograde happens 3–4 times a year and affects communication, travel, and technology. In this video I walk you through exactly what to do (and avoid) during each retrograde phase, including shadow periods most astrologers overlook.",
      duration_seconds: 2187,
      sort_order: 10,
      is_active: true,
      is_featured: true,
      moderation_status: "approved",
      view_count: 1243,
      created_at: daysAgo(60),
    },
    {
      id: IDS.v2,
      diviner_id: DIVINER_ID,
      type: "video",
      platform: "youtube",
      category: "Astrology",
      url: "https://www.youtube.com/watch?v=xBJOjnHLAX4",
      thumbnail_url: yt("xBJOjnHLAX4"),
      title: "Understanding Your Big Three — Sun, Moon & Rising Signs",
      description: "Your Sun sign is just the beginning. Your Moon sign reveals your emotional nature and needs, while your Rising sign (Ascendant) governs how you show up in the world. This is the essential foundation for anyone learning astrology.",
      duration_seconds: 1820,
      sort_order: 11,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 892,
      created_at: daysAgo(45),
    },
    {
      id: IDS.v3,
      diviner_id: DIVINER_ID,
      type: "video",
      platform: "youtube",
      category: "Astrology",
      url: "https://www.youtube.com/watch?v=K3YDBBaGLYs",
      thumbnail_url: yt("K3YDBBaGLYs"),
      title: "Saturn Return Explained — First, Second & Third Returns",
      description: "Saturn returns every ~29.5 years and marks a major life initiation. The first return (ages 28–30) is about becoming an adult; the second (57–60) about legacy; the third (86–88) about completion. Learn what each cycle demands of you.",
      duration_seconds: 2650,
      sort_order: 12,
      is_active: true,
      is_featured: true,
      moderation_status: "approved",
      view_count: 2110,
      created_at: daysAgo(30),
    },
    {
      id: IDS.v4,
      diviner_id: DIVINER_ID,
      type: "video",
      platform: "youtube",
      category: "Astrology",
      url: "https://www.youtube.com/watch?v=5M1EIYMV97U",
      thumbnail_url: yt("5M1EIYMV97U"),
      title: "Venus in All 12 Houses — Love, Beauty & Values",
      description: "Venus's house placement reveals how you give and receive love, what you find beautiful, and where you seek pleasure and comfort. A full walkthrough of Venus in the 1st through 12th house with real client examples.",
      duration_seconds: 3240,
      sort_order: 13,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 674,
      created_at: daysAgo(15),
    },
    {
      id: IDS.v5,
      diviner_id: DIVINER_ID,
      type: "video",
      platform: "youtube",
      category: "Astrology",
      url: "https://www.youtube.com/watch?v=Jp_2lMqJuoQ",
      thumbnail_url: yt("Jp_2lMqJuoQ"),
      title: "Full Moon Ritual — How to Work With Lunar Energy",
      description: "The full moon is a time of culmination, release, and emotional amplification. Learn a simple but powerful ritual for working consciously with full moon energy: journaling prompts, releasing ceremony, and which crystals to use for each sign.",
      duration_seconds: 1540,
      sort_order: 14,
      is_active: false,        // inactive — pending schedule
      is_featured: false,
      moderation_status: "pending",
      view_count: 0,
      created_at: daysAgo(2),
    },

    // ── AUDIO ────────────────────────────────────────────────────────────────
    {
      id: IDS.a1,
      diviner_id: DIVINER_ID,
      type: "audio",
      platform: "spotify",
      category: "Meditation",
      url: "https://open.spotify.com/episode/3R7CrNnoUJeXyejJDnbm3C",
      thumbnail_url: AUDIO_THUMB_1,
      title: "New Moon in Taurus — Setting Intentions for Abundance",
      description: "A guided meditation and intention-setting practice for the New Moon in Taurus. Taurus new moons are potent times to plant seeds around finances, sensory pleasure, and slow, steady growth. Includes a 5-minute breathwork opener and affirmation sequence.",
      duration_seconds: 1860,
      sort_order: 20,
      is_active: true,
      is_featured: true,
      moderation_status: "approved",
      view_count: 318,
      created_at: daysAgo(52),
    },
    {
      id: IDS.a2,
      diviner_id: DIVINER_ID,
      type: "audio",
      platform: "spotify",
      category: "Meditation",
      url: "https://open.spotify.com/episode/5Cl8Vd4IQEOA7lxpzTRpBV",
      thumbnail_url: AUDIO_THUMB_2,
      title: "Mars Return Activation — Reclaim Your Drive & Courage",
      description: "Mars returns to its natal position every ~2 years, marking a new cycle of action, desire, and personal will. This activation meditation helps you consciously channel Mars energy — clearing stagnant anger and reigniting purposeful ambition. Best listened to during your personal Mars return window.",
      duration_seconds: 2280,
      sort_order: 21,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 145,
      created_at: daysAgo(28),
    },
    {
      id: IDS.a3,
      diviner_id: DIVINER_ID,
      type: "audio",
      platform: "podcast",
      category: "Forecast",
      url: "https://anchor.fm/astrology-pro/episodes/april-2026-forecast",
      thumbnail_url: AUDIO_THUMB_3,
      title: "April 2026 Astrology Forecast — Key Transits & Themes",
      description: "This month's forecast covers the major transits affecting all signs in April 2026: Jupiter trine Pluto opening long-term growth channels, Mars entering Taurus slowing and grounding our drive, and the Scorpio Full Moon on the 12th demanding honest emotional reckoning.",
      duration_seconds: 3120,
      sort_order: 22,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 204,
      created_at: daysAgo(14),
    },

    // ── ARTICLES ─────────────────────────────────────────────────────────────
    {
      id: IDS.ar1,
      diviner_id: DIVINER_ID,
      type: "article",
      category: "Astrology",
      url: "https://astrologypro.com/blog/twelve-houses-explained",
      thumbnail_url: ARTICLE_THUMB_1,
      title: "The 12 Astrological Houses — What Each One Rules",
      description: "The 12 houses of the natal chart represent different life domains, from the self (1st house) to the collective unconscious (12th house). This comprehensive guide walks through each house, its natural sign ruler, and the areas of life it governs — with examples of how planets placed there colour the experience.",
      sort_order: 30,
      is_active: true,
      is_featured: true,
      moderation_status: "approved",
      view_count: 1587,
      created_at: daysAgo(90),
    },
    {
      id: IDS.ar2,
      diviner_id: DIVINER_ID,
      type: "article",
      category: "Astrology",
      url: "https://astrologypro.com/blog/saturn-return-what-to-expect",
      thumbnail_url: ARTICLE_THUMB_2,
      title: "Saturn Return: What to Expect and How to Prepare",
      description: "Between ages 28 and 30, Saturn completes its first full orbit since your birth — and life rarely stays the same. Relationships, careers, and long-held beliefs all come under Saturnian scrutiny. This article explains why Saturn forces these reckonings and gives practical tools for navigating your return with intention rather than resistance.",
      sort_order: 31,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 933,
      created_at: daysAgo(55),
    },
    {
      id: IDS.ar3,
      diviner_id: DIVINER_ID,
      type: "article",
      category: "Astrology",
      url: "https://astrologypro.com/blog/venus-retrograde-natal-chart",
      thumbnail_url: ARTICLE_THUMB_3,
      title: "Venus Retrograde Natal — Born with Venus Retrograde",
      description: "About 7–8% of people are born with Venus retrograde in their natal chart. This placement often correlates with an unconventional relationship to love, beauty, and self-worth — one that turns inward rather than outward. If you have natal Venus retrograde, this deep dive is for you.",
      sort_order: 32,
      is_active: true,
      is_featured: false,
      moderation_status: "pending",
      view_count: 0,
      created_at: daysAgo(3),
    },

    // ── IMAGES ───────────────────────────────────────────────────────────────
    {
      id: IDS.i1,
      diviner_id: DIVINER_ID,
      type: "image",
      category: "Events",
      album_name: "Workshop & Events",
      url: IMG_WORKSHOP_1,
      thumbnail_url: IMG_WORKSHOP_1,
      title: "Saturn Return Workshop — Dublin, March 2026",
      description: "Group workshop on navigating the Saturn return. 18 participants exploring their natal Saturn placements, transits, and practical strategies for this major life initiation.",
      sort_order: 40,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 72,
      created_at: daysAgo(40),
    },
    {
      id: IDS.i2,
      diviner_id: DIVINER_ID,
      type: "image",
      category: "Events",
      album_name: "Workshop & Events",
      url: IMG_WORKSHOP_2,
      thumbnail_url: IMG_WORKSHOP_2,
      title: "Eclipse Season Group Reading — February 2026",
      description: "A special group session held during the Pisces eclipse season. Participants charted the eclipse degree against their natal charts and mapped personal release points.",
      sort_order: 41,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 58,
      created_at: daysAgo(70),
    },
    {
      id: IDS.i3,
      diviner_id: DIVINER_ID,
      type: "image",
      category: "Events",
      album_name: "Workshop & Events",
      url: IMG_WORKSHOP_3,
      thumbnail_url: IMG_WORKSHOP_3,
      title: "New Moon in Capricorn — Intention Setting Ceremony",
      description: "Crystal grid, candle ritual, and group intention setting under the Capricorn new moon. Crystals used: clear quartz (amplification), black tourmaline (protection), green aventurine (abundance).",
      sort_order: 42,
      is_active: true,
      is_featured: true,
      moderation_status: "approved",
      view_count: 134,
      created_at: daysAgo(100),
    },
    {
      id: IDS.i4,
      diviner_id: DIVINER_ID,
      type: "image",
      category: "Practice",
      album_name: "Reading Room",
      url: IMG_READING_1,
      thumbnail_url: IMG_READING_1,
      title: "Tarot + Astrology Integration — My Reading Space",
      description: "My personal reading room where I integrate tarot and astrology for client sessions. The cards on display are from the Thoth deck — particularly relevant for planetary dignities and elemental correspondences.",
      sort_order: 43,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 89,
      created_at: daysAgo(120),
    },
    {
      id: IDS.i5,
      diviner_id: DIVINER_ID,
      type: "image",
      category: "Practice",
      album_name: "Reading Room",
      url: IMG_READING_2,
      thumbnail_url: IMG_READING_2,
      title: "Hand-Drawn Natal Chart — Traditional Method",
      description: "A hand-drawn natal chart prepared for a client's Saturn return consultation. I still draw charts by hand for major readings — the process of placing each planet and calculating house cusps manually creates a deeper connection with the chart.",
      sort_order: 44,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 61,
      created_at: daysAgo(85),
    },

    // ── LINKS ────────────────────────────────────────────────────────────────
    {
      id: IDS.l1,
      diviner_id: DIVINER_ID,
      type: "link",
      category: "Resources",
      url: "https://astro-seek.com",
      title: "Astro-Seek — Free Charts, Synastry & Transits Calculator",
      description: "My recommended free tool for birth charts, synastry, composite charts, solar returns, and real-time transit tracking. Covers all major asteroids and house systems. Bookmark this if you're learning to read your own chart.",
      sort_order: 50,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 287,
      created_at: daysAgo(75),
    },
    {
      id: IDS.l2,
      diviner_id: DIVINER_ID,
      type: "link",
      category: "Resources",
      url: "https://cafeastrology.com",
      title: "Café Astrology — Interpretations & Learning Library",
      description: "An outstanding free resource for learning astrology interpretations — especially useful for beginners working through planet-in-sign, planet-in-house, and aspect meanings. I recommend this site to every new client who wants to deepen their own chart understanding.",
      sort_order: 51,
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      view_count: 198,
      created_at: daysAgo(65),
    },
  ];

  console.log(`Inserting ${rows.length} media items…`);
  const { error } = await sb.from("media_items").insert(rows);
  if (error) throw new Error(error.message);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const byType = rows.reduce((acc, r) => { acc[r.type] = (acc[r.type] ?? 0) + 1; return acc; }, {});
  console.log("\n=== DONE ===");
  console.log(`Inserted ${rows.length} items:`);
  Object.entries(byType).forEach(([t, n]) => console.log(`  ${t.padEnd(8)} × ${n}`));
  console.log(`\nPending review : ${rows.filter(r => r.moderation_status === "pending").length}`);
  console.log(`Featured       : ${rows.filter(r => r.is_featured).length}`);
  console.log(`Albums         : Workshop & Events (3 images), Reading Room (2 images)`);
  console.log("\nVisit: https://astrologypro.com/dashboard/media");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
