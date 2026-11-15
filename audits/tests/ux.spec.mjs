// Design-system and copy rules.
import { readFileSync } from 'node:fs';
import { test, expect, openResults, pageText } from './helpers.mjs';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

test('UX-01 entrances are CSS: framer-motion is gone from the app', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(Object.keys(pkg.dependencies)).not.toContain('framer-motion');
});

test('UX-03 the copy a student reads has no em dashes, tildes or emojis', async ({ page }) => {
  const texts = [];
  await page.goto('/');
  texts.push(await pageText(page));
  for (const over of [{ employment: 'education' }, { employment: 'nonprofit', disbursement: 'on_or_after_july_2026' }, { income: 0, loanType: 'both', privateBalance: 9000, privateRate: 7 }]) {
    await openResults(page, over);
    texts.push(await pageText(page));
  }
  const all = texts.join('\n');
  expect(all).not.toMatch(/—/);
  expect(all).not.toMatch(/~/);
  expect(all).not.toMatch(EMOJI);
});

test('UX-02 the verdict, its figure and one next step come before anything else', async ({ page }) => {
  await openResults(page, {});
  const order = await page.evaluate(() => {
    const top = el => (el ? el.getBoundingClientRect().top : Infinity);
    return {
      verdict: top(document.querySelector('[data-recommended] h1')),
      action: top(document.querySelector('[data-recommended] a')),
      cards: top(document.querySelector('[data-plan]')),
      notes: top(document.querySelector('#know-title')),
    };
  });
  expect(order.verdict).toBeLessThan(order.cards);
  expect(order.action).toBeLessThan(order.cards);
  expect(order.cards).toBeLessThan(order.notes);
});

test('UX-04 the header does not claim nothing is stored', async ({ page }) => {
  await page.goto('/');
  expect(await pageText(page)).not.toMatch(/No data stored/);
});
