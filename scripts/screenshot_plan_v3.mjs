import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'pm.test@astrologypro.com';
const PASS = 'PMTest2026!';

const browser = await chromium.launch({ channel: 'chrome', headless: false });
// Fresh context — no cached session
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login fresh
await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
console.error('Logged in at:', page.url());

// Force-reload to skip any CDN/edge cache
await page.goto(`${BASE}/community/plan`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(()=>{});
// Wait enough for React to mount + fetch + re-render
await page.waitForTimeout(5000);
const fname = `/tmp/ss_plan_v3_${Date.now()}.png`;
await page.screenshot({ path: fname, fullPage: false });
console.log('URL:', page.url(), 'File:', fname);

// Also check the raw API response
const apiRes = await page.evaluate(async () => {
  const r = await fetch('/api/community/plan');
  return { status: r.status, body: await r.json() };
});
console.log('API response:', JSON.stringify(apiRes));

await browser.close();
