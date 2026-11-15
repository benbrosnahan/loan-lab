// Shared helpers for the Loan Lab suite. Created with Claude Code.
// Each test gets a fresh browser context, so session storage starts empty.
import { test, expect } from '@playwright/test';

export { test, expect };

export const PHONE = { width: 375, height: 812 };
export const DESKTOP = { width: 1440, height: 900 };

/**
 * Marks a test as a known issue from audits/REPORT.md. The test asserts the fixed behaviour, so today it fails
 * and Playwright counts that as expected. Once the issue is fixed, Playwright reports "expected to fail, but
 * passed": delete the knownIssue() call and mark the finding fixed. AUDIT_SHOW_KNOWN=1 runs known issues as
 * ordinary tests, which shows the real failure message.
 */
export function knownIssue(id) {
  test.info().annotations.push({ type: 'issue', description: id });
  test.fail(!process.env.AUDIT_SHOW_KNOWN, `Known issue ${id}: see audits/REPORT.md`);
}

/** Quiz answers in the shape the share link carries. Old fields (familySize) stay so the live site reads them. */
export function answers(over = {}) {
  const a = {
    loanType: 'federal',
    disbursement: 'before_july_2026',
    federalBalance: 27000,
    federalRate: 6.52,
    privateBalance: 0,
    privateRate: 0,
    income: 45000,
    familySize: 1,
    dependents: 0,
    filesJointly: false,
    employment: 'private',
    priority: 'low_payment',
    ...over,
  };
  if (over.familySize === undefined) a.familySize = 1 + a.dependents + (a.filesJointly ? 1 : 0);
  return a;
}

/** Opens the results page for a set of answers through the app's own share link. */
export async function openResults(page, over = {}) {
  const q = Buffer.from(JSON.stringify(answers(over))).toString('base64');
  await page.goto(`/results?q=${encodeURIComponent(q)}`);
  await page.waitForFunction(() => /Monthly payment|private loans/i.test(document.body.innerText));
}

/** The recommended plan's name: the verdict's data attribute, or the older "Our top pick: X" banner. */
export async function pickName(page) {
  return page.evaluate(() => {
    const names = { standard: 'Standard 10-Year', graduated: 'Graduated', ibr: 'IBR', tiered_standard: 'Tiered Standard', rap: 'RAP', pslf: 'PSLF' };
    const el = document.querySelector('[data-recommended]');
    if (el) return names[el.getAttribute('data-recommended')] ?? null;
    const m = document.body.innerText.match(/top pick:\s*([^\n]+)/i);
    return m ? m[1].trim() : null;
  });
}

/**
 * Reads one plan card: finds the heading with the plan's exact name, climbs to the element that holds its
 * figures, and returns its text lines. Null when the plan is not on the page.
 */
export async function cardLines(page, name) {
  const text = await page.evaluate(n => {
    const heads = [...document.querySelectorAll('h2, h3, h4')].filter(h => h.innerText.trim() === n);
    for (const h of heads) {
      let el = h;
      while (el && !/Monthly payment/.test(el.innerText)) el = el.parentElement;
      if (el) return el.innerText;
    }
    return null;
  }, name);
  return text === null ? null : text.split('\n').map(s => s.trim()).filter(Boolean);
}

/** The dollar figure on the line after `label` in a card, or null. */
export function figure(lines, label) {
  if (!lines) return null;
  const i = lines.findIndex(l => l === label || l.startsWith(label));
  if (i < 0) return null;
  const same = lines[i].slice(label.length).match(/-?\$[\d,]+(\.\d+)?/);
  const next = (same ? same[0] : lines[i + 1] ?? '').match(/-?\$[\d,]+(\.\d+)?/);
  return next ? Number(next[0].replace(/[$,]/g, '')) : null;
}

/** The estimated tax on a forgiven balance, read from the first line after "Amount forgiven" that names tax. */
export function taxFigure(lines) {
  if (!lines) return null;
  const i = lines.findIndex(l => l.startsWith('Amount forgiven'));
  const line = lines.slice(Math.max(0, i)).find(l => /tax/i.test(l) && /\$[\d,]/.test(l));
  const m = line?.match(/\$[\d,]+/);
  return m ? Number(m[0].replace(/[$,]/g, '')) : null;
}

/** Visible text of the whole page, with every disclosure opened first. */
export const pageText = page => page.evaluate(() => {
  document.querySelectorAll('details').forEach(d => { d.open = true; });
  return document.body.innerText;
});

/** Waits until every CSS entrance outside a closed disclosure has finished, so checks see the settled page. */
export async function settle(page) {
  await page.waitForFunction(() => document.getAnimations()
    .filter(a => !a.effect?.target?.closest?.('details:not([open])'))
    .every(a => a.playState === 'finished'), null, { timeout: 5000 });
}
