/**
 * Seed script for: check-ins, giveaways, testimonials, page_views,
 * diviner_activity_events — all for the test diviner (cosmic-aura).
 * Also backfills client_diviners.last_session_at from completed bookings.
 *
 * Run: node scripts/seed-dashboard-pages.mjs
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

const DIVINER_ID = "2f292629-e7ac-4ff8-bfa4-b5f0878421f0";

// Helpers
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function hoursAgo(n) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Backfill client_diviners.last_session_at from completed bookings
// ─────────────────────────────────────────────────────────────────────────────
async function backfillLastSessionAt() {
  console.log("→ Backfilling client_diviners.last_session_at …");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, scheduled_at")
    .eq("diviner_id", DIVINER_ID)
    .eq("status", "completed");

  if (!bookings?.length) {
    console.log("  No completed bookings found.");
    return;
  }

  // Max scheduled_at per client
  const latestPerClient = {};
  for (const b of bookings) {
    if (!latestPerClient[b.client_id] || b.scheduled_at > latestPerClient[b.client_id]) {
      latestPerClient[b.client_id] = b.scheduled_at;
    }
  }

  const { data: cds } = await supabase
    .from("client_diviners")
    .select("id, client_id")
    .eq("diviner_id", DIVINER_ID);

  let updated = 0;
  for (const cd of cds ?? []) {
    const lastAt = latestPerClient[cd.client_id];
    if (lastAt) {
      const { error } = await supabase
        .from("client_diviners")
        .update({ last_session_at: lastAt })
        .eq("id", cd.id);
      if (error) console.warn("  ✗ update failed for", cd.id, error.message);
      else updated++;
    }
  }
  console.log(`  ✓ Updated ${updated} client_diviners rows`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Check-ins (50 rows)
// ─────────────────────────────────────────────────────────────────────────────
const CHECK_IN_DATA = [
  { first_name: "Luna", last_name: "Hartwell", email: "luna.hartwell@gmail.com", birth_date: "1990-03-15", birth_city: "Austin", birth_time: "07:23", days_ago: 1 },
  { first_name: "Marcus", last_name: "Chen", email: "marcus.chen@gmail.com", birth_date: "1985-11-02", birth_city: "San Francisco", birth_time: null, days_ago: 2 },
  { first_name: "Seraphina", last_name: "Torres", email: "sera.torres@icloud.com", birth_date: "1993-07-21", birth_city: "Miami", birth_time: "14:45", days_ago: 2 },
  { first_name: "Devon", last_name: "Okafor", email: "devon.okafor@outlook.com", birth_date: null, birth_city: null, birth_time: null, days_ago: 3 },
  { first_name: "Celeste", last_name: "Martin", email: "celeste.martin@yahoo.com", birth_date: "1988-01-30", birth_city: "New York", birth_time: "22:15", days_ago: 3 },
  { first_name: "Rayan", last_name: "Patel", email: "rayan.patel@gmail.com", birth_date: "1996-06-08", birth_city: "Houston", birth_time: "03:10", days_ago: 4 },
  { first_name: "Ines", last_name: "Johansson", email: "ines.johansson@gmail.com", birth_date: "1982-09-14", birth_city: "Seattle", birth_time: null, days_ago: 4 },
  { first_name: "Tobias", last_name: "Wright", email: "tobias.wright@proton.me", birth_date: "1991-12-25", birth_city: "Denver", birth_time: "11:00", days_ago: 5 },
  { first_name: "Anika", last_name: "Sharma", email: "anika.sharma@gmail.com", birth_date: "1994-04-03", birth_city: "Phoenix", birth_time: "16:30", days_ago: 5 },
  { first_name: "Brett", last_name: "Collins", email: "brett.collins@icloud.com", birth_date: null, birth_city: "Las Vegas", birth_time: null, days_ago: 6 },
  { first_name: "Zara", last_name: "Osei", email: "zara.osei@gmail.com", birth_date: "1987-08-19", birth_city: "Atlanta", birth_time: "08:47", days_ago: 6 },
  { first_name: "Finn", last_name: "Larsson", email: "finn.larsson@outlook.com", birth_date: "1999-02-14", birth_city: "Portland", birth_time: null, days_ago: 7 },
  { first_name: "Melody", last_name: "Banks", email: "melody.banks@gmail.com", birth_date: "1992-05-27", birth_city: "Nashville", birth_time: "19:55", days_ago: 8 },
  { first_name: "Jasper", last_name: "Nguyen", email: "jasper.nguyen@gmail.com", birth_date: "1989-10-10", birth_city: "San Diego", birth_time: "00:30", days_ago: 9 },
  { first_name: "Sofia", last_name: "Reyes", email: "sofia.reyes@yahoo.com", birth_date: "1995-03-01", birth_city: "Dallas", birth_time: "12:00", days_ago: 10 },
  { first_name: "Omar", last_name: "Hassan", email: "omar.hassan@gmail.com", birth_date: "1984-07-17", birth_city: "Chicago", birth_time: null, days_ago: 11 },
  { first_name: "Priya", last_name: "Mehta", email: "priya.mehta@gmail.com", birth_date: "1997-01-22", birth_city: "Boston", birth_time: "06:15", days_ago: 12 },
  { first_name: "Lucas", last_name: "Ferreira", email: "lucas.ferreira@outlook.com", birth_date: "1990-11-28", birth_city: "Los Angeles", birth_time: "20:00", days_ago: 13 },
  { first_name: "Amara", last_name: "Diallo", email: "amara.diallo@gmail.com", birth_date: "1993-06-05", birth_city: "Detroit", birth_time: null, days_ago: 14 },
  { first_name: "Noah", last_name: "Steinberg", email: "noah.steinberg@icloud.com", birth_date: "1986-04-12", birth_city: "Minneapolis", birth_time: "09:40", days_ago: 15 },
  { first_name: "Valentina", last_name: "Cruz", email: "valentina.cruz@gmail.com", birth_date: "1998-08-29", birth_city: "San Antonio", birth_time: "15:20", days_ago: 16 },
  { first_name: "Kieran", last_name: "Murphy", email: "kieran.murphy@proton.me", birth_date: "1983-02-07", birth_city: "Columbus", birth_time: null, days_ago: 17 },
  { first_name: "Elara", last_name: "Stone", email: "elara.stone@gmail.com", birth_date: "1991-09-18", birth_city: "Indianapolis", birth_time: "23:00", days_ago: 18 },
  { first_name: "Kwame", last_name: "Asante", email: "kwame.asante@gmail.com", birth_date: null, birth_city: "Cleveland", birth_time: null, days_ago: 19 },
  { first_name: "Isla", last_name: "McKay", email: "isla.mckay@outlook.com", birth_date: "1996-12-03", birth_city: "Charlotte", birth_time: "05:50", days_ago: 20 },
  { first_name: "Damien", last_name: "Bouchard", email: "damien.bouchard@gmail.com", birth_date: "1988-03-25", birth_city: "Baltimore", birth_time: "18:10", days_ago: 21 },
  { first_name: "Nadia", last_name: "Kaur", email: "nadia.kaur@yahoo.com", birth_date: "1994-10-16", birth_city: "Sacramento", birth_time: null, days_ago: 22 },
  { first_name: "Elliot", last_name: "Rhodes", email: "elliot.rhodes@gmail.com", birth_date: "1987-05-20", birth_city: "Kansas City", birth_time: "13:25", days_ago: 23 },
  { first_name: "Soraya", last_name: "Ahmadi", email: "soraya.ahmadi@gmail.com", birth_date: "1992-01-08", birth_city: "Raleigh", birth_time: "07:00", days_ago: 24 },
  { first_name: "Caden", last_name: "Xu", email: "caden.xu@icloud.com", birth_date: null, birth_city: null, birth_time: null, days_ago: 25 },
  { first_name: "Marisol", last_name: "Vega", email: "marisol.vega@gmail.com", birth_date: "1985-07-11", birth_city: "El Paso", birth_time: "21:35", days_ago: 26 },
  { first_name: "Arlo", last_name: "Davies", email: "arlo.davies@outlook.com", birth_date: "1999-04-24", birth_city: "Tucson", birth_time: null, days_ago: 27 },
  { first_name: "Yemi", last_name: "Adeyemi", email: "yemi.adeyemi@gmail.com", birth_date: "1990-08-02", birth_city: "Memphis", birth_time: "10:45", days_ago: 28 },
  { first_name: "Tatiana", last_name: "Volkov", email: "tatiana.volkov@gmail.com", birth_date: "1993-11-19", birth_city: "Louisville", birth_time: "04:20", days_ago: 29 },
  { first_name: "Bastian", last_name: "Koch", email: "bastian.koch@proton.me", birth_date: "1986-06-30", birth_city: "Portland", birth_time: null, days_ago: 30 },
  { first_name: "Deja", last_name: "Washington", email: "deja.washington@yahoo.com", birth_date: "1997-02-13", birth_city: "Richmond", birth_time: "17:05", days_ago: 32 },
  { first_name: "Nikolai", last_name: "Petrov", email: "nikolai.petrov@gmail.com", birth_date: "1984-09-06", birth_city: "Milwaukee", birth_time: "02:50", days_ago: 35 },
  { first_name: "Zahra", last_name: "Ibrahim", email: "zahra.ibrahim@outlook.com", birth_date: "1995-05-14", birth_city: "Albuquerque", birth_time: null, days_ago: 38 },
  { first_name: "Phoenix", last_name: "Gray", email: "phoenix.gray@gmail.com", birth_date: null, birth_city: "Fresno", birth_time: null, days_ago: 40 },
  { first_name: "Lena", last_name: "Fischer", email: "lena.fischer@gmail.com", birth_date: "1991-03-22", birth_city: "Omaha", birth_time: "11:30", days_ago: 42 },
  { first_name: "Cyrus", last_name: "Rahmani", email: "cyrus.rahmani@icloud.com", birth_date: "1989-12-07", birth_city: "Tulsa", birth_time: "14:15", days_ago: 45 },
  { first_name: "Britta", last_name: "Andersen", email: "britta.andersen@gmail.com", birth_date: "1994-08-31", birth_city: "Oakland", birth_time: null, days_ago: 48 },
  { first_name: "Matteo", last_name: "Romano", email: "matteo.romano@outlook.com", birth_date: "1987-04-17", birth_city: "Minneapolis", birth_time: "22:45", days_ago: 50 },
  { first_name: "Adaeze", last_name: "Eze", email: "adaeze.eze@gmail.com", birth_date: "1996-01-26", birth_city: "Wichita", birth_time: "08:00", days_ago: 53 },
  { first_name: "Fletcher", last_name: "Hunt", email: "fletcher.hunt@yahoo.com", birth_date: null, birth_city: null, birth_time: null, days_ago: 55 },
  { first_name: "Mia", last_name: "Tanaka", email: "mia.tanaka@gmail.com", birth_date: "1992-07-09", birth_city: "Aurora", birth_time: "16:00", days_ago: 58 },
  { first_name: "Solomon", last_name: "Abebe", email: "solomon.abebe@proton.me", birth_date: "1983-10-23", birth_city: "Anaheim", birth_time: null, days_ago: 60 },
  { first_name: "Cassidy", last_name: "Bloom", email: "cassidy.bloom@gmail.com", birth_date: "1998-06-18", birth_city: "Santa Ana", birth_time: "19:10", days_ago: 63 },
  { first_name: "Tariq", last_name: "Ali", email: "tariq.ali@outlook.com", birth_date: "1985-02-28", birth_city: "Corpus Christi", birth_time: "01:40", days_ago: 65 },
  { first_name: "Waverly", last_name: "James", email: "waverly.james@gmail.com", birth_date: "1990-05-04", birth_city: "Lexington", birth_time: null, days_ago: 70 },
];

async function seedCheckIns() {
  console.log("→ Seeding check_ins …");
  const rows = CHECK_IN_DATA.map((c) => ({
    diviner_id: DIVINER_ID,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    birth_date: c.birth_date,
    birth_city: c.birth_city,
    birth_time: c.birth_time,
    created_at: daysAgo(c.days_ago),
  }));
  const { error } = await supabase.from("check_ins").insert(rows);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rows.length} check-in rows inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Giveaways + entries + winner
// ─────────────────────────────────────────────────────────────────────────────
async function seedGiveaways() {
  console.log("→ Seeding giveaways …");

  const giveaways = [
    {
      diviner_id: DIVINER_ID,
      title: "Mercury Retrograde Survival Kit",
      description: "Enter for a chance to win a curated crystal kit + a free natal chart reading to help you navigate the upcoming Mercury retrograde with grace.",
      prize_description: "Amethyst, black tourmaline & selenite crystal set + 60-min Natal Chart reading ($175 value)",
      status: "ended",
      starts_at: daysAgo(30),
      ends_at: daysAgo(10),
      winner_count: 1,
      winner_selection: "random",
      is_public: true,
      entry_fields: ["email", "name"],
      max_entries: null,
    },
    {
      diviner_id: DIVINER_ID,
      title: "Full Moon Tarot Pull — Win a Deep Reading",
      description: "Celebrate the Scorpio Full Moon with us! Submit your name and burning question for a chance to win a full Celtic Cross reading.",
      prize_description: "10-card Celtic Cross reading + personalised Moon ritual guide ($95 value)",
      status: "active",
      starts_at: daysAgo(5),
      ends_at: daysAgo(-7),
      winner_count: 2,
      winner_selection: "random",
      is_public: true,
      entry_fields: ["email", "name", "question"],
      max_entries: 200,
    },
    {
      diviner_id: DIVINER_ID,
      title: "Jupiter Return Reading Giveaway",
      description: "Is Jupiter returning to its natal position in your chart? Share your birth year and find out if you qualify — one lucky winner gets a full Jupiter Return reading.",
      prize_description: "45-min Jupiter Return reading ($95 value)",
      status: "draft",
      starts_at: daysAgo(-3),
      ends_at: daysAgo(-17),
      winner_count: 1,
      winner_selection: "manual",
      is_public: false,
      entry_fields: ["email", "name", "birth_year"],
      max_entries: null,
    },
  ];

  const { data: inserted, error } = await supabase
    .from("giveaways")
    .insert(giveaways)
    .select("id, title");
  if (error) {
    console.error("  ✗ giveaways:", error.message);
    return;
  }
  console.log(`  ✓ ${inserted.length} giveaways inserted`);

  // Seed entries for the first two (ended + active)
  const entryNames = [
    ["Luna", "Hartwell", "luna.hartwell@gmail.com"],
    ["Marcus", "Chen", "marcus.chen@gmail.com"],
    ["Seraphina", "Torres", "sera.torres@icloud.com"],
    ["Devon", "Okafor", "devon.okafor@outlook.com"],
    ["Celeste", "Martin", "celeste.martin@yahoo.com"],
    ["Rayan", "Patel", "rayan.patel@gmail.com"],
    ["Ines", "Johansson", "ines.johansson@gmail.com"],
    ["Tobias", "Wright", "tobias.wright@proton.me"],
    ["Anika", "Sharma", "anika.sharma@gmail.com"],
    ["Brett", "Collins", "brett.collins@icloud.com"],
    ["Zara", "Osei", "zara.osei@gmail.com"],
    ["Finn", "Larsson", "finn.larsson@outlook.com"],
    ["Melody", "Banks", "melody.banks@gmail.com"],
    ["Jasper", "Nguyen", "jasper.nguyen@gmail.com"],
    ["Sofia", "Reyes", "sofia.reyes@yahoo.com"],
    ["Omar", "Hassan", "omar.hassan@gmail.com"],
    ["Priya", "Mehta", "priya.mehta@gmail.com"],
    ["Lucas", "Ferreira", "lucas.ferreira@outlook.com"],
    ["Amara", "Diallo", "amara.diallo@gmail.com"],
    ["Noah", "Steinberg", "noah.steinberg@icloud.com"],
  ];

  for (let gIdx = 0; gIdx < Math.min(2, inserted.length); gIdx++) {
    const gId = inserted[gIdx].id;
    const count = gIdx === 0 ? 20 : 12;
    const entries = entryNames.slice(0, count).map((n) => ({
      giveaway_id: gId,
      name: `${n[0]} ${n[1]}`,
      email: n[2],
      extra_fields: {},
      ip_address: null,
    }));
    const { data: insertedEntries, error: ee } = await supabase
      .from("giveaway_entries")
      .insert(entries)
      .select("id");
    if (ee) console.error("  ✗ entries for", inserted[gIdx].title, ee.message);
    else console.log(`  ✓ ${insertedEntries.length} entries for "${inserted[gIdx].title}"`);

    // Seed winner for the ended giveaway (first one)
    if (gIdx === 0 && insertedEntries?.length) {
      const winnerId = insertedEntries[0].id;
      const { error: we } = await supabase.from("giveaway_winners").insert({
        giveaway_id: gId,
        entry_id: winnerId,
      });
      if (we) console.error("  ✗ winner:", we.message);
      else console.log("  ✓ 1 winner inserted for ended giveaway");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Testimonials (30 real-looking)
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    client_name: "Luna Hartwell",
    rating: 5,
    title: "Life-changing reading",
    text: "I went into this session feeling completely lost — career, relationships, everything felt like it was unravelling at once. The natal chart reading was so precise it made me catch my breath. I left with a real roadmap and for the first time in years I actually feel like I understand WHY I'm wired the way I am. Totally worth every penny and I've already booked a Solar Return for next month.",
    service_name: "Nativity Birth Chart",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 3,
  },
  {
    client_name: "Marcus Chen",
    rating: 5,
    title: "Spot-on Saturn Return guidance",
    text: "My Saturn return hit me hard last year — job loss, breakup, major relocation. I was skeptical about astrology before this session but the reading described everything I went through with almost scary accuracy. The advice on timing and how to work WITH Saturn instead of against it has been genuinely useful. Highly recommend to anyone in their late 20s or approaching 60.",
    service_name: "Saturn Return",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 5,
  },
  {
    client_name: "Seraphina Torres",
    rating: 5,
    title: "Best tarot reader I have ever found",
    text: "The Celtic Cross spread I got was phenomenal. Not one of those vague 'you will face challenges' readings — every card was placed with thoughtful interpretation and real depth. The hidden influences card completely blew my mind because it described a situation no one knew about except me. I came back for a relationship spread the following week and it was equally brilliant.",
    service_name: "10 Card Celtic Cross (Major Read)",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 7,
  },
  {
    client_name: "Devon Okafor",
    rating: 4,
    title: "Really helpful monthly forecast",
    text: "My Monthly Transits + Lunar Return reading gave me a clear sense of what to focus on and what to let go of this month. Some of the timing predictions were incredibly accurate — a professional opportunity showed up almost exactly when predicted. Giving 4 stars only because I wanted a tiny bit more depth on the Lunar Return chart itself, but overall I'm very happy and will be back monthly.",
    service_name: "Monthly Transits + Lunar Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 8,
  },
  {
    client_name: "Celeste Martin",
    rating: 5,
    title: "The horary reading answered my question perfectly",
    text: "I had a very specific question about whether to accept a job offer and the Horary reading was like getting a direct answer from the universe. The timing, the significators, the final aspect — all of it was explained clearly and it made sense of something I had been agonizing over for weeks. I accepted the offer, three months in and it's been the right decision. Thank you!",
    service_name: "Predictive Event (Horary)",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 10,
  },
  {
    client_name: "Rayan Patel",
    rating: 5,
    title: "My weekly transit reading is now a ritual",
    text: "I started doing weekly transit readings three months ago and it has fundamentally changed how I approach my week. I can plan meetings, creative sessions, and rest days around planetary energies. Sounds woo-woo until you try it — the accuracy is remarkable. The readings are concise, practical, and always delivered on time. 10/10.",
    service_name: "Weekly Transits",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 12,
  },
  {
    client_name: "Ines Johansson",
    rating: 5,
    title: "Synastry reading saved my relationship",
    text: "My partner and I were in a rough patch and I booked the Romantic Relationships reading partly out of desperation. What we got was a detailed map of WHY we clash in certain areas and what each of us is actually looking for in love that we weren't communicating. We both felt seen. The composite chart section was especially powerful — we now understand our relationship as its own entity.",
    service_name: "Romantic Relationships",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 14,
  },
  {
    client_name: "Tobias Wright",
    rating: 5,
    title: "3-card reading nailed my situation",
    text: "Quick, affordable, and shockingly accurate. I asked about a creative project I've been stalling on and the three cards drawn mapped onto past resistance, present opportunity, and a clear outcome. The interpretation wasn't generic — it was tailored to my specific question. I've done this four times now for different topics.",
    service_name: "3 Card Basic Question Spread",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 15,
  },
  {
    client_name: "Anika Sharma",
    rating: 4,
    title: "Solar Return reading was eye-opening",
    text: "I had my Solar Return reading done before my birthday and it set the tone for the whole year. The ascendant falling in my 10th natal house made complete sense with the career shifts that followed. A couple of the timing predictions were slightly off but the themes were right on point. Really valuable for anyone wanting a year-ahead framework.",
    service_name: "Solar Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 17,
  },
  {
    client_name: "Brett Collins",
    rating: 5,
    title: "The 12-card astrological spread is a must-do",
    text: "I spent an entire afternoon just going back over the notes from my 12-card astrological spread reading. Every house position held a relevant card and the overall picture painted for the year was extraordinary. I particularly appreciated that no house got a generic 'things will improve' — each had a specific message. This is the most comprehensive reading I've ever had.",
    service_name: "12 Card Astrological Spread (Major Read)",
    service_type: "tarot",
    status: "approved",
    featured: true,
    days_ago: 19,
  },
  {
    client_name: "Zara Osei",
    rating: 5,
    title: "Business partnership reading was gold",
    text: "I was considering a business partnership and wanted an astrological perspective before committing. The Business Relationship reading highlighted a timing consideration around Mercury that turned out to be exactly right — delays that I was prepared for didn't derail us. The compatibility analysis also confirmed what my gut was telling me. Practical and insightful.",
    service_name: "Business Relationship",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 20,
  },
  {
    client_name: "Finn Larsson",
    rating: 5,
    title: "Jupiter Return opened a new chapter",
    text: "I came in not really knowing what to expect from a Jupiter Return reading — I just knew I was entering a new 12-year cycle and wanted guidance. What I received was a rich, layered exploration of where growth and abundance are most likely to manifest and what old patterns need releasing. I've referred three friends since.",
    service_name: "Jupiter Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 22,
  },
  {
    client_name: "Melody Banks",
    rating: 3,
    title: "Good reading but ran over time",
    text: "The content was really good and the astrologer clearly knows their stuff. My main feedback is that the session ran significantly over the booked time which pushed my next commitment. I did appreciate the thoroughness and would book again — just maybe when I have more buffer time. The lunar return interpretation was the highlight for me.",
    service_name: "Monthly Transits + Lunar Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 24,
  },
  {
    client_name: "Jasper Nguyen",
    rating: 5,
    title: "The horseshoe spread gave me real clarity",
    text: "I had been going round and round on a major life decision for six months. The 7-card Horseshoe spread showed me my own blind spots with startling clarity — specifically the hidden influences card which pointed to a fear of visibility that was absolutely true and that I had never named before. I made my decision that evening and haven't looked back.",
    service_name: "7 Card Horseshoe Spread (Major Read)",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 26,
  },
  {
    client_name: "Sofia Reyes",
    rating: 5,
    title: "Uranus opposition reading was exactly what I needed",
    text: "Mid-life awakening is real and it is disorienting. This reading helped me understand that the upheaval I've been experiencing isn't breakdown — it's breakthrough. The Uranus opposition interpretation reframed everything and the practical timing advice on when to push forward vs. when to wait has been invaluable. I feel like I have a co-pilot through this period now.",
    service_name: "Uranus Opposition",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 28,
  },
  {
    client_name: "Omar Hassan",
    rating: 4,
    title: "Friendship compatibility reading surprised me",
    text: "I got a friendship reading for myself and a close friend who I was having some tension with. The synastry chart highlighted communication styles that explained so much of our friction — not incompatibility, just different processing. We actually went through the reading together and it sparked one of the best conversations we've had in years. Genuinely useful.",
    service_name: "Friendship Relationships",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 30,
  },
  {
    client_name: "Priya Mehta",
    rating: 5,
    title: "I finally understand my Mars placements",
    text: "The Mars Return reading unpacked my drive and anger patterns in a way that therapy never quite cracked. Understanding that my natal Mars squares Saturn and what that means for motivation cycles has been transformative. I now work WITH my energy rhythms instead of against them and my productivity has genuinely improved. This was a profound session.",
    service_name: "Mars Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 32,
  },
  {
    client_name: "Lucas Ferreira",
    rating: 5,
    title: "5-card spread covered everything I needed",
    text: "I came with a complex work situation and the 5-card spread captured every layer of it: the context, the competing influences, the core challenge, the recommended action, and the likely outcome. The action card told me to stop waiting for permission — I did that and within a week my situation shifted. Great format for nuanced questions.",
    service_name: "5 Card Complex Question Spread",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 34,
  },
  {
    client_name: "Amara Diallo",
    rating: 5,
    title: "Six-month forecast gave me a year-long plan",
    text: "I booked the 7 Card 6 Month Forward Review before a major life transition and I keep coming back to the notes. Each monthly card has held up as a theme, not as a rigid prediction but as a reliable energy lens. Month four was literally the card of healing and rest in a month where I got sick and had to slow down. Powerful stuff.",
    service_name: "7 Card 6 Month Forward Review",
    service_type: "tarot",
    status: "approved",
    featured: true,
    days_ago: 36,
  },
  {
    client_name: "Noah Steinberg",
    rating: 5,
    title: "Relationship spread gave us both clarity",
    text: "My partner and I did the 10 Card Relationship Spread together over video and it was one of the most connecting experiences we have shared. Each card for each person was distinct and honest — not flattering, just true. The challenges section was delivered with real care. We came away understanding each other better and with tools to work through our sticking points.",
    service_name: "10 Card Relationship Spread",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 38,
  },
  {
    client_name: "Valentina Cruz",
    rating: 4,
    title: "Great for yearly planning",
    text: "I like to do a natal chart check-in at the start of each year and this reading gave me exactly the strategic overview I was looking for. The houses with heavy transits this year have all proven relevant. My only note is I would have loved a bit more on the Venus transit cycle but maybe that's a separate booking topic.",
    service_name: "Nativity Birth Chart",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 40,
  },
  {
    client_name: "Kieran Murphy",
    rating: 5,
    title: "Precise and compassionate",
    text: "What sets this reader apart is the combination of technical precision and genuine compassion. I've had readings elsewhere that were accurate but delivered without care. This one was both — the Pluto placement in my 12th house interpretation hit very deep and it was handled with real sensitivity. I felt held through a difficult piece of truth.",
    service_name: "Nativity Birth Chart",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 42,
  },
  {
    client_name: "Elara Stone",
    rating: 5,
    title: "Weekly readings have become my compass",
    text: "I've been doing weekly transit readings for two months and the improvement in how I navigate my week is measurable. I now know when to push creatively, when to rest, and when to hold off on important conversations. It sounds small but the cumulative effect is significant. These readings are now a non-negotiable part of my routine.",
    service_name: "Weekly Transits",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 44,
  },
  {
    client_name: "Kwame Asante",
    rating: 5,
    title: "The business synastry was eye opening",
    text: "We did a Business Relationship reading for my co-founder and me before officially launching. The complementary strengths were affirmed and the potential friction points were identified — specifically around decision-making speed. We put a clear process in place to handle that and six months later our partnership is rock solid. This was a high-value investment.",
    service_name: "Business Relationship",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 46,
  },
  {
    client_name: "Isla McKay",
    rating: 4,
    title: "Really accurate tarot for a tricky situation",
    text: "I asked about a housing situation that has four or five different factors in play and the Celtic Cross mapped them out clearly. I appreciated that the 'what is crossing you' card was read as an energy I was adding to the situation myself rather than an external obstacle — that reframe was exactly what I needed to hear.",
    service_name: "10 Card Celtic Cross (Major Read)",
    service_type: "tarot",
    status: "approved",
    featured: false,
    days_ago: 50,
  },
  {
    client_name: "Damien Bouchard",
    rating: 5,
    title: "Horary nailed my property question",
    text: "I asked a time-sensitive question about whether a property sale would complete before a deadline. The Horary chart was cast and the answer was yes — with a caveat around a three-week delay. The sale did complete, three weeks after the expected date. The chart was accurate to within a day. I'm a convert.",
    service_name: "Predictive Event (Horary)",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 53,
  },
  {
    client_name: "Nadia Kaur",
    rating: 5,
    title: "Solar return set perfect expectations",
    text: "I've been doing solar return readings for three years now and each year the themes hold up. This year's chart placed the Sun in the 6th house and indeed it has been a year of health focus and daily routine restructuring. The advance preparation this reading enabled has made the year feel manageable rather than reactive.",
    service_name: "Solar Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 55,
  },
  {
    client_name: "Elliot Rhodes",
    rating: 5,
    title: "Genuinely the most useful reading I've ever had",
    text: "I've been to many readers over the years and this birth chart reading was in a different league. The integration of modern and traditional techniques, the emphasis on psychological themes alongside practical advice, and the ability to hold the complexity of the whole chart without oversimplifying — this is high-level work. I've recommended it to five people.",
    service_name: "Nativity Birth Chart",
    service_type: "astrology",
    status: "approved",
    featured: true,
    days_ago: 57,
  },
  {
    client_name: "Soraya Ahmadi",
    rating: 3,
    title: "Informative but a bit overwhelming",
    text: "The reading covered a lot of ground and clearly came from deep knowledge. For me personally it was slightly too information-dense — I left with pages of notes and struggled to prioritise what to act on. I think a follow-up session to discuss key themes would have helped. The core insights were good though.",
    service_name: "Nativity Birth Chart",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 60,
  },
  {
    client_name: "Caden Xu",
    rating: 5,
    title: "5-star all the way",
    text: "Quick note because I'm short on words: this was excellent. The monthly transits reading was accurate, practical, and delivered with clarity. The Lunar Return section explained why the first week of the month felt so emotionally charged in a way that made total sense. Will absolutely be a regular client.",
    service_name: "Monthly Transits + Lunar Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 63,
  },
  {
    client_name: "Marisol Vega",
    rating: 5,
    title: "Mars Return reading changed how I work",
    text: "I had no idea what a Mars Return was before booking this. What I learned is that I've been fighting my natural energy cycle for years — pushing hard at all times instead of recognising the ebb and flow of Martian energy. The reading gave me a six-month roadmap for when to launch, when to consolidate, and when to rest. My output has improved dramatically.",
    service_name: "Mars Return",
    service_type: "astrology",
    status: "approved",
    featured: false,
    days_ago: 66,
  },
];

async function seedTestimonials() {
  console.log("→ Seeding testimonials …");
  const rows = TESTIMONIALS.map((t) => ({
    diviner_id: DIVINER_ID,
    client_name: t.client_name,
    rating: t.rating,
    title: t.title,
    text: t.text,
    service_name: t.service_name,
    service_type: t.service_type,
    status: t.status,
    featured: t.featured,
    is_featured: t.featured,
    created_at: daysAgo(t.days_ago),
  }));
  const { error } = await supabase.from("testimonials").insert(rows);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rows.length} testimonials inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Page views (last 30 days — realistic traffic curve)
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES = ["google", "instagram", "direct", "facebook", "tiktok", "referral"];
const PATHS = ["/diviner/cosmic-aura", "/diviner/cosmic-aura/services", "/diviner/cosmic-aura/testimonials", "/diviner/cosmic-aura/live"];
const COUNTRIES = [["US", "CA", "Los Angeles"], ["US", "NY", "New York"], ["US", "TX", "Austin"], ["GB", "ENG", "London"], ["AU", "NSW", "Sydney"], ["CA", "ON", "Toronto"]];
const REFERRERS = ["https://instagram.com/", "https://google.com/", "https://facebook.com/", "https://tiktok.com/", null, null, null];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedPageViews() {
  console.log("→ Seeding page_views …");
  const rows = [];
  // Generate ~8-30 views per day for last 30 days, more on weekends
  for (let d = 29; d >= 0; d--) {
    const base = new Date();
    base.setDate(base.getDate() - d);
    const dayOfWeek = base.getDay();
    const count = dayOfWeek === 0 || dayOfWeek === 6 ? randInt(18, 35) : randInt(8, 22);
    for (let i = 0; i < count; i++) {
      const ts = new Date(base);
      ts.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));
      const country = randItem(COUNTRIES);
      const source = randItem(SOURCES);
      rows.push({
        diviner_id: DIVINER_ID,
        path: randItem(PATHS),
        referrer: randItem(REFERRERS),
        ip_hash: `hash_${randInt(1000, 9999)}_${i}`,
        traffic_source: source,
        utm_source: source === "direct" ? null : source,
        country_code: country[0],
        country_region: country[1],
        city: country[2],
        created_at: ts.toISOString(),
      });
    }
  }
  // Insert in batches of 200
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("page_views").insert(rows.slice(i, i + 200));
    if (error) { console.error("  ✗ batch:", error.message); break; }
    inserted += Math.min(200, rows.length - i);
  }
  console.log(`  ✓ ${inserted} page view rows inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Diviner activity events (last 30 days)
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  "booking_checkout_started",
  "booking_checkout_started",
  "booking_checkout_started",
  "check_in_submitted",
  "check_in_submitted",
  "testimonial_submitted",
  "weekly_subscription_checkout_started",
  "page_view",
];

async function seedActivityEvents() {
  console.log("→ Seeding diviner_activity_events …");
  const rows = [];
  for (let d = 29; d >= 0; d--) {
    const base = new Date();
    base.setDate(base.getDate() - d);
    const count = randInt(3, 12);
    for (let i = 0; i < count; i++) {
      const ts = new Date(base);
      ts.setHours(randInt(8, 22), randInt(0, 59));
      const actType = randItem(ACTIVITY_TYPES);
      const source = randItem(SOURCES);
      rows.push({
        diviner_id: DIVINER_ID,
        activity_type: actType,
        path: randItem(PATHS),
        traffic_source: source,
        country_code: randItem(COUNTRIES)[0],
        created_at: ts.toISOString(),
      });
    }
  }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("diviner_activity_events").insert(rows.slice(i, i + 200));
    if (error) { console.error("  ✗ batch:", error.message); break; }
    inserted += Math.min(200, rows.length - i);
  }
  console.log(`  ✓ ${inserted} activity event rows inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Gift Certificates (6 unredeemed)
// ─────────────────────────────────────────────────────────────────────────────
async function seedGiftCertificates() {
  console.log("→ Seeding gift_certificates …");

  const certs = [
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-LUNA-2026",
      purchaser_name: "James Hartwell",
      purchaser_email: "james.hartwell@gmail.com",
      recipient_name: "Luna Hartwell",
      recipient_email: "luna.hartwell@gmail.com",
      amount: 175,
      remaining_amount: 175,
      message: "Happy birthday, sis! Enjoy your natal chart reading. ✨",
      stripe_payment_intent_id: "pi_seed_gift_001",
    },
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-MRCHN-2026",
      purchaser_name: "Sarah Chen",
      purchaser_email: "sarah.chen@gmail.com",
      recipient_name: "Marcus Chen",
      recipient_email: "marcus.chen@gmail.com",
      amount: 95,
      remaining_amount: 95,
      message: "For your Saturn return journey. Use it wisely!",
      stripe_payment_intent_id: "pi_seed_gift_002",
    },
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-ANON-2026",
      purchaser_name: "Tobias Wright",
      purchaser_email: "tobias.wright@proton.me",
      recipient_name: null,
      recipient_email: null,
      amount: 50,
      remaining_amount: 50,
      message: null,
      stripe_payment_intent_id: "pi_seed_gift_003",
    },
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-CELST-2026",
      purchaser_name: "David Martin",
      purchaser_email: "david.martin@outlook.com",
      recipient_name: "Celeste Martin",
      recipient_email: "celeste.martin@yahoo.com",
      amount: 125,
      remaining_amount: 75,
      message: "Enjoy your reading — you deserve it!",
      stripe_payment_intent_id: "pi_seed_gift_004",
    },
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-RFYN-2026",
      purchaser_name: "Priya Mehta",
      purchaser_email: "priya.mehta@gmail.com",
      recipient_name: "Rayan Patel",
      recipient_email: "rayan.patel@gmail.com",
      amount: 200,
      remaining_amount: 200,
      message: "For your solar return year — may it be magical.",
      stripe_payment_intent_id: "pi_seed_gift_005",
    },
    {
      diviner_id: DIVINER_ID,
      code: "GIFT-ZARA-2026",
      purchaser_name: "Finn Larsson",
      purchaser_email: "finn.larsson@outlook.com",
      recipient_name: "Zara Osei",
      recipient_email: "zara.osei@gmail.com",
      amount: 95,
      remaining_amount: 95,
      message: null,
      stripe_payment_intent_id: "pi_seed_gift_006",
    },
  ];

  const { error } = await supabase.from("gift_certificates").insert(certs);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${certs.length} gift certificate rows inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Client Subscriptions — 12 active weekly update subscribers
// ─────────────────────────────────────────────────────────────────────────────
async function seedClientSubscriptions() {
  console.log("→ Seeding client_subscriptions (weekly_updates) …");

  // Fetch existing client_ids linked to this diviner
  const { data: cds, error: cdErr } = await supabase
    .from("client_diviners")
    .select("client_id")
    .eq("diviner_id", DIVINER_ID)
    .limit(12);

  if (cdErr || !cds?.length) {
    console.log("  ⚠  No client_diviners found — skipping client_subscriptions seed");
    return;
  }

  // Fetch a weekly_subscription_products row if any exists
  const { data: products } = await supabase
    .from("weekly_subscription_products")
    .select("id")
    .eq("diviner_id", DIVINER_ID)
    .limit(1);
  const productId = products?.[0]?.id ?? null;

  const futureEnd = new Date();
  futureEnd.setDate(futureEnd.getDate() + 30);

  const rows = cds.map((cd, i) => ({
    client_id: cd.client_id,
    diviner_id: DIVINER_ID,
    product_id: productId,
    subscription_type: "weekly_updates",
    status: "active",
    stripe_subscription_id: `sub_seed_weekly_${String(i + 1).padStart(3, "0")}`,
    stripe_customer_id: `cus_seed_weekly_${String(i + 1).padStart(3, "0")}`,
    amount_cents: 2500,
    current_period_end: new Date(futureEnd.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: daysAgo(i),
  }));

  const { error } = await supabase.from("client_subscriptions").insert(rows);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rows.length} client_subscriptions rows inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Affiliate Campaigns — 3 active with realistic spend
// ─────────────────────────────────────────────────────────────────────────────
async function seedAffiliateCampaigns() {
  console.log("→ Seeding affiliate_campaigns …");

  const today = new Date().toISOString().slice(0, 10);
  const inFuture = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const inPast = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const campaigns = [
    {
      diviner_id: DIVINER_ID,
      name: "Spring Solar Return Promo",
      description: "Targeted campaign for clients approaching their solar return. Discount on SR readings + free transit overview add-on.",
      status: "active",
      start_date: inPast(14),
      end_date: inFuture(16),
      commission_type: "percentage",
      commission_value: 15,
      budget_cap_cents: 50000,
      spent_cents: 18750,
      target_product_type: "astrology",
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "spring-solar-return-2026",
    },
    {
      diviner_id: DIVINER_ID,
      name: "Tarot Discovery — New Clients",
      description: "Introduction offer for first-time tarot clients. 3-card spread at a discounted rate with affiliate referral tracking.",
      status: "active",
      start_date: inPast(7),
      end_date: inFuture(23),
      commission_type: "fixed",
      commission_value: 1000,
      budget_cap_cents: 30000,
      spent_cents: 7500,
      target_product_type: "tarot",
      utm_source: "facebook",
      utm_medium: "social",
      utm_campaign: "tarot-discovery-may2026",
    },
    {
      diviner_id: DIVINER_ID,
      name: "Mercury Retrograde Prep Pack",
      description: "Seasonal campaign around Mercury retrograde. Bundle of transit reading + personalised retrograde guide for new and returning clients.",
      status: "active",
      start_date: today,
      end_date: inFuture(30),
      commission_type: "percentage",
      commission_value: 12,
      budget_cap_cents: null,
      spent_cents: 0,
      target_product_type: "astrology",
      utm_source: "email",
      utm_medium: "newsletter",
      utm_campaign: "mercury-rx-prep-2026",
    },
  ];

  const { data: inserted, error } = await supabase
    .from("affiliate_campaigns")
    .insert(campaigns)
    .select("id, name");
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${inserted.length} affiliate_campaigns inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Follow-up Sequences — 3 pending/overdue rows
// ─────────────────────────────────────────────────────────────────────────────
async function seedFollowUpSequences() {
  console.log("→ Seeding follow_up_sequences …");

  // Fetch up to 3 completed bookings for this diviner
  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, client_id")
    .eq("diviner_id", DIVINER_ID)
    .eq("status", "completed")
    .limit(3);

  if (bErr || !bookings?.length) {
    console.log("  ⚠  No completed bookings found — skipping follow_up_sequences seed");
    return;
  }

  const emailTypes = ["thank_you", "review_request", "rebooking"];
  const rows = bookings.map((b, i) => ({
    diviner_id: DIVINER_ID,
    booking_id: b.id,
    client_id: b.client_id,
    step: i + 1,
    email_type: emailTypes[i],
    scheduled_at: daysAgo(i + 1), // 1–3 days ago = overdue
    sent_at: null,
  }));

  const { error } = await supabase.from("follow_up_sequences").insert(rows);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rows.length} follow_up_sequences inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Orders — 12 orders across service types and statuses
// ─────────────────────────────────────────────────────────────────────────────
async function seedOrders() {
  console.log("→ Seeding orders …");

  // Fetch client IDs linked to this diviner
  const { data: cds } = await supabase
    .from("client_diviners")
    .select("client_id")
    .eq("diviner_id", DIVINER_ID)
    .limit(12);

  const clientIds = (cds ?? []).map((c) => c.client_id);

  const SERVICE_TYPES = ["astrology", "tarot", "gift_certificate", "astrology", "tarot"];
  const STATUSES = ["completed", "completed", "completed", "pending", "refunded"];
  const AMOUNTS = [175, 95, 50, 125, 200, 85, 150, 60, 110, 175, 95, 75];

  const orders = AMOUNTS.map((amount, i) => ({
    diviner_id: DIVINER_ID,
    client_id: clientIds[i] ?? null,
    service_type: SERVICE_TYPES[i % SERVICE_TYPES.length],
    amount,
    currency: "usd",
    status: STATUSES[i % STATUSES.length],
    stripe_payment_intent_id: `pi_seed_order_${String(i + 1).padStart(3, "0")}`,
    notes: null,
    created_at: daysAgo(i * 5 + 1),
  }));

  const { error } = await supabase.from("orders").insert(orders);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${orders.length} orders inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Diviner Affiliates — 5 affiliates with realistic profiles
// ─────────────────────────────────────────────────────────────────────────────
async function seedDivinerAffiliates() {
  console.log("→ Seeding diviner_affiliates …");

  const affiliates = [
    {
      diviner_id: DIVINER_ID,
      name: "Luna Hartwell",
      email: "luna.hartwell@gmail.com",
      phone: null,
      status: "active",
      notes: "Top referrer — sends 3–5 clients per month from her wellness community.",
      default_commission_type: "percentage",
      default_commission_value: 15,
      created_at: daysAgo(60),
    },
    {
      diviner_id: DIVINER_ID,
      name: "Marcus Chen",
      email: "marcus.chen@gmail.com",
      phone: "+1-415-555-0192",
      status: "active",
      notes: "Yoga studio owner — shares our booking link in his newsletter.",
      default_commission_type: "percentage",
      default_commission_value: 12,
      created_at: daysAgo(45),
    },
    {
      diviner_id: DIVINER_ID,
      name: "Seraphina Torres",
      email: "sera.torres@icloud.com",
      phone: null,
      status: "active",
      notes: "Instagram creator with 40k followers. High conversion rate.",
      default_commission_type: "fixed",
      default_commission_value: 1500,
      created_at: daysAgo(30),
    },
    {
      diviner_id: DIVINER_ID,
      name: "Tobias Wright",
      email: "tobias.wright@proton.me",
      phone: "+1-720-555-0147",
      status: "suspended",
      notes: "Paused — on sabbatical until June.",
      default_commission_type: "percentage",
      default_commission_value: 10,
      created_at: daysAgo(90),
    },
    {
      diviner_id: DIVINER_ID,
      name: "Anika Sharma",
      email: "anika.sharma@gmail.com",
      phone: null,
      status: "pending",
      notes: "Referred by Luna — awaiting contract signature.",
      default_commission_type: "percentage",
      default_commission_value: 12,
      created_at: daysAgo(3),
    },
  ];

  const { error } = await supabase.from("diviner_affiliates").insert(affiliates);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${affiliates.length} diviner_affiliates inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Weekly Subscription Product — one per diviner (UNIQUE constraint)
// ─────────────────────────────────────────────────────────────────────────────
async function seedWeeklySubscriptionProduct() {
  console.log("→ Seeding weekly_subscription_products …");

  // Skip if already exists (UNIQUE diviner_id constraint)
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
    title: "Weekly Astrological Updates",
    description: "Personalised weekly transit insights, moon phase guidance, and practical timing advice delivered every Monday.",
    price_cents: 2500,
    is_active: true,
  });
  if (error) console.error("  ✗", error.message);
  else console.log("  ✓ 1 weekly_subscription_products row inserted");
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Media Items — videos, articles, links across categories
// ─────────────────────────────────────────────────────────────────────────────
async function seedMediaItems() {
  console.log("→ Seeding media_items …");

  const items = [
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "Mercury Retrograde Survival Guide 2026",
      description: "Everything you need to know about navigating the upcoming Mercury retrograde — communication, contracts, and travel.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Astrology",
      platform: "youtube",
      duration_seconds: 1423,
      sort_order: 0,
      is_featured: true,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "Saturn Return Explained — What It Really Means",
      description: "A deep dive into the Saturn Return cycle: what triggers it, what to expect, and how to work with its energy constructively.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Astrology",
      platform: "youtube",
      duration_seconds: 2187,
      sort_order: 1,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "audio",
      title: "Full Moon in Scorpio — Guided Meditation",
      description: "A 20-minute guided meditation aligned with the Scorpio full moon energy. Ideal for releasing what no longer serves you.",
      url: "https://open.spotify.com/episode/example",
      thumbnail_url: null,
      category: "Meditation",
      platform: "spotify",
      duration_seconds: 1204,
      sort_order: 2,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "article",
      title: "Understanding Your Rising Sign vs. Sun Sign",
      description: "Most people know their Sun sign, but your Rising sign shapes how the world sees you and how you approach life. Here's how to tell them apart.",
      url: "https://astrologypro.com/blog/rising-vs-sun-sign",
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
      type: "article",
      title: "The 12 Houses in Astrology — A Practical Guide",
      description: "A comprehensive breakdown of all 12 astrological houses, what each governs, and how to read them in your own natal chart.",
      url: "https://astrologypro.com/blog/12-houses-guide",
      thumbnail_url: null,
      category: "Education",
      platform: null,
      duration_seconds: null,
      sort_order: 4,
      is_featured: true,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "video",
      title: "Tarot vs. Oracle Cards — Which Is Right for You?",
      description: "Breaking down the differences between tarot and oracle decks, how each works, and how to choose the right tool for your practice.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Tarot",
      platform: "youtube",
      duration_seconds: 987,
      sort_order: 5,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "link",
      title: "Free Natal Chart Calculator",
      description: "Generate your free birth chart. You'll need your birth date, time, and city to get accurate house placements.",
      url: "https://astro.com/horoscopes/natal-chart",
      thumbnail_url: null,
      category: "Tools",
      platform: null,
      duration_seconds: null,
      sort_order: 6,
      is_featured: false,
      moderation_status: "approved",
    },
    {
      diviner_id: DIVINER_ID,
      type: "audio",
      title: "New Moon Intentions Podcast — April 2026",
      description: "Monthly new moon setting intentions episode. This month: Aries new moon, solar arc progressions, and timing your new beginnings.",
      url: "https://open.spotify.com/episode/example2",
      thumbnail_url: null,
      category: "Podcast",
      platform: "spotify",
      duration_seconds: 2640,
      sort_order: 7,
      is_featured: false,
      moderation_status: "approved",
    },
  ];

  const { error } = await supabase.from("media_items").insert(items);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${items.length} media_items inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Discount Rules — session count + package discounts
// ─────────────────────────────────────────────────────────────────────────────
async function seedDiscountRules() {
  console.log("→ Seeding discount_rules …");

  const rules = [
    {
      diviner_id: DIVINER_ID,
      name: "Loyal Client — 5 Sessions",
      type: "session_count",
      discount_percent: 10,
      min_sessions: 5,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Long-Term Client — 10 Sessions",
      type: "session_count",
      discount_percent: 15,
      min_sessions: 10,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Birth Chart + Transit Bundle",
      type: "package",
      discount_percent: 20,
      min_sessions: null,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "Couples Reading Package",
      type: "package",
      discount_percent: 12,
      min_sessions: null,
      is_active: true,
    },
    {
      diviner_id: DIVINER_ID,
      name: "VIP — 20+ Sessions",
      type: "session_count",
      discount_percent: 25,
      min_sessions: 20,
      is_active: false,
    },
  ];

  const { error } = await supabase.from("discount_rules").insert(rules);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rules.length} discount_rules inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. User Ritual Configurations — seeded against the diviner's auth user_id
// ─────────────────────────────────────────────────────────────────────────────
async function seedUserRituals() {
  console.log("→ Seeding user_ritual_configurations …");

  // Look up the user_id for this diviner
  const { data: divinerRow, error: dErr } = await supabase
    .from("diviners")
    .select("user_id")
    .eq("id", DIVINER_ID)
    .single();

  if (dErr || !divinerRow?.user_id) {
    console.log("  ⚠  Could not resolve user_id for diviner — skipping rituals seed");
    return;
  }

  const USER_ID = divinerRow.user_id;

  const rituals = [
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "Full Moon Release Ritual",
      ritual_tags: ["full-moon", "release", "cleansing", "candle-work"],
    },
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "New Moon Intention Setting",
      ritual_tags: ["new-moon", "intentions", "manifestation", "journaling"],
    },
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "Solar Return Ceremony",
      ritual_tags: ["solar-return", "birthday", "year-ahead", "gratitude"],
    },
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "Mercury Retrograde Protection",
      ritual_tags: ["mercury-retrograde", "protection", "communication", "crystals"],
    },
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "Venus Attraction Ritual",
      ritual_tags: ["venus", "love", "abundance", "rose-quartz"],
    },
    {
      user_id: USER_ID,
      community_member_id: null,
      ritual_name: "Saturn Grounding Practice",
      ritual_tags: ["saturn", "grounding", "discipline", "boundaries", "earth-element"],
    },
  ];

  const { error } = await supabase.from("user_ritual_configurations").insert(rituals);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rituals.length} user_ritual_configurations inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Intake Templates — 3 reusable templates for common reading types
// ─────────────────────────────────────────────────────────────────────────────
async function seedIntakeTemplates() {
  console.log("→ Seeding intake_templates …");

  const { randomUUID } = await import("crypto");

  const templates = [
    {
      diviner_id: DIVINER_ID,
      name: "Natal Chart / Birth Chart",
      description: "Standard intake for natal chart and birth chart readings.",
      is_default: true,
      fields: [
        { id: randomUUID(), type: "birth_details", label: "Birth Details", required: true, sort_order: 0 },
        { id: randomUUID(), type: "textarea", label: "What would you like to focus on?", placeholder: "e.g. career, relationships, life purpose...", required: false, sort_order: 1 },
        { id: randomUUID(), type: "textarea", label: "Any current life themes or challenges?", placeholder: "Share anything you'd like the reader to know...", required: false, sort_order: 2 },
      ],
    },
    {
      diviner_id: DIVINER_ID,
      name: "Relationship / Synastry Reading",
      description: "Intake for synastry, compatibility, and relationship readings.",
      is_default: false,
      fields: [
        { id: randomUUID(), type: "birth_details", label: "Your Birth Details", required: true, sort_order: 0 },
        { id: randomUUID(), type: "partner_birth_details", label: "Partner / Other Person's Birth Details", required: true, sort_order: 1 },
        { id: randomUUID(), type: "textarea", label: "What would you like to explore in this relationship?", placeholder: "e.g. compatibility, communication, long-term potential...", required: false, sort_order: 2 },
      ],
    },
    {
      diviner_id: DIVINER_ID,
      name: "Tarot Reading",
      description: "General intake for tarot sessions — free-form question focus.",
      is_default: false,
      fields: [
        { id: randomUUID(), type: "textarea", label: "What is your main question or area of focus?", placeholder: "Be as specific as possible for the most useful reading...", required: true, sort_order: 0 },
        { id: randomUUID(), type: "select", label: "Reading type preference", required: false, sort_order: 1, options: ["Open reading (reader's intuition)", "Specific question", "Life overview"] },
        { id: randomUUID(), type: "textarea", label: "Anything else the reader should know?", placeholder: "Context, background, or specific concerns...", required: false, sort_order: 2 },
      ],
    },
  ];

  const { error } = await supabase.from("intake_templates").insert(templates);
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${templates.length} intake_templates inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. Video Sessions — ended sessions linked to completed bookings
// ─────────────────────────────────────────────────────────────────────────────
async function seedVideoSessions() {
  console.log("→ Seeding video_sessions …");

  // Fetch completed bookings to link sessions to
  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, client_id, scheduled_at, duration_minutes")
    .eq("diviner_id", DIVINER_ID)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(6);

  if (bErr || !bookings?.length) {
    console.log("  ⚠  No completed bookings found — seeding standalone video sessions");
  }

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

  // If no bookings, seed a few standalone sessions
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
  console.log("=== Seeding dashboard page data ===\n");
  await backfillLastSessionAt();
  await seedCheckIns();
  await seedGiveaways();
  await seedTestimonials();
  await seedPageViews();
  await seedActivityEvents();
  await seedGiftCertificates();
  await seedClientSubscriptions();
  await seedAffiliateCampaigns();
  await seedFollowUpSequences();
  await seedOrders();
  await seedDivinerAffiliates();
  await seedWeeklySubscriptionProduct();
  await seedMediaItems();
  await seedDiscountRules();
  await seedUserRituals();
  await seedIntakeTemplates();
  await seedVideoSessions();
  console.log("\n=== Done ===");
}
main().catch(console.error);
