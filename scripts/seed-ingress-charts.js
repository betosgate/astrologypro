/**
 * Seed script: ingress_charts — 4 seasonal charts for 2026
 *
 * Usage:
 *   node scripts/seed-ingress-charts.js
 *
 * Reads credentials from .env.local. Requires Node 18+.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Seed data ────────────────────────────────────────────────────────────────

const CHARTS = [
  {
    title: "2026 Aries Ingress — Washington D.C.",
    ingress_type: "Aries Ingress",
    importance: "High Impact",
    short_description:
      "The Sun enters Aries on March 20, 2026, marking the Spring Equinox and beginning a new annual cycle for the United States. This ingress chart sets the energetic tone for government, public mood, and national identity through the summer.",
    effective_time_period: "Mar–Jun 2026",
    event_time_period: "Spring 2026",
    event_timestamp: "2026-03-20T06:24:00-04:00",
    validity_start: "2026-03-20",
    validity_end: "2026-06-20",
    location_name: "Washington D.C., USA",
    location_lat: 38.9072,
    location_lon: -77.0369,
    location_timezone: "America/New_York",
    sector_focus: [
      "governmentAndLeadership",
      "socialClimateAndPublicMood",
      "potentialConflictsAndAlliances",
    ],
    tags: ["Spring Equinox", "Aries", "2026", "USA", "Government"],
    is_social_advo: true,
    is_published: true,
    author_name: "AstrologyPro Team",
    author_email: "astro@divineinfinitebeing.com",
    system_interpretation: {
      intro:
        "The 2026 Aries Ingress positions Mars as chart ruler, reflecting a period of decisive action and heightened national identity. With the Ascendant in late Aquarius, collective innovation and civic participation take center stage.",
      body: [
        "Mars in Gemini at the time of the ingress suggests a dualistic energy in leadership — expect rapid shifts in public rhetoric and competing narratives dominating the political landscape. Communication systems and media will amplify tensions.",
        "Jupiter in Cancer trines the Sun, providing a stabilizing influence on the national economy and domestic affairs. Families and local communities may find unexpected sources of resilience during this period.",
        "Saturn's square to the Ascendant from Taurus indicates structural challenges to existing institutions. Long-term infrastructure and financial frameworks will face pressure to evolve or reform.",
      ],
      chartRuler: [
        {
          icon: "♂",
          text: "Mars in Gemini — Chart ruler in the 4th house, indicating domestic policy disputes and competing voices in civic leadership.",
        },
        {
          icon: "☉",
          text: "Sun in Aries conjunct Chiron — National healing is tied to confronting old wounds around identity and power.",
        },
      ],
      challengesAndStrengths: [
        {
          type: "challenge",
          text: "Polarized public discourse driven by Mars–Mercury tension; misinformation campaigns may intensify.",
        },
        {
          type: "challenge",
          text: "Saturn's square to the Ascendant signals delays and obstacles in key legislative agendas.",
        },
        {
          type: "strength",
          text: "Jupiter in Cancer trine the Sun supports community resilience and grassroots economic growth.",
        },
        {
          type: "strength",
          text: "Venus in Taurus in the 3rd house favors diplomatic communication and cultural exchange.",
        },
      ],
    },
  },
  {
    title: "2026 Cancer Ingress — Washington D.C.",
    ingress_type: "Cancer Ingress",
    importance: "High Impact",
    short_description:
      "The Summer Solstice of 2026 marks the Sun's entry into Cancer, highlighting themes of home, family, national security, and emotional foundations. This ingress governs the United States through the height of summer.",
    effective_time_period: "Jun–Sep 2026",
    event_time_period: "Summer 2026",
    event_timestamp: "2026-06-21T12:57:00-04:00",
    validity_start: "2026-06-21",
    validity_end: "2026-09-22",
    location_name: "Washington D.C., USA",
    location_lat: 38.9072,
    location_lon: -77.0369,
    location_timezone: "America/New_York",
    sector_focus: [
      "publicHealthAndWorkforce",
      "weatherAndAgriculture",
      "socialClimateAndPublicMood",
    ],
    tags: ["Summer Solstice", "Cancer", "2026", "USA", "Public Health"],
    is_social_advo: false,
    is_published: true,
    author_name: "AstrologyPro Team",
    author_email: "astro@divineinfinitebeing.com",
    system_interpretation: {
      intro:
        "The Cancer Ingress of 2026 places the Moon as chart ruler in a prominent angular position, amplifying emotional sensitivity across the nation. Security concerns — both physical and economic — dominate the collective conversation.",
      body: [
        "The Moon in Libra at the Midheaven suggests public figures will be judged by fairness and balance. Diplomatic relationships and trade agreements reach critical junctures requiring nuanced handling.",
        "Neptune in Aries in the 6th house introduces confusion around public health policies and workforce conditions. Clarity will be elusive, and adaptive responses will be more effective than rigid solutions.",
        "Uranus in Gemini sextile the Cancer Sun opens unexpected pathways in communication technology and innovation that benefit domestic industries.",
      ],
      chartRuler: [
        {
          icon: "☽",
          text: "Moon in Libra at the Midheaven — Public leaders must project balance and fairness to maintain credibility.",
        },
      ],
      challengesAndStrengths: [
        {
          type: "challenge",
          text: "Neptune in the 6th house creates ambiguity around healthcare policy and workforce management.",
        },
        {
          type: "challenge",
          text: "Emotional volatility in public opinion may create sudden swings in political approval ratings.",
        },
        {
          type: "strength",
          text: "Uranus–Sun sextile brings innovative solutions to domestic infrastructure and communications.",
        },
        {
          type: "strength",
          text: "Moon's angular position supports grassroots movements gaining institutional recognition.",
        },
      ],
    },
  },
  {
    title: "2026 Libra Ingress — Washington D.C.",
    ingress_type: "Libra Ingress",
    importance: "Medium Impact",
    short_description:
      "The Autumn Equinox of 2026 brings a Libra ingress focused on justice, law, international relationships, and the balance of power. This chart governs the period leading into the final quarter of the year.",
    effective_time_period: "Sep–Dec 2026",
    event_time_period: "Autumn 2026",
    event_timestamp: "2026-09-23T04:05:00-04:00",
    validity_start: "2026-09-23",
    validity_end: "2026-12-21",
    location_name: "Washington D.C., USA",
    location_lat: 38.9072,
    location_lon: -77.0369,
    location_timezone: "America/New_York",
    sector_focus: [
      "justiceLawAndForeignTrade",
      "potentialConflictsAndAlliances",
      "communicationsAndTransportation",
    ],
    tags: ["Autumn Equinox", "Libra", "2026", "USA", "Foreign Policy", "Justice"],
    is_social_advo: false,
    is_published: true,
    author_name: "AstrologyPro Team",
    author_email: "astro@divineinfinitebeing.com",
    system_interpretation: {
      intro:
        "With Venus ruling the 2026 Libra Ingress, diplomacy and coalition building take precedence. This is a critical window for treaty negotiations, trade agreements, and legal reforms that will shape long-term alliances.",
      body: [
        "Venus in Scorpio in the 7th house intensifies partnership negotiations — deals struck during this period carry deep, binding implications. Hidden agendas and power dynamics beneath diplomatic surfaces will eventually emerge.",
        "Mercury retrograde in Libra during part of this period calls for careful review of all legal documents and contracts. Revisiting past agreements may surface unresolved issues requiring mediation.",
        "The North Node in Pisces activates a collective pull toward compassion-based governance and humanitarian foreign policy.",
      ],
      chartRuler: [
        {
          icon: "♀",
          text: "Venus in Scorpio — Diplomatic negotiations carry hidden depth; surface agreements may conceal deeper power plays.",
        },
        {
          icon: "☿",
          text: "Mercury Retrograde in Libra — Review and revision of legal frameworks; past decisions resurface for reconsideration.",
        },
      ],
      challengesAndStrengths: [
        {
          type: "challenge",
          text: "Mercury retrograde creates confusion in diplomatic communications and legal proceedings.",
        },
        {
          type: "challenge",
          text: "Venus in Scorpio warns of hidden agendas in international trade negotiations.",
        },
        {
          type: "strength",
          text: "North Node in Pisces aligns foreign policy decisions with humanitarian values and collective wellbeing.",
        },
        {
          type: "strength",
          text: "Libra Sun's focus on balance creates favorable conditions for bipartisan cooperation.",
        },
      ],
    },
  },
  {
    title: "2026 Capricorn Ingress — Washington D.C.",
    ingress_type: "Capricorn Ingress",
    importance: "High Impact",
    short_description:
      "The Winter Solstice of 2026 marks the Sun's entry into Capricorn, setting the energetic stage for governmental structure, long-term planning, and institutional authority for the final season of the year.",
    effective_time_period: "Dec 2026 – Mar 2027",
    event_time_period: "Winter 2026–2027",
    event_timestamp: "2026-12-21T18:50:00-05:00",
    validity_start: "2026-12-21",
    validity_end: "2027-03-20",
    location_name: "Washington D.C., USA",
    location_lat: 38.9072,
    location_lon: -77.0369,
    location_timezone: "America/New_York",
    sector_focus: [
      "governmentAndLeadership",
      "justiceLawAndForeignTrade",
      "naturalDisasters",
    ],
    tags: ["Winter Solstice", "Capricorn", "2026", "USA", "Government", "Structure"],
    is_social_advo: true,
    is_published: false,
    author_name: "AstrologyPro Team",
    author_email: "astro@divineinfinitebeing.com",
    system_interpretation: {
      intro:
        "Saturn co-rules this Capricorn Ingress alongside the Sun in Capricorn, marking a period of significant structural testing for institutions. The tone is sober, demanding accountability and long-range strategic thinking from leadership.",
      body: [
        "Pluto's extended transit through Aquarius reaches a key turning point during this ingress, accelerating systemic transformation in government and financial systems. The old guard faces unprecedented pressure to adapt.",
        "Mars in Sagittarius in the 9th house suggests foreign policy actions and legal battles on the international stage. Aggressive posturing in global forums may escalate before resolution is reached.",
        "Saturn in Taurus trines the Capricorn Sun, providing structural stability and a foundation for disciplined long-term planning. Infrastructure investment initiated now has lasting generational impact.",
      ],
      chartRuler: [
        {
          icon: "♄",
          text: "Saturn in Taurus trine Sun — Structural integrity and disciplined governance create lasting institutional foundations.",
        },
        {
          icon: "♇",
          text: "Pluto in Aquarius — Systemic transformation in government structures is irreversible; adaptation is essential.",
        },
      ],
      challengesAndStrengths: [
        {
          type: "challenge",
          text: "Mars in Sagittarius signals foreign policy tensions and potential international disputes.",
        },
        {
          type: "challenge",
          text: "Pluto's transformative pressure may destabilize existing financial and governmental institutions.",
        },
        {
          type: "strength",
          text: "Saturn–Sun trine supports disciplined, methodical governance and long-term infrastructure planning.",
        },
        {
          type: "strength",
          text: "Capricorn Sun's emphasis on accountability creates conditions for meaningful institutional reform.",
        },
      ],
    },
  },
];

// ─── Run seed ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding ingress charts…");

  let inserted = 0;
  let skipped = 0;

  for (const chart of CHARTS) {
    // Check if a chart with this title already exists
    const { data: existing } = await admin
      .from("ingress_charts")
      .select("id")
      .eq("title", chart.title)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP — already exists: "${chart.title}"`);
      skipped++;
      continue;
    }

    const { error } = await admin.from("ingress_charts").insert(chart);
    if (error) {
      console.error(`  ERROR inserting "${chart.title}":`, error.message);
    } else {
      console.log(`  OK — inserted: "${chart.title}"`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
