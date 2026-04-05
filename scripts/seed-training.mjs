/**
 * Seed script: training programs, categories, lessons, quizzes
 * Run: node scripts/seed-training.mjs
 */

const SUPABASE_URL = "https://wyluvclvtvwptsvvtgkv.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHV2Y2x2dHZ3cHRzdnZ0Z2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MjU0OSwiZXhwIjoyMDkwNTU4NTQ5fQ.FFO4z0U0HUnRxioHGZbwh6cOU0Ex_9vZ6rNhotwB_AM";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function insert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert into ${table} failed: ${err}`);
  }
  return res.json();
}

// ─── 1. Training Programs ────────────────────────────────────────────────────

const programs = await insert("training_programs", [
  {
    name: "Diviner Certification Program",
    description: "Core training for all astrologers and diviners seeking certification on the platform.",
    priority: 1,
    is_active: true,
    allowed_roles: ["is_trainee", "is_astrologer"],
  },
  {
    name: "Mystery School Foundation",
    description: "12-week foundational curriculum for Mystery School members.",
    priority: 2,
    is_active: true,
    allowed_roles: ["is_mystery_school"],
  },
  {
    name: "Tarot Mastery Track",
    description: "Advanced tarot reading techniques and client management.",
    priority: 3,
    is_active: true,
    allowed_roles: ["is_tarotreader", "is_astrologer_tarotreader"],
  },
  {
    name: "Social Advocacy Training",
    description: "Training for social advocates on promotion strategies and commission management.",
    priority: 4,
    is_active: true,
    allowed_roles: ["is_social_advo"],
  },
]);

console.log(`✓ Inserted ${programs.length} training programs`);

// ─── 2. Training Categories ──────────────────────────────────────────────────

const [divinerProg, mysteryProg, tarotProg, advocateProg] = programs;

const categories = await insert("training_categories", [
  // Diviner Certification
  {
    training_id: divinerProg.id,
    name: "Astrology Fundamentals",
    description: "Planets, signs, houses and the basics of chart interpretation.",
    priority: 1,
    is_active: true,
  },
  {
    training_id: divinerProg.id,
    name: "Client Communication",
    description: "How to conduct professional readings and manage client relationships.",
    priority: 2,
    is_active: true,
  },
  {
    training_id: divinerProg.id,
    name: "Platform & Tools",
    description: "Using the AstrologyPro platform, booking system, and payment tools.",
    priority: 3,
    is_active: true,
  },
  // Mystery School
  {
    training_id: mysteryProg.id,
    name: "Weeks 1–4: Foundation",
    description: "Introduction to esoteric principles and mystery school lineage.",
    priority: 1,
    is_active: true,
  },
  {
    training_id: mysteryProg.id,
    name: "Weeks 5–8: Intermediate",
    description: "Deepening practice through ritual, journaling, and peer study.",
    priority: 2,
    is_active: true,
  },
  // Tarot
  {
    training_id: tarotProg.id,
    name: "Major Arcana Deep Dive",
    description: "Card-by-card study of the 22 Major Arcana and their meanings.",
    priority: 1,
    is_active: true,
  },
  {
    training_id: tarotProg.id,
    name: "Spread Design & Readings",
    description: "Creating effective spreads and delivering accurate readings.",
    priority: 2,
    is_active: true,
  },
  // Social Advocacy
  {
    training_id: advocateProg.id,
    name: "Getting Started as an Advocate",
    description: "Setting up your profile, referral links, and first promotions.",
    priority: 1,
    is_active: true,
  },
]);

console.log(`✓ Inserted ${categories.length} categories`);

const [astroFund, clientComm, platformTools, msWeek1, msWeek5, majorArcana, spreadDesign, advocateStart] = categories;

// ─── 3. Training Lessons ─────────────────────────────────────────────────────

const lessons = await insert("training_lessons", [
  // Astrology Fundamentals
  {
    category_id: astroFund.id,
    title: "The 12 Zodiac Signs",
    description: "Overview of all 12 signs — element, modality, ruling planet, and key traits.",
    video_url: null,
    duration_mins: 25,
    priority: 1,
    is_active: true,
  },
  {
    category_id: astroFund.id,
    title: "The 10 Planets",
    description: "Personal vs outer planets, what each planet represents in a natal chart.",
    video_url: null,
    duration_mins: 30,
    priority: 2,
    is_active: true,
  },
  {
    category_id: astroFund.id,
    title: "The 12 Houses",
    description: "House meanings, angular vs cadent, and how houses interact with signs.",
    video_url: null,
    duration_mins: 35,
    priority: 3,
    is_active: true,
  },
  // Client Communication
  {
    category_id: clientComm.id,
    title: "Booking & Intake Process",
    description: "How to set up intake forms, manage booking confirmations, and handle no-shows.",
    video_url: null,
    duration_mins: 20,
    priority: 1,
    is_active: true,
  },
  {
    category_id: clientComm.id,
    title: "Delivering Difficult Readings",
    description: "Ethics and best practices when delivering challenging or sensitive chart information.",
    video_url: null,
    duration_mins: 40,
    priority: 2,
    is_active: true,
  },
  // Platform & Tools
  {
    category_id: platformTools.id,
    title: "Setting Up Your Diviner Profile",
    description: "Profile photo, bio, specialties, availability, and Stripe Connect setup.",
    video_url: null,
    duration_mins: 15,
    priority: 1,
    is_active: true,
  },
  // Mystery School W1–4
  {
    category_id: msWeek1.id,
    title: "Week 1 — The Call to the Mysteries",
    description: "Introduction to the lineage, setting intentions, and your first ritual.",
    video_url: null,
    duration_mins: 45,
    priority: 1,
    is_active: true,
  },
  {
    category_id: msWeek1.id,
    title: "Week 2 — Sacred Geometry Primer",
    description: "Understanding the Flower of Life, Metatron's Cube, and their applications.",
    video_url: null,
    duration_mins: 50,
    priority: 2,
    is_active: true,
  },
  // Major Arcana
  {
    category_id: majorArcana.id,
    title: "The Fool to The Chariot (0–VII)",
    description: "Cards 0 through 7 — upright and reversed meanings, imagery deep dive.",
    video_url: null,
    duration_mins: 60,
    priority: 1,
    is_active: true,
  },
  {
    category_id: majorArcana.id,
    title: "Strength to The World (VIII–XXI)",
    description: "Cards 8 through 21 — completing the Hero's Journey of the Major Arcana.",
    video_url: null,
    duration_mins: 60,
    priority: 2,
    is_active: true,
  },
  // Advocate Start
  {
    category_id: advocateStart.id,
    title: "Your Referral Link & Commission Dashboard",
    description: "How referral tracking works, where to find your stats, and payout schedule.",
    video_url: null,
    duration_mins: 15,
    priority: 1,
    is_active: true,
  },
]);

console.log(`✓ Inserted ${lessons.length} lessons`);

const [zodiacLesson, planetsLesson, housesLesson] = lessons;

// ─── 4. Training Quizzes ─────────────────────────────────────────────────────

const quizzes = await insert("training_quizzes", [
  {
    lesson_id: zodiacLesson.id,
    title: "Zodiac Signs Quiz",
    pass_score: 70,
    is_active: true,
    questions: [
      {
        question: "Which element does Aries belong to?",
        answers: [
          { text: "Fire", is_correct: true },
          { text: "Earth", is_correct: false },
          { text: "Air", is_correct: false },
          { text: "Water", is_correct: false },
        ],
      },
      {
        question: "What is the ruling planet of Scorpio?",
        answers: [
          { text: "Mars / Pluto", is_correct: true },
          { text: "Venus", is_correct: false },
          { text: "Saturn", is_correct: false },
          { text: "Jupiter", is_correct: false },
        ],
      },
      {
        question: "Which sign is associated with the 7th house by natural rulership?",
        answers: [
          { text: "Libra", is_correct: true },
          { text: "Taurus", is_correct: false },
          { text: "Aries", is_correct: false },
          { text: "Gemini", is_correct: false },
        ],
      },
    ],
  },
  {
    lesson_id: planetsLesson.id,
    title: "Planets Quiz",
    pass_score: 70,
    is_active: true,
    questions: [
      {
        question: "Which planet is known as the Greater Benefic?",
        answers: [
          { text: "Jupiter", is_correct: true },
          { text: "Venus", is_correct: false },
          { text: "Sun", is_correct: false },
          { text: "Saturn", is_correct: false },
        ],
      },
      {
        question: "Saturn is associated with which of the following?",
        answers: [
          { text: "Discipline, limits, and karma", is_correct: true },
          { text: "Love and beauty", is_correct: false },
          { text: "Communication and travel", is_correct: false },
          { text: "Expansion and luck", is_correct: false },
        ],
      },
    ],
  },
  {
    lesson_id: housesLesson.id,
    title: "Houses Quiz",
    pass_score: 75,
    is_active: true,
    questions: [
      {
        question: "The 1st house represents:",
        answers: [
          { text: "Self, identity, physical appearance", is_correct: true },
          { text: "Home and family", is_correct: false },
          { text: "Career and public image", is_correct: false },
          { text: "Partnerships and marriage", is_correct: false },
        ],
      },
      {
        question: "Which house rules career and public reputation?",
        answers: [
          { text: "10th house", is_correct: true },
          { text: "6th house", is_correct: false },
          { text: "2nd house", is_correct: false },
          { text: "8th house", is_correct: false },
        ],
      },
    ],
  },
]);

console.log(`✓ Inserted ${quizzes.length} quizzes`);
console.log("\n✅ Seed complete!");
console.log(`   ${programs.length} programs · ${categories.length} categories · ${lessons.length} lessons · ${quizzes.length} quizzes`);
