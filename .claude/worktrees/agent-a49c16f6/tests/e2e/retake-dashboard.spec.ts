import { test } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.join(__dirname, "../../public/screenshots");

async function screenshot(page: any, name: string) {
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  });
  console.log(`  Captured: ${name}.png`);
}

test("retake all dashboard screenshots with proper login", async ({ page }) => {
  // Step 1: Login as demo diviner
  await page.goto("/login");
  await page.waitForTimeout(2000);

  // Fill diviner login form
  await page.locator('input[id="diviner-email"]').fill("demo.astrologer@astrologypro.com");
  await page.locator('input[id="diviner-password"]').fill("DemoAstro2026!");
  await page.locator('button[type="submit"]').first().click();

  // Wait for redirect to dashboard
  await page.waitForTimeout(5000);

  // Check if we landed on dashboard or got redirected somewhere
  const url = page.url();
  console.log("After login, URL:", url);

  // If we're on the dashboard, take screenshots
  if (url.includes("/dashboard") || url.includes("/onboarding")) {
    // Dashboard overview
    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    await screenshot(page, "19-dashboard-overview");

    // Bookings
    await page.goto("/dashboard/bookings");
    await page.waitForTimeout(3000);
    await screenshot(page, "20-dashboard-bookings");

    // Clients
    await page.goto("/dashboard/clients");
    await page.waitForTimeout(3000);
    await screenshot(page, "21-dashboard-clients");

    // Services
    await page.goto("/dashboard/services");
    await page.waitForTimeout(3000);
    await screenshot(page, "22-dashboard-services");

    // Profile
    await page.goto("/dashboard/profile");
    await page.waitForTimeout(3000);
    await screenshot(page, "23-dashboard-profile");

    // Settings
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    await screenshot(page, "24-dashboard-settings");

    // Testimonials
    await page.goto("/dashboard/testimonials");
    await page.waitForTimeout(3000);
    await screenshot(page, "25-dashboard-testimonials");

    // Affiliates
    await page.goto("/dashboard/affiliates");
    await page.waitForTimeout(3000);
    await screenshot(page, "26-dashboard-affiliates");

    // Marketing
    await page.goto("/dashboard/marketing");
    await page.waitForTimeout(3000);
    await screenshot(page, "27-dashboard-marketing");

    // Live
    await page.goto("/dashboard/live");
    await page.waitForTimeout(3000);
    await screenshot(page, "28-dashboard-live");

    // Analytics
    await page.goto("/dashboard/analytics");
    await page.waitForTimeout(3000);
    await screenshot(page, "34-dashboard-analytics");

    // Calendar
    await page.goto("/dashboard/calendar");
    await page.waitForTimeout(3000);
    await screenshot(page, "35-dashboard-calendar");
  } else {
    console.log("Login may have failed or redirected to:", url);
    await screenshot(page, "login-result");
  }
});

test("retake public page screenshots", async ({ page }) => {
  // Landing pages with new theme
  await page.goto("/mystic-maya");
  await page.waitForTimeout(3000);
  await screenshot(page, "14-landing-hero");

  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(1000);
  await screenshot(page, "15-landing-services");

  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(1000);
  await screenshot(page, "16-landing-testimonials");

  // Booking page
  await page.goto("/mystic-maya/book/natal-chart");
  await page.waitForTimeout(3000);
  await screenshot(page, "18-booking-start");

  // Discover page
  await page.goto("/discover");
  await page.waitForTimeout(3000);
  await screenshot(page, "31-discover-page");
});
