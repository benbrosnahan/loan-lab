# Cense Loan Lab audit, 2026-11-15

Loan Lab is a six-question quiz that recommends a federal student loan repayment plan and points to Loan Desk for depth. It loads fast (Lighthouse performance 100) and its plan eligibility was right: the July 1, 2026 cutoff, the Tiered Standard terms, the RAP brackets, and the rule that Tiered Standard never earns PSLF credit all match 34 CFR 685.

The problems were in the money engine and in a few sentences of advice. Loan Lab's `src/data/plans.ts` is the ancestor of Loan Desk's, so every money error fixed in Loan Desk was checked here; the engine itself was written separately and had its own errors. Each finding was measured on the live site with an independent oracle (`tests/support/money-oracle.mjs`) written from the regulations, never from the app's code.

**37 findings: 2 P0, 18 P1, 11 P2, 6 P3. 35 fixed on branch `audit-redesign`, 1 disclosed but not modelled (SCOPE-03), 1 left for Ben (SEC-03).**

## Scoreboard

| Measure | Live, 2026-11-15 | Branch, local build |
|---|---|---|
| Lighthouse Perf / A11y / BP / SEO (phone and desktop) | 100 / 93 / 100 / 100 | 100 / 100 / 100 / 100 |
| GEO | 44 | 84 |
| Words in the server HTML | 0 | 114 |
| Design heuristics (advisory) | 42 | 89 |
| Header check | 40 | 80 |
| Readable, first visit, slow 4G and 4x CPU | failed | 1.70 s |
| Budgets | FAIL: 21 pass, 4 fail | PASS: 27 pass, 0 fail |
| Playwright suite | 9 of 49 pass | 49 of 49 (1 known issue) |

The kit's security engine sends no request over plain HTTP, so localhost scores 35 whatever headers the app sends. Use the header check and `tests/security.spec.mjs` until a deployed URL can be scanned. The flow and INP steps drive Loan Desk's screens and do not apply here. Results: [`results/2026-11-15-live`](results/2026-11-15-live/SUMMARY.md), [`results/2026-11-15-local`](results/2026-11-15-local/SUMMARY.md).

## Four students, worked by hand

Oracle: 34 CFR 685.208 and 685.209 month by month at a flat income. "Live" is what loan-lab.vercel.app showed for the same answers through its share link. The branch now shows exactly the oracle figures.

| Student | Figure | Rule (and branch) | Live |
|---|---|---|---|
| A. Loans before July 2026, $27,000 at 6.0%, AGI $45,000, single, private employer | IBR monthly | $176 | $179 (2025 poverty line) |
| | IBR total | $42,120 paid, $8,287 forgiven at year 20 | $41,302, paid off (3% raises) |
| | RAP total | $54,000 | $42,155 |
| B. Borrowed for fall 2026, $31,000 at 6.52%, AGI $38,000, nonprofit, wants forgiveness | PSLF | $11,400 paid, $25,000 forgiven | $16,654 paid, $31,000 forgiven |
| | RAP | $34,200 paid, $13,000 forgiven, about $1,560 tax | $53,420 paid, nothing forgiven |
| C. Single parent, 1 dependent, $18,000 at 6.39%, AGI $26,000, government | RAP | $10 a month, $14,400 forgiven at year 30 | paid off at year 30, "Total interest -$950" |
| | IBR | $0 a month, $41,004 forgiven at year 20, about $4,921 tax | $17,643 forgiven, $3,881 tax |
| D. $3,500 at 6.53%, AGI $40,000 | Standard / IBR monthly | $50 / $50 | $40 / $138 |

## Findings

P0: a wrong number or wrong advice that could cost money. P1: misleading but unlikely to cost money. P2: a real defect with a small effect. P3: polish. Tests are in `tests/`.

| ID | Sev | Finding | Status | Source |
|---|---|---|---|---|
| MONEY-01 | P1 | RAP's $50 match was applied to payments under $50 (C: paid off instead of $14,400 forgiven; negative interest shown) | Fixed | https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.209 ((o)(2)(i), (h)(4)(i)) |
| MONEY-02 | P1 | IBR's unpaid interest vanished; forgiven balance and tax understated ($35,000 at 6.53%, AGI $30,000: rule $68,590 forgiven) | Fixed | 685.209(j)(2), same URL |
| MONEY-03 | P1 | Forgiveness taxed at a flat 22% and ignored by "pay the least overall" ($30,000 at 6.53%, AGI $30,000 picked IBR; with tax RAP is $1,583 cheaper) | Fixed | https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill; https://studentaid.gov/announcements-events/idr-court-actions |
| MONEY-04 | P2 | 2025 poverty guidelines | Fixed | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines |
| MONEY-05 | P1 | Income grew 3% a year, unstated, against a fixed poverty line | Fixed: held flat and stated; Ben to confirm | 685.209(b)(14) |
| MONEY-06 | P1 | Standard below its $50 minimum | Fixed | https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.208 ((b)(1)(ii)) |
| MONEY-07 | P1 | A typed decimal point multiplied a dollar figure by 100 ($27,000.50 became $2,700,050) | Fixed | |
| MONEY-08 | P0 | "Take Teacher Loan Forgiveness at year 5, then PSLF at year 10": the same years cannot count toward both; the $17,500 cap applies only to some teachers | Fixed | https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher |
| MONEY-09 | P1 | Consolidation "resets your forgiveness progress to zero" (ED credits a weighted average) | Fixed | https://studentaid.gov/articles/save/ (Q9) |
| MONEY-10 | P1 | PSLF ignored RAP's match and IBR's unpaid interest (B: $31,000 shown, $25,000 by rule) | Fixed | 685.209(o)(2)(i); https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.219 |
| MONEY-11 | P1 | PSLF said to need "10 straight years", all or nothing | Fixed | 685.219(c)(1) |
| MONEY-12 | P1 | IBR card showed the payment before IBR's Standard cap (D: $138 shown, $50 charged) | Fixed | 685.209(f)(2)(ii) |
| MONEY-13 | P1 | Household: unmarried partner counted, spouse taken as a RAP dependent ($100 shown, $150 billed), 5+ priced as 5 | Fixed | 685.209(b)(3), (b)(9), (e)(1) |
| MONEY-14 | P2 | "$0 income shows $0 on every income-driven plan" (RAP is $10) | Fixed | 685.209(g)(3)(ii) |
| MONEY-15 | P3 | IBR $5/$10 rounding missing | Fixed | 685.209(g)(1)(iii) |
| MONEY-16 | P2 | Graduated: "Payments do NOT count toward PSLF" (later payments at or above Standard can) | Fixed | 685.219(b)(28)(iii) |
| MONEY-17 | P2 | "Use avg rate (6.52%)" is the 2026-27 new-loan rate; "use the highest rate" overstated payments | Fixed (update the constant each June) | https://studentaid.gov/understand-aid/types/loans/interest-rates |
| MONEY-18 | P2 | SAVE note lacked the final 30-day notice, PSLF buyback and the 2028 end of PAYE and ICR | Fixed | https://studentaid.gov/articles/save/ |
| MONEY-19 | P2 | Take-home share used guessed flat tax rates, unlabeled | Fixed (2026 brackets, labeled rough) | IRS 2026 brackets |
| MONEY-20 | P3 | Totals added a full payment in the final month | Fixed | |
| MONEY-21 | P3 | 1-point autopay rate cut (enroll by Dec 31, 2026) not mentioned | Fixed (date-gated next step) | https://studentaid.gov/articles/save/ (Q7) |
| SCOPE-01 | P0 | Income asked as gross pay; IBR and RAP use AGI ($52,000 salary, AGI $47,080: RAP $157 not $217) | Fixed | 685.209(b)(10) |
| SCOPE-02 | P1 | PSLF offered on employer type without the 30-hour rule | Fixed | 685.219(b)(11) |
| SCOPE-03 | P1 | Every federal loan priced as a Direct Loan (Parent PLUS, FFEL, Perkins) | Disclosed, not modelled | https://studentaid.gov/articles/save/ (Q4 table) |
| SCOPE-04 | P2 | "Not sure" about disbursement buried its warning | Fixed (warning at the top) | https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.210 |
| SCOPE-05 | P3 | Pre-July 2014 IBR borrowers (15%, 25 years) not mentioned | Fixed (IBR card line) | 685.209(b)(13)(ii), (f)(3) |
| SCOPE-06 | P1 | Results said "Every plan open to you" without Extended, PAYE or ICR | Fixed (heading changed; Extended named) | 685.208(b)(4) |
| A11Y-01 | P1 | Helper text, step counter and Back at about 2.6:1 contrast | Fixed (axe 0 violations, Lighthouse 100) | WCAG 2.2 SC 1.4.3 |
| A11Y-02 | P2 | No main or nav landmark, no h1 on the quiz, focus lost after auto-advance | Fixed | WCAG 2.2 SC 1.3.1, 2.4.3 |
| A11Y-03 | P2 | Type at 10 to 11 px, targets under 40 px, 14 px inputs, no reduced-motion rule | Fixed | Cense floors; WCAG 2.2 SC 2.5.8 |
| SEC-01 | P2 | No CSP, frame, nosniff, referrer or permissions headers | Fixed | Kit security scan |
| SEC-02 | P2 | Share link put balance and income in the query string | Fixed (fragment; old links still open) | |
| SEC-03 | P3 | Next.js 14 no longer gets security fixes | Needs Ben (known issue) | https://nextjs.org/support-policy |
| SEO-01 | P1 | Server HTML had 0 words (client-only render) | Fixed (114 words, GEO 84) | Google Search Central, JavaScript SEO basics |
| SEO-02 | P2 | No canonical, sitemap, robots, JSON-LD or share image | Fixed | Kit GEO and tools scans |
| UX-01 | P1 | framer-motion entrances started content at opacity 0 | Fixed (CSS keyframes, dependency removed) | Cense design system |
| UX-02 | P2 | Answer buried under up to 10 notes with emoji icons | Fixed (verdict and one next step first; notes ranked, the rest collapsible) | Cense design system |
| UX-03 | P3 | Off-system type and colors; em dashes and emojis in copy | Fixed | Cense design system |
| UX-04 | P3 | Header said "No data stored" while answers sit in session storage | Fixed ("Stays on this device") | |

## Details of the P0 and P1 findings

**MONEY-08 (P0).** studentaid.gov: borrowers cannot get credit toward TLF and PSLF for the same period of service; after TLF, PSLF needs 120 more qualifying payments. A teacher following the old advice took at most $5,000 or $17,500 at year 5 and pushed PSLF, which cancels the whole remaining balance, from year 10 to year 15. The fixed copy names both caps and says the same years cannot count toward both.

**SCOPE-01 (P0).** "Annual income before taxes" was asked; 685.209(b)(10) uses AGI. Pre-tax 401(k) and health premiums can drop RAP a bracket. The field is now "Adjusted gross income (AGI)", with a one-line hint (line 11 of the tax return).

**MONEY-01.** `calcRAP` added up to $50 of principal whatever the payment. 685.209(o)(2)(i): the lesser of $50 or the payment, minus what the payment already put on principal. Live: $27,000 at 6.52%, AGI $9,000 showed $9,000 forgiven; the rule leaves $23,400.

**MONEY-02 and MONEY-10.** IBR and PSLF lowered principal by payment minus interest and dropped the rest. Under 685.209(j)(2) unpaid IBR interest is not capitalized while on IBR, but stays owed and is forgiven, and taxed, with the principal.

**MONEY-03.** Pub. L. 119-21 sec. 70119 kept the IRC 108(f)(5) exclusion after 2025 only for death and disability. Tax is now tax(AGI + forgiven) minus tax(AGI) at 2026 single or joint brackets, federal only, and "pay the least overall" ranks on payments plus that tax.

**MONEY-05.** Raises were applied to income but not to the poverty line, and never mentioned. Income is now flat, and the page says so: "Income is held flat for the whole term, so if it rises, IBR and RAP cost more and forgive less."

**MONEY-06, MONEY-12, MONEY-13, MONEY-07.** Standard is now floored at $50 per 685.208(b)(1)(ii). The IBR card reports the capped payment. The household question is now dependents (0 to 10) plus a "married, filing jointly" switch: IBR family size counts the spouse only on a joint return, and RAP takes $50 only per tax dependent. Dollar fields keep one decimal point.

**MONEY-09, MONEY-11, SCOPE-02, SCOPE-06.** These were overconfident claims, rewritten to match the cited rules.

**SEO-01, UX-01, A11Y-01.** The page is now prerendered (the share link is read in an effect, not with useSearchParams). Entrances are CSS. Text contrast meets 4.5:1 everywhere.

## Design

Direction: a calm one-question-per-screen quiz in large Bricolage type on Cense cream, with Loan Desk's tokens, fonts, pills, cards and header. Results open with a plain-sentence verdict, its reasons, what you give up, and one next step. The signature element is the years ruler: every plan as a lane on one 0 to 30 year axis, with an orange cap where a balance is forgiven, so the real trade (lower payment, longer time, taxed forgiveness) is visible at a glance; all figures are also in text. Screenshots are kept on disk in `screenshots/` (not in git).

## Not verified

- Not modelled, and disclosed on screen: IBR's 3-year subsidized interest benefit, splitting a joint filer's payment when the spouse has loans, Extended, PAYE and ICR pricing.
- ED contradicts itself on consolidation credit (its court-actions page, September 29, 2026, says the weighted average was struck down; the SAVE FAQ, October 2026, says it applies), so the copy says consolidation "can lower the payments already counted".
- `verify.mts` was not run (no TypeScript runner installed); the Playwright suite supersedes it.

## How to check

From `audits/`: `npm ci && npm run setup`, build the app (`npm --prefix .. run build`), then `npx playwright test` (it starts the app on port 3206). For the scans, start the app and run `node run.mjs --url http://localhost:3206/ --runs 1`. `AUDIT_URL=https://loan-lab.vercel.app npx playwright test tests/money.spec.mjs` reproduces the live failures recorded in `results/2026-11-15-live/money-before.txt`.

## Follow-ups, 2026-11-15 (deployed the same day)

**MONEY-05: income held flat, now stated where projections are shown.** Ben confirmed flat income. Three places say it in plain words: the verdict ("It assumes your income stays the same every year."); a note at the top of "How long each plan lasts", using the student's own AGI ("These numbers assume your income stays at $45,000 a year the whole time. If you earn more later, IBR, RAP and PSLF payments rise with it, so you would pay more and have less forgiven than shown."); and a line on each IBR, RAP and PSLF card. Tests: two MONEY-05 tests in `money.spec.mjs`.

**SEC-03: upgraded to a supported Next.js.** next 14.2.35 to 16.4.6; react and react-dom 18 to 19.3.1; eslint 8 to 9 with a flat `eslint.config.mjs`; versions pinned exactly. `npm run lint` is now `eslint` (Next 16 removed `next lint`). Two React 19 `set-state-in-effect` findings are deliberate post-hydration reads on prerendered pages and carry a one-line suppression with the reason. Security headers unchanged and passing on the production build. `npm audit --omit=dev`: 0 vulnerabilities; 7 moderate advisories remain in lint-only tooling.

Playwright: 51 of 51 pass locally and on the production build.
