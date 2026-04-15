#!/usr/bin/env node
/**
 * seed-subscriptions-readings.mjs
 *
 * Seeds subscription, delivery, and reading data for test-diviner-2.
 *
 * Populates:
 *   - weekly_subscription_products   (1 product per diviner)
 *   - weekly_subscription_subscribers (8 subscribers, varied status)
 *   - weekly_subscription_deliveries  (6 deliveries)
 *   - tarot_readings                  (5 readings)
 *   - birth_chart_results             (5 birth charts)
 *   - astro_toolkit_readings          (4 toolkit readings)
 *
 * Idempotent: clears existing rows scoped to this diviner/user before inserting.
 *
 * Run: node scripts/seed-subscriptions-readings.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ─── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env vars");

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Known IDs ────────────────────────────────────────────────────────────────
const TARGET_USER_ID = "99cbfaa5-35c0-4244-b703-189dd4decc69"; // test-diviner-2
// diviner_id will be fetched from DB to confirm; fallback is the known value
const KNOWN_DIVINER_ID = "c10a225f-51f5-441f-ad0c-1487fe576b43";

// ─── Date helpers ─────────────────────────────────────────────────────────────
const now = new Date();
function daysAgo(n) {
  return new Date(now.getTime() - n * 86400000).toISOString();
}
function daysFromNow(n) {
  return new Date(now.getTime() + n * 86400000).toISOString();
}
function monthsAgo(n) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

// ─── Step 1: Resolve diviner_id ───────────────────────────────────────────────
async function resolveDivinerId() {
  console.log("→ Resolving diviner_id for user_id:", TARGET_USER_ID);
  const { data, error } = await sb
    .from("diviners")
    .select("id, user_id")
    .eq("user_id", TARGET_USER_ID)
    .maybeSingle();

  if (error) {
    console.warn("  ⚠  Query error:", error.message, "— using fallback diviner_id");
    return KNOWN_DIVINER_ID;
  }
  if (!data) {
    console.warn("  ⚠  No row found — using fallback diviner_id:", KNOWN_DIVINER_ID);
    return KNOWN_DIVINER_ID;
  }
  console.log("  ✓ diviner_id resolved:", data.id);
  return data.id;
}

// ─── Step 2: weekly_subscription_products ────────────────────────────────────
async function seedProduct(divinerId) {
  console.log("\n→ Seeding weekly_subscription_products…");

  // Remove existing to be idempotent
  const { error: delErr } = await sb
    .from("weekly_subscription_products")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const { data, error } = await sb
    .from("weekly_subscription_products")
    .insert({
      diviner_id: divinerId,
      title: "Weekly Astrological Insights",
      description:
        "Receive weekly mundane astrology forecasts, planetary transit analysis, and world event predictions delivered to your inbox every Monday.",
      price_cents: 2900,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error("weekly_subscription_products insert failed: " + error.message);
  console.log("  ✓ 1 product inserted, id:", data.id);
  return data.id;
}

// ─── Step 3: weekly_subscription_subscribers ─────────────────────────────────
async function seedSubscribers(divinerId, productId) {
  console.log("\n→ Seeding weekly_subscription_subscribers…");

  // Clear existing subscribers for this diviner
  const { error: delErr } = await sb
    .from("weekly_subscription_subscribers")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const subscribers = [
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "sophia.hartwell@gmail.com",
      name: "Sophia Hartwell",
      status: "active",
      subscribed_at: monthsAgo(6),
      current_period_end: daysFromNow(14),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "marcus.deleon@icloud.com",
      name: "Marcus DeLeon",
      status: "active",
      subscribed_at: monthsAgo(5),
      current_period_end: daysFromNow(21),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "priya.nair@outlook.com",
      name: "Priya Nair",
      status: "active",
      subscribed_at: monthsAgo(4),
      current_period_end: daysFromNow(7),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "claire.rousseau@hotmail.com",
      name: "Claire Rousseau",
      status: "active",
      subscribed_at: monthsAgo(3),
      current_period_end: daysFromNow(18),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "james.okafor@gmail.com",
      name: "James Okafor",
      status: "active",
      subscribed_at: monthsAgo(2),
      current_period_end: daysFromNow(10),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "natalie.kim@yahoo.com",
      name: "Natalie Kim",
      status: "cancelled",
      subscribed_at: monthsAgo(5),
      cancelled_at: monthsAgo(1),
      current_period_end: null,
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "tobias.wren@gmail.com",
      name: "Tobias Wren",
      status: "past_due",
      subscribed_at: monthsAgo(3),
      current_period_end: daysAgo(5),
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      email: "amara.osei@protonmail.com",
      name: "Amara Osei",
      status: "unpaid",
      subscribed_at: monthsAgo(2),
      current_period_end: daysAgo(12),
    },
  ];

  const { data, error } = await sb
    .from("weekly_subscription_subscribers")
    .insert(subscribers)
    .select("id");

  if (error) throw new Error("weekly_subscription_subscribers insert failed: " + error.message);
  console.log("  ✓", data.length, "subscribers inserted");
}

// ─── Step 4: weekly_subscription_deliveries ───────────────────────────────────
async function seedDeliveries(divinerId, productId) {
  console.log("\n→ Seeding weekly_subscription_deliveries…");

  // Clear existing deliveries for this diviner
  const { error: delErr } = await sb
    .from("weekly_subscription_deliveries")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const deliveries = [
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Mercury Retrograde & The Week Ahead",
      content:
        "This week Mercury stations retrograde in Aries, bringing communication delays and equipment glitches. Use this energy to review, revise, and reconnect with old contacts. Mars in Gemini adds mental restlessness — ground yourself before important decisions. Watch for sudden shifts in information mid-week as Mercury squares Saturn.",
      content_blocks: [
        { type: "heading", text: "This Week's Key Transits" },
        { type: "paragraph", text: "Mercury stations retrograde at 15° Aries — double-check all communications and contracts." },
        { type: "paragraph", text: "Mars in Gemini trine Venus in Aquarius offers creative inspiration on Wednesday." },
      ],
      scheduled_for: daysAgo(49),
      sent_at: daysAgo(49),
      recipient_count: 6,
      status: "sent",
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Eclipse Season: What to Watch For This Week",
      content:
        "Eclipse season is upon us. The Solar Eclipse in Libra this week activates the South Node, pulling old relationship patterns to the surface. Justice themes dominate world events as Jupiter in Gemini forms a T-square with the eclipse axis. Financial markets may react to unexpected diplomatic news Thursday through Saturday.",
      content_blocks: [
        { type: "heading", text: "Eclipse Season Activations" },
        { type: "paragraph", text: "Solar Eclipse at 10° Libra: themes of balance, justice, and partnership contracts reaching culmination." },
        { type: "paragraph", text: "Jupiter square the eclipse axis amplifies the social and legal dimensions of this lunation." },
      ],
      scheduled_for: daysAgo(42),
      sent_at: daysAgo(42),
      recipient_count: 6,
      status: "sent",
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Saturn Square Uranus: Tension at the Top",
      content:
        "Saturn in Pisces squares Uranus in Gemini this week — a collision of tradition and disruption rippling through geopolitics and financial systems. Expect surprises in government policy announcements. Personal life: the tension between responsibility and the urge for radical change reaches a peak. Breakthrough or breakdown depends on the chart.",
      content_blocks: [
        { type: "heading", text: "Saturn–Uranus Square Peaks" },
        { type: "paragraph", text: "This is the year's most significant structural transit. Global institutions face pressure to reform." },
      ],
      scheduled_for: daysAgo(28),
      sent_at: daysAgo(28),
      recipient_count: 5,
      status: "sent",
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Full Moon in Scorpio: What's Being Revealed",
      content:
        "The Full Moon at 22° Scorpio illuminates what has been hidden. Power dynamics in relationships and institutions come to light. Mars rules this lunation and sits in tense aspect to Pluto — confrontations are possible. This is an excellent week for research, financial audits, and uncovering truth. Past secrets may surface.",
      content_blocks: [
        { type: "heading", text: "Full Moon in Scorpio — 22°" },
        { type: "paragraph", text: "Themes: depth, exposure, power, transformation, hidden finances." },
        { type: "paragraph", text: "Mars-Pluto tension peaks mid-week. Avoid escalation; channel the energy into focused investigation." },
      ],
      scheduled_for: daysAgo(14),
      sent_at: daysAgo(14),
      recipient_count: 5,
      status: "sent",
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Venus Enters Cancer: Home, Hearth & Abundance",
      content:
        "Venus moves into Cancer this week, shifting collective attention toward home, family, nourishment, and emotional security. Excellent timing for real estate activity, family gatherings, and comfort-focused investments. Neptune in Aries trines the Moon mid-week — heightened intuition and creative inspiration flood in. A softer, more reflective week overall.",
      content_blocks: [
        { type: "heading", text: "Venus in Cancer — Domestic Harmony" },
        { type: "paragraph", text: "Best days for financial decisions: Tuesday and Thursday when Venus trines Saturn." },
      ],
      scheduled_for: daysFromNow(7),
      sent_at: null,
      recipient_count: 5,
      status: "scheduled",
    },
    {
      product_id: productId,
      diviner_id: divinerId,
      subject: "Mars Conjunct Jupiter: Expansion Through Action",
      content:
        "Draft content for the upcoming Mars–Jupiter conjunction issue. This rare alignment in Gemini amplifies ambition and favors bold moves in communications, trade, and education sectors. Will expand with additional geopolitical analysis before scheduling.",
      content_blocks: [],
      scheduled_for: daysFromNow(14),
      sent_at: null,
      recipient_count: 0,
      status: "draft",
    },
  ];

  const { data, error } = await sb
    .from("weekly_subscription_deliveries")
    .insert(deliveries)
    .select("id");

  if (error) throw new Error("weekly_subscription_deliveries insert failed: " + error.message);
  console.log("  ✓", data.length, "deliveries inserted");
}

// ─── Step 5: tarot_readings ───────────────────────────────────────────────────
async function seedTarotReadings(divinerId) {
  console.log("\n→ Seeding tarot_readings…");

  // Clear existing tarot readings for this diviner
  const { error: delErr } = await sb
    .from("tarot_readings")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const readings = [
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      spread_id: "celtic-cross",
      spread_name: "Celtic Cross",
      cards: [
        { position: 1, position_name: "Present", card_name: "The Tower", is_reversed: false, keywords: ["upheaval", "revelation", "chaos"], meaning: "Sudden disruption clearing the way for truth." },
        { position: 2, position_name: "Challenge", card_name: "The Moon", is_reversed: false, keywords: ["illusion", "fear", "the unconscious"], meaning: "Hidden fears clouding judgment." },
        { position: 3, position_name: "Past", card_name: "Six of Pentacles", is_reversed: false, keywords: ["generosity", "charity", "giving"], meaning: "A period of giving and receiving in balance." },
        { position: 4, position_name: "Future", card_name: "The Star", is_reversed: false, keywords: ["hope", "renewal", "inspiration"], meaning: "Hope and healing follow the disruption." },
        { position: 5, position_name: "Above", card_name: "The World", is_reversed: false, keywords: ["completion", "integration", "wholeness"], meaning: "The goal is completion and integration of lessons." },
        { position: 6, position_name: "Below", card_name: "Five of Cups", is_reversed: true, keywords: ["grief", "loss", "recovery"], meaning: "Grief is lifting; what remains is being seen." },
        { position: 7, position_name: "Advice", card_name: "The Hermit", is_reversed: false, keywords: ["solitude", "guidance", "inner light"], meaning: "Seek guidance within before acting." },
        { position: 8, position_name: "External Influences", card_name: "King of Swords", is_reversed: false, keywords: ["intellect", "authority", "clarity"], meaning: "An authority figure or rational force is at play." },
        { position: 9, position_name: "Hopes & Fears", card_name: "Judgement", is_reversed: false, keywords: ["awakening", "reckoning", "redemption"], meaning: "Fear of final judgment; hope for renewal." },
        { position: 10, position_name: "Outcome", card_name: "Ace of Wands", is_reversed: false, keywords: ["new beginning", "spark", "initiative"], meaning: "A new creative beginning emerges from the ashes." },
      ],
      notes: "Client is navigating a major career transition. Tower energy confirms the upheaval is necessary and clearing old structures. The Star as the future position is encouraging — renewal follows disruption.",
      created_at: daysAgo(85),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      spread_id: "three-card",
      spread_name: "Three Card",
      cards: [
        { position: 1, position_name: "Past", card_name: "The High Priestess", is_reversed: false, keywords: ["intuition", "mystery", "inner knowing"], meaning: "A period of deep internal knowing and listening." },
        { position: 2, position_name: "Present", card_name: "Two of Swords", is_reversed: false, keywords: ["indecision", "stalemate", "avoidance"], meaning: "Standing at a crossroads, refusing to choose." },
        { position: 3, position_name: "Future", card_name: "The Chariot", is_reversed: false, keywords: ["willpower", "victory", "determination"], meaning: "Decisive action and forward momentum ahead." },
      ],
      notes: "Client has been sitting with a difficult decision for months. High Priestess confirms they already know the answer. The Chariot promises decisive movement once they commit.",
      created_at: daysAgo(70),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      spread_id: "past-present-future",
      spread_name: "Past Present Future",
      cards: [
        { position: 1, position_name: "Past", card_name: "Ten of Cups", is_reversed: false, keywords: ["harmony", "fulfillment", "family joy"], meaning: "A time of emotional fulfillment and family harmony." },
        { position: 2, position_name: "Present", card_name: "Three of Swords", is_reversed: true, keywords: ["heartbreak", "sorrow", "recovery"], meaning: "Moving through grief and beginning to heal." },
        { position: 3, position_name: "Future", card_name: "Temperance", is_reversed: false, keywords: ["balance", "patience", "alchemy"], meaning: "Patience and gradual integration lead to wholeness." },
      ],
      notes: "Reading focused on a relationship transition. Past happiness makes the present loss acute, but Temperance as future suggests healing is gradual and steady — not sudden.",
      created_at: daysAgo(55),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      spread_id: "horseshoe",
      spread_name: "Horseshoe",
      cards: [
        { position: 1, position_name: "Past Influences", card_name: "Eight of Pentacles", is_reversed: false, keywords: ["diligence", "craft", "mastery"], meaning: "Years of dedicated skill-building have shaped this moment." },
        { position: 2, position_name: "Present", card_name: "Page of Wands", is_reversed: false, keywords: ["enthusiasm", "exploration", "new ideas"], meaning: "A fresh creative spark igniting." },
        { position: 3, position_name: "Hidden Influences", card_name: "The Devil", is_reversed: false, keywords: ["bondage", "materialism", "shadow"], meaning: "Unconscious attachment to a limiting pattern." },
        { position: 4, position_name: "Obstacles", card_name: "Four of Swords", is_reversed: false, keywords: ["rest", "recuperation", "withdrawal"], meaning: "Need for rest is being ignored, causing fatigue." },
        { position: 5, position_name: "External Influences", card_name: "Six of Wands", is_reversed: false, keywords: ["victory", "recognition", "public success"], meaning: "External recognition and support are available." },
        { position: 6, position_name: "Advice", card_name: "The Emperor", is_reversed: false, keywords: ["structure", "authority", "discipline"], meaning: "Apply discipline and structure to the new creative venture." },
        { position: 7, position_name: "Likely Outcome", card_name: "Nine of Pentacles", is_reversed: false, keywords: ["abundance", "self-sufficiency", "luxury"], meaning: "Financial independence and self-sufficiency as the outcome." },
      ],
      notes: "Career and creative direction reading. Client has strong foundations from years of practice. Hidden Devil card points to imposter syndrome holding them back. Outcome is strongly positive if they trust their established expertise.",
      created_at: daysAgo(40),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      spread_id: "daily-card",
      spread_name: "Daily Card",
      cards: [
        { position: 1, position_name: "Card of the Day", card_name: "Wheel of Fortune", is_reversed: false, keywords: ["fate", "cycles", "turning point"], meaning: "A pivotal turning point arrives — stay centred as the wheel turns." },
      ],
      notes: "One-card pull for a client checking in on the energy of a major announcement day. Wheel of Fortune confirms a significant turning point is active.",
      created_at: daysAgo(12),
    },
  ];

  const { data, error } = await sb
    .from("tarot_readings")
    .insert(readings)
    .select("id");

  if (error) throw new Error("tarot_readings insert failed: " + error.message);
  console.log("  ✓", data.length, "tarot readings inserted");
}

// ─── Step 6: birth_chart_results ─────────────────────────────────────────────
async function seedBirthCharts(divinerId) {
  console.log("\n→ Seeding birth_chart_results…");

  // Clear existing birth charts for this diviner
  const { error: delErr } = await sb
    .from("birth_chart_results")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const charts = [
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      city_label: "Mumbai, India",
      birth_day: 14,
      birth_month: 3,
      birth_year: 1988,
      birth_hour: 7,
      birth_min: 30,
      lat: 19.076090,
      lon: 72.877426,
      tzone: "Asia/Kolkata",
      astro_data: {
        sun: { sign: "Pisces", degree: 23.5 },
        moon: { sign: "Taurus", degree: 11.2 },
        ascendant: { sign: "Aquarius", degree: 5.8 },
        chart_notes: "Stellium in Pisces; strong Neptune influence on 1st house via dispositor chain.",
      },
      created_at: daysAgo(58),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      city_label: "New York, USA",
      birth_day: 22,
      birth_month: 7,
      birth_year: 1995,
      birth_hour: 14,
      birth_min: 15,
      lat: 40.712776,
      lon: -74.005974,
      tzone: "America/New_York",
      astro_data: {
        sun: { sign: "Cancer", degree: 29.9 },
        moon: { sign: "Scorpio", degree: 18.4 },
        ascendant: { sign: "Libra", degree: 22.1 },
        chart_notes: "Sun at anaretic degree of Cancer — themes of completion around home and identity.",
      },
      created_at: daysAgo(48),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      city_label: "London, UK",
      birth_day: 5,
      birth_month: 11,
      birth_year: 1979,
      birth_hour: 22,
      birth_min: 45,
      lat: 51.507351,
      lon: -0.127758,
      tzone: "Europe/London",
      astro_data: {
        sun: { sign: "Scorpio", degree: 13.0 },
        moon: { sign: "Capricorn", degree: 27.6 },
        ascendant: { sign: "Cancer", degree: 9.3 },
        chart_notes: "Grand trine in water signs linking Sun, Neptune, and Chiron — deep emotional healing gifts.",
      },
      created_at: daysAgo(38),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      city_label: "Sydney, Australia",
      birth_day: 18,
      birth_month: 1,
      birth_year: 2001,
      birth_hour: 6,
      birth_min: 0,
      lat: -33.868820,
      lon: 151.209296,
      tzone: "Australia/Sydney",
      astro_data: {
        sun: { sign: "Capricorn", degree: 28.1 },
        moon: { sign: "Virgo", degree: 4.9 },
        ascendant: { sign: "Sagittarius", degree: 17.5 },
        chart_notes: "Jupiter in 1st house conjunct Ascendant — natural optimism and international connections.",
      },
      created_at: daysAgo(25),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      city_label: "Paris, France",
      birth_day: 30,
      birth_month: 4,
      birth_year: 1991,
      birth_hour: 11,
      birth_min: 20,
      lat: 48.856613,
      lon: 2.352222,
      tzone: "Europe/Paris",
      astro_data: {
        sun: { sign: "Taurus", degree: 9.7 },
        moon: { sign: "Gemini", degree: 21.3 },
        ascendant: { sign: "Leo", degree: 14.6 },
        chart_notes: "Venus in Taurus conjunct Sun — strong artistic sensibility and material values at the core.",
      },
      created_at: daysAgo(10),
    },
  ];

  const { data, error } = await sb
    .from("birth_chart_results")
    .insert(charts)
    .select("id");

  if (error) throw new Error("birth_chart_results insert failed: " + error.message);
  console.log("  ✓", data.length, "birth chart results inserted");
}

// ─── Step 7: astro_toolkit_readings ──────────────────────────────────────────
// Valid reading_type values per migration:
// horoscope | planet_return | solar_return | saturn_return |
// jupiter_return | transit | natal_chart | custom
async function seedToolkitReadings(divinerId) {
  console.log("\n→ Seeding astro_toolkit_readings…");

  // Clear existing toolkit readings for this diviner
  const { error: delErr } = await sb
    .from("astro_toolkit_readings")
    .delete()
    .eq("diviner_id", divinerId);
  if (delErr) console.warn("  ⚠  Delete error:", delErr.message);

  const readings = [
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      reading_type: "natal_chart",
      input_data: {
        name: "Elena Vasquez",
        birth_date: "1990-06-15",
        birth_time: "08:30",
        birth_place: "Barcelona, Spain",
        lat: 41.3851,
        lon: 2.1734,
        tzone: "Europe/Madrid",
      },
      result_data: {
        sun_sign: "Gemini",
        moon_sign: "Aries",
        ascendant: "Cancer",
        dominant_planets: ["Mercury", "Mars", "Moon"],
        key_aspects: [
          { aspect: "Sun conjunct Mercury", orb: 3.2, nature: "empowering" },
          { aspect: "Moon trine Jupiter", orb: 1.8, nature: "harmonious" },
          { aspect: "Saturn square Ascendant", orb: 2.1, nature: "challenging" },
        ],
        summary: "Chart shows strong communicative and emotional intelligence with a protective shell around the self-image. Saturn challenges to structure are the main growth edge.",
      },
      created_at: daysAgo(28),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      reading_type: "transit",
      input_data: {
        name: "David Chen",
        birth_date: "1985-09-03",
        birth_time: "15:45",
        birth_place: "Vancouver, Canada",
        lat: 49.2827,
        lon: -123.1207,
        tzone: "America/Vancouver",
        transit_date: "2026-04-15",
      },
      result_data: {
        active_transits: [
          { transit_planet: "Jupiter", natal_planet: "Sun", aspect: "conjunction", exact_date: "2026-04-18", nature: "expansion", interpretation: "Major opportunity and growth period — a year of expansion in career and visibility." },
          { transit_planet: "Saturn", natal_planet: "Moon", aspect: "square", exact_date: "2026-05-02", nature: "challenge", interpretation: "Emotional restraint and responsibility themes. Family obligations may feel heavy." },
          { transit_planet: "Uranus", natal_planet: "Venus", aspect: "trine", exact_date: "2026-04-28", nature: "positive_change", interpretation: "Exciting shifts in relationships and aesthetics. New connections with unusual or international people." },
        ],
        summary: "Spring 2026 is a pivotal window. The Jupiter conjunction to natal Sun is the headline — use this window for career launches, visibility moves, and bold new directions.",
      },
      created_at: daysAgo(18),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      reading_type: "solar_return",
      input_data: {
        name: "Fatima Al-Hassan",
        birth_date: "1992-03-21",
        birth_time: "03:15",
        birth_place: "Dubai, UAE",
        lat: 25.2048,
        lon: 55.2708,
        tzone: "Asia/Dubai",
        return_year: 2026,
      },
      result_data: {
        solar_return_date: "2026-03-21T04:32:18Z",
        sr_ascendant: "Scorpio",
        sr_sun_house: 5,
        sr_moon_sign: "Leo",
        sr_moon_house: 10,
        key_placements: [
          { planet: "Venus", house: 5, sign: "Taurus", significance: "Creative expression and romance highlighted this solar year." },
          { planet: "Saturn", house: 2, sign: "Pisces", significance: "Financial discipline and clarity around values and resources." },
          { planet: "Mars", house: 8, sign: "Cancer", significance: "Transformation in shared resources and deep psychological work." },
        ],
        year_theme: "A year of creative flourishing, public visibility (SR Moon in 10th), and romantic development. Saturn in 2nd calls for fiscal responsibility alongside the joy.",
      },
      created_at: daysAgo(10),
    },
    {
      user_id: TARGET_USER_ID,
      diviner_id: divinerId,
      reading_type: "planet_return",
      input_data: {
        name: "Oliver Müller",
        birth_date: "1984-11-08",
        birth_time: "19:00",
        birth_place: "Berlin, Germany",
        lat: 52.5200,
        lon: 13.4050,
        tzone: "Europe/Berlin",
        return_planet: "Jupiter",
        return_year: 2026,
      },
      result_data: {
        return_planet: "Jupiter",
        natal_jupiter_sign: "Capricorn",
        natal_jupiter_degree: 14.7,
        return_date: "2026-01-12T11:20:00Z",
        return_ascendant: "Virgo",
        jupiter_house_in_return: 4,
        key_themes: [
          "Expansion in home and family domain",
          "Real estate opportunities",
          "Philosophical deepening around roots and legacy",
          "Potential international relocation or long-distance family connection",
        ],
        summary: "Jupiter returning to natal position after 12 years. The Capricorn Jupiter return for this chart emphasises serious growth in home, real estate, and family legacy. The 4-year window around this return is powerful for property decisions.",
      },
      created_at: daysAgo(3),
    },
  ];

  const { data, error } = await sb
    .from("astro_toolkit_readings")
    .insert(readings)
    .select("id");

  if (error) throw new Error("astro_toolkit_readings insert failed: " + error.message);
  console.log("  ✓", data.length, "astro toolkit readings inserted");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Seeding subscriptions + readings for test-diviner-2 ===\n");

  const divinerId = await resolveDivinerId();

  const productId = await seedProduct(divinerId);
  await seedSubscribers(divinerId, productId);
  await seedDeliveries(divinerId, productId);
  await seedTarotReadings(divinerId);
  await seedBirthCharts(divinerId);
  await seedToolkitReadings(divinerId);

  console.log("\n=== Done ===");
  console.log("  diviner_id :", divinerId);
  console.log("  user_id    :", TARGET_USER_ID);
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
