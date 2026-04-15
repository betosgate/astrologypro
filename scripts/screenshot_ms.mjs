import { chromium } from 'playwright-core';

const BASE = 'https://astrologypro.com';

// Mystery School - need a MS user. Let's try the admin first to see if there's MS access
// Actually, let me check if pm.test also has mystery school
// From memory: pm.test has community_members active (PM), also has clients row
// Let me try - if redirect to /mystery-school/enroll it means no MS access

const USERS = [
  { email: 'admin.test@astrologypro.com', pass: 'AdminTest2026!', route: '/mystery-school' },
  { email: 'trainee.test@astrologypro.com', pass: 'TraineeTest2026!', route: '/trainee' },
];

const MS_PAGES = [
  '/mystery-school',
  '/mystery-school/decans',
  '/mystery-school/rituals',
  '/mystery-school/center',
  '/mystery-school/training',
  '/mystery-school/journals',
];

const TRAINEE_PAGES = [
  '/trainee',
  '/trainee/curriculum',
  '/trainee/progress',
  '/trainee/quiz-history',
  '/trainee/resources',
  '/trainee/sessions',
  '/trainee/graduation',
];

const browser = await chromium.launch({ channel: 'chrome', headless: false });

// Admin user → try mystery school pages
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', USERS[0].email);
  await page.fill('input[type="password"]', USERS[0].pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.error('Admin logged in at:', page.url());

  for (const path of MS_PAGES) {
    try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
    await page.waitForTimeout(2500);
    const finalUrl = page.url();
    const fname = `/tmp/ss_ms_${path.replace(/\//g,'_').replace(/^_/,'')}.png`;
    await page.screenshot({ path: fname, fullPage: false });
    console.log(JSON.stringify({ path, finalUrl, fname, ok: finalUrl.includes('/mystery-school') }));
  }
  await ctx.close();
}

// Trainee user
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', USERS[1].email);
  await page.fill('input[type="password"]', USERS[1].pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.error('Trainee logged in at:', page.url());

  for (const path of TRAINEE_PAGES) {
    try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
    await page.waitForTimeout(2500);
    const finalUrl = page.url();
    const fname = `/tmp/ss_trainee_${path.replace(/\//g,'_').replace(/^_/,'')}.png`;
    await page.screenshot({ path: fname, fullPage: false });
    console.log(JSON.stringify({ path, finalUrl, fname, ok: finalUrl.includes('/trainee') }));
  }
  await ctx.close();
}

await browser.close();
