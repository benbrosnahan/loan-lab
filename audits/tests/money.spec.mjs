// Money and claims: every figure checked against the independent oracle in support/money-oracle.mjs, which is
// written from 34 CFR 685, the HHS 2026 poverty guidelines and the IRS 2026 brackets, never from the app's code.
import { test, expect, openResults, cardLines, figure, taxFigure, pageText, pickName } from './helpers.mjs';
import {
  standard, tiered, graduated, ibrPayment, rapPayment, ibrPath, rapPath, forgivenessTax,
} from './support/money-oracle.mjs';

const near = (shown, expected, tol = 1) => shown !== null && Math.abs(shown - expected) <= tol;

test('MONEY-01 RAP at the $10 minimum moves principal by $10 a month, not $50', async ({ page }) => {
  const a = { federalBalance: 27000, federalRate: 6.52, income: 9000, disbursement: 'on_or_after_july_2026' };
  await openResults(page, a);
  const rap = await cardLines(page, 'RAP');
  const path = rapPath(27000, 6.52, rapPayment(9000, 0));
  expect(figure(rap, 'Monthly payment')).toBe(10);
  expect(near(figure(rap, 'Amount forgiven'), path.left, 5), `forgiven shown ${figure(rap, 'Amount forgiven')}, rule gives ${Math.round(path.left)}`).toBe(true);
  expect(await pageText(page)).not.toMatch(/at least \$50\/month goes toward your principal/i);
});

test('MONEY-02 IBR keeps unpaid interest owed, so the forgiven balance includes it', async ({ page }) => {
  const a = { federalBalance: 35000, federalRate: 6.53, income: 30000, priority: 'forgiveness' };
  await openResults(page, a);
  const ibr = await cardLines(page, 'IBR');
  const pay = ibrPayment(30000, 1, 35000, 6.53);
  const path = ibrPath(35000, 6.53, pay);
  expect(near(figure(ibr, 'Monthly payment'), Math.round(pay))).toBe(true);
  expect(near(figure(ibr, 'Total paid'), path.paid, 5), `total paid shown ${figure(ibr, 'Total paid')}, rule gives ${Math.round(path.paid)}`).toBe(true);
  expect(near(figure(ibr, 'Amount forgiven'), path.left, 5), `forgiven shown ${figure(ibr, 'Amount forgiven')}, rule gives ${Math.round(path.left)}`).toBe(true);
});

test('MONEY-03 the tax on a forgiven IBR balance uses 2026 brackets, not a flat 22%', async ({ page }) => {
  const a = { federalBalance: 35000, federalRate: 6.53, income: 30000, priority: 'forgiveness' };
  await openResults(page, a);
  const ibr = await cardLines(page, 'IBR');
  const path = ibrPath(35000, 6.53, ibrPayment(30000, 1, 35000, 6.53));
  const tax = forgivenessTax(30000, path.left);
  expect(near(taxFigure(ibr), tax, 10), `tax shown ${taxFigure(ibr)}, 2026 brackets give ${Math.round(tax)}`).toBe(true);
});

test('MONEY-03 "pay the least overall" counts the tax on a forgiven balance', async ({ page }) => {
  // IBR pays the least before tax, but forgives about $45,000 that is taxed; with the tax counted, RAP costs less.
  const a = { federalBalance: 30000, federalRate: 6.53, income: 30000, priority: 'least_total' };
  await openResults(page, a);
  const ibr = ibrPath(30000, 6.53, ibrPayment(30000, 1, 30000, 6.53));
  const rap = rapPath(30000, 6.53, rapPayment(30000, 0));
  const costs = {
    'Standard 10-Year': standard(30000, 6.53).paid,
    Graduated: graduated(30000, 6.53).paid,
    IBR: ibr.paid + forgivenessTax(30000, ibr.left),
    RAP: rap.paid + forgivenessTax(30000, rap.left),
  };
  const pick = Object.entries(costs).sort((x, y) => x[1] - y[1])[0][0];
  const banner = await pickName(page);
  expect(banner, `with tax: ${JSON.stringify(Object.fromEntries(Object.entries(costs).map(([k, v]) => [k, Math.round(v)])))}`).toBe(pick);
});

test('MONEY-04 IBR uses the 2026 poverty guideline ($15,960 for one person)', async ({ page }) => {
  await openResults(page, { income: 45000 });
  const ibr = await cardLines(page, 'IBR');
  expect(figure(ibr, 'Monthly payment')).toBe(Math.round(ibrPayment(45000, 1, 27000, 6.52)));
});

test('MONEY-05 income is held flat, so IBR total paid matches a flat-income path', async ({ page }) => {
  await openResults(page, { federalBalance: 27000, federalRate: 5.5, income: 45000 });
  const ibr = await cardLines(page, 'IBR');
  const path = ibrPath(27000, 5.5, ibrPayment(45000, 1, 27000, 5.5));
  expect(near(figure(ibr, 'Total paid'), path.paid, 5), `shown ${figure(ibr, 'Total paid')}, flat income gives ${Math.round(path.paid)}`).toBe(true);
  expect(await pageText(page)).toMatch(/income (is )?(held )?flat|same income every year|income stays the same/i);
});

test('MONEY-06 Standard charges at least $50 a month on a small balance', async ({ page }) => {
  await openResults(page, { federalBalance: 3000, federalRate: 6.53, income: 40000, priority: 'fastest' });
  const std = await cardLines(page, 'Standard 10-Year');
  const s = standard(3000, 6.53);
  expect(figure(std, 'Monthly payment')).toBe(50);
  expect(near(figure(std, 'Total paid'), s.paid, 2)).toBe(true);
});

test('MONEY-10 PSLF on RAP counts the matching principal payment', async ({ page }) => {
  const a = { federalBalance: 31000, federalRate: 6.52, income: 38000, employment: 'nonprofit', priority: 'forgiveness', disbursement: 'on_or_after_july_2026' };
  await openResults(page, a);
  const pslf = await cardLines(page, 'PSLF');
  const path = rapPath(31000, 6.52, rapPayment(38000, 0), 120);
  expect(near(figure(pslf, 'Amount forgiven'), path.left, 5), `shown ${figure(pslf, 'Amount forgiven')}, rule gives ${Math.round(path.left)}`).toBe(true);
  expect(near(figure(pslf, 'Total paid'), path.paid, 5)).toBe(true);
});

test('MONEY-13 a married joint filer with no children gets no RAP dependent credit, and IBR counts the spouse', async ({ page }) => {
  await openResults(page, { income: 45000, familySize: 2, dependents: 0, filesJointly: true });
  const rap = await cardLines(page, 'RAP');
  const ibr = await cardLines(page, 'IBR');
  expect(figure(rap, 'Monthly payment')).toBe(Math.round(rapPayment(45000, 0)));
  expect(figure(ibr, 'Monthly payment')).toBe(Math.round(ibrPayment(45000, 2, 27000, 6.52)));
});

test('MONEY-15 IBR under $5 is $0 and from $5 to $10 is $10', async ({ page }) => {
  await openResults(page, { income: 24780 });
  expect(figure(await cardLines(page, 'IBR'), 'Monthly payment')).toBe(10);
  await openResults(page, { income: 24300 });
  expect(figure(await cardLines(page, 'IBR'), 'Monthly payment')).toBe(0);
});

test('Graduated starts at the 3x-cap start and Tiered Standard uses its tier (guards)', async ({ page }) => {
  await openResults(page, { federalBalance: 27000, federalRate: 6.52 });
  expect(near(figure(await cardLines(page, 'Graduated'), 'Monthly payment'), graduated(27000, 6.52).first)).toBe(true);
  await openResults(page, { federalBalance: 27000, federalRate: 6.52, disbursement: 'on_or_after_july_2026' });
  const ts = await cardLines(page, 'Tiered Standard');
  expect(near(figure(ts, 'Monthly payment'), tiered(27000, 6.52).payment)).toBe(true);
});

test('Tiered Standard is never the pick for a public-service borrower and says it earns no PSLF credit (guard)', async ({ page }) => {
  for (const priority of ['low_payment', 'least_total', 'fastest', 'forgiveness']) {
    await openResults(page, { employment: 'government', priority, disbursement: 'on_or_after_july_2026', federalBalance: 22000 });
    expect(await pickName(page), priority).not.toBe('Tiered Standard');
  }
  const ts = (await cardLines(page, 'Tiered Standard')).join(' ');
  expect(ts).toMatch(/in any tier|every tier/i);
});

test('MONEY-08 Teacher Loan Forgiveness copy says the same years cannot count toward PSLF', async ({ page }) => {
  await openResults(page, { employment: 'education' });
  const text = await pageText(page);
  expect(text).not.toMatch(/continue toward PSLF forgiveness at year 10/i);
  expect(text).toMatch(/same (years|period)/i);
  expect(text).toMatch(/\$5,000/);
});

test('MONEY-09 consolidation copy does not claim progress resets to zero', async ({ page }) => {
  await openResults(page, {});
  expect(await pageText(page)).not.toMatch(/resets your forgiveness progress to zero/i);
});

test('MONEY-11 PSLF copy does not require 10 straight or unbroken years', async ({ page }) => {
  await openResults(page, { employment: 'nonprofit', income: 30000, federalBalance: 60000, priority: 'least_total' });
  const text = await pageText(page);
  expect(text).not.toMatch(/10 straight years|for the entire 10 years/i);
  expect(text).toMatch(/120/);
});

test('MONEY-14 a $0 income is not described as $0 on every income-driven plan', async ({ page }) => {
  await openResults(page, { income: 0, disbursement: 'on_or_after_july_2026' });
  expect(figure(await cardLines(page, 'RAP'), 'Monthly payment')).toBe(10);
  expect(await pageText(page)).not.toMatch(/income-driven plans show \$0 monthly payments/i);
});

test('MONEY-16 the Graduated card does not say none of its payments count toward PSLF', async ({ page }) => {
  await openResults(page, { employment: 'government' });
  const g = (await cardLines(page, 'Graduated')).join(' ');
  expect(g).not.toMatch(/Payments do NOT count toward Public Service Loan Forgiveness/);
});

test('MONEY-19 the SAVE note names the final 30-day notice and PSLF buyback', async ({ page }) => {
  await openResults(page, {});
  const text = await pageText(page);
  expect(text).toMatch(/30-day/);
  expect(text).toMatch(/buy back|buyback/i);
});

test('MONEY-05 the flat-income assumption is stated in plain words next to the projections', async ({ page }) => {
  await openResults(page, { income: 45000 });
  const note = page.locator('[data-flat-income]');
  await expect(note).toBeVisible();
  await expect(note).toContainText('assume your income stays at $45,000 a year the whole time');
  await expect(note).toContainText('you would pay more and have less forgiven');
  // It sits in the projections section, before the ruler's lanes, not only in the fine print below.
  const ruler = page.locator('section[aria-labelledby="ruler-title"]');
  await expect(ruler.locator('[data-flat-income]')).toHaveCount(1);
  for (const id of ['ibr', 'rap']) {
    await expect(page.locator(`article[data-plan="${id}"] [data-flat-income-card]`)).toContainText('Assumes your income never changes');
  }
  await expect(page.locator('article[data-plan="standard"] [data-flat-income-card]')).toHaveCount(0);
});

test('MONEY-05 the verdict, the first projection a student reads, also says income is held the same', async ({ page }) => {
  await openResults(page, { income: 45000 });
  await expect(page.getByText('It assumes your income stays the same every year.')).toBeVisible();
});
