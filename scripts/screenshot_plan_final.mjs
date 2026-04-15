import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';
const EMAIL = 'pm.test@astrologypro.com';
const PASS = 'PMTest2026!';

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

await page.goto(`${BASE}/community/plan`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(5000);
const fname = `/tmp/ss_plan_final.png`;
await page.screenshot({ path: fname, fullPage: false });
console.log('URL:', page.url(), 'File:', fname);

await browser.close();
