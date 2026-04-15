import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'pm.test@astrologypro.com';
const PASS = 'PMTest2026!';

const PAGES = [
  '/community',
  '/community/horoscope',
  '/community/family',
  '/community/events',
  '/community/training',
  '/community/rituals',
  '/community/library',
  '/community/tarot',
  '/community/decans',
  '/community/ingress-charts',
  '/community/mundane',
  '/community/profile',
  '/community/plan',
];

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
console.error('After login, at:', page.url());

for (const path of PAGES) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) { console.error('goto err:', e.message.slice(0,80)); }
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const fname = `/tmp/ss_comm_${path.replace(/\//g,'_').replace(/^_/,'')}.png`;
  await page.screenshot({ path: fname, fullPage: false });
  console.log(JSON.stringify({ path, finalUrl, fname, ok: finalUrl.includes('/community') }));
}

await browser.close();
