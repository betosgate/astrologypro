import { test } from "@playwright/test";
import path from "path";

const DIR = path.join(__dirname, "../../public/screenshots");

async function snap(page: any, name: string) {
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false });
  console.log(`  ${name}.png`);
}

test("take specific tab screenshots", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.waitForTimeout(1500);
  await page.locator('input[id="diviner-email"]').fill("demo.astrologer@astrologypro.com");
  await page.locator('input[id="diviner-password"]').fill("DemoAstro2026!");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  console.log("Logged in, URL:", page.url());

  // Settings page - click each tab by value attribute
  await page.goto("/dashboard/settings");
  await page.waitForTimeout(3000);

  // Phone tab
  const phoneTab = page.locator('[value="phone"]');
  if (await phoneTab.count() > 0) {
    await phoneTab.click();
    await page.waitForTimeout(2000);
    await snap(page, "36-settings-phone");
    console.log("  Phone tab captured");
  } else {
    console.log("  Phone tab not found by value selector");
    await snap(page, "36-settings-phone");
  }

  // Loyalty tab
  const loyaltyTab = page.locator('[value="loyalty"]');
  if (await loyaltyTab.count() > 0) {
    await loyaltyTab.click();
    await page.waitForTimeout(2000);
    await snap(page, "37-settings-loyalty");
    console.log("  Loyalty tab captured");
  } else {
    console.log("  Loyalty tab not found");
    await snap(page, "37-settings-loyalty");
  }

  // Payments tab (Connect Stripe status)
  const paymentsTab = page.locator('[value="payments"]');
  if (await paymentsTab.count() > 0) {
    await paymentsTab.click();
    await page.waitForTimeout(2000);
    await snap(page, "38-settings-payments");
    console.log("  Payments tab captured");
  }

  // Calendar tab
  const calTab = page.locator('[value="calendar"]');
  if (await calTab.count() > 0) {
    await calTab.click();
    await page.waitForTimeout(2000);
    await snap(page, "42-settings-calendar");
  }

  // Bookings - show the completed sessions
  await page.goto("/dashboard/bookings");
  await page.waitForTimeout(3000);
  await snap(page, "20-dashboard-bookings");

  // Try to open a booking detail
  const viewButtons = page.locator('button').filter({ hasText: /view|detail|prepare/i });
  const count = await viewButtons.count();
  console.log(`  Found ${count} action buttons on bookings`);
  if (count > 0) {
    await viewButtons.first().click();
    await page.waitForTimeout(2000);
    await snap(page, "39-session-prep");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  // Testimonials with data
  await page.goto("/dashboard/testimonials");
  await page.waitForTimeout(3000);
  await snap(page, "25-dashboard-testimonials");

  // Clients with data
  await page.goto("/dashboard/clients");
  await page.waitForTimeout(3000);
  await snap(page, "21-dashboard-clients");
});
