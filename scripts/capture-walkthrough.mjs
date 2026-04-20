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

async function resolveFirstTraineeTrainingHref(page, entity) {
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

  const program =
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

async function navigateForScreen(page, screen) {
  if (typeof screen.resolveUrl === "function") {
    const resolved = await screen.resolveUrl(page);
    if (!resolved) return null;
    await page.goto(resolved, { waitUntil: "networkidle", timeout: 30000 });
    await waitForStableView(page, 3000);
    if (page.url().includes("/login")) {
      throw new Error(`Navigation for ${screen.name} resolved to login page`);
    }
    return resolved;
  }

  await page.goto(`${BASE}${screen.url}`, { waitUntil: "networkidle", timeout: 30000 });
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
        resolveUrl: async (page) => resolveFirstTraineeTrainingHref(page, "program"),
      },
      {
        name: "lesson-detail",
        label: "Lesson Viewer",
        resolveUrl: async (page) => resolveFirstTraineeTrainingHref(page, "lesson"),
      },
      { name: "progress", url: "/trainee/progress", label: "Progress Tracker" },
      { name: "quiz-history", url: "/trainee/quiz-history", label: "Quiz History" },
      { name: "resources", url: "/trainee/resources", label: "Learning Resources" },
      { name: "sessions", url: "/trainee/sessions", label: "Practice Sessions" },
      { name: "graduation", url: "/trainee/training/graduation", label: "Graduation Readiness" },
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

  if (role.email) {
    console.log(`  Logging in as ${role.slug} (${role.email})...`);
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', role.password);
      await page.click('button[type="submit"]');

      const sessionReady = await waitForAuthSession(context, 15000);
      if (!sessionReady) {
        throw new Error("Auth session cookie was not established after login");
      }

      await page.waitForTimeout(1500);
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
