import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";

// Relative path setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = process.env.WALKTHROUGH_SCREENSHOT_DIR
  ? path.resolve(process.env.WALKTHROUGH_SCREENSHOT_DIR)
  : path.join(__dirname, "..", "public", "walkthrough", "screenshots");

const BASE = "http://localhost:3000";

async function waitForAuthSession(context, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(
      (cookie) =>
        cookie.name.includes("auth-token") ||
        (cookie.name.startsWith("sb-") && cookie.domain.includes("localhost")),
    );
    if (hasAuthCookie) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function waitForStableView(page, ms = 2500) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function gotoWalkthroughPage(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("ERR_ABORTED")) throw err;
    await page.waitForTimeout(1000);
    if (!page.url().startsWith(url)) throw err;
  }
}

async function scrollToVisibleText(page, text, options = {}) {
  const locator = page.getByText(text, { exact: options.exact ?? true }).last();
  await locator.waitFor({ state: "visible", timeout: options.timeout ?? 15000 });
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(options.waitMs ?? 1000);
}

async function selectTrainingAnalyticsTab(page, tabName) {
  await page.getByRole("tab", { name: tabName }).click();
  await waitForStableView(page, 6000);
}

async function resolveFirstTrainingEditHref(page, entity) {
  const config = {
    program: {
      api: "/api/admin/training/programs?pageSize=100",
      listKey: "programs",
      buildHref: (item) => `/admin/training/programs/${item.id}/edit`,
      score: (item) => {
        const text = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();
        let score = 0;
        if (item.is_active) score += 10;
        if (!text.includes("test")) score += 8;
        if (!text.includes("sanket")) score += 6;
        if (text.includes("foundation")) score += 5;
        if (text.includes("astrology")) score += 5;
        return score;
      },
    },
    category: {
      api: "/api/admin/training/categories?pageSize=100",
      listKey: "categories",
      buildHref: (item) => `/admin/training/categories/${item.id}/edit`,
      score: (item) => {
        const text = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();
        let score = 0;
        if (item.is_active) score += 10;
        if (!text.includes("test")) score += 8;
        if (!text.includes("sanket")) score += 6;
        if (text.includes("foundation")) score += 5;
        if (text.includes("astrology")) score += 5;
        return score;
      },
    },
    lesson: {
      api: "/api/admin/training/lessons?pageSize=100",
      listKey: "lessons",
      buildHref: (item) => `/admin/training/lessons/${item.id}/edit`,
      score: (item) => {
        const text = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase();
        let score = 0;
        if (item.is_active) score += 10;
        if (item.video_url) score += 6;
        if (!text.includes("test")) score += 8;
        if (text.includes("astrology")) score += 4;
        if (text.includes("spread")) score += 3;
        if (text.includes("major arcana")) score += 3;
        return score;
      },
    },
    quiz: {
      api: "/api/admin/training/quizzes?pageSize=100",
      listKey: "quizzes",
      buildHref: (item) => `/admin/training/quizzes/${item.id}/edit`,
      score: (item) => {
        const text = `${item.title ?? ""} ${item.lesson_title ?? ""}`.toLowerCase();
        let score = 0;
        if (item.is_active) score += 10;
        if (Array.isArray(item.questions) && item.questions.length > 0) score += 6;
        if (!text.includes("test")) score += 8;
        if (text.includes("profile")) score += 3;
        if (text.includes("mysteries")) score += 3;
        if (text.includes("sacred geometry")) score += 3;
        return score;
      },
    },
  }[entity];

  if (!config) return null;

  const result = await page.evaluate(async ({ api, listKey }) => {
    const res = await fetch(api, { credentials: "include" });
    if (!res.ok) return { ok: false, status: res.status, items: [] };
    const json = await res.json();
    return { ok: true, status: res.status, items: json[listKey] ?? [] };
  }, { api: config.api, listKey: config.listKey });

  if (!result.ok || !result.items.length) return null;

  const best = [...result.items].sort((a, b) => config.score(b) - config.score(a))[0];
  return `${BASE}${config.buildHref(best)}`;
}

async function resolveFirstTraineeTrainingHref(page, entity, options = {}) {
  const result = await page.evaluate(async () => {
    const res = await fetch("/api/trainee/training/programs", {
      credentials: "include",
    });
    if (!res.ok) return { ok: false, programs: [] };
    const json = await res.json();
    return { ok: true, programs: json.programs ?? [] };
  });

  if (!result.ok || !result.programs.length) return null;

  const sortedPrograms = [...result.programs].sort((a, b) => {
    const aStarted = a.completed_lessons > 0 || a.progress_pct > 0 ? 1 : 0;
    const bStarted = b.completed_lessons > 0 || b.progress_pct > 0 ? 1 : 0;
    if (aStarted !== bStarted) return bStarted - aStarted;
    return (a.priority ?? 0) - (b.priority ?? 0);
  });

  const preferredProgramName = options.programName?.toLowerCase();
  const preferredProgram = preferredProgramName
    ? sortedPrograms.find((item) =>
        `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase().includes(preferredProgramName),
      )
    : null;

  const program =
    (preferredProgram && Array.isArray(preferredProgram.categories) && preferredProgram.categories.length > 0
      ? preferredProgram
      : null) ??
    sortedPrograms.find((item) => Array.isArray(item.categories) && item.categories.length > 0) ??
    sortedPrograms[0];
  if (!program?.id) return null;

  if (entity === "program") {
    return `${BASE}/trainee/training/${program.id}`;
  }

  const categories = Array.isArray(program.categories) ? program.categories : [];
  const category =
    categories.find((item) => !item.is_locked && Array.isArray(item.lessons) && item.lessons.length > 0) ??
    categories.find((item) => Array.isArray(item.lessons) && item.lessons.length > 0);
  if (!category?.id) return `${BASE}/trainee/training/${program.id}`;

  if (entity === "category") {
    return `${BASE}/trainee/training/${program.id}/${category.id}`;
  }

  const lessons = Array.isArray(category.lessons) ? category.lessons : [];
  const lesson =
    lessons.find((item) => !item.is_locked && !item.completed) ??
    lessons.find((item) => !item.is_locked) ??
    lessons[0];
  if (!lesson?.id) return `${BASE}/trainee/training/${program.id}/${category.id}`;

  return `${BASE}/trainee/training/${program.id}/${category.id}/${lesson.id}`;
}

async function resolveTraineeCertificateHref(page) {
  await page.goto(`${BASE}/trainee/certificate`, { waitUntil: "networkidle", timeout: 30000 });
  await waitForStableView(page, 3000);

  return page.url().includes("/trainee/certificate") ? page.url() : null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findTraineeLessonWithQuiz(page) {
  return page.evaluate(async () => {
    const programId = window.location.pathname.split("/").filter(Boolean)[2];
    if (!programId) return null;

    const programsRes = await fetch("/api/trainee/training/programs", {
      credentials: "include",
    });
    if (!programsRes.ok) return null;

    const programsJson = await programsRes.json();
    const programs = Array.isArray(programsJson.programs) ? programsJson.programs : [];
    const program = programs.find((item) => item.id === programId);
    if (!program || !Array.isArray(program.categories)) return null;

    const candidates = [];
    const categories = [...program.categories].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    for (const category of categories) {
      if (category.is_locked || !Array.isArray(category.lessons)) continue;
      const lessons = [...category.lessons].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      for (const lesson of lessons) {
        if (lesson.is_locked) continue;
        const lessonRes = await fetch(`/api/trainee/training/lessons/${lesson.id}`, {
          credentials: "include",
        });
        if (!lessonRes.ok) continue;

        const lessonJson = await lessonRes.json();
        const detail = lessonJson.lesson ?? {};
        const quizQuestions = Array.isArray(detail.quiz_questions) ? detail.quiz_questions : [];
        if (quizQuestions.length === 0) continue;

        const videoUrls = [
          detail.video_url,
          ...(Array.isArray(detail.videos) ? detail.videos.map((video) => video.video_url) : []),
        ].filter(Boolean);
        const hasEmbedVideo = videoUrls.some((url) => /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(String(url)));

        candidates.push({
          categoryName: category.name,
          lessonTitle: lesson.title,
          quizCount: quizQuestions.length,
          hasEmbedVideo,
          lessonPriority: lesson.priority ?? 0,
          completed: lesson.completed === true,
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.hasEmbedVideo !== b.hasEmbedVideo) return a.hasEmbedVideo ? -1 : 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.lessonPriority - b.lessonPriority;
    });

    return candidates[0] ?? null;
  });
}

async function revealTraineeLessonQuiz(page) {
  const target = await findTraineeLessonWithQuiz(page);
  if (target?.categoryName) {
    const categoryButton = page
      .getByRole("button")
      .filter({ hasText: new RegExp(escapeRegExp(target.categoryName), "i") })
      .first();
    await categoryButton.click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  if (target?.lessonTitle) {
    const quizAlreadyLoaded = await page
      .getByText("Lesson Quiz", { exact: true })
      .last()
      .isVisible()
      .catch(() => false);

    if (!quizAlreadyLoaded) {
      const lessonButton = page
        .getByRole("button")
        .filter({ hasText: new RegExp(escapeRegExp(target.lessonTitle), "i") })
        .first();
      await lessonButton.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }

  const quizHeading = page.getByText("Lesson Quiz", { exact: true }).last();
  await quizHeading.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  if (!(await quizHeading.isVisible().catch(() => false))) {
    console.log("  ↷ Lesson quiz was not visible for program-workspace; capturing current workspace state");
    return;
  }
  await quizHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
}

async function navigateForScreen(page, screen) {
  if (typeof screen.resolveUrl === "function") {
    const resolved = await screen.resolveUrl(page);
    if (!resolved) return null;
    await gotoWalkthroughPage(page, resolved);
    await waitForStableView(page, 3000);
    if (page.url().includes("/login")) {
      throw new Error(`Navigation for ${screen.name} resolved to login page`);
    }
    return resolved;
  }

  await gotoWalkthroughPage(page, `${BASE}${screen.url}`);
  await waitForStableView(page, 3000);
  if (page.url().includes("/login")) {
    throw new Error(`Navigation for ${screen.name} resolved to login page`);
  }
  return `${BASE}${screen.url}`;
}

/**
 * ROLE MAPPINGS & DATA
 */
const roles = [
  {
    slug: "admin",
    email: "admin@astrologypro.com",
    password: "Admin@AstroPro2026!",
    screens: [
      { name: "admin-home", url: "/admin", label: "Executive Dashboard" },
      { name: "user-mgmt", url: "/admin/users", label: "User Directory" },
      { name: "commerce", url: "/admin/orders", label: "Commerce Hub" },
      { name: "mundane", url: "/admin/mundane-dashboard", label: "Mundane Studio" },
      { name: "mystery-school", url: "/admin/mystery-school", label: "Mystery School Admin" },
      { name: "audit", url: "/admin/activity-log", label: "Audit Trails" },
      { name: "training_lessons", url: "/admin/training", label: "Training Hub" },
      {
        name: "quiz-bank-admin",
        url: "/admin/training",
        label: "Quiz Bank",
        afterNavigate: async (page) => scrollToVisibleText(page, "Quizzes"),
      },
      { name: "training_program_new", url: "/admin/training/programs/new", label: "Create Training Program" },
      {
        name: "training-program-detail",
        label: "Training Program Detail",
        resolveUrl: async (page) => resolveFirstTrainingEditHref(page, "program"),
      },
      { name: "training_category_new", url: "/admin/training/categories/new", label: "Create Training Category" },
      {
        name: "training-category-detail",
        label: "Training Category Detail",
        resolveUrl: async (page) => resolveFirstTrainingEditHref(page, "category"),
      },
      { name: "training_lesson_new", url: "/admin/training/lessons/new", label: "Create Training Lesson" },
      {
        name: "training_lesson_edit",
        label: "Lesson Edit & Asset Review",
        resolveUrl: async (page) => resolveFirstTrainingEditHref(page, "lesson"),
      },
      { name: "training_quiz_new", url: "/admin/training/quizzes/new", label: "Create Lesson Quiz" },
      {
        name: "quiz-detail-admin",
        label: "Quiz Detail",
        resolveUrl: async (page) => resolveFirstTrainingEditHref(page, "quiz"),
      },
      { name: "ai-quiz-generator", url: "/admin/training/quiz-generate", label: "AI Quiz Generator" },
      { name: "training_analytics", url: "/admin/training/analytics", label: "Training Analytics" },
      {
        name: "trainee-quiz-scores",
        url: "/admin/training/analytics",
        label: "Trainee Quiz Scores",
        afterNavigate: async (page) => selectTrainingAnalyticsTab(page, "Users"),
      },
      { name: "training_settings", url: "/admin/training/settings", label: "Training Settings" },
      { name: "certificate-config", url: "/admin/certificate-config", label: "Certificate Config" },
      { name: "tabbie-appointment-config", url: "/admin/tabbie-appointment", label: "Tabbie Appointment Config" },
      { name: "tabbie-appointment-monitor", url: "/admin/trainee-tabbie-appointments", label: "Tabbie Appointment Monitor" },
    ],
  },
  {
    slug: "public",
    email: null,
    screens: [
      { name: "home", url: "/", label: "Homepage" },
      { name: "discover", url: "/discover", label: "Diviner Discovery" },
      { name: "profile", url: "/discover", label: "Practitioner Profile" },
      { name: "checkout", url: "/discover", label: "Booking Checkout" },
      { name: "blog", url: "/blog", label: "Blog Index" },
      { name: "join", url: "/join", label: "Registration Hub" },
    ],
  },
  {
    slug: "customer",
    email: "sarah.johnson@example.com",
    password: "ClientTest2026!",
    screens: [
      { name: "dashboard", url: "/portal", label: "Customer Dashboard" },
      { name: "bookings", url: "/portal/bookings", label: "My Bookings" },
      { name: "orders", url: "/portal/orders", label: "Order History" },
      { name: "profile", url: "/portal/profile", label: "User Profile" },
    ],
  },
  {
    slug: "community",
    email: "emma.garcia@example.com",
    password: "ClientTest2026!",
    screens: [
      { name: "hub", url: "/community", label: "Community Hub" },
      { name: "natal", url: "/community/horoscope", label: "Natal Chart Studio" },
      { name: "transits", url: "/community/transits", label: "Monthly Transits" },
      { name: "sunday", url: "/community/sunday-service", label: "Sunday Service" },
      { name: "rituals", url: "/community/rituals", label: "Ritual Path" },
    ],
  },
  {
    slug: "mystery-school",
    email: "emma.garcia@example.com",
    password: "ClientTest2026!",
    screens: [
      { name: "decans", url: "/mystery-school", label: "Decans Grid" },
      { name: "center", url: "/mystery-school/training", label: "Training Center" },
      { name: "lesson", url: "/mystery-school/training", label: "Lesson View" },
      { name: "builder", url: "/mystery-school/training/ritual-builder", label: "Ritual Builder" },
    ],
  },
  {
    slug: "diviner",
    email: "demo.astrologer@astrologypro.com",
    password: "DemoAstro2026!",
    screens: [
      { name: "overview", url: "/dashboard", label: "Practitioner CRM" },
      { name: "calendar", url: "/dashboard/bookings", label: "Session Calendar" },
      { name: "client-detail", url: "/dashboard/clients", label: "Client Spiritual Twin" },
      { name: "broadcast", url: "/dashboard/live", label: "Live Hub" },
      { name: "payouts", url: "/dashboard/billing", label: "Billing & Payouts" },
    ],
  },
  {
    slug: "social_advo",
    email: "demo.astrologer@astrologypro.com",
    password: "DemoAstro2026!",
    screens: [
      { name: "advocate-home", url: "/advocate", label: "Advocacy Dashboard" },
      { name: "payouts", url: "/advocate/earnings", label: "Earnings Log" },
    ],
  },
  {
    slug: "trainee",
    email: "trainee4@test.astrologypro.com",
    password: "TestUser123!",
    screens: [
      { name: "trainee-hub", url: "/trainee", label: "Trainee Dashboard" },
      { name: "training-center", url: "/trainee/training", label: "Training Center" },
      {
        name: "program-workspace",
        label: "Program Workspace",
        resolveUrl: async (page) =>
          resolveFirstTraineeTrainingHref(page, "program", { programName: "Tarot Mastery Track" }),
        afterNavigate: async (page) => revealTraineeLessonQuiz(page),
      },
      { name: "progress", url: "/trainee/progress", label: "Progress Tracker" },
      { name: "quiz-history", url: "/trainee/quiz-history", label: "Quiz History" },
      { name: "resources", url: "/trainee/resources", label: "Learning Resources" },
      { name: "sessions", url: "/trainee/sessions", label: "Practice Sessions" },
      { name: "graduation", url: "/trainee/training/graduation", label: "Graduation Readiness" },
      {
        name: "certificate",
        label: "Certificate of Completion",
        resolveUrl: async (page) => resolveTraineeCertificateHref(page),
      },
      { name: "trainee-profile", url: "/trainee/profile", label: "Trainee Profile" },
    ],
  },
];

const roleFilter = process.env.WALKTHROUGH_ROLE?.trim();
const screenFilter = new Set(
  (process.env.WALKTHROUGH_SCREENS ?? "")
    .split(",")
    .map((screen) => screen.trim())
    .filter(Boolean),
);
const rolesToCapture = roleFilter
  ? roles.filter((role) => role.slug === roleFilter)
  : roles;

async function captureRole(browser, role) {
  const roleDir = path.join(screenshotDir, role.slug);
  if (!existsSync(roleDir)) {
    mkdirSync(roleDir, { recursive: true });
  }

  const context = await browser.newContext({ 
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark'
  });
  
  const page = await context.newPage();

  const loginEmail = process.env.WALKTHROUGH_EMAIL?.trim() || role.email;
  const loginPassword = process.env.WALKTHROUGH_PASSWORD || role.password;

  if (loginEmail) {
    console.log(`  Logging in as ${role.slug} (${loginEmail})...`);
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', loginEmail);
      await page.fill('input[type="password"]', loginPassword);
      await page.click('button[type="submit"]');

      const sessionReady = await waitForAuthSession(context, 15000);
      if (!sessionReady) {
        throw new Error("Auth session cookie was not established after login");
      }

      const landingScreen = role.screens.find((screen) => typeof screen.url === "string");
      if (landingScreen) {
        await gotoWalkthroughPage(page, `${BASE}${landingScreen.url}`);
        await waitForStableView(page, 1500);
      } else {
        await page.waitForTimeout(1500);
      }
      console.log(`  Logged in successfully.`);
    } catch (err) {
      console.error(`  Login failed for ${role.slug}: ${err.message}`);
      await context.close();
      return;
    }
  }

  const screensToCapture = screenFilter.size
    ? role.screens.filter((screen) => screenFilter.has(screen.name))
    : role.screens;

  for (const screen of screensToCapture) {
    try {
      console.log(`  Capturing ${screen.name}...`);
      const resolved = await navigateForScreen(page, screen);
      if (!resolved) {
        console.log(`  ↷ Skipped ${screen.name} (no capturable route/data available)`);
        continue;
      }
      if (typeof screen.afterNavigate === "function") {
        await screen.afterNavigate(page);
      }

      const filePath = path.join(roleDir, `${screen.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  ✓ Saved to ${role.slug}/${screen.name}.png`);
    } catch (err) {
      console.error(`  ✗ Failed to capture ${screen.name}: ${err.message}`);
    }
  }

  await context.close();
}

async function main() {
  console.log("==============================================");
  console.log("  AstrologyPro Walkthrough Capture System");
  console.log("  Target: Flagship Admin Update");
  console.log("==============================================\n");

  const browser = await chromium.launch({ headless: true });

  for (const role of rolesToCapture) {
    console.log(`\n[${role.slug.toUpperCase()}]`);
    await captureRole(browser, role);
  }

  await browser.close();
  console.log("\n==============================================");
  console.log("  Done! All walkthrough images captured.");
  console.log("==============================================");
}

main().catch((err) => {
  console.error("\nFATAL ERROR:", err);
  process.exit(1);
});
