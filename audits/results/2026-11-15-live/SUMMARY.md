# Audit summary

- Target: https://loan-lab.vercel.app/ (given with --url)
- Started: 2026-11-15T18:25:42.004Z
- Command: `node run.mjs --url https://loan-lab.vercel.app/ --runs 1`
- Budgets: FAIL: 21 passed, 4 failed, 3 not measured

| Step | Result | Time |
|---|---|---|
| lighthouse | ok | 27.3 s |
| flow | failed: mobile: clickText: no visible control "Look around with example loans"; desktop: clickText: no visible control "Look around with example loans" | 16.3 s |
| security | ok | 0.1 s |
| geo | ok | 11.4 s |
| design | partial: form-errors-desktop: clickText: no visible control "Add my first loan"; form-errors-mobile: clickText: no visible control "Add my first loan"; plans-desktop: clickTab: no section button for plans; 5 more | 50.3 s |
| ux | partial: form-errors-desktop: clickText: no visible control "Add my first loan"; form-errors-mobile: clickText: no visible control "Add my first loan"; plans-desktop: clickTab: no section button for plans; 5 more | under 0.1 s |
| tools | ok | 0.9 s |
| responsive | partial: form-errors@320: clickText: no visible control "Add my first loan"; form-errors@375: clickText: no visible control "Add my first loan"; form-errors@768: clickText: no visible control "Add my first loan"; 17 more | 55.9 s |
| inp | failed: cpu1x loans=8 run1: clickTab: no section button for plans; cpu1x loans=8 run2: clickTab: no section button for plans; cpu1x loans=25 run1: clickTab: no section button for plans; 9 more | 25.8 s |
| readable | failed: first run1: not readable within 30 s of the load event; returning run1: not readable within 30 s of the load event | 68.6 s |

## Scoreboard

| Page | Perf | A11y | BP | SEO | LCP | FCP | CLS |
|---|---|---|---|---|---|---|---|
| Empty, mobile | 100 | 93 | 100 | 100 | 1832 ms | 784 ms | 0 |
| Empty, desktop | 100 | 93 | 100 | 100 | 446 ms | 246 ms | 0 |
| Seeded, mobile | 100 | 93 | 100 | 100 | 1835 ms | 787 ms | 0 |
| Seeded, desktop | 100 | 93 | 100 | 100 | 506 ms | 306 ms | 0 |

Median of 1 Lighthouse run per page, chosen by performance score. Empty is a first visit; seeded has the eight-loan fixture in localStorage before load. TBT: empty, mobile 7 ms, empty, desktop 0 ms, seeded, mobile 41 ms, seeded, desktop 0 ms.

## Budgets

| Budget | Measured | Limit | Result |
|---|---|---|---|
| Performance, empty, mobile | 100 | ≥ 90 | pass |
| Accessibility, empty, mobile | 93 | ≥ 100 | **FAIL** |
| Best practices, empty, mobile | 100 | ≥ 95 | pass |
| SEO, empty, mobile | 100 | ≥ 100 | pass |
| LCP, empty, mobile | 1832 ms | ≤ 2500 ms | pass |
| FCP, empty, mobile | 784 ms | ≤ 1800 ms | pass |
| CLS, empty, mobile | 0 | ≤ 0.1 | pass |
| TBT, empty, mobile | 7 ms | ≤ 200 ms | pass |
| Performance, empty, desktop | 100 | ≥ 90 | pass |
| Accessibility, empty, desktop | 93 | ≥ 100 | **FAIL** |
| Best practices, empty, desktop | 100 | ≥ 95 | pass |
| SEO, empty, desktop | 100 | ≥ 100 | pass |
| Performance, seeded, mobile | 100 | ≥ 90 | pass |
| Accessibility, seeded, mobile | 93 | ≥ 100 | **FAIL** |
| Best practices, seeded, mobile | 100 | ≥ 95 | pass |
| SEO, seeded, mobile | 100 | ≥ 100 | pass |
| LCP, seeded, mobile | 1835 ms | ≤ 2500 ms | pass |
| FCP, seeded, mobile | 787 ms | ≤ 1800 ms | pass |
| CLS, seeded, mobile | 0 | ≤ 0.1 | pass |
| TBT, seeded, mobile | 41 ms | ≤ 200 ms | pass |
| Performance, seeded, desktop | 100 | ≥ 90 | pass |
| Accessibility, seeded, desktop | 93 | ≥ 100 | **FAIL** |
| Best practices, seeded, desktop | 100 | ≥ 95 | pass |
| SEO, seeded, desktop | 100 | ≥ 100 | pass |
| Flow INP (worst timespan), mobile | – (the flow failed: clickText: no visible control "Look around with example loans") | ≤ 200 ms | not measured |
| Flow INP (worst timespan), desktop | – (the flow failed: clickText: no visible control "Look around with example loans") | ≤ 200 ms | not measured |
| GEO score (floor) | 44 | ≥ 44 | pass |
| Readable, first visit (floor) | – (every load failed) | ≤ 3500 ms | not measured |

First-load JS is read from the local build, so it is checked only when the target is served from this machine.
Floors are not goals: they are the scores measured on 2026-11-02, so falling below one means something regressed.
The readable floor is a time, so going over it fails. It sits well above the times measured on 2026-11-02, because throttled loads on a shared machine are noisy: a regression guard, not a goal.

Targets, which never fail a run:

| Measure | Now | Target | Status |
|---|---|---|---|
| GEO score | 44 | 80 | 36 to go |

## User flow

Lighthouse user flow: first load, example loans, plans with income typed, a plan chosen, the extra-payment slider dragged, and a snapshot saved in Records. Timespans measure INP, CLS and TBT; snapshots audit the state for accessibility, best practices and SEO.

### Mobile

Failed: clickText: no visible control "Look around with example loans"

### Desktop

Failed: clickText: no visible control "Look around with example loans"


## Security

**71** of 100. HTTPS 100, headers 27, cookies 100, content 80, dependencies not measured.

Lighthouse-based checks: included, from the median mobile Lighthouse run of the empty page.

- critical: Missing Content-Security-Policy (0/10 points)
- warning: Missing X-Content-Type-Options (0/4 points)
- warning: Missing X-Frame-Options (0/4 points)
- warning: CORS allows all origins

## GEO

**44** of 100: crawl access 20/20, server content 12/30, structured data 0/20, social and meta 7/15, LLM discovery 0/10, indexability 5/5.

Words in the raw HTML: 0. Words once rendered: 102. Content parity 0%.

- fail: H1 Tag in SSR (0/5)
- fail: Heading Hierarchy (0/3)
- fail: Body Text Parity (SSR vs CSR) (0/10)
- fail: JSON-LD in SSR (0/12)
- fail: Rich Schema Types (0/8)
- warn: Open Graph Tags (3/7)
- warn: Canonical URL (0/4)

High-priority recommendations: Add JSON-LD structured data; Move JS-injected page body into the server response.

## Design

| State | Desktop | Mobile | Score | Grade | Accessibility | Consistency | Motion | Performance |
|---|---|---|---|---|---|---|---|---|
| empty | 42.1 F | 42.1 F | 42 | F | 30 | 88 | 8 | 54 |
| form-errors | – | – | – | – | – | – | – | – |
| loans | 42.1 F | 42.1 F | 42 | F | 30 | 88 | 8 | 54 |
| plans | – | – | – | – | – | – | – | – |
| payoff | – | – | – | – | – | – | – | – |
| records | – | – | – | – | – | – | – | – |

Design engine 1.3.0. Score is the mean of the rounded desktop (1440x900) and mobile (375x812) scores; buckets are 0 to 100. The engine scores against Material 3 conventions and this app does not use Material, so a radius or target-size rule is advisory unless it is also a WCAG failure.

## UX deterministic

| Screen | Rule findings | P1 | P2 | P3 | Probe findings | Design |
|---|---|---|---|---|---|---|
| empty-desktop | 9 | 3 | 6 | 0 | 1 | 42.1 |
| empty-mobile | 9 | 3 | 6 | 0 | 0 | 42.1 |
| form-errors-desktop | failed: clickText: no visible control "Add my first loan" | – | – | – | – | – |
| form-errors-mobile | failed: clickText: no visible control "Add my first loan" | – | – | – | – | – |
| loans-desktop | 9 | 3 | 6 | 0 | 1 | 42.1 |
| loans-mobile | 9 | 3 | 6 | 0 | 0 | 42.1 |
| plans-desktop | failed: clickTab: no section button for plans | – | – | – | – | – |
| plans-mobile | failed: clickTab: no section button for plans | – | – | – | – | – |
| payoff-desktop | failed: clickTab: no section button for payoff | – | – | – | – | – |
| payoff-mobile | failed: clickTab: no section button for payoff | – | – | – | – | – |
| records-desktop | failed: clickTab: no section button for records | – | – | – | – | – |
| records-mobile | failed: clickTab: no section button for records | – | – | – | – | – |

Distinct findings, with how many screens show each:

- P1 No @media (prefers-reduced-motion: reduce) rule found (4 screens)
- P1 6 to 7 text node(s) below WCAG contrast (4.5:1 normal / 3:1 large). (4 screens)
- P1 1 transition(s) animate layout props (width/height/top/left/margin) (4 screens)
- P2 1 infinite decorative loop(s) (4 screens)
- P2 Missing landmark(s): main, nav, contentinfo. (4 screens)
- P2 1 movement animation(s) using linear easing (4 screens)
- P2 No <h1> found (4 screens)
- P2 1 pointer target(s) smaller than M3's comfortable 48×48px at 1440px wide (2 screens)
- P2 6 reading-copy text node(s) below 16px (or any text below 11px). (4 screens)
- P2 1 tap target(s) smaller than M3's comfortable 48×48px at 375px wide (2 screens)
- P3 Primary controls show no hover feedback (2 screens)

These are rule findings only. UX scores come from the AI review, which reads ux/<screen>.jpg and ux/<screen>.dom.json and writes ux/ai/<screen>.json; then `node lib/merge-ux.mjs <results>/ux` scores and merges them.

## Responsive overflow

| State | 320 | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| empty | ok, 843 px | ok, 813 px | ok, 1025 px | ok, 769 px | ok, 901 px |
| form-errors | failed | failed | failed | failed | failed |
| loans | ok, 843 px | ok, 813 px | ok, 1025 px | ok, 769 px | ok, 901 px |
| plans | failed | failed | failed | failed | failed |
| payoff | failed | failed | failed | failed | failed |
| records | failed | failed | failed | failed | failed |

0 of 30 pages scroll sideways. Each cell: horizontal overflow (document scrollWidth beyond the viewport), then page height. Full-page screenshots are in responsive/.

## INP probe

| CPU | Loans | Runs | tabToPlans | typeIncome5 | tabToPayoff | dragSlider30 | typeExtra3 | tabToRecords | tabToLoans |
|---|---|---|---|---|---|---|---|---|---|
| 1x | 8 | 0 (2 failed) | – | – | – | – | – | – | – |
| 1x | 25 | 0 (2 failed) | – | – | – | – | – | – | – |
| 1x | 60 | 0 (2 failed) | – | – | – | – | – | – | – |
| 4x | 8 | 0 (2 failed) | – | – | – | – | – | – | – |
| 4x | 25 | 0 (2 failed) | – | – | – | – | – | – | – |
| 4x | 60 | 0 (2 failed) | – | – | – | – | – | – | – |

Each cell: the worst Event Timing interaction in ms that started inside the step, then main-thread task ms in parentheses, the higher of the runs. 0 means no interaction reached 16 ms. The page stops scrolling before every step and each field is centred before typing, so no click lands mid-scroll or on the edge of the viewport.

## What a borrower sees and when

| Scenario | First paint | Real content | Readable | LCP (in page) |
|---|---|---|---|---|
| First visit (1 of 1 loads failed) | – | – | – | – |
| Returning, eight loans (1 of 1 loads failed) | – | – | – | – |

One cold load per scenario, each in a fresh browser, on slow 4G and 4x CPU applied for real with devtools throttling, at 412x823 and DPR 1.75; ms from navigation start. First paint is Paint Timing's first-paint, the skeleton here. Real content is the first frame with `main h1` and no skeleton, readable the first frame with the first `.rise` block fully faded in. FCP and the other marks are in readable.json.

Lighthouse's simulated LCP sees only the skeleton for this app (1832 ms on the empty mobile page in this run), so the Scoreboard's LCP is not when a borrower can read anything: the Readable column is.

## Site tools

| Tool | Result |
|---|---|
| header-check | score 40: 4 good, 1 warnings, 5 missing |
| meta-validate | score 67: 10 good, 3 warnings, 2 missing |
| structured-data | 0 schemas, 0 errors, 0 warnings |
| sitemap-validate | not found (Sitemap not found at https://loan-lab.vercel.app/sitemap.xml. HTTP 404) |
| redirect-check | 0 redirects, final status 200: No redirects detected. URL resolves directly. |
| broken-links | 11 links, 0 broken, 0 redirects, 0 errors, 0 timeouts |
| webmcp-check | AI readiness 0 |
