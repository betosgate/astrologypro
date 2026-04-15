import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'ms.test@astrologypro.com';
const PASS = 'MSTest2026!';

const PAGES = [
  '/mystery-school',
  '/mystery-school/training',
  '/mystery-school/training/graduation',
  '/mystery-school/training/ritual-builder',
];

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
console.error('MS user at:', page.url());

for (const path of PAGES) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const slug = path.replace(/\//g,'_').replace(/^_/,'');
  const fname = `/tmp/ss_ms2_${slug}.png`;
  await page.screenshot({ path: fname, fullPage: false });
  console.log(JSON.stringify({ path, finalUrl, fname }));
}

await browser.close();
