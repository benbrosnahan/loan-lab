// Screenshots for the design review loop. Created with Claude Code.
// Usage: node shoot.mjs <base url> <label> [--refs]
// Writes screenshots/<label>-<screen>-<width>.png at 375x812 and 1440x900.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [base, label, flag] = process.argv.slice(2);
const OUT = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const SIZES = [{ width: 375, height: 812 }, { width: 1440, height: 900 }];

const answers = {
  loanType: 'federal', disbursement: 'before_july_2026', federalBalance: 27000, federalRate: 6.52,
  privateBalance: 0, privateRate: 0, income: 45000, familySize: 1, dependents: 0, filesJointly: false,
  employment: 'nonprofit', priority: 'low_payment',
};
const q = encodeURIComponent(Buffer.from(JSON.stringify(answers)).toString('base64'));

const browser = await chromium.launch();
for (const size of SIZES) {
  const page = await browser.newPage({ viewport: size, reducedMotion: 'reduce' });
  if (flag === '--refs') {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}${label}-home-${size.width}.png` });
  } else {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}${label}-quiz1-${size.width}.png`, fullPage: true });
    await page.getByText('Federal loans only', { exact: true }).click();
    await page.getByText('All of them came before July 1, 2026', { exact: true }).click();
    await page.getByLabel('Total federal loan balance').fill('27000');
    await page.getByLabel(/Average interest rate/).fill('6.52');
    await page.screenshot({ path: `${OUT}${label}-quiz3-${size.width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#income').fill('45000');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}${label}-quiz4-${size.width}.png`, fullPage: true });
    await page.goto(`${base.replace(/\/$/, '')}/results?q=${q}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}${label}-results-${size.width}.png`, fullPage: true });
    await page.screenshot({ path: `${OUT}${label}-results-fold-${size.width}.png` });
  }
  await page.close();
}
await browser.close();
console.log('done', label);
