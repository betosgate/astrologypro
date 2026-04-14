/**
 * Reseeds service_templates with the canonical catalog:
 *   - 12 Astrology services (Nativity Birth Chart → Uranus Opposition)
 *   - 7 Tarot Toolkit services
 *
 * Run: node scripts/seed-service-templates.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wyluvclvtvwptsvvtgkv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TEMPLATES = [
  // ── Astrology ──────────────────────────────────────────────────────────
  {
    category: "astrology",
    name: "Nativity Birth Chart",
    slug: "nativity-birth-chart",
    description:
      "A comprehensive analysis of the natal chart, covering personality, life path, key planetary placements, houses, and aspects.",
    duration_minutes: 90,
    base_price: 175.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 10,
  },
  {
    category: "astrology",
    name: "Solar Return",
    slug: "solar-return",
    description:
      "Annual forecast reading based on the solar return chart — themes, opportunities, and challenges for the coming year.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: false,
    requires_birth_data: true,
    trigger_event: "solar_return",
    sort_order: 20,
  },
  {
    category: "astrology",
    name: "Weekly Transits",
    slug: "weekly-transits",
    description:
      "Personalized transit forecast covering the current week's planetary movements and how they activate the natal chart.",
    duration_minutes: 30,
    base_price: 65.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 30,
  },
  {
    category: "astrology",
    name: "Monthly Transits + Lunar Return",
    slug: "monthly-transits-lunar-return",
    description:
      "Monthly overview combining current transits with the lunar return chart for emotional and practical themes.",
    duration_minutes: 45,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 40,
  },
  {
    category: "astrology",
    name: "Romantic Relationships",
    slug: "romantic-relationships",
    description:
      "Synastry and composite chart analysis for romantic compatibility, communication styles, and relationship dynamics.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 50,
  },
  {
    category: "astrology",
    name: "Friendship Relationships",
    slug: "friendship-relationships",
    description:
      "Compatibility analysis for friendships — shared values, communication patterns, and long-term potential.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 60,
  },
  {
    category: "astrology",
    name: "Business Relationship",
    slug: "business-relationship",
    description:
      "Astrological compatibility for business partnerships — strengths, blind spots, and timing considerations.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 70,
  },
  {
    category: "astrology",
    name: "Predictive Event (Horary)",
    slug: "predictive-event-horary",
    description:
      "Horary astrology reading for a specific question or event — answer sought from the chart cast at the time of the question.",
    duration_minutes: 45,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 80,
  },
  {
    category: "astrology",
    name: "Jupiter Return",
    slug: "jupiter-return",
    description:
      "Reading focused on the Jupiter return cycle — expansion, opportunity, and growth themes for the next 12-year chapter.",
    duration_minutes: 45,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: false,
    requires_birth_data: true,
    trigger_event: "jupiter_return",
    sort_order: 90,
  },
  {
    category: "astrology",
    name: "Saturn Return",
    slug: "saturn-return",
    description:
      "Deep dive into the Saturn return — major life restructuring, responsibility shifts, and long-term foundation building.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: false,
    requires_birth_data: true,
    trigger_event: "saturn_return",
    sort_order: 100,
  },
  {
    category: "astrology",
    name: "Mars Return",
    slug: "mars-return",
    description:
      "Annual Mars return forecast covering drive, ambition, conflict patterns, and action themes for the coming year.",
    duration_minutes: 45,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: false,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 110,
  },
  {
    category: "astrology",
    name: "Uranus Opposition",
    slug: "uranus-opposition",
    description:
      "Mid-life Uranus opposition reading — awakening, rebellion, liberation themes and how to navigate the transition.",
    duration_minutes: 60,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: false,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 120,
  },
  // ── Tarot Toolkit ──────────────────────────────────────────────────────
  {
    category: "tarot",
    name: "3 Card Basic Question Spread",
    slug: "3-card-basic-question-spread",
    description:
      "Quick focused reading using a 3-card spread — past, present, and future or situation, action, outcome.",
    duration_minutes: 20,
    base_price: 35.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 130,
  },
  {
    category: "tarot",
    name: "5 Card Complex Question Spread",
    slug: "5-card-complex-question-spread",
    description:
      "In-depth reading for complex questions using a 5-card spread covering context, influences, challenge, advice, and outcome.",
    duration_minutes: 30,
    base_price: 55.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 140,
  },
  {
    category: "tarot",
    name: "7 Card 6 Month Forward Review",
    slug: "7-card-6-month-forward-review",
    description:
      "Six-month forecast spread covering monthly energy themes and an overall guidance card for the period ahead.",
    duration_minutes: 45,
    base_price: 75.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 150,
  },
  {
    category: "tarot",
    name: "7 Card Horseshoe Spread (Major Read)",
    slug: "7-card-horseshoe-spread-major-read",
    description:
      "Classic horseshoe spread covering past, present, hidden influences, obstacles, external influences, advice, and outcome.",
    duration_minutes: 45,
    base_price: 75.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 160,
  },
  {
    category: "tarot",
    name: "10 Card Relationship Spread",
    slug: "10-card-relationship-spread",
    description:
      "Comprehensive relationship reading covering both parties' feelings, connection dynamics, challenges, and future potential.",
    duration_minutes: 60,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 170,
  },
  {
    category: "tarot",
    name: "10 Card Celtic Cross (Major Read)",
    slug: "10-card-celtic-cross-major-read",
    description:
      "The classic Celtic Cross — a thorough 10-card reading covering the full spectrum of a situation with deep insight.",
    duration_minutes: 60,
    base_price: 95.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: false,
    trigger_event: null,
    sort_order: 180,
  },
  {
    category: "tarot",
    name: "12 Card Astrological Spread (Major Read)",
    slug: "12-card-astrological-spread-major-read",
    description:
      "Twelve-card spread mapped to the astrological houses — a holistic yearly overview covering all life areas.",
    duration_minutes: 75,
    base_price: 125.0,
    overage_rate: 0.5,
    is_primary: true,
    requires_birth_data: true,
    trigger_event: null,
    sort_order: 190,
  },
];

async function run() {
  console.log("Clearing existing service_templates...");
  const { error: delErr } = await admin
    .from("service_templates")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }
  console.log("Cleared.");

  console.log(`Inserting ${TEMPLATES.length} templates...`);
  const { data, error: insErr } = await admin
    .from("service_templates")
    .insert(TEMPLATES)
    .select("id, name, category");

  if (insErr) {
    console.error("Insert failed:", insErr.message);
    process.exit(1);
  }

  console.log(`\n✓ Seeded ${data?.length ?? 0} service templates:\n`);
  const astro = data?.filter((t) => t.category === "astrology") ?? [];
  const tarot = data?.filter((t) => t.category === "tarot") ?? [];
  console.log(`  Astrology (${astro.length}):`);
  astro.forEach((t) => console.log(`    • ${t.name}`));
  console.log(`  Tarot (${tarot.length}):`);
  tarot.forEach((t) => console.log(`    • ${t.name}`));
  console.log("\nDone.");
}

run();
