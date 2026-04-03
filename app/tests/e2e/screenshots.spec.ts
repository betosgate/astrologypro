import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.join(__dirname, "../../public/screenshots");

// Helper to take a named screenshot
async function screenshot(page: any, name: string) {
  await page.waitForTimeout(2000); // Let page render
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

// ============================================================
// PUBLIC PAGES
// ============================================================

test.describe("Marketing Site", () => {
  test("homepage", async ({ page }) => {
    await page.goto("/");
    await screenshot(page, "01-homepage-hero");

    // Scroll to features
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(300);
    await screenshot(page, "02-homepage-features");

    // Scroll to revenue calculator
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(300);
    await screenshot(page, "03-homepage-calculator");

    // Scroll to pricing
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(300);
    await screenshot(page, "04-homepage-pricing");
  });

  test("features page", async ({ page }) => {
    await page.goto("/features");
    await screenshot(page, "05-features-hero");

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);
    await screenshot(page, "06-features-detail");
  });

  test("pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await screenshot(page, "07-pricing-page");

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);
    await screenshot(page, "08-pricing-comparison");
  });

  test("demo page", async ({ page }) => {
    await page.goto("/demo");
    await screenshot(page, "09-demo-page");
  });

  test("instructions page", async ({ page }) => {
    await page.goto("/instructions");
    await screenshot(page, "10-instructions-hero");
  });
});

// ============================================================
// AUTH PAGES
// ============================================================

test.describe("Auth", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await screenshot(page, "11-login-diviner");

    // Click client tab
    const clientTab = page.getByRole("tab", { name: /client/i });
    if (await clientTab.isVisible()) {
      await clientTab.click();
      await page.waitForTimeout(300);
      await screenshot(page, "12-login-client");
    }
  });

  test("signup page", async ({ page }) => {
    await page.goto("/get-started");
    await screenshot(page, "13-signup-page");
  });
});

// ============================================================
// DIVINER LANDING PAGE
// ============================================================

test.describe("Diviner Landing Pages", () => {
  test("mystic-maya landing page", async ({ page }) => {
    await page.goto("/mystic-maya");
    await screenshot(page, "14-landing-hero");

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);
    await screenshot(page, "15-landing-services");

    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(300);
    await screenshot(page, "16-landing-testimonials");
  });

  test("luna-readings landing page", async ({ page }) => {
    await page.goto("/luna-readings");
    await screenshot(page, "17-landing-tarot");
  });

  test("booking flow", async ({ page }) => {
    await page.goto("/mystic-maya/book/natal-chart");
    await screenshot(page, "18-booking-start");
  });
});

// ============================================================
// DASHBOARD (requires login)
// ============================================================

test.describe("Diviner Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo diviner
    await page.goto("/login");
    await page.fill('input[id="diviner-email"]', "demo.astrologer@astrologypro.com");
    await page.fill('input[id="diviner-password"]', "DemoAstro2026!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test("dashboard overview", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);
    await screenshot(page, "19-dashboard-overview");
  });

  test("dashboard bookings", async ({ page }) => {
    await page.goto("/dashboard/bookings");
    await page.waitForTimeout(1000);
    await screenshot(page, "20-dashboard-bookings");
  });

  test("dashboard clients", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await page.waitForTimeout(1000);
    await screenshot(page, "21-dashboard-clients");
  });

  test("dashboard services", async ({ page }) => {
    await page.goto("/dashboard/services");
    await page.waitForTimeout(1000);
    await screenshot(page, "22-dashboard-services");
  });

  test("dashboard profile", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForTimeout(1000);
    await screenshot(page, "23-dashboard-profile");
  });

  test("dashboard settings", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(1000);
    await screenshot(page, "24-dashboard-settings");
  });

  test("dashboard testimonials", async ({ page }) => {
    await page.goto("/dashboard/testimonials");
    await page.waitForTimeout(1000);
    await screenshot(page, "25-dashboard-testimonials");
  });

  test("dashboard affiliates", async ({ page }) => {
    await page.goto("/dashboard/affiliates");
    await page.waitForTimeout(1000);
    await screenshot(page, "26-dashboard-affiliates");
  });

  test("dashboard marketing", async ({ page }) => {
    await page.goto("/dashboard/marketing");
    await page.waitForTimeout(1000);
    await screenshot(page, "27-dashboard-marketing");
  });

  test("dashboard live", async ({ page }) => {
    await page.goto("/dashboard/live");
    await page.waitForTimeout(1000);
    await screenshot(page, "28-dashboard-live");
  });
});

// ============================================================
// ONBOARDING
// ============================================================

test.describe("Onboarding", () => {
  test("onboarding page", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(1000);
    await screenshot(page, "29-onboarding");
  });
});

// ============================================================
// CLIENT PORTAL
// ============================================================

test.describe("Client Portal", () => {
  test("portal login and pages", async ({ page }) => {
    // Try to access portal directly
    await page.goto("/portal");
    await page.waitForTimeout(1000);
    await screenshot(page, "30-portal");
  });
});
