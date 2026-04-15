import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'admin.test@astrologypro.com';
const PASS = 'AdminTest2026!';

const PAGES = [
  '/admin/mundane/entities',
  '/admin/mundane/forecasts',
  '/admin/mundane/research',
  '/admin/mundane/search',
  '/admin/mundane/alerts',
  '/admin/reports',
  '/admin/reports/finance-ops',
  '/admin/horoscope',
  '/admin/tarot/cards',
  '/admin/tarot/spreads',
  '/admin/calendar',
  '/admin/ingress-charts',
  '/admin/testimonials',
  '/admin/certificate-config',
  '/admin/mystery-school/decans',
];

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
console.error('Admin at:', page.url());

for (const path of PAGES) {
  // Navigate fresh each time with full page reload
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) { console.error('nav err:', e.message.slice(0,60)); }
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const slug = path.replace(/\//g,'_').replace(/^_/,'');
  const fname = `/tmp/ss_admin2_${slug}.png`;
  await page.screenshot({ path: fname, fullPage: false });
  console.log(JSON.stringify({ path, finalUrl, fname }));
}

await browser.close();
