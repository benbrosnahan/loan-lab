// Smoke: every route answers, and old share links still open.
import { test, expect, answers } from './helpers.mjs';

test('the quiz opens on its first question', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What kind of student loans do you have?');
  await expect(page.getByRole('main')).toBeVisible();
});

test('an old ?q= share link and a new #q= link both rebuild the results', async ({ page }) => {
  const q = encodeURIComponent(Buffer.from(JSON.stringify(answers())).toString('base64'));
  await page.goto(`/results?q=${q}`);
  await expect(page.locator('[data-recommended]')).toBeVisible();
  await page.goto(`/results#q=${q}`);
  await page.reload();
  await expect(page.locator('[data-recommended]')).toBeVisible();
});

test('a link to the quiz page with ?q= goes to its results', async ({ page }) => {
  const q = encodeURIComponent(Buffer.from(JSON.stringify(answers())).toString('base64'));
  await page.goto(`/?q=${q}`);
  await page.waitForURL(/\/results/);
  await expect(page.locator('[data-recommended]')).toBeVisible();
});

test('a private-only borrower gets the explanation, not an empty comparison', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Private loans only', { exact: true }).click();
  await page.waitForURL(/\/results/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText("don't apply to private loans");
});

test('opening results with no answers sends the student to the quiz', async ({ page }) => {
  await page.goto('/results');
  await page.waitForURL(url => new URL(url).pathname === '/');
});

test('the results page logs no errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const q = encodeURIComponent(Buffer.from(JSON.stringify(answers({ employment: 'education' }))).toString('base64'));
  await page.goto(`/results?q=${q}`);
  await expect(page.locator('[data-recommended]')).toBeVisible();
  expect(errors).toEqual([]);
});
