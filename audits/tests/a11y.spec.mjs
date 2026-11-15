// Accessibility: axe on every screen a student sees, plus the Cense floors axe cannot check. Created with Claude Code.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openResults, settle, PHONE, DESKTOP } from './helpers.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map(v => `${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target}`);
}

/** Visible text set below 13px, and buttons, inputs and links-as-buttons under 40px tall. */
async function floors(page) {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent.trim()) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]') || el.closest('.sr-only')) continue;
      if (parseFloat(cs.fontSize) < 13) out.push(`text ${cs.fontSize}: "${n.textContent.trim().slice(0, 30)}"`);
    }
    for (const el of document.querySelectorAll('button, input:not([type=checkbox]), summary, a.inline-flex, a.block, a.flex')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height < 40) out.push(`target ${Math.round(r.height)}px: "${(el.innerText || el.id).trim().slice(0, 30)}"`);
    }
    for (const el of document.querySelectorAll('input')) {
      if (parseFloat(getComputedStyle(el).fontSize) < 16 && el.type !== 'checkbox') out.push(`input ${getComputedStyle(el).fontSize}: #${el.id}`);
    }
    return out;
  });
}

for (const [label, size] of [['phone', PHONE], ['desktop', DESKTOP]]) {
  test(`A11Y-01 the first question has no axe violations and meets the floors (${label})`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    expect(await axe(page)).toEqual([]);
    expect(await floors(page)).toEqual([]);
  });

  test(`A11Y-01 the results page has no axe violations and meets the floors (${label})`, async ({ page }) => {
    await page.setViewportSize(size);
    await openResults(page, { employment: 'nonprofit', priority: 'forgiveness', income: 30000 });
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
    expect(await axe(page)).toEqual([]);
    expect(await floors(page)).toEqual([]);
  });
}

test('A11Y-02 the income step has no axe violations, with the joint-filing note open', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Federal loans only', { exact: true }).click();
  await expect(page.locator('#step-heading')).toHaveText(/paid out/);
  await page.getByText('Not sure', { exact: true }).click();
  await page.getByLabel('Total federal loan balance').fill('20000');
  await page.getByLabel(/Average interest rate/).fill('6');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#income').fill('3000');
  await page.getByText('Married, filing taxes jointly').click();
  expect(await axe(page)).toEqual([]);
});

test('A11Y-03 motion respects reduced-motion and nothing is left invisible', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openResults(page, {});
  await page.waitForTimeout(100);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('main *')]
    .filter(el => el.getBoundingClientRect().width && parseFloat(getComputedStyle(el).opacity) < 0.99 && !el.closest('[aria-hidden="true"]') && !el.closest('details:not([open])'))
    .map(el => el.tagName));
  expect(hidden).toEqual([]);
  await context.close();
});
