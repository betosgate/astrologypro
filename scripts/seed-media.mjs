import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wyluvclvtvwptsvvtgkv.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// All Unsplash astrology/cosmos images — validated 200 OK
const IMGS = {
  galaxy:       "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&q=80",
  milkyway:     "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80",
  moon:         "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=900&q=80",
  crescent:     "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=900&q=80",
  aurora:       "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=900&q=80",
  stars:        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=900&q=80",
  tarot:        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=900&q=80",
  crystals:     "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80",
  crystal_ball: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  zodiac:       "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
  eclipse:      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80",
  cosmos:       "https://images.unsplash.com/photo-1607988795691-3d0147b43231?w=900&q=80",
  planets:      "https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=900&q=80",
  telescope:    "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=900&q=80",
  candles:      "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=900&q=80",
  notebook:     "https://images.unsplash.com/photo-1517842645767-c639042777db?w=900&q=80",
};

const ALL_IMGS = Object.values(IMGS);

// Only the 2 confirmed-real YouTube video IDs
const REAL_YT = [
  "dwDns8x3Jb4",
  "jfKfPfyJRdk",
];

// Per-diviner media sets — rich, specific astrology content, all with Unsplash thumbnails
const DIVINER_MEDIA = {
  "luna-brightwell-qa": [
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[0]}`, title:"Transit Forecast: Reading Planetary Movements", desc:"How to read current transits against a natal chart — timing, themes, and client guidance.", thumb: IMGS.planets, platform:"youtube", category:"Astrology Education", featured:true, views:743 },
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[1]}`, title:"The Jupiter Return: 12-Year Expansion Cycle", desc:"How Jupiter's return cycle shapes opportunity, abundance and life direction.", thumb: IMGS.galaxy, platform:"youtube", category:"Astrology Education", featured:false, views:512 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Saturn Return — Your Cosmic Initiation at 29 & 59", desc:"What to expect during your Saturn return and how to work with this powerful transit.", thumb: IMGS.cosmos, platform:"youtube", category:"Astrology Education", featured:false, views:391 },
    { type:"image", url:IMGS.zodiac, title:"Zodiac Wheel Reference Chart", desc:"My personal reference wheel used during natal chart readings.", thumb: IMGS.zodiac, album:"Chart Gallery", category:"Visual Reference", featured:false, views:128 },
    { type:"image", url:IMGS.milkyway, title:"Night Sky — Pluto Direct October 2025", desc:"Captured the night sky on the day Pluto stationed direct.", thumb: IMGS.milkyway, album:"Chart Gallery", category:"Visual Reference", featured:false, views:89 },
    { type:"image", url:IMGS.moon, title:"Full Moon in Scorpio — Reading Notes", desc:"Key themes and chart notes from the October full moon reading session.", thumb: IMGS.moon, album:"Chart Gallery", category:"Visual Reference", featured:false, views:203 },
    { type:"image", url:IMGS.crystals, title:"Session Setup — Crystal Grid for Clarity", desc:"My reading space setup with selenite, lapis lazuli and clear quartz.", thumb: IMGS.crystals, album:"Reading Space", category:"Visual Reference", featured:false, views:67 },
    { type:"article", url:"https://cafeastrology.com/articles/natalchartsinterpretation.html", title:"Interpreting the Natal Chart — A Practitioner's Guide", desc:"Synthesising planets, signs, houses and aspects into meaningful chart narratives.", thumb: IMGS.notebook, category:"Reading Resources", featured:false, views:312 },
    { type:"article", url:"https://www.astro.com/astrology/in_transit_e.htm", title:"Planetary Transits: The Complete Reference", desc:"How current planetary positions trigger events and themes in the natal chart.", thumb: IMGS.telescope, category:"Reading Resources", featured:false, views:189 },
    { type:"link", url:"https://www.astro.com/horoscope", title:"Astro.com — Daily Ephemeris & Chart Generator", desc:"The real-time planetary positions I check before every reading session.", thumb: IMGS.stars, category:"Tools & References", featured:false, views:54 },
  ],
  "test-diviner": [
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[0]}`, title:"North Node in Aries — Your Soul's Direction", desc:"How the North Node in Aries calls you to step into bold, self-directed action.", thumb: IMGS.aurora, platform:"youtube", category:"Astrology Education", featured:true, views:847 },
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[1]}`, title:"Pluto in Aquarius — The Great Shift Explained", desc:"A breakdown of Pluto's 20-year transit through Aquarius and its collective impact.", thumb: IMGS.cosmos, platform:"youtube", category:"Astrology Education", featured:false, views:634 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Chiron: The Wounded Healer in Your Chart", desc:"Chiron's placement and aspects reveal your core wound, healing path and teaching gift.", thumb: IMGS.crescent, platform:"youtube", category:"Astrology Education", featured:false, views:421 },
    { type:"image", url:IMGS.tarot, title:"Tarot + Astrology Integration — My Reading Space", desc:"How I blend natal chart themes with tarot spreads for deeper client readings.", thumb: IMGS.tarot, album:"Reading Space", category:"Visual Reference", featured:false, views:156 },
    { type:"image", url:IMGS.galaxy, title:"Saturn Return Workshop — March 2026", desc:"Group workshop on navigating the Saturn return — chart highlights and key themes.", thumb: IMGS.galaxy, album:"Workshops & Events", category:"Visual Reference", featured:false, views:94 },
    { type:"image", url:IMGS.moon, title:"Eclipse Season Group Reading — February 2026", desc:"Notes and chart overlays from the February eclipse season group reading.", thumb: IMGS.moon, album:"Workshops & Events", category:"Visual Reference", featured:false, views:211 },
    { type:"image", url:IMGS.crystals, title:"New Moon in Capricorn — Intention Setting Ceremony", desc:"Setting intentions under the Capricorn new moon with crystal grid and chart focus.", thumb: IMGS.crystals, album:"Workshops & Events", category:"Visual Reference", featured:false, views:88 },
    { type:"article", url:"https://cafeastrology.com/articles/saturnreturn.html", title:"Saturn Return: What to Expect and How to Prepare", desc:"A thorough guide to the Saturn return — themes, timing, and how to navigate it.", thumb: IMGS.notebook, category:"Reading Resources", featured:false, views:443 },
    { type:"article", url:"https://www.astro.com/astrology/in_school_e.htm", title:"The 12 Astrological Houses — What Each One Rules", desc:"A complete breakdown of house meanings, natural signs, and interpreting house cusps.", thumb: IMGS.zodiac, category:"Reading Resources", featured:false, views:267 },
    { type:"link", url:"https://cafeastrology.com", title:"Café Astrology — Interpretations & Learning Library", desc:"My go-to reference for sign, planet and aspect interpretations during client prep.", thumb: IMGS.stars, category:"Tools & References", featured:false, views:121 },
  ],
  "test-diviner-2": [
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[0]}`, title:"North Node in Aries — Your Soul's Direction", desc:"How the North Node in Aries calls you to step into bold, self-directed action.", thumb: IMGS.aurora, platform:"youtube", category:"Astrology Education", featured:true, views:847 },
    { type:"video", url:`https://www.youtube.com/watch?v=${REAL_YT[1]}`, title:"Pluto in Aquarius — The Great Shift Explained", desc:"A breakdown of Pluto's 20-year transit through Aquarius and its collective impact.", thumb: IMGS.cosmos, platform:"youtube", category:"Astrology Education", featured:false, views:634 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Mercury Retrograde Survival Guide — What You Must Know", desc:"Practical guidance for working with Mercury retrograde rather than against it.", thumb: IMGS.crescent, platform:"youtube", category:"Astrology Education", featured:false, views:1243 },
    { type:"audio", url:"https://theaastrologypodcast.com", title:"Eclipse Season Meditation — Embracing Change", desc:"A guided meditation for working with the intense energy of eclipse season.", thumb: IMGS.eclipse, platform:"podcast", category:"Guided Audio", featured:false, views:302 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Understanding Your Big Three — Sun, Moon & Rising Signs", desc:"How to interpret your Sun, Moon and Rising as the core triangle of the birth chart.", thumb: IMGS.zodiac, platform:"youtube", category:"Astrology Education", featured:false, views:892 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Saturn Return Explained — First, Second & Third Returns", desc:"A deep dive into all three Saturn returns and the life transitions each one triggers.", thumb: IMGS.milkyway, platform:"youtube", category:"Astrology Education", featured:false, views:210 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Venus in All 12 Houses — Love, Beauty & Values", desc:"How Venus expresses itself through each of the 12 houses in the birth chart.", thumb: IMGS.galaxy, platform:"youtube", category:"Astrology Education", featured:false, views:207 },
    { type:"video", url:"https://www.youtube.com/@astro_education", title:"Full Moon Ritual — How to Work With Lunar Energy", desc:"Step-by-step ritual for harnessing the release power of each full moon.", thumb: IMGS.moon, platform:"youtube", category:"Astrology Education", featured:false, views:318 },
    { type:"audio", url:"https://theaastrologypodcast.com", title:"New Moon in Taurus — Setting Intentions for Abundance", desc:"A focused audio guide for new moon intention-setting under earthy Taurus energy.", thumb: IMGS.crystals, platform:"podcast", category:"Guided Audio", featured:false, views:3 },
    { type:"audio", url:"https://theaastrologypodcast.com", title:"Mars Return Activation — Reclaim Your Drive & Courage", desc:"How to work with your Mars return as a reset for motivation, goals and courageous action.", thumb: IMGS.planets, platform:"podcast", category:"Guided Audio", featured:false, views:145 },
    { type:"audio", url:"https://theaastrologypodcast.com", title:"April 2026 Astrology Forecast — Key Transits & Themes", desc:"Monthly overview of the major planetary movements and what they mean for each sign.", thumb: IMGS.telescope, platform:"podcast", category:"Guided Audio", featured:false, views:204 },
    { type:"article", url:"https://www.astro.com/astrology/in_school_e.htm", title:"The 12 Astrological Houses — What Each One Rules", desc:"A complete breakdown of house meanings, natural signs, and interpreting house cusps.", thumb: IMGS.notebook, category:"Reading Resources", featured:false, views:1587 },
    { type:"article", url:"https://cafeastrology.com/articles/saturnreturn.html", title:"Saturn Return: What to Expect and How to Prepare", desc:"A thorough guide to the Saturn return — themes, timing, and how to navigate it.", thumb: IMGS.zodiac, category:"Reading Resources", featured:false, views:933 },
    { type:"article", url:"https://www.astro.com/astrology/in_sundance_e.htm", title:"Venus Retrograde Natal — Born With Venus Retrograde", desc:"Understanding the natal Venus retrograde placement and how it shapes love and values.", thumb: IMGS.crescent, category:"Reading Resources", featured:false, views:58 },
    { type:"image", url:IMGS.stars, title:"Saturn Return Workshop — Dublin, March 2026", desc:"Group workshop on navigating the Saturn return — chart highlights and key themes.", thumb: IMGS.stars, album:"Workshops & Events", category:"Visual Reference", featured:false, views:72 },
    { type:"image", url:IMGS.aurora, title:"Eclipse Season Group Reading — February 2026", desc:"Notes and chart overlays from the February eclipse season group reading.", thumb: IMGS.aurora, album:"Workshops & Events", category:"Visual Reference", featured:false, views:58 },
    { type:"image", url:IMGS.moon, title:"New Moon in Capricorn — Intention Setting Ceremony", desc:"Setting intentions under the Capricorn new moon with crystal grid and chart focus.", thumb: IMGS.moon, album:"Workshops & Events", category:"Visual Reference", featured:false, views:134 },
    { type:"image", url:IMGS.tarot, title:"Tarot + Astrology Integration — My Reading Space", desc:"How I blend natal chart themes with tarot spreads for deeper client readings.", thumb: IMGS.tarot, album:"Reading Room", category:"Visual Reference", featured:false, views:69 },
    { type:"image", url:IMGS.milkyway, title:"Hand-Drawn Natal Chart — Traditional Method", desc:"A hand-drawn natal chart created using the traditional quadrant house system.", thumb: IMGS.milkyway, album:"Reading Room", category:"Visual Reference", featured:false, views:51 },
    { type:"link", url:"https://astro-seek.com", title:"Astro-Seek — Free Charts, Synastry & Transits Calculator", desc:"Excellent tool for synastry comparisons and transit tracking between sessions.", thumb: IMGS.telescope, category:"Tools & References", featured:false, views:257 },
    { type:"link", url:"https://cafeastrology.com", title:"Café Astrology — Interpretations & Learning Library", desc:"My go-to reference for sign, planet and aspect interpretations during client prep.", thumb: IMGS.stars, category:"Tools & References", featured:false, views:190 },
    { type:"article", url:"https://www.astro.com/astrology/in_transit_e.htm", title:"How to Read Your Progressed Chart", desc:"Secondary progressions map the unfolding of your inner world and evolving identity.", thumb: IMGS.notebook, category:"Reading Resources", featured:false, views:178 },
    { type:"article", url:"https://cafeastrology.com/articles/natalchartsinterpretation.html", title:"The Major Arcana Explained — Card by Card", desc:"A practitioner's guide to the 22 Major Arcana and their astrological correspondences.", thumb: IMGS.zodiac, category:"Tarot Education", featured:false, views:289 },
    { type:"link", url:"https://www.astro.com/horoscope", title:"Astro.com — Free Chart & Ephemeris Tools", desc:"Real-time planetary positions and free chart generation I use daily.", thumb: IMGS.galaxy, category:"Tools & References", featured:false, views:421 },
  ],
};

// Generic pool for all other named diviners
const VIDEO_POOL = [
  { url:`https://www.youtube.com/watch?v=${REAL_YT[0]}`, title:"Reading Planetary Transits for Clients", desc:"How to identify and communicate the most relevant transits in a client session.", thumb: IMGS.planets },
  { url:`https://www.youtube.com/watch?v=${REAL_YT[1]}`, title:"The Jupiter Return — Cycles of Expansion", desc:"Working with the 12-year Jupiter cycle to identify peaks of opportunity and growth.", thumb: IMGS.cosmos },
  { url:"https://www.youtube.com/@astro_education", title:"Synastry Chart Reading: Relationship Astrology", desc:"Comparing two birth charts to assess compatibility, challenges and karmic bonds.", thumb: IMGS.zodiac },
  { url:"https://www.youtube.com/@astro_education", title:"Solar Return Chart — Your Year Ahead", desc:"Using the solar return to forecast themes, opportunities and challenges for the coming year.", thumb: IMGS.aurora },
  { url:"https://www.youtube.com/@astro_education", title:"Saturn Return: Navigating Your Cosmic Initiation", desc:"What the Saturn return means and practical guidance for working through its lessons.", thumb: IMGS.milkyway },
  { url:"https://www.youtube.com/@astro_education", title:"Chiron in Your Chart — The Wounded Healer", desc:"How Chiron's natal placement and transits reveal your healing path and gift to others.", thumb: IMGS.crescent },
  { url:"https://www.youtube.com/@astro_education", title:"North Node Astrology — Your Soul's Mission", desc:"Interpreting the North Node sign, house and aspects to understand your karmic direction.", thumb: IMGS.eclipse },
  { url:"https://www.youtube.com/@astro_education", title:"Venus Retrograde — Love, Money & Values Revisited", desc:"How Venus retrograde periods invite review of relationships, finances and self-worth.", thumb: IMGS.galaxy },
  { url:"https://www.youtube.com/@astro_education", title:"Reading Tarot with Astrology — Combined Practice", desc:"How to layer astrological timing and chart themes into a tarot reading for deeper insight.", thumb: IMGS.tarot },
  { url:"https://www.youtube.com/@astro_education", title:"Pluto Transits — Transformation & Personal Power", desc:"How Pluto transits reshape identity, power dynamics and your deepest core patterns.", thumb: IMGS.stars },
];

const IMAGE_POOL = [
  { title:"Zodiac Wheel Reference Chart", desc:"My annotated zodiac wheel used during natal and transit readings.", album:"Chart Gallery", thumb: IMGS.zodiac },
  { title:"Full Moon Energy — Reading Notes", desc:"Chart notes captured during the last full moon reading session.", album:"Chart Gallery", thumb: IMGS.moon },
  { title:"Current Sky — Weekly Snapshot", desc:"A snapshot of current planetary positions for the weekly forecast.", album:"Chart Gallery", thumb: IMGS.milkyway },
  { title:"Session Prep — Crystal Grid", desc:"Crystal grid arrangement I use to set the energy before client sessions.", album:"Reading Space", thumb: IMGS.crystals },
  { title:"Reading Space Setup", desc:"My dedicated reading space with charts, candles and reference books.", album:"Reading Space", thumb: IMGS.candles },
  { title:"Tarot Spread — Celtic Cross", desc:"A Celtic Cross reading from a recent client session — key themes noted.", album:"Reading Room", thumb: IMGS.tarot },
  { title:"Night Sky — Eclipse Observation", desc:"Observing the night sky during the eclipse window — a powerful energy reset.", album:"Chart Gallery", thumb: IMGS.aurora },
  { title:"Workshop Notes — Saturn Return", desc:"Group workshop handout on Saturn return timing and key themes.", album:"Workshops & Events", thumb: IMGS.stars },
];

const ARTICLE_POOL = [
  { url:"https://cafeastrology.com/articles/natalchartsinterpretation.html", title:"Interpreting the Natal Chart — A Practitioner's Guide", desc:"How to synthesise planets, signs, houses and aspects into meaningful chart narratives.", thumb: IMGS.notebook },
  { url:"https://www.astro.com/astrology/in_transit_e.htm", title:"Planetary Transits — The Complete Reference", desc:"How current planetary positions trigger events and themes in the natal chart.", thumb: IMGS.telescope },
  { url:"https://cafeastrology.com/articles/saturnreturn.html", title:"Saturn Return: Passages and Milestones", desc:"In-depth look at what to expect during the Saturn return periods.", thumb: IMGS.zodiac },
  { url:"https://www.astro.com/astrology/in_sundance_e.htm", title:"The Solar Arc Direction Method", desc:"Solar arc directions offer a powerful secondary progression technique for forecasting.", thumb: IMGS.crescent },
  { url:"https://cafeastrology.com/articles/synastryoverview.html", title:"Relationship Astrology — Synastry Overview", desc:"How to use synastry charts to analyse compatibility and karmic connections.", thumb: IMGS.galaxy },
  { url:"https://www.astro.com/astrology/in_decans_e.htm", title:"The Decans — Sub-Divisions of the Zodiac", desc:"Each zodiac sign is divided into three decans, each with distinct qualities.", thumb: IMGS.stars },
  { url:"https://cafeastrology.com/articles/progressedchart.html", title:"Progressed Charts — Inner Evolution", desc:"Secondary progressions map the unfolding of your inner world over time.", thumb: IMGS.aurora },
  { url:"https://www.astro.com/astrology/in_school_e.htm", title:"Astrology Fundamentals — A Comprehensive Introduction", desc:"The foundational principles of astrological interpretation from Astro.com's library.", thumb: IMGS.notebook },
];

const LINK_POOL = [
  { url:"https://www.astro.com/horoscope", title:"Astro.com — Daily Ephemeris & Chart Tools", desc:"Real-time planetary positions I check before every reading session.", thumb: IMGS.cosmos },
  { url:"https://cafeastrology.com", title:"Café Astrology — Interpretations & Learning Library", desc:"My go-to reference for sign, planet and aspect interpretations.", thumb: IMGS.stars },
  { url:"https://astro-seek.com", title:"Astro-Seek — Charts, Synastry & Transit Calculator", desc:"Excellent tool for synastry comparisons and transit tracking between sessions.", thumb: IMGS.telescope },
  { url:"https://www.astro.com/atlas", title:"Astro.com — Atlas & Time Zone Database", desc:"Precise birth time and location verification for accurate chart calculation.", thumb: IMGS.zodiac },
];

const NAMED_DIVINERS = [
  { id:"7ba53c28-558c-4b23-8fff-049941f940d4", username:"iris-solaris" },
  { id:"3924bd3e-57d0-4e46-a9c2-37ba2c121bec", username:"aurora-vega" },
  { id:"5ba59399-31c1-4253-98f5-2a2072fd70cb", username:"serena-stardust" },
  { id:"2f292629-e7ac-4ff8-bfa4-b5f0878421f0", username:"cosmic-aura" },
  { id:"8ab9851f-abe3-412b-a260-6c229400a64a", username:"aurora-mystic" },
  { id:"fddfbf81-9ead-421b-87eb-3c7d7ad4e86c", username:"sol-oracle" },
  { id:"f16f4083-013c-4680-bf7f-294d901e63f8", username:"celestine-reads" },
  { id:"c7a96739-a88a-485b-b755-7420c6cf4226", username:"mystic-maya" },
  { id:"8941b9ce-5288-4be1-b693-6ba938f81ada", username:"luna-readings" },
  { id:"7d48e5e3-097d-480d-9f84-76eede3c0641", username:"luna-brightwell" },
];

function buildGenericItems(diviner, offset) {
  const items = [];
  let sort = 0;
  const v = (n) => VIDEO_POOL[(offset * 3 + n) % VIDEO_POOL.length];
  const a = (n) => ARTICLE_POOL[(offset * 2 + n) % ARTICLE_POOL.length];
  const img = (n) => IMAGE_POOL[(offset * 4 + n) % IMAGE_POOL.length];
  const lnk = LINK_POOL[offset % LINK_POOL.length];

  // 3 videos
  for (let i = 0; i < 3; i++) {
    const vid = v(i);
    items.push({ diviner_id:diviner.id, type:"video", url:vid.url, title:vid.title, description:vid.desc, thumbnail_url:vid.thumb, platform:"youtube", category:"Astrology Education", is_active:true, is_featured:i===0, moderation_status:"approved", sort_order:sort++, view_count:Math.floor(Math.random()*800)+50 });
  }
  // 4 images
  for (let i = 0; i < 4; i++) {
    const im = img(i);
    items.push({ diviner_id:diviner.id, type:"image", url:im.thumb, title:im.title, description:im.desc, thumbnail_url:im.thumb, album_name:im.album, category:"Visual Reference", is_active:true, is_featured:false, moderation_status:"approved", sort_order:sort++, view_count:Math.floor(Math.random()*200)+10 });
  }
  // 2 articles
  for (let i = 0; i < 2; i++) {
    const art = a(i);
    items.push({ diviner_id:diviner.id, type:"article", url:art.url, title:art.title, description:art.desc, thumbnail_url:art.thumb, category:"Reading Resources", is_active:true, is_featured:false, moderation_status:"approved", sort_order:sort++, view_count:Math.floor(Math.random()*400)+20 });
  }
  // 1 link
  items.push({ diviner_id:diviner.id, type:"link", url:lnk.url, title:lnk.title, description:lnk.desc, thumbnail_url:lnk.thumb, category:"Tools & References", is_active:true, is_featured:false, moderation_status:"approved", sort_order:sort++, view_count:Math.floor(Math.random()*150)+5 });

  return items;
}

async function main() {
  const customDivinerIds = ["d1c2a107-384c-4702-be0a-dda5b4727b06","80bf299e-b14f-4be9-9609-4b14ecd2c3ed","c10a225f-51f5-441f-ad0c-1487fe576b43"];
  const genericDivinerIds = NAMED_DIVINERS.map(d => d.id);
  const allIds = [...customDivinerIds, ...genericDivinerIds];

  console.log(`Deleting existing media for ${allIds.length} diviners...`);
  const { error: delErr } = await db.from("media_items").delete().in("diviner_id", allIds);
  if (delErr) { console.error("Delete error:", delErr); process.exit(1); }
  console.log("Deleted ✓\n");

  let total = 0;

  // Custom per-diviner content
  for (const [username, mediaList] of Object.entries(DIVINER_MEDIA)) {
    const idMap = {
      "luna-brightwell-qa": "d1c2a107-384c-4702-be0a-dda5b4727b06",
      "test-diviner":       "80bf299e-b14f-4be9-9609-4b14ecd2c3ed",
      "test-diviner-2":     "c10a225f-51f5-441f-ad0c-1487fe576b43",
    };
    const divId = idMap[username];
    const items = mediaList.map((m, i) => ({
      diviner_id: divId, type: m.type, url: m.url, title: m.title,
      description: m.desc, thumbnail_url: m.thumb,
      platform: m.platform ?? null, category: m.category ?? null,
      album_name: m.album ?? null,
      is_active: true, is_featured: m.featured ?? false,
      moderation_status: "approved",
      sort_order: i, view_count: m.views ?? 0,
    }));
    const { error } = await db.from("media_items").insert(items);
    if (error) console.error(`  ✗ ${username}:`, error.message);
    else { console.log(`  ✓ ${username}: ${items.length} items`); total += items.length; }
  }

  // Generic content for all other named diviners
  for (let i = 0; i < NAMED_DIVINERS.length; i++) {
    const diviner = NAMED_DIVINERS[i];
    const items = buildGenericItems(diviner, i);
    const { error } = await db.from("media_items").insert(items);
    if (error) console.error(`  ✗ ${diviner.username}:`, error.message);
    else { console.log(`  ✓ ${diviner.username}: ${items.length} items`); total += items.length; }
  }

  console.log(`\nDone — ${total} items across ${allIds.length} diviners.`);
}

main().catch(console.error);
