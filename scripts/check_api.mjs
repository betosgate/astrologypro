import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'pm.test@astrologypro.com';
const PASS = 'PMTest2026!';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

// Check the API
const result = await page.evaluate(async () => {
  const r = await fetch('/api/community/plan');
  const body = await r.json();
  return { 
    status: r.status, 
    hasStatus: 'status' in (body.plan ?? {}),
    hasMembershipStatus: 'membership_status' in (body.plan ?? {}),
    hasMemberCount: 'member_count' in (body.plan ?? {}),
    hasCurrentMembers: 'current_members' in (body.plan ?? {}),
    tierFields: body.plan?.tier ? Object.keys(body.plan.tier) : [],
  };
});
console.log(JSON.stringify(result, null, 2));

await browser.close();
