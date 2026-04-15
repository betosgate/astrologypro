#!/usr/bin/env node
/**
 * seed-james-obrien-activity.mjs
 *
 * Populates all activity sections for client James O'Brien
 * on /dashboard/clients/dec26330-0f47-466d-868d-d23c91678fbe
 *
 * Inserts:
 *   - 4 past bookings (completed) for this client + diviner
 *   - 4 tarot readings linked to James's user_id + diviner
 *   - 3 birth chart results linked to James's user_id
 *   - 4 astro toolkit readings linked to James's user_id + diviner
 *   - 2 testimonials from James for this diviner
 *   - Updates client_diviners last_session_at
 *
 * Idempotent: deletes previous seeded records first.
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

const CLIENT_ID   = "dec26330-0f47-466d-868d-d23c91678fbe";
const USER_ID     = "1e2752ff-e64e-4835-84e8-b10da5e6434d";
const DIVINER_ID  = "c10a225f-51f5-441f-ad0c-1487fe576b43";

// Pre-assigned UUIDs so inserts are idempotent
const TAROT_IDS   = ["b1000001-0000-0000-0000-000000000001","b1000001-0000-0000-0000-000000000002","b1000001-0000-0000-0000-000000000003","b1000001-0000-0000-0000-000000000004"];
const CHART_IDS   = ["b2000001-0000-0000-0000-000000000001","b2000001-0000-0000-0000-000000000002","b2000001-0000-0000-0000-000000000003"];
const TOOLKIT_IDS = ["b3000001-0000-0000-0000-000000000001","b3000001-0000-0000-0000-000000000002","b3000001-0000-0000-0000-000000000003","b3000001-0000-0000-0000-000000000004"];
const TEST_IDS    = ["b4000001-0000-0000-0000-000000000001","b4000001-0000-0000-0000-000000000002"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function main() {
  console.log("=== seed-james-obrien-activity ===\n");

  // ── 1. Get service id ─────────────────────────────────────────────────────
  const { data: svc } = await sb
    .from("services")
    .select("id, base_price, duration_minutes")
    .eq("diviner_id", DIVINER_ID)
    .eq("is_active", true)
    .limit(1)
    .single();
  const serviceId = svc?.id;
  const price = svc?.base_price ?? 150;
  const duration = svc?.duration_minutes ?? 60;
  console.log(`Service: ${serviceId} @ $${price}`);

  // ── 2. Clean previous seed data ───────────────────────────────────────────
  console.log("\nCleaning previous seed data…");
  await sb.from("testimonials").delete().in("id", TEST_IDS);
  await sb.from("astro_toolkit_readings").delete().in("id", TOOLKIT_IDS);
  await sb.from("birth_chart_results").delete().in("id", CHART_IDS);
  await sb.from("tarot_readings").delete().in("id", TAROT_IDS);
  // Delete past seeded bookings (completed, past date) for this client+diviner
  await sb.from("bookings")
    .delete()
    .eq("client_id", CLIENT_ID)
    .eq("diviner_id", DIVINER_ID)
    .eq("status", "completed");
  console.log("   ✓ Cleaned");

  // ── 3. Past bookings (completed) ─────────────────────────────────────────
  console.log("\nInserting 4 completed past bookings…");
  const pastBookings = [
    { scheduled_at: daysAgo(90), status: "completed", session_notes: "Initial natal chart consultation. James showed strong Sagittarius stellium — adventure and philosophy are key themes.", total_amount: price },
    { scheduled_at: daysAgo(60), status: "completed", session_notes: "Transits review. Mars return coming up in 2 weeks — discussed energy management and discipline.", total_amount: price },
    { scheduled_at: daysAgo(32), status: "completed", session_notes: "Followed up on Mars return experience. Client reported increased drive and impulse. Next focus: Jupiter progression.", total_amount: price },
    { scheduled_at: daysAgo(10), status: "completed", session_notes: "Solar arc directions for the next 12 months. Key themes: education, foreign travel, spiritual growth.", total_amount: price },
  ].map((b) => ({
    diviner_id: DIVINER_ID,
    client_id: CLIENT_ID,
    service_id: serviceId,
    duration_minutes: duration,
    base_price: price,
    ...b,
  }));

  const { error: bookErr } = await sb.from("bookings").insert(pastBookings);
  if (bookErr) throw new Error(`Bookings: ${bookErr.message}`);
  console.log("   ✓ 4 past bookings inserted");

  // ── 4. Tarot readings ─────────────────────────────────────────────────────
  console.log("\nInserting 4 tarot readings…");
  const tarotRows = [
    {
      id: TAROT_IDS[0],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      spread_id: "celtic-cross",
      spread_name: "Celtic Cross",
      notes: "James was contemplating a major life change. Cards pointed strongly to the Chariot — forward movement despite obstacles. Advised patience through the transition.",
      created_at: daysAgo(88),
      cards: [
        { position: 1, position_name: "Present", card_name: "The Chariot", is_reversed: false, keywords: ["determination","control","victory"], meaning: "Forward movement and willpower are your greatest assets right now." },
        { position: 2, position_name: "Challenge", card_name: "Five of Cups", is_reversed: true, keywords: ["recovery","moving on"], meaning: "Past losses are being released; focus shifts to what remains." },
        { position: 3, position_name: "Past", card_name: "The Hermit", is_reversed: false, keywords: ["introspection","solitude"], meaning: "A period of deep inner work has prepared you for this moment." },
        { position: 4, position_name: "Future", card_name: "The Sun", is_reversed: false, keywords: ["joy","success","vitality"], meaning: "Bright outcomes ahead — confidence and clarity will emerge." },
        { position: 5, position_name: "Above", card_name: "King of Wands", is_reversed: false, keywords: ["leadership","vision"], meaning: "Aspire to bold, visionary leadership in your chosen path." },
        { position: 6, position_name: "Below", card_name: "Eight of Swords", is_reversed: true, keywords: ["liberation","new perspective"], meaning: "Releasing self-limiting beliefs opens a new path forward." },
        { position: 7, position_name: "Advice", card_name: "Ace of Pentacles", is_reversed: false, keywords: ["opportunity","manifestation"], meaning: "A grounded new beginning — take practical steps toward your goal." },
        { position: 8, position_name: "External", card_name: "Two of Cups", is_reversed: false, keywords: ["partnership","connection"], meaning: "Supportive relationships will be pivotal in your journey." },
        { position: 9, position_name: "Hopes/Fears", card_name: "The Tower", is_reversed: false, keywords: ["upheaval","revelation"], meaning: "Fear of sudden change — yet this disruption carries liberation." },
        { position: 10, position_name: "Outcome", card_name: "The World", is_reversed: false, keywords: ["completion","wholeness"], meaning: "A cycle completes in triumph — full integration of lessons learned." },
      ],
    },
    {
      id: TAROT_IDS[1],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      spread_id: "three-card",
      spread_name: "Three Card Spread",
      notes: "Quick check-in before Mars return. Energy was scattered — advised grounding practices.",
      created_at: daysAgo(58),
      cards: [
        { position: 1, position_name: "Past", card_name: "Knight of Wands", is_reversed: true, keywords: ["impulsive","scattered"], meaning: "Rushing ahead without clear direction has drained energy." },
        { position: 2, position_name: "Present", card_name: "Strength", is_reversed: false, keywords: ["courage","patience","inner power"], meaning: "The capacity is there — channel it with measured calm." },
        { position: 3, position_name: "Future", card_name: "Six of Pentacles", is_reversed: false, keywords: ["generosity","balance","giving"], meaning: "Balanced exchange of resources and energy brings stability." },
      ],
    },
    {
      id: TAROT_IDS[2],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      spread_id: "horseshoe",
      spread_name: "Horseshoe Spread",
      notes: "Post Mars return reading. Client felt energised. Cards confirmed new chapter opening — Sagittarius themes of expansion and philosophy front and centre.",
      created_at: daysAgo(30),
      cards: [
        { position: 1, position_name: "Past Influences", card_name: "Four of Cups", is_reversed: false, keywords: ["apathy","contemplation"], meaning: "Withdrawal and inward focus characterised the recent past." },
        { position: 2, position_name: "Present", card_name: "Page of Wands", is_reversed: false, keywords: ["curiosity","enthusiasm"], meaning: "Fresh excitement about new directions is taking hold." },
        { position: 3, position_name: "Hidden Influence", card_name: "The High Priestess", is_reversed: false, keywords: ["intuition","mystery"], meaning: "Subconscious wisdom is guiding you more than you realise." },
        { position: 4, position_name: "Advice", card_name: "Wheel of Fortune", is_reversed: false, keywords: ["cycles","luck","turning point"], meaning: "Align with the natural turning point — the wheel is in your favour." },
        { position: 5, position_name: "External Influences", card_name: "Three of Cups", is_reversed: false, keywords: ["community","celebration"], meaning: "Supportive social connections will amplify your momentum." },
        { position: 6, position_name: "Hopes and Fears", card_name: "Nine of Swords", is_reversed: true, keywords: ["releasing anxiety","recovery"], meaning: "Worry is easing — the mental weight is beginning to lift." },
        { position: 7, position_name: "Outcome", card_name: "Ace of Wands", is_reversed: false, keywords: ["new beginnings","inspiration","creative spark"], meaning: "A bold new creative chapter ignites — pursue it without hesitation." },
      ],
    },
    {
      id: TAROT_IDS[3],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      spread_id: "three-card",
      spread_name: "Three Card Spread",
      notes: "Pre-session check on upcoming Jupiter transit. Client asked specifically about career and education.",
      created_at: daysAgo(8),
      cards: [
        { position: 1, position_name: "Career", card_name: "Eight of Pentacles", is_reversed: false, keywords: ["mastery","dedication","craft"], meaning: "Focused, skill-building effort now leads to mastery later." },
        { position: 2, position_name: "Education", card_name: "The Star", is_reversed: false, keywords: ["hope","inspiration","higher purpose"], meaning: "Study and learning will feel guided and deeply purposeful." },
        { position: 3, position_name: "Outcome", card_name: "Ten of Cups", is_reversed: false, keywords: ["fulfilment","harmony","family"], meaning: "Lasting joy and emotional fulfilment follow the effort invested." },
      ],
    },
  ];

  const { error: tarotErr } = await sb.from("tarot_readings").insert(tarotRows);
  if (tarotErr) throw new Error(`Tarot: ${tarotErr.message}`);
  console.log("   ✓ 4 tarot readings inserted");

  // ── 5. Birth charts ───────────────────────────────────────────────────────
  console.log("\nInserting 3 birth charts…");
  const chartRows = [
    {
      id: CHART_IDS[0],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      city_label: "Dublin, County Dublin, Ireland",
      birth_day: 1,
      birth_month: 12,
      birth_year: 2016,
      birth_hour: 7,
      birth_min: 22,
      lat: 53.3498,
      lon: -6.2603,
      tzone: "+00:00",
      astro_data: {
        planets: [
          { name: "Sun",     sign: "Sagittarius", house: 1,  full_degree: 249.3, norm_degree:  9.3, speed: 1.015, is_retro: "false", sign_id: 9  },
          { name: "Moon",    sign: "Aries",       house: 5,  full_degree: 355.8, norm_degree: 25.8, speed: 14.1,  is_retro: "false", sign_id: 1  },
          { name: "Mercury", sign: "Sagittarius", house: 1,  full_degree: 254.6, norm_degree: 14.6, speed: 1.58,  is_retro: "false", sign_id: 9  },
          { name: "Venus",   sign: "Capricorn",   house: 2,  full_degree: 282.1, norm_degree: 12.1, speed: 1.25,  is_retro: "false", sign_id: 10 },
          { name: "Mars",    sign: "Aquarius",    house: 3,  full_degree: 303.4, norm_degree:  3.4, speed: 0.77,  is_retro: "false", sign_id: 11 },
          { name: "Jupiter", sign: "Libra",       house: 11, full_degree: 196.2, norm_degree: 16.2, speed: 0.19,  is_retro: "false", sign_id: 7  },
          { name: "Saturn",  sign: "Sagittarius", house: 1,  full_degree: 261.4, norm_degree: 21.4, speed: 0.11,  is_retro: "false", sign_id: 9  },
          { name: "Uranus",  sign: "Aries",       house: 5,  full_degree:  20.6, norm_degree: 20.6, speed: 0.055, is_retro: "false", sign_id: 1  },
          { name: "Neptune", sign: "Pisces",       house: 4,  full_degree: 339.9, norm_degree:  9.9, speed: 0.014, is_retro: "false", sign_id: 12 },
          { name: "Pluto",   sign: "Capricorn",   house: 2,  full_degree: 285.5, norm_degree: 15.5, speed: 0.02,  is_retro: "false", sign_id: 10 },
        ],
        houses: [
          { house: 1, sign: "Sagittarius", degree: 240.0, sign_id: 9  },
          { house: 2, sign: "Capricorn",   degree: 270.0, sign_id: 10 },
          { house: 3, sign: "Aquarius",    degree: 300.0, sign_id: 11 },
          { house: 4, sign: "Pisces",      degree: 330.0, sign_id: 12 },
          { house: 5, sign: "Aries",       degree:   0.0, sign_id: 1  },
          { house: 6, sign: "Taurus",      degree:  30.0, sign_id: 2  },
          { house: 7, sign: "Gemini",      degree:  60.0, sign_id: 3  },
          { house: 8, sign: "Cancer",      degree:  90.0, sign_id: 4  },
          { house: 9, sign: "Leo",         degree: 120.0, sign_id: 5  },
          { house: 10, sign: "Virgo",      degree: 150.0, sign_id: 6  },
          { house: 11, sign: "Libra",      degree: 180.0, sign_id: 7  },
          { house: 12, sign: "Scorpio",    degree: 210.0, sign_id: 8  },
        ],
        ascendant: 240.0,
        midheaven: 150.0,
        aspects: [
          { aspecting_planet: "Sun", aspected_planet: "Saturn", type: "Conjunction", orb: 2.1, diff: 12.1, aspect_type: 1 },
          { aspecting_planet: "Moon", aspected_planet: "Uranus", type: "Conjunction", orb: 5.2, diff: 5.2, aspect_type: 1 },
          { aspecting_planet: "Jupiter", aspected_planet: "Neptune", type: "Trine", orb: 3.7, diff: 143.7, aspect_type: 3 },
          { aspecting_planet: "Mars", aspected_planet: "Venus", type: "Sextile", orb: 1.3, diff: 61.3, aspect_type: 5 },
        ],
      },
      created_at: daysAgo(87),
    },
    {
      id: CHART_IDS[1],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      city_label: "Dublin, County Dublin, Ireland",
      birth_day: 1,
      birth_month: 12,
      birth_year: 2016,
      birth_hour: 8,
      birth_min: 0,
      lat: 53.3498,
      lon: -6.2603,
      tzone: "+00:00",
      astro_data: { note: "Rectified birth time — corrected to 08:00 based on life events" },
      chart_url: null,
      created_at: daysAgo(60),
    },
    {
      id: CHART_IDS[2],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      city_label: "Dublin, County Dublin, Ireland",
      birth_day: 1,
      birth_month: 12,
      birth_year: 2016,
      birth_hour: 8,
      birth_min: 0,
      lat: 53.3498,
      lon: -6.2603,
      tzone: "+00:00",
      astro_data: { note: "Solar arc directions chart — progressed to age 9 (2025/26)" },
      chart_url: null,
      created_at: daysAgo(9),
    },
  ];

  const { error: chartErr } = await sb.from("birth_chart_results").insert(chartRows);
  if (chartErr) throw new Error(`Charts: ${chartErr.message}`);
  console.log("   ✓ 3 birth charts inserted");

  // ── 6. Astro toolkit readings ─────────────────────────────────────────────
  console.log("\nInserting 4 astro toolkit readings…");
  const toolkitRows = [
    {
      id: TOOLKIT_IDS[0],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      reading_type: "natal_chart",
      input_data: { name: "James O'Brien", birth_date: "2016-12-01", birth_time: "07:22", birth_place: "Dublin, Ireland" },
      result_data: { sun_sign: "Sagittarius", moon_sign: "Aries", rising: "Sagittarius", chart_ruler: "Jupiter", dominant_element: "Fire", dominant_modality: "Mutable" },
      created_at: daysAgo(86),
    },
    {
      id: TOOLKIT_IDS[1],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      reading_type: "planet_return",
      input_data: { name: "James O'Brien", birth_date: "2016-12-01", birth_place: "Dublin, Ireland", return_year: 2026 },
      result_data: { return_date: "2026-04-29", return_sign: "Aquarius", return_house: 3, key_themes: ["communication","siblings","short travel","mental energy"], duration_days: 687 },
      created_at: daysAgo(57),
    },
    {
      id: TOOLKIT_IDS[2],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      reading_type: "transit",
      input_data: { name: "James O'Brien", birth_date: "2016-12-01", transit_date: "2026-06-01", birth_place: "Dublin, Ireland" },
      result_data: {
        active_transits: [
          { transit_planet: "Jupiter", natal_planet: "Sun", aspect: "Trine", orb: 2.1, theme: "Growth and optimism — favourable for education and broadening horizons" },
          { transit_planet: "Saturn", natal_planet: "Moon", aspect: "Square", orb: 3.4, theme: "Emotional discipline required — learning boundaries and responsibility" },
          { transit_planet: "Uranus", natal_planet: "Mercury", aspect: "Sextile", orb: 1.8, theme: "Inventive thinking and unexpected insights — great for learning new subjects" },
        ],
      },
      created_at: daysAgo(29),
    },
    {
      id: TOOLKIT_IDS[3],
      user_id: USER_ID,
      diviner_id: DIVINER_ID,
      reading_type: "solar_return",
      input_data: { name: "James O'Brien", birth_date: "2016-12-01", return_year: 2026, birth_place: "Dublin, Ireland" },
      result_data: { return_date: "2026-12-01", sr_ascendant: "Leo", sr_sun_house: 5, sr_stellium: "Sagittarius 5th house", key_themes: ["creativity","self-expression","play","education","joy"] },
      created_at: daysAgo(8),
    },
  ];

  const { error: toolErr } = await sb.from("astro_toolkit_readings").insert(toolkitRows);
  if (toolErr) throw new Error(`Toolkit: ${toolErr.message}`);
  console.log("   ✓ 4 toolkit readings inserted");

  // ── 7. Testimonials ───────────────────────────────────────────────────────
  console.log("\nInserting 2 testimonials…");
  const testimonialRows = [
    {
      id: TEST_IDS[0],
      diviner_id: DIVINER_ID,
      client_id: CLIENT_ID,
      client_name: "James O'Brien",
      rating: 5,
      text: "The natal chart reading was incredible — it explained so much about my son's personality and natural gifts. The astrologer broke down complex concepts in a way that was easy to understand and deeply meaningful. We will absolutely be back for the solar return reading.",
      service_type: "Natal Chart Reading",
      status: "approved",
      featured: true,
      created_at: daysAgo(80),
    },
    {
      id: TEST_IDS[1],
      diviner_id: DIVINER_ID,
      client_id: CLIENT_ID,
      client_name: "James O'Brien",
      rating: 5,
      text: "The Mars return consultation was spot on — the timing aligned perfectly with what James was experiencing at school. The session notes were detailed and gave us real practical guidance for the months ahead. Highly recommend.",
      service_type: "Transit Reading",
      status: "approved",
      featured: false,
      created_at: daysAgo(28),
    },
  ];

  const { error: testErr } = await sb.from("testimonials").insert(testimonialRows);
  if (testErr) throw new Error(`Testimonials: ${testErr.message}`);
  console.log("   ✓ 2 testimonials inserted");

  // ── 8. Update client_diviners ─────────────────────────────────────────────
  console.log("\nUpdating client_diviners summary…");
  const { error: cdErr } = await sb
    .from("client_diviners")
    .update({
      total_sessions: 7,         // 4 past + upcoming sessions
      total_spent: 600,          // 4 × $150
      last_session_at: daysAgo(10),
    })
    .eq("client_id", CLIENT_ID)
    .eq("diviner_id", DIVINER_ID);
  if (cdErr) throw new Error(`client_diviners: ${cdErr.message}`);
  console.log("   ✓ client_diviners updated");

  console.log("\n=== DONE ===");
  console.log("Visit: https://astrologypro.com/dashboard/clients/dec26330-0f47-466d-868d-d23c91678fbe");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
