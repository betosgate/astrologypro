import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';

const PAGES = [
  '/',
  '/discover',
  '/blog',
  '/blog/mystery-of-the-decans-36-faces',
  '/features/walkthrough',
  '/get-started',
];

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const path of PAGES) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const slug = (path === '/' ? 'home' : path.replace(/\//g,'_').replace(/^_/,''));
  const fname = `/tmp/ss_pub_${slug}.png`;
  await page.screenshot({ path: fname, fullPage: false });
  console.log(JSON.stringify({ path, finalUrl, fname }));
}

await browser.close();
