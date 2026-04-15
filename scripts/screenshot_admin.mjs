import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'admin.test@astrologypro.com';
const PASS = 'AdminTest2026!';

const PAGES = [
  '/admin',
  '/admin/users',
  '/admin/diviners',
  '/admin/bookings',
  '/admin/orders',
  '/admin/campaigns',
  '/admin/affiliates',
  '/admin/training',
  '/admin/blog',
  '/admin/mystery-school',
  '/admin/mystery-school/students',
  '/admin/mystery-school/decans',
  '/admin/mundane',
  '/admin/mundane/entities',
  '/admin/mundane/forecasts',
  '/admin/reports',
  '/admin/reports/finance-ops',
  '/admin/horoscope',
  '/admin/tarot/cards',
  '/admin/tarot/spreads',
  '/admin/calendar',
  '/admin/ingress-charts',
  '/admin/testimonials',
  '/admin/certificate-config',
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
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await page.waitForTimeout(2000);
  const finalUrl = page.url();
  const slug = path.replace(/\//g,'_').replace(/^_/,'');
  const fname = `/tmp/ss_admin_${slug}.png`;
  await page.screenshot({ path: fname, fullPage: false });
  console.log(JSON.stringify({ path, finalUrl, fname, ok: finalUrl.includes('/admin') }));
}

await browser.close();
