import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

async function upsertAuthUser(email: string, password: string) {
  // Check if user exists
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === email);
  if (existing) {
    log(`  Auth user ${email} already exists (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  log(`  Created auth user ${email} (${data.user.id})`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// 1. Diviner users
// ---------------------------------------------------------------------------
async function seedDiviners() {
  log("Creating diviner auth users...");

  const mayaUserId = await upsertAuthUser("demo.astrologer@astrologypro.com", "DemoAstro2026!");
  const lunaUserId = await upsertAuthUser("demo.tarot@astrologypro.com", "DemoTarot2026!");

  log("Upserting diviner profiles...");

  const diviners = [
    {
      user_id: mayaUserId,
      username: "mystic-maya",
      display_name: "Mystic Maya",
      bio: "Mystic Maya is a professional astrologer with over 15 years of experience reading natal charts, solar returns, and relationship synastry. Specializing in Western astrology, Maya helps clients understand their cosmic blueprint and navigate life's challenges with clarity and confidence. Every reading is a sacred journey into self-discovery.",
      tagline: "Illuminate Your Path Through the Stars",
      specialties: ["astrology", "tarot"],
      timezone: "America/New_York",
      onboarding_completed: true,
      onboarding_step: 5,
      subscription_status: "active",
      youtube_channel_id: null,
      is_active: true,
    },
    {
      user_id: lunaUserId,
      username: "luna-readings",
      display_name: "Luna Starweaver",
      bio: "Luna Starweaver is an intuitive tarot reader and spiritual guide who has been reading cards for over a decade. Using both traditional Rider-Waite-Smith and modern decks, Luna creates a safe space for clients to explore their questions about love, career, spirituality, and life purpose. Each reading combines ancient wisdom with practical guidance.",
      tagline: "Let the Cards Reveal Your Truth",
      specialties: ["astrology", "tarot"],
      timezone: "America/Los_Angeles",
      onboarding_completed: true,
      onboarding_step: 5,
      subscription_status: "active",
      is_active: true,
    },
  ];

  const divinerIds: Record<string, string> = {};

  for (const d of diviners) {
    // Delete existing row for this user_id to make idempotent
    await supabase.from("diviners").delete().eq("user_id", d.user_id);

    const { data, error } = await supabase.from("diviners").insert(d).select("id").single();
    if (error) throw new Error(`Failed to insert diviner ${d.username}: ${error.message}`);
    divinerIds[d.username] = data.id;
    log(`  Diviner "${d.display_name}" => ${data.id}`);
  }

  return { mayaUserId, lunaUserId, divinerIds };
}

// ---------------------------------------------------------------------------
// 2. Services from templates
// ---------------------------------------------------------------------------
async function seedServices(divinerIds: Record<string, string>) {
  log("Seeding services from templates...");

  // Fetch all templates
  const { data: templates, error } = await supabase
    .from("service_templates")
    .select("*")
    .order("sort_order");
  if (error || !templates) throw new Error(`Failed to fetch templates: ${error?.message}`);

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  // Delete existing services for these diviners
  await supabase.from("services").delete().eq("diviner_id", mayaId);
  await supabase.from("services").delete().eq("diviner_id", lunaId);

  // Both diviners offer ALL 19 services (astrology AND tarot)
  const allSlugs = templates.map((t) => t.slug);

  const mayaSlugs = allSlugs;
  const mayaFeatured = ["natal-chart", "romantic-relationships", "10-card-celtic-cross", "solar-return"];

  const lunaSlugs = allSlugs;
  const lunaFeatured = ["10-card-celtic-cross", "natal-chart", "3-card-basic", "romantic-relationships"];

  const serviceIds: Record<string, Record<string, string>> = { maya: {}, luna: {} };

  for (const slug of mayaSlugs) {
    const tpl = templates.find((t) => t.slug === slug);
    if (!tpl) { log(`  WARNING: template ${slug} not found`); continue; }
    const { data, error: sErr } = await supabase.from("services").insert({
      diviner_id: mayaId,
      category: tpl.category,
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      duration_minutes: tpl.duration_minutes,
      base_price: tpl.base_price,
      overage_rate: tpl.overage_rate,
      is_primary: tpl.is_primary,
      is_featured: mayaFeatured.includes(slug),
      requires_birth_data: tpl.requires_birth_data,
      trigger_event: tpl.trigger_event,
      sort_order: tpl.sort_order,
    }).select("id").single();
    if (sErr) throw new Error(`Service insert error: ${sErr.message}`);
    serviceIds.maya[slug] = data!.id;
  }
  log(`  Maya: ${mayaSlugs.length} services created (${mayaFeatured.length} featured)`);

  for (const slug of lunaSlugs) {
    const tpl = templates.find((t) => t.slug === slug);
    if (!tpl) { log(`  WARNING: template ${slug} not found`); continue; }
    const { data, error: sErr } = await supabase.from("services").insert({
      diviner_id: lunaId,
      category: tpl.category,
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      duration_minutes: tpl.duration_minutes,
      base_price: tpl.base_price,
      overage_rate: tpl.overage_rate,
      is_primary: tpl.is_primary,
      is_featured: lunaFeatured.includes(slug),
      requires_birth_data: tpl.requires_birth_data,
      trigger_event: tpl.trigger_event,
      sort_order: tpl.sort_order,
    }).select("id").single();
    if (sErr) throw new Error(`Service insert error: ${sErr.message}`);
    serviceIds.luna[slug] = data!.id;
  }
  log(`  Luna: ${lunaSlugs.length} services created (${lunaFeatured.length} featured)`);

  return serviceIds;
}

// ---------------------------------------------------------------------------
// 3. Availability slots
// ---------------------------------------------------------------------------
async function seedAvailability(divinerIds: Record<string, string>) {
  log("Seeding availability slots...");

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  await supabase.from("availability_slots").delete().eq("diviner_id", mayaId);
  await supabase.from("availability_slots").delete().eq("diviner_id", lunaId);

  // Maya: Mon(1)-Fri(5) 9am-5pm, Sat(6) 10am-2pm
  const mayaSlots = [];
  for (let day = 1; day <= 5; day++) {
    mayaSlots.push({ diviner_id: mayaId, day_of_week: day, start_time: "09:00", end_time: "17:00" });
  }
  mayaSlots.push({ diviner_id: mayaId, day_of_week: 6, start_time: "10:00", end_time: "14:00" });

  // Luna: Tue(2)-Sat(6) 11am-7pm
  const lunaSlots = [];
  for (let day = 2; day <= 6; day++) {
    lunaSlots.push({ diviner_id: lunaId, day_of_week: day, start_time: "11:00", end_time: "19:00" });
  }

  const { error: e1 } = await supabase.from("availability_slots").insert(mayaSlots);
  if (e1) throw new Error(`Maya availability error: ${e1.message}`);
  log(`  Maya: ${mayaSlots.length} slots (Mon-Fri 9-5, Sat 10-2)`);

  const { error: e2 } = await supabase.from("availability_slots").insert(lunaSlots);
  if (e2) throw new Error(`Luna availability error: ${e2.message}`);
  log(`  Luna: ${lunaSlots.length} slots (Tue-Sat 11-7)`);
}

// ---------------------------------------------------------------------------
// 4. Client users
// ---------------------------------------------------------------------------
async function seedClients() {
  log("Creating client auth users...");

  const clientDefs = [
    {
      email: "sarah.johnson@example.com",
      password: "ClientTest2026!",
      full_name: "Sarah Johnson",
      birth_date: "1990-06-15",
      birth_time: "14:30",
      birth_city: "New York, NY",
      birth_lat: 40.7128,
      birth_lng: -74.006,
      birth_timezone: "America/New_York",
    },
    {
      email: "michael.chen@example.com",
      password: "ClientTest2026!",
      full_name: "Michael Chen",
      birth_date: "1985-11-22",
      birth_time: "08:15",
      birth_city: "San Francisco, CA",
      birth_lat: 37.7749,
      birth_lng: -122.4194,
      birth_timezone: "America/Los_Angeles",
    },
    {
      email: "emma.garcia@example.com",
      password: "ClientTest2026!",
      full_name: "Emma Garcia",
      birth_date: "1995-03-08",
      birth_time: "22:45",
      birth_city: "Austin, TX",
      birth_lat: 30.2672,
      birth_lng: -97.7431,
      birth_timezone: "America/Chicago",
    },
  ];

  const clientIds: Record<string, string> = {};

  for (const c of clientDefs) {
    const userId = await upsertAuthUser(c.email, c.password);

    // Delete existing client row
    await supabase.from("clients").delete().eq("user_id", userId);

    const { data, error } = await supabase.from("clients").insert({
      user_id: userId,
      email: c.email,
      full_name: c.full_name,
      birth_date: c.birth_date,
      birth_time: c.birth_time,
      birth_city: c.birth_city,
      birth_lat: c.birth_lat,
      birth_lng: c.birth_lng,
      birth_timezone: c.birth_timezone,
    }).select("id").single();
    if (error) throw new Error(`Client insert error for ${c.email}: ${error.message}`);
    clientIds[c.email] = data.id;
    log(`  Client "${c.full_name}" => ${data.id}`);
  }

  return clientIds;
}

// ---------------------------------------------------------------------------
// 5. Client-Diviner relationships
// ---------------------------------------------------------------------------
async function seedClientDiviners(
  clientIds: Record<string, string>,
  divinerIds: Record<string, string>,
) {
  log("Creating client-diviner relationships...");

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  // Delete existing relationships for these diviners
  await supabase.from("client_diviners").delete().eq("diviner_id", mayaId);
  await supabase.from("client_diviners").delete().eq("diviner_id", lunaId);

  const relationships = [];
  for (const clientId of Object.values(clientIds)) {
    relationships.push(
      { client_id: clientId, diviner_id: mayaId, total_sessions: 2, total_spent: 200 },
      { client_id: clientId, diviner_id: lunaId, total_sessions: 1, total_spent: 100 },
    );
  }

  const { error } = await supabase.from("client_diviners").insert(relationships);
  if (error) throw new Error(`Client-diviner insert error: ${error.message}`);
  log(`  Created ${relationships.length} relationships`);
}

// ---------------------------------------------------------------------------
// 6. Bookings
// ---------------------------------------------------------------------------
async function seedBookings(
  divinerIds: Record<string, string>,
  clientIds: Record<string, string>,
  serviceIds: Record<string, Record<string, string>>,
) {
  log("Creating bookings...");

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  const sarahId = clientIds["sarah.johnson@example.com"];
  const michaelId = clientIds["michael.chen@example.com"];
  const emmaId = clientIds["emma.garcia@example.com"];

  // Delete existing bookings for these diviners
  await supabase.from("bookings").delete().eq("diviner_id", mayaId);
  await supabase.from("bookings").delete().eq("diviner_id", lunaId);

  // Today for relative date calculations
  const now = new Date();

  function daysAgo(n: number): string {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  }

  function daysFromNow(n: number, hour = 10): string {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  const bookings = [
    // 4 completed bookings (past)
    {
      diviner_id: mayaId,
      client_id: sarahId,
      service_id: serviceIds.maya["natal-chart"],
      status: "completed",
      scheduled_at: daysAgo(30),
      duration_minutes: 60,
      actual_duration_minutes: 65,
      base_price: 100,
      overage_amount: 2.50,
      total_amount: 102.50,
      session_notes: "Sarah has a strong Sun-Moon trine indicating natural emotional balance. Discussed career implications of her Mercury in Gemini and recommended journaling during upcoming Mercury retrograde.",
    },
    {
      diviner_id: mayaId,
      client_id: michaelId,
      service_id: serviceIds.maya["romantic-relationships"],
      status: "completed",
      scheduled_at: daysAgo(21),
      duration_minutes: 60,
      actual_duration_minutes: 58,
      base_price: 100,
      overage_amount: 0,
      total_amount: 100,
      session_notes: "Analyzed synastry with Michael's partner. Strong Venus-Mars aspects suggest passionate connection. Noted potential communication challenges with Mercury square and advised patience during Saturn transit to 7th house.",
    },
    {
      diviner_id: lunaId,
      client_id: emmaId,
      service_id: serviceIds.luna["10-card-celtic-cross"],
      status: "completed",
      scheduled_at: daysAgo(14),
      duration_minutes: 60,
      actual_duration_minutes: 62,
      base_price: 100,
      overage_amount: 1.00,
      total_amount: 101,
      session_notes: "Celtic Cross revealed The Star as the outcome card — a very positive sign for Emma's career question. The Tower in the recent past position confirms the major workplace changes she described.",
    },
    {
      diviner_id: lunaId,
      client_id: sarahId,
      service_id: serviceIds.luna["3-card-basic"],
      status: "completed",
      scheduled_at: daysAgo(7),
      duration_minutes: 30,
      actual_duration_minutes: 28,
      base_price: 50,
      overage_amount: 0,
      total_amount: 50,
      session_notes: "Quick check-in reading for Sarah. Past: 8 of Cups (letting go), Present: The Empress (abundance), Future: Ace of Pentacles (new opportunity). Very encouraging spread for her upcoming job transition.",
    },
    // 2 confirmed upcoming bookings (next week)
    {
      diviner_id: mayaId,
      client_id: emmaId,
      service_id: serviceIds.maya["solar-return"],
      status: "confirmed",
      scheduled_at: daysFromNow(5, 14),
      duration_minutes: 60,
      base_price: 100,
      total_amount: 100,
    },
    {
      diviner_id: lunaId,
      client_id: michaelId,
      service_id: serviceIds.luna["7-card-horseshoe"],
      status: "confirmed",
      scheduled_at: daysFromNow(6, 11),
      duration_minutes: 60,
      base_price: 100,
      total_amount: 100,
    },
    // 2 pending bookings
    {
      diviner_id: mayaId,
      client_id: michaelId,
      service_id: serviceIds.maya["monthly-transit"],
      status: "pending",
      scheduled_at: daysFromNow(10, 10),
      duration_minutes: 30,
      base_price: 50,
      total_amount: 50,
    },
    {
      diviner_id: lunaId,
      client_id: emmaId,
      service_id: serviceIds.luna["12-card-astrological"],
      status: "pending",
      scheduled_at: daysFromNow(12, 15),
      duration_minutes: 60,
      base_price: 100,
      total_amount: 100,
    },
  ];

  const { error } = await supabase.from("bookings").insert(bookings);
  if (error) throw new Error(`Bookings insert error: ${error.message}`);
  log(`  Created ${bookings.length} bookings (4 completed, 2 confirmed, 2 pending)`);
}

// ---------------------------------------------------------------------------
// 7. Testimonials
// ---------------------------------------------------------------------------
async function seedTestimonials(
  divinerIds: Record<string, string>,
  clientIds: Record<string, string>,
) {
  log("Creating testimonials...");

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  const sarahId = clientIds["sarah.johnson@example.com"];
  const michaelId = clientIds["michael.chen@example.com"];
  const emmaId = clientIds["emma.garcia@example.com"];

  // Delete existing testimonials for these diviners
  await supabase.from("testimonials").delete().eq("diviner_id", mayaId);
  await supabase.from("testimonials").delete().eq("diviner_id", lunaId);

  const testimonials = [
    // Maya testimonials
    {
      diviner_id: mayaId,
      client_id: sarahId,
      client_name: "Sarah J.",
      rating: 5,
      text: "Maya's natal chart reading was absolutely eye-opening. She explained complex aspects in a way that made total sense and gave me practical advice I could use immediately. I finally understand why certain patterns keep showing up in my life.",
      service_type: "Natal Chart Reading",
      status: "approved",
      is_featured: true,
    },
    {
      diviner_id: mayaId,
      client_id: michaelId,
      client_name: "Michael C.",
      rating: 5,
      text: "The synastry reading Maya did for my partner and me was incredibly detailed and accurate. She identified dynamics in our relationship that we had struggled to articulate for years. Her guidance has genuinely improved how we communicate.",
      service_type: "Romantic Relationship Reading",
      status: "approved",
      is_featured: true,
    },
    {
      diviner_id: mayaId,
      client_id: emmaId,
      client_name: "Emma G.",
      rating: 4,
      text: "I was skeptical about astrology before my reading with Maya, but she completely won me over. Her solar return reading for my birthday year has been spot-on so far. Highly recommend for anyone curious about what the stars have in store.",
      service_type: "Solar Return Reading",
      status: "approved",
      is_featured: false,
    },
    // Luna testimonials
    {
      diviner_id: lunaId,
      client_id: emmaId,
      client_name: "Emma G.",
      rating: 5,
      text: "Luna has an incredible gift for reading the cards. My Celtic Cross reading provided clarity on a career decision I had been agonizing over for months. She creates such a warm, safe space and her interpretations are always thoughtful and nuanced.",
      service_type: "10-Card Celtic Cross",
      status: "approved",
      is_featured: true,
    },
    {
      diviner_id: lunaId,
      client_id: sarahId,
      client_name: "Sarah J.",
      rating: 5,
      text: "I've had readings with many tarot readers but Luna is in a league of her own. Her 3-card reading was quick but packed with insight. She picks up on energy shifts with remarkable accuracy and delivers the message with compassion.",
      service_type: "3-Card Basic Spread",
      status: "approved",
      is_featured: true,
    },
    {
      diviner_id: lunaId,
      client_id: michaelId,
      client_name: "Michael C.",
      rating: 4,
      text: "Great experience with Luna's horseshoe spread. She took time to explain each card position and how they related to my question about relocating. The reading gave me confidence to move forward with my plans.",
      service_type: "7-Card Horseshoe Spread",
      status: "approved",
      is_featured: false,
    },
  ];

  const { error } = await supabase.from("testimonials").insert(testimonials);
  if (error) throw new Error(`Testimonials insert error: ${error.message}`);
  log(`  Created ${testimonials.length} testimonials (3 per diviner, all approved)`);
}

// ---------------------------------------------------------------------------
// 8. Share Batches (Mundane + Regular)
// ---------------------------------------------------------------------------
async function seedShareBatches(divinerIds: Record<string, string>) {
  log("Seeding share batches (mundane + regular)...");

  const mayaId = divinerIds["mystic-maya"];
  const lunaId = divinerIds["luna-readings"];

  // Delete existing share_batches for these diviners
  await supabase.from("share_batches").delete().eq("diviner_id", mayaId);
  await supabase.from("share_batches").delete().eq("diviner_id", lunaId);

  const STORAGE_BASE =
    "https://bkstnlbwsrmhnebgmhxk.supabase.co/storage/v1/object/public/share-images/uranus-sextile-neptune.jpg";

  // Helper: date string relative to today (negative = past)
  function dateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function sentAtOffset(days: number, hour = 10): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  // Random 32-char hex token
  function makeToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  const batches = [
    // ---- Mystic Maya — mundane shares ----
    {
      diviner_id: mayaId,
      token: makeToken(),
      caption:
        "Uranus sextile Neptune is exact today and I can feel it in every reading I do right now \u2014 this aspect blurs the line between the practical and the mystical in the most beautiful way. If you\u2019ve been sensing a pull toward spiritual reinvention or unexpected breakthroughs in long-standing patterns, you\u2019re right on time. This energy favors healers, creatives, and anyone ready to trust their intuition over logic. Book a natal chart reading with me this week and let\u2019s see exactly how this transit is activating your chart. \u2728\n\n#UranusNeptune #MundaneAstrology #CosmicWeather #AstrologyReading #MysticMaya",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: true,
      sent_at: sentAtOffset(-20, 10),
      shares: JSON.stringify({
        facebook: { shared_at: sentAtOffset(-20, 10), clicks: 14 },
        twitter: { shared_at: sentAtOffset(-20, 11), clicks: 8 },
        instagram: { downloaded_at: sentAtOffset(-20, 10) },
      }),
      share_date: dateOffset(-20),
      is_mundane: true,
      share_number: 1,
    },
    {
      diviner_id: mayaId,
      token: makeToken(),
      caption:
        "Mercury stations retrograde in Aries this afternoon and already my inbox is full of \u201cwhat does this mean for me?\u201d \u2014 which is exactly why I love this work. In Aries, Mercury retrograde isn\u2019t just about tech glitches and travel delays; it\u2019s asking us to rethink the stories we tell about who we are and where we\u2019re headed. Old decisions come up for review, and that\u2019s a gift if you use it well. Drop a comment with your Sun or Rising sign and I\u2019ll share one thing to watch for over the next three weeks. \ud83d\udd04\n\n#MercuryRetrograde #MercuryInAries #AstrologyAlert #MysticMaya #RetrogradeSeason",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: true,
      sent_at: sentAtOffset(-14, 15),
      shares: JSON.stringify({
        facebook: { shared_at: sentAtOffset(-14, 15), clicks: 22 },
        whatsapp: { shared_at: sentAtOffset(-14, 16), clicks: 5 },
      }),
      share_date: dateOffset(-14),
      is_mundane: true,
      share_number: 2,
    },
    {
      diviner_id: mayaId,
      token: makeToken(),
      caption:
        "Mars enters Capricorn today and the energy shifts immediately \u2014 from scattered sparks to a slow, strategic burn. This is one of the most productive placements for Mars: disciplined, ambitious, and willing to do the unglamorous work that actually gets results. If you\u2019ve been waiting for the right moment to launch something, restructure your schedule, or just stop procrastinating on a big goal, the cosmos just handed you the best possible fuel. \ud83d\udd25\n\n#MarsInCapricorn #MarsIngress #AstrologyNow #CosmicEnergy #MysticMaya",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: false,
      sent_at: sentAtOffset(-7, 10),
      shares: JSON.stringify({
        instagram: { downloaded_at: sentAtOffset(-7, 10) },
        tiktok: { downloaded_at: sentAtOffset(-7, 11) },
        linkedin: { shared_at: sentAtOffset(-7, 12), clicks: 9 },
      }),
      share_date: dateOffset(-7),
      is_mundane: true,
      share_number: 1,
    },
    // ---- Mystic Maya — regular (non-mundane) share ----
    {
      diviner_id: mayaId,
      token: makeToken(),
      caption:
        "Three things I check before every astrology reading \u2014 the client\u2019s current Saturn transit, their progressed Moon sign, and any planets within 2\u00b0 of an angle. These three alone tell me more about where someone is in their life journey than almost anything else. If you\u2019re curious what your chart is showing right now, I have a few spots open this week for natal chart and transit readings. Link in bio or DM me \u2018reading\u2019 to get started. \u2b50\n\n#AstrologyTips #NatalChart #SaturnReturn #AstrologyReading #MysticMaya",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: false,
      sent_at: sentAtOffset(-3, 10),
      shares: JSON.stringify({
        facebook: { shared_at: sentAtOffset(-3, 10), clicks: 31 },
        instagram: { downloaded_at: sentAtOffset(-3, 10) },
      }),
      share_date: dateOffset(-3),
      is_mundane: false,
      share_number: 1,
    },
    // ---- Luna Readings — mundane share ----
    {
      diviner_id: lunaId,
      token: makeToken(),
      caption:
        "Uranus sextile Neptune is exact right now and I\u2019ve never had so many clients come to me feeling like their entire sense of self is quietly dissolving and reforming at the same time \u2014 and honestly? That\u2019s exactly what this aspect does. It softens the hard edges between what we thought we wanted and what the soul actually needs. My cards have been pulling in a very watery, visionary direction all week and it feels like confirmation. If you\u2019ve been putting off that reading, this is your nudge. \ud83c\udf19\n\n#UranusNeptune #TarotAndAstrology #CosmicWeather #LunaReadings #SpiritualGuidance",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: true,
      sent_at: sentAtOffset(-20, 10),
      shares: JSON.stringify({
        facebook: { shared_at: sentAtOffset(-20, 10), clicks: 17 },
        instagram: { downloaded_at: sentAtOffset(-20, 10) },
        whatsapp: { shared_at: sentAtOffset(-20, 12), clicks: 3 },
      }),
      share_date: dateOffset(-20),
      is_mundane: true,
      share_number: 1,
    },
    // ---- Luna Readings — regular (non-mundane) share ----
    {
      diviner_id: lunaId,
      token: makeToken(),
      caption:
        "Something I notice with the Full Moon in Libra every year \u2014 clients come in asking about relationships, but the real question is almost always about self-worth. The cards almost never lie about this. The 6 of Cups, the 2 of Cups, the Lovers reversed \u2014 they all point inward before they point outward. I have a few Celtic Cross spots available this week if you want to dig into what this Full Moon is illuminating for you personally. \ud83c\udf52\n\n#FullMoonInLibra #TarotReading #CelticCross #LunaReadings #MoonTarot",
      image_url: STORAGE_BASE,
      tracking_url: `https://astrologypro.com/share/${makeToken()}`,
      sent_via_email: true,
      sent_via_sms: true,
      sent_at: sentAtOffset(-10, 10),
      shares: JSON.stringify({
        facebook: { shared_at: sentAtOffset(-10, 10), clicks: 19 },
        twitter: { shared_at: sentAtOffset(-10, 11), clicks: 7 },
        instagram: { downloaded_at: sentAtOffset(-10, 10) },
      }),
      share_date: dateOffset(-10),
      is_mundane: false,
      share_number: 1,
    },
  ];

  // Insert one at a time so a token collision (ultra-rare) fails gracefully
  let count = 0;
  for (const batch of batches) {
    const { error } = await supabase.from("share_batches").insert(batch);
    if (error) {
      log(`  WARNING: share_batch insert failed (${error.message}) — skipping`);
    } else {
      count++;
    }
  }
  log(`  Created ${count}/${batches.length} share batches`);
}

// ---------------------------------------------------------------------------
// 9. Affiliates
// ---------------------------------------------------------------------------
async function seedAffiliates(divinerIds: Record<string, string>) {
  log("Creating affiliates...");

  const mayaId = divinerIds["mystic-maya"];

  // Delete existing affiliates for Maya
  await supabase.from("affiliates").delete().eq("diviner_id", mayaId);

  const affiliates = [
    {
      diviner_id: mayaId,
      name: "Cosmic Connections Blog",
      email: "cosmic@example.com",
      referral_code: "COSMIC15",
      commission_percent: 15,
      total_referrals: 8,
      total_earned: 120,
      total_paid: 80,
      is_active: true,
    },
    {
      diviner_id: mayaId,
      name: "Spiritual Growth Podcast",
      email: "spirit@example.com",
      referral_code: "SPIRIT10",
      commission_percent: 10,
      total_referrals: 5,
      total_earned: 50,
      total_paid: 30,
      is_active: true,
    },
  ];

  const { error } = await supabase.from("affiliates").insert(affiliates);
  if (error) throw new Error(`Affiliates insert error: ${error.message}`);
  log(`  Created ${affiliates.length} affiliates for Mystic Maya`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("==============================================");
  console.log("  AstrologyPro Database Seed");
  console.log("==============================================\n");

  try {
    const { divinerIds } = await seedDiviners();
    const serviceIds = await seedServices(divinerIds);
    await seedAvailability(divinerIds);
    const clientIds = await seedClients();
    await seedClientDiviners(clientIds, divinerIds);
    await seedBookings(divinerIds, clientIds, serviceIds);
    await seedTestimonials(divinerIds, clientIds);
    await seedShareBatches(divinerIds);
    await seedAffiliates(divinerIds);

    console.log("\n==============================================");
    console.log("  Seed complete!");
    console.log("==============================================");
    console.log("\nTest accounts:");
    console.log("  Diviner 1: demo.astrologer@astrologypro.com / DemoAstro2026!");
    console.log("  Diviner 2: demo.tarot@astrologypro.com / DemoTarot2026!");
    console.log("  Client 1:  sarah.johnson@example.com / ClientTest2026!");
    console.log("  Client 2:  michael.chen@example.com / ClientTest2026!");
    console.log("  Client 3:  emma.garcia@example.com / ClientTest2026!");
  } catch (err) {
    console.error("\n[seed] FAILED:", err);
    process.exit(1);
  }
}

main();
