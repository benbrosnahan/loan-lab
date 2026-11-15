// Security and privacy. Created with Claude Code.
import { test, expect, answers } from './helpers.mjs';

test('SEC-01 responses carry a CSP that forbids framing, plus nosniff, referrer and permissions policies', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy'] ?? '').toMatch(/frame-ancestors 'none'/);
  expect(h['content-security-policy'] ?? '').toMatch(/default-src 'self'/);
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy'] ?? '').toMatch(/camera=\(\)/);
});

test('SEC-02 the copied share link carries answers in the fragment, never the query string', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
  const q = encodeURIComponent(Buffer.from(JSON.stringify(answers())).toString('base64'));
  await page.goto(`/results?q=${q}`);
  await page.getByRole('button', { name: /copy a link/i }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\/results#q=/);
  expect(copied).not.toMatch(/\?q=/);
});

test('a whole journey requests nothing from any other site', async ({ page, baseURL }) => {
  const offsite = [];
  page.on('request', r => { if (!r.url().startsWith(baseURL) && !r.url().startsWith('data:')) offsite.push(r.url()); });
  await page.goto('/');
  await page.getByText('Federal loans only', { exact: true }).click();
  await page.getByText('All of them came before July 1, 2026', { exact: true }).click();
  await page.getByLabel('Total federal loan balance').fill('30000');
  await page.getByLabel(/Average interest rate/).fill('6.5');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#income').fill('40000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Government', { exact: true }).click();
  await page.getByText('Pay the least overall', { exact: true }).click();
  await page.waitForURL(/\/results/);
  await page.locator('[data-recommended]').waitFor();
  expect(offsite).toEqual([]);
});

test('links to other sites open without a handle back to this page', async ({ page }) => {
  const q = encodeURIComponent(Buffer.from(JSON.stringify(answers())).toString('base64'));
  await page.goto(`/results?q=${q}`);
  const bad = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')]
    .filter(a => !/noopener/.test(a.rel)).map(a => a.href));
  expect(bad).toEqual([]);
});

test('SEC-03 the site runs on a supported Next.js release line', async () => {
  test.info().annotations.push({ type: 'issue', description: 'SEC-03' });
  test.fail(!process.env.AUDIT_SHOW_KNOWN, 'Known issue SEC-03: Next 14 is unsupported; upgrading is a decision for Ben');
  const { readFileSync } = await import('node:fs');
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(Number(String(pkg.dependencies.next).replace(/[^\d.]/g, '').split('.')[0])).toBeGreaterThanOrEqual(15);
});
