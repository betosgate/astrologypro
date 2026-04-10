import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";

// Relative path setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, "..", "public", "walkthrough", "screenshots");

const BASE = "http://localhost:3000";

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
    email: "demo.astrologer@astrologypro.com",
    password: "DemoAstro2026!",
    screens: [
      { name: "trainee-hub", url: "/trainee", label: "Trainee Dashboard" },
      { name: "curriculum", url: "/trainee/curriculum", label: "Learning Path" },
    ],
  },
];

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
      
      await page.waitForURL((url) => url.toString().includes("localhost"), { timeout: 15000 });
      console.log(`  Logged in successfully.`);
    } catch (err) {
      console.error(`  Login failed for ${role.slug}: ${err.message}`);
      await context.close();
      return;
    }
  }

  for (const screen of role.screens) {
    try {
      console.log(`  Capturing ${screen.name}...`);
      await page.goto(`${BASE}${screen.url}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(4000); // Wait for animations/data

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

  for (const role of roles) {
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
