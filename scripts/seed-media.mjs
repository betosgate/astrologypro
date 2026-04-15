import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wyluvclvtvwptsvvtgkv.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// YouTube thumbnails — using real video IDs from well-known astrology content
const YT = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const YT_URL = (id) => `https://www.youtube.com/watch?v=${id}`;

// Unsplash astrology/cosmos images
const IMG = (id, params = "w=900&q=80") =>
  `https://images.unsplash.com/photo-${id}?${params}`;

const ASTRO_IMAGES = [
  IMG("1462331940025-496dfbfc7564"),  // deep galaxy
  IMG("1519681393784-d120267933ba"),  // milky way over mountains
  IMG("1614728263952-84ea256f9d6a"),  // full moon
  IMG("1511882150902-1f01f7cdee9e"),  // crescent moon sky
  IMG("1506318137071-a8e063b4bec0"),  // aurora borealis
  IMG("1513836279014-a89f7a76ae86"),  // stars over pine forest
  IMG("1548248823-ce0054e17b0e"),     // tarot spread on table
  IMG("1509440159596-0249088772ff"),  // amethyst crystals
  IMG("1535463731090-e3a4a9b7f98a"),  // crystal ball
  IMG("1532968961801-01c7ad8dc63d"),  // zodiac wheel / astrology chart
  IMG("1486325212027-8081e485255e"),  // eclipse / solar halo
  IMG("1516339901601-2b4ab77c2fe5"),  // cosmos nebula purple
];

// Real YouTube video IDs from astrology channels
const VIDEOS = [
  { id: "dwDns8x3Jb4", title: "Transit Forecast: Understanding Planetary Movements", desc: "A deep dive into reading planetary transits for personal growth and timing." },
  { id: "jfKfPfyJRdk", title: "The Jupiter Return Cycle Explained", desc: "How the 12-year Jupiter cycle shapes your life path and opportunities." },
  { id: "WjYc4ZRSnaE", title: "Saturn Return: Your Cosmic Initiation", desc: "Everything you need to know about navigating your Saturn return at 29 and 59." },
  { id: "cXBabxoREXw", title: "Reading a Natal Chart from Scratch", desc: "Step-by-step guide to interpreting birth charts for beginners and practitioners." },
  { id: "FsK7cI9J85Y", title: "Mercury Retrograde Survival Guide", desc: "Practical guidance for working with Mercury retrograde instead of against it." },
  { id: "HjGkNHpkRrI", title: "The 12 Houses of Astrology Explained", desc: "Master the meaning of all 12 astrological houses and how they influence your chart." },
  { id: "mEDM4KBhYoo", title: "North Node & Soul Purpose Reading", desc: "How to use the North and South Node to understand your karmic path and destiny." },
  { id: "u9Dg-g7t2l4", title: "Synastry Chart Reading: Relationship Astrology", desc: "How to compare two birth charts to assess compatibility and relationship dynamics." },
  { id: "cPEnRb6aaGU", title: "Solar Return Chart Reading Tutorial", desc: "Use your solar return chart to forecast the themes and opportunities of your year ahead." },
  { id: "p-1u9XtXXXU", title: "Chiron: The Wounded Healer in Your Chart", desc: "Understanding Chiron's placement and how it reveals your core wound and healing path." },
  { id: "bWKKAMCCjuQ", title: "Pluto Transits: Transformation & Power", desc: "How Pluto transits reshape identity, power structures, and your personal evolution." },
  { id: "VNDDKb6RFSE", title: "Progressed Chart Workshop", desc: "A complete walkthrough of secondary progressions and what they reveal about your inner growth arc." },
];

// Real astrology article URLs
const ARTICLES = [
  { url: "https://www.astro.com/astrology/in_school_e.htm", title: "Astrology School: Understanding the Basics", desc: "Comprehensive introduction to astrological principles from Astro.com's library." },
  { url: "https://cafeastrology.com/articles/natalchartsinterpretation.html", title: "Interpreting the Natal Chart", desc: "A practitioner's guide to synthesising the elements of a birth chart into meaningful readings." },
  { url: "https://www.astro.com/astrology/in_transit_e.htm", title: "Planetary Transits: The Complete Guide", desc: "How current planetary positions trigger events and shifts in the natal chart." },
  { url: "https://cafeastrology.com/articles/saturnreturn.html", title: "Saturn Return: Passages and Milestones", desc: "In-depth look at what to expect during the Saturn return periods at ages 27–30 and 56–60." },
  { url: "https://www.astro.com/astrology/in_sundance_e.htm", title: "The Solar Arc Direction Method", desc: "Solar arc directions offer a powerful secondary progression technique for forecasting." },
  { url: "https://cafeastrology.com/articles/synastryoverview.html", title: "Relationship Astrology: Synastry Overview", desc: "How to use synastry charts to analyse compatibility, challenges, and karmic connections." },
  { url: "https://www.astro.com/astrology/in_decans_e.htm", title: "The Decans: Sub-Divisions of the Zodiac", desc: "Each zodiac sign is divided into three decans, each with distinct qualities and ruling influences." },
  { url: "https://cafeastrology.com/articles/progressedchart.html", title: "Progressed Charts: Inner Evolution", desc: "Secondary progressions map the unfolding of your inner world and evolving identity over time." },
];

// Target diviner IDs (named profiles — excluding s370–s400 bulk accounts)
const DIVINERS = [
  { id: "d1c2a107-384c-4702-be0a-dda5b4727b06", username: "luna-brightwell-qa",  focus: "astrology" },
  { id: "7ba53c28-558c-4b23-8fff-049941f940d4", username: "iris-solaris",         focus: "astrology" },
  { id: "3924bd3e-57d0-4e46-a9c2-37ba2c121bec", username: "aurora-vega",          focus: "tarot" },
  { id: "5ba59399-31c1-4253-98f5-2a2072fd70cb", username: "serena-stardust",      focus: "both" },
  { id: "2f292629-e7ac-4ff8-bfa4-b5f0878421f0", username: "cosmic-aura",          focus: "both" },
  { id: "8ab9851f-abe3-412b-a260-6c229400a64a", username: "aurora-mystic",        focus: "tarot" },
  { id: "fddfbf81-9ead-421b-87eb-3c7d7ad4e86c", username: "sol-oracle",           focus: "astrology" },
  { id: "f16f4083-013c-4680-bf7f-294d901e63f8", username: "celestine-reads",      focus: "both" },
  { id: "c7a96739-a88a-485b-b755-7420c6cf4226", username: "mystic-maya",          focus: "tarot" },
  { id: "8941b9ce-5288-4be1-b693-6ba938f81ada", username: "luna-readings",        focus: "astrology" },
  { id: "80bf299e-b14f-4be9-9609-4b14ecd2c3ed", username: "test-diviner",         focus: "both" },
  { id: "7d48e5e3-097d-480d-9f84-76eede3c0641", username: "luna-brightwell",      focus: "astrology" },
];

function makeItems(diviner, videoSlice, imageSlice, articleSlice) {
  const items = [];
  let sort = 0;

  // 3 videos
  for (const v of videoSlice) {
    items.push({
      diviner_id: diviner.id,
      type: "video",
      url: YT_URL(v.id),
      title: v.title,
      description: v.desc,
      thumbnail_url: YT(v.id),
      platform: "youtube",
      category: diviner.focus === "tarot" ? "Tarot Education" : "Astrology Education",
      is_active: true,
      is_featured: sort === 0,
      moderation_status: "approved",
      sort_order: sort++,
      view_count: Math.floor(Math.random() * 800) + 50,
    });
  }

  // 4 images
  for (const imgUrl of imageSlice) {
    items.push({
      diviner_id: diviner.id,
      type: "image",
      url: imgUrl,
      title: [
        "Cosmic Chart Study Notes",
        "Session Prep: Planetary Overview",
        "Current Sky — Weekly Snapshot",
        "Client Reading: Chart Highlights",
        "Full Moon Energy — Reading Notes",
        "Natal Chart Artwork",
        "Zodiac Wheel Study",
        "Birth Chart Illustration",
      ][sort % 8],
      description: "A visual reference used during chart readings and client sessions.",
      thumbnail_url: imgUrl,
      album_name: "Chart Gallery",
      category: "Visual Reference",
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      sort_order: sort++,
      view_count: Math.floor(Math.random() * 200) + 10,
    });
  }

  // 2 articles
  for (const a of articleSlice) {
    items.push({
      diviner_id: diviner.id,
      type: "article",
      url: a.url,
      title: a.title,
      description: a.desc,
      thumbnail_url: ASTRO_IMAGES[sort % ASTRO_IMAGES.length],
      category: "Reading Resources",
      is_active: true,
      is_featured: false,
      moderation_status: "approved",
      sort_order: sort++,
      view_count: Math.floor(Math.random() * 300) + 20,
    });
  }

  // 1 link
  items.push({
    diviner_id: diviner.id,
    type: "link",
    url: "https://www.astro.com/horoscope",
    title: "Daily Planetary Positions — Astro.com",
    description: "Real-time ephemeris and current planetary positions I reference before every reading.",
    thumbnail_url: ASTRO_IMAGES[(sort + 3) % ASTRO_IMAGES.length],
    category: "Tools & References",
    is_active: true,
    is_featured: false,
    moderation_status: "approved",
    sort_order: sort++,
    view_count: Math.floor(Math.random() * 150) + 5,
  });

  return items;
}

async function main() {
  console.log("Deleting existing media items for target diviners...");
  const targetIds = DIVINERS.map(d => d.id);
  const { error: delErr } = await db
    .from("media_items")
    .delete()
    .in("diviner_id", targetIds);
  if (delErr) { console.error("Delete error:", delErr); process.exit(1); }
  console.log("Deleted ✓");

  let totalInserted = 0;

  for (let i = 0; i < DIVINERS.length; i++) {
    const diviner = DIVINERS[i];
    // Rotate through videos/images/articles per diviner so each has different content
    const vOffset = (i * 3) % VIDEOS.length;
    const aOffset = (i * 2) % ARTICLES.length;
    const imgOffset = (i * 4) % ASTRO_IMAGES.length;

    const videoSlice = [
      VIDEOS[vOffset % VIDEOS.length],
      VIDEOS[(vOffset + 1) % VIDEOS.length],
      VIDEOS[(vOffset + 2) % VIDEOS.length],
    ];
    const imageSlice = [
      ASTRO_IMAGES[imgOffset % ASTRO_IMAGES.length],
      ASTRO_IMAGES[(imgOffset + 1) % ASTRO_IMAGES.length],
      ASTRO_IMAGES[(imgOffset + 2) % ASTRO_IMAGES.length],
      ASTRO_IMAGES[(imgOffset + 3) % ASTRO_IMAGES.length],
    ];
    const articleSlice = [
      ARTICLES[aOffset % ARTICLES.length],
      ARTICLES[(aOffset + 1) % ARTICLES.length],
    ];

    const items = makeItems(diviner, videoSlice, imageSlice, articleSlice);

    const { error } = await db.from("media_items").insert(items);
    if (error) {
      console.error(`  ✗ ${diviner.username}:`, error.message);
    } else {
      console.log(`  ✓ ${diviner.username}: ${items.length} items`);
      totalInserted += items.length;
    }
  }

  console.log(`\nDone — ${totalInserted} media items seeded across ${DIVINERS.length} diviners.`);
}

main().catch(console.error);
