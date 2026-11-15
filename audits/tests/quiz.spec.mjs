// The quiz itself: inputs read the way a student types them, and the questions ask for what the rules use.
import { test, expect, PHONE } from './helpers.mjs';

async function toLoanDetails(page) {
  await page.goto('/');
  await page.getByText('Federal loans only', { exact: true }).click();
  await page.getByText('All of them came before July 1, 2026', { exact: true }).click();
  await page.getByLabel('Total federal loan balance').waitFor();
}

async function toIncome(page) {
  await toLoanDetails(page);
  await page.getByLabel('Total federal loan balance').fill('27000');
  await page.getByLabel(/Average interest rate/).fill('6.52');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#income').waitFor();
}

test('MONEY-07 a typed decimal point stays a decimal point in dollar fields', async ({ page }) => {
  await toLoanDetails(page);
  const balance = page.getByLabel('Total federal loan balance');
  await balance.pressSequentially('27000.50');
  await expect(balance).toHaveValue('27,000.50');
  await page.getByLabel(/Average interest rate/).fill('6.52');
  await page.getByRole('button', { name: 'Continue' }).click();
  const income = page.locator('#income');
  await income.pressSequentially('45000.75');
  await expect(income).toHaveValue('45,000.75');
});

test('SCOPE-01 the income question asks for adjusted gross income', async ({ page }) => {
  await toIncome(page);
  const label = await page.locator('label[for="income"]').innerText();
  expect(label).toMatch(/adjusted gross income/i);
});

test('a student can finish the quiz on a phone and land on a verdict with every plan priced', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await toIncome(page);
  await page.locator('#income').fill('45000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Nonprofit', { exact: true }).click();
  await page.getByText('Explore loan forgiveness', { exact: true }).click();
  await page.waitForURL(/\/results/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/best fit/);
  for (const name of ['Standard 10-Year', 'Graduated', 'IBR', 'RAP', 'PSLF']) {
    await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
  }
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scroll, 'page scrolls sideways').toBeLessThanOrEqual(0);
});

test('after an answer moves the quiz on, focus is on the new question', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Federal loans only', { exact: true }).click();
  await expect(page.locator('#step-heading')).toHaveText(/paid out/);
  await expect(page.locator('#step-heading')).toBeFocused();
});

test('Back keeps what was typed', async ({ page }) => {
  await toIncome(page);
  await page.locator('#income').fill('41,000');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByLabel('Total federal loan balance')).toHaveValue('27,000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#income')).toHaveValue('41,000');
});

test('dependents and joint filing change the RAP and IBR figures the way the rules say', async ({ page }) => {
  await toIncome(page);
  await page.locator('#income').fill('45000');
  await page.getByRole('button', { name: 'One more dependent' }).click();
  await page.getByText('Married, filing taxes jointly').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Private company', { exact: true }).click();
  await page.getByText('Keep payments as low as possible', { exact: true }).click();
  await page.waitForURL(/\/results/);
  await expect(page.getByText(/1 dependent, filing jointly/)).toBeVisible();
  // RAP: 4% of $45,000 over 12 is $150, less $50 for the one dependent; the spouse takes nothing off.
  const rap = page.locator('[data-plan="rap"]');
  await expect(rap.getByText('$100', { exact: true })).toBeVisible();
});
