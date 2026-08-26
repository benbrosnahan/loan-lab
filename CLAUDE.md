# Loan Lab — Claude Code Spec

## Overview

Build **Loan Lab**: a polished, 5-step quiz that helps college students understand their student loan repayment options and get a personalized recommendation. The user answers a few plain-English questions and lands on a results page comparing their four main repayment strategies with a clear "best for you" recommendation.

This is a **newsletter tool** — it needs to be fast to load, shareable via URL, and completable in under 3 minutes. No login. No data stored server-side. Zero friction.

**Live debt dashboard to link to at end of results:** https://app-one-rosy-18.vercel.app/?utm_source=cense.beehiiv.com&utm_medium=newsletter&utm_campaign=so-you-want-to-pay-off-your-credit-card

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (for step transitions and results reveal — same pattern as cc-recommender)
- **Deployment:** Vercel

Before writing any code, read the Next.js docs in `node_modules/next/dist/docs/` to confirm current App Router conventions.

---

## File Structure

```
loan-lab/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                    ← Quiz orchestrator (step state, reducer)
│   │   └── results/
│   │       └── page.tsx                ← Results page (reads from sessionStorage)
│   ├── components/
│   │   ├── quiz/
│   │   │   ├── QuizShell.tsx           ← Progress bar + centered layout wrapper
│   │   │   ├── StepLoanType.tsx        ← Step 1: federal / private / both / unsure
│   │   │   ├── StepLoanDetails.tsx     ← Step 2: balance + interest rate inputs
│   │   │   ├── StepIncome.tsx          ← Step 3: income + family size
│   │   │   ├── StepEmployment.tsx      ← Step 4: employer type (PSLF eligibility)
│   │   │   └── StepPriority.tsx        ← Step 5: what matters most
│   │   ├── results/
│   │   │   ├── RecommendationBanner.tsx  ← "Best for you" highlighted callout
│   │   │   ├── PlanCard.tsx              ← Single repayment plan card
│   │   │   ├── ComparisonTable.tsx       ← Side-by-side table (desktop)
│   │   │   └── WarningFlags.tsx          ← Amber warning/tip section
│   │   └── shared/
│   │       ├── ProgressBar.tsx
│   │       ├── SelectionCard.tsx
│   │       ├── NumberInput.tsx          ← Styled number input with label + helper text
│   │       └── Nav.tsx
│   ├── lib/
│   │   ├── calculator.ts               ← All repayment math (see spec below)
│   │   └── utils.ts
│   ├── data/
│   │   └── plans.ts                    ← Plan definitions, poverty line table
│   └── types/
│       └── index.ts
```

---

## Visual Design System

Copy the cc-recommender's aesthetic exactly. This keeps the Cense suite visually consistent.

**Colors:**
- Primary navy: `#1E3A5F`
- Primary hover: `#16304F`
- Selected card bg: `#EEF3F9`
- Green (savings/forgiveness): `#22C55E`
- Amber (warnings/tips): `#F59E0B`
- Red (danger): `#EF4444`
- Body text: `text-slate-800`
- Secondary text: `text-slate-500`
- Background: `bg-white` or `bg-slate-50` for the page
- Border: `border-slate-200`

**Typography:**
- Step headings: `text-2xl sm:text-3xl font-bold text-slate-900`
- Helper text (plain-language definitions): `text-xs text-slate-400 mt-0.5 leading-snug`
- Card labels: `text-sm font-semibold`

**Layout:**
- Quiz max width: `max-w-xl` centered
- Results max width: `max-w-4xl` centered
- Mobile-first; all steps must look good at 375px wide

**Interactions:**
- Continue button: disabled + `opacity-40` until a valid selection is made
- SelectionCard: border-2 highlight on selection (same as cc-recommender)
- Step transitions: Framer Motion slide — entering step slides in from the right (+60px), exiting slides out to the left, with `Back` reversing directions. Duration 0.28s, ease `easeInOut`.
- Results cards: staggered fade-up on mount (0.15s stagger between cards)

---

## Quiz Flow — All 5 Steps

### Step 1: Loan Type

**Heading:** `What kind of student loans do you have?`
**Subheading:** `This determines which repayment options are available to you.`

**Below the heading, add this definition block (small gray text, always visible — NOT a tooltip):**
> *Federal loans come directly from the U.S. government and offer the most repayment options, including income-based plans and forgiveness programs. Private loans come from banks or lenders like Sallie Mae and have fewer protections.*

**Options (SelectionCard):**
| Value | Label | Description |
|---|---|---|
| `federal` | Federal loans only | Stafford, Direct, or PLUS loans — from the government |
| `private` | Private loans only | From a bank, credit union, or lender like Sallie Mae |
| `both` | I have both | A mix of federal and private loans |
| `unsure` | Not sure | I'll look it up at studentaid.gov |

Auto-advance to next step on selection (no separate Continue button needed here).

---

### Step 2: Loan Details

**Heading:** `Tell us about your loans`
**Subheading:** `We'll use this to estimate your payments. You can always re-run with different numbers.`

**Show for federal/both/unsure:**
- Label: `Total federal loan balance` — Input: dollar amount, placeholder `e.g. 28000`
- Helper text: *"You can find this at studentaid.gov under "My Aid"*
- Label: `Average interest rate` — Input: percentage, placeholder `e.g. 5.5`
- Helper text: *"Your rate is shown next to each loan on studentaid.gov. If you have multiple loans, use the highest rate or average them."*

**Show additionally for private/both:**
- Label: `Total private loan balance` — dollar amount, placeholder `e.g. 12000`
- Label: `Average private loan interest rate` — percentage, placeholder `e.g. 7.2`

**Note shown for private/both loans (amber tinted box):**
> ⚠️ Income-based repayment and forgiveness programs only apply to federal loans. Private loans will be shown separately.

Continue button enabled when all visible required fields have values > 0.

---

### Step 3: Income & Family Size

**Heading:** `What's your annual income?`
**Subheading:** `Income-based repayment plans tie your monthly payment to what you earn. Use your expected salary if you haven't started working yet — you can re-run this anytime.`

**Fields:**
- Label: `Annual income before taxes` — Input: dollar amount, placeholder `e.g. 52000`
- Helper text: *"Not working yet? Enter your best guess for your first job. Even $0 works — it'll show you options for when you're in school or unemployed."*

**Then, family size as SelectionCard grid:**
**Label:** `How many people are in your household?`
**Helper text:** *"This affects how "discretionary income" is calculated under income-based plans — larger households get a bigger exemption."*

Options (small cards, 2-column grid):
- `1` — Just me
- `2` — Me + partner or dependent
- `3` — Family of 3
- `4` — Family of 4
- `5+` — Family of 5 or more

---

### Step 4: Where Do You Work?

**Heading:** `Where do you work — or plan to work?`
**Subheading:** `Your employer type determines whether you qualify for Public Service Loan Forgiveness (PSLF) — a program that cancels your remaining federal loan balance after 10 years.`

**Definition block (always visible):**
> *PSLF — Public Service Loan Forgiveness — is a federal program that forgives 100% of your remaining loan balance after you make 10 years of qualifying payments while working full-time for the government or a qualifying nonprofit. The forgiven amount is tax-free.*

**Options (SelectionCard):**
| Value | Label | Description |
|---|---|---|
| `government` | Government | Federal, state, or local government agency |
| `education` | Education | Public school, university, community college |
| `nonprofit` | Nonprofit | 501(c)(3) organization |
| `private` | Private company | For-profit employer or corporation |
| `self_employed` | Self-employed | Freelance, contractor, or own your own business |
| `unsure` | Not sure yet | I'm still figuring it out |

**After selection, show a conditional note:**
- If `government`, `education`, or `nonprofit`: Show green banner — *"✓ You may qualify for PSLF. We'll include that option in your results."*
- If `private` or `self_employed`: Show gray note — *"PSLF requires government or nonprofit employment. We'll show you the best alternatives."*
- If `unsure`: Show gray note — *"No problem — we'll show all options including PSLF so you can see what's possible."*

---

### Step 5: What Matters Most?

**Heading:** `What's your main goal with your student loans?`
**Subheading:** `Pick the one that best describes where you're at right now.`

**Options (SelectionCard):**
| Value | Label | Description |
|---|---|---|
| `low_payment` | Keep payments as low as possible | I need room in my budget right now |
| `least_total` | Pay the least overall | I'm okay with higher payments to save on interest |
| `fastest` | Pay off loans as fast as possible | I want to be debt-free as quickly as I can |
| `forgiveness` | Explore loan forgiveness | I want to see if my loans can be cancelled |

---

## Calculator Logic (`src/lib/calculator.ts`)

This is the core of the app. Implement it precisely.

### Constants

```typescript
// 2025 Federal Poverty Lines (continental US)
export const POVERTY_LINE: Record<number, number> = {
  1: 15060,
  2: 20440,
  3: 25820,
  4: 31200,
  5: 36580, // 5 or more: add $5,380 per person
};

export function getPovertyLine(familySize: number): number {
  if (familySize <= 1) return POVERTY_LINE[1];
  if (familySize >= 5) return POVERTY_LINE[5] + (familySize - 5) * 5380;
  return POVERTY_LINE[familySize];
}
```

### Standard 10-Year Plan

```typescript
function calcStandard(balance: number, annualRate: number): PlanResult {
  const r = annualRate / 100 / 12;
  const n = 120; // 10 years
  const payment = r === 0
    ? balance / n
    : balance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPaid = payment * n;
  const totalInterest = totalPaid - balance;

  return {
    id: 'standard',
    name: 'Standard 10-Year',
    tagline: 'Fixed payments, out in a decade',
    monthlyPayment: payment,
    totalPaid,
    totalInterest,
    payoffYears: 10,
    forgivenAmount: 0,
    isEligible: true,
  };
}
```

### IBR — Income-Based Repayment

```typescript
function calcIBR(
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number
): PlanResult {
  const povertyLine = getPovertyLine(familySize);
  const discretionary = Math.max(0, annualIncome - 1.5 * povertyLine);
  const monthlyPayment = Math.max(0, (discretionary * 0.10) / 12);

  // Simulate 240 months (20 years) with 3% annual income growth
  // Assume interest does NOT capitalize (simplified — IBR has some capitalization rules
  // but for illustrative purposes we skip that complexity)
  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentMonthlyPayment = monthlyPayment;
  const INCOME_GROWTH_MONTHLY = Math.pow(1.03, 1 / 12);
  let currentIncome = annualIncome;

  for (let month = 0; month < 240; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
      const newDiscretionary = Math.max(0, currentIncome - 1.5 * povertyLine);
      currentMonthlyPayment = Math.max(0, (newDiscretionary * 0.10) / 12);
    }

    const interestAccrued = remainingBalance * monthlyRate;
    const principalPaid = Math.max(0, currentMonthlyPayment - interestAccrued);
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += currentMonthlyPayment;

    if (remainingBalance <= 0) {
      // Paid off early
      return {
        id: 'ibr',
        name: 'IBR',
        tagline: 'Payments tied to your income',
        monthlyPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
        isEligible: true,
      };
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);

  return {
    id: 'ibr',
    name: 'IBR',
    tagline: 'Payments tied to your income',
    monthlyPayment,
    totalPaid,
    totalInterest: totalPaid - (balance - forgivenAmount),
    payoffYears: 20,
    forgivenAmount,
    isEligible: true,
  };
}
```

### SAVE Plan

```typescript
function calcSAVE(
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number
): PlanResult {
  const povertyLine = getPovertyLine(familySize);
  const discretionary = Math.max(0, annualIncome - 2.25 * povertyLine);
  const monthlyPayment = Math.max(0, (discretionary * 0.05) / 12); // 5% for undergrad

  // Forgiveness timeline:
  // Balance <= $12,000 → 10 years (120 months)
  // Balance $12,000–$24,000 → 10 to 20 years (scaled linearly)
  // Balance > $24,000 → 20 years (240 months)
  let forgivenesMonths: number;
  if (balance <= 12000) {
    forgivenesMonths = 120;
  } else if (balance <= 24000) {
    forgivenesMonths = 120 + Math.floor(((balance - 12000) / 12000) * 120);
  } else {
    forgivenesMonths = 240;
  }

  // SAVE: government covers unpaid interest, so balance never grows above original
  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentIncome = annualIncome;

  for (let month = 0; month < forgivenesMonths; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
      const newDiscretionary = Math.max(0, currentIncome - 2.25 * povertyLine);
      // Update payment but don't let it exceed what's needed
    }

    const interestAccrued = remainingBalance * monthlyRate;
    const principalPaid = Math.max(0, monthlyPayment - interestAccrued);
    // SAVE covers any interest not covered by payment
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += monthlyPayment;

    if (remainingBalance <= 0) {
      return {
        id: 'save',
        name: 'SAVE Plan',
        tagline: 'Lowest payments, interest protection',
        monthlyPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
        isEligible: true,
      };
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);

  return {
    id: 'save',
    name: 'SAVE Plan',
    tagline: 'Lowest payments, interest protection',
    monthlyPayment,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - (balance - forgivenAmount)),
    payoffYears: forgivenesMonths / 12,
    forgivenAmount,
    isEligible: true,
  };
}
```

### PSLF

```typescript
function calcPSLF(
  saveResult: PlanResult,
  ibrResult: PlanResult,
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number
): PlanResult {
  // PSLF: make IDR payments for 120 months (10 years), remainder forgiven tax-free
  // Use whichever IDR plan gives a lower payment
  const monthlyPayment = Math.min(saveResult.monthlyPayment, ibrResult.monthlyPayment);

  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentIncome = annualIncome;
  const povertyLine = getPovertyLine(familySize);

  for (let month = 0; month < 120; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
    }

    const interestAccrued = remainingBalance * monthlyRate;
    const principalPaid = Math.max(0, monthlyPayment - interestAccrued);
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += monthlyPayment;

    if (remainingBalance <= 0) {
      return {
        id: 'pslf',
        name: 'PSLF',
        tagline: 'Full forgiveness after 10 years of public service',
        monthlyPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
        isEligible: true,
        pslfEligible: true,
      };
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);

  return {
    id: 'pslf',
    name: 'PSLF',
    tagline: 'Full forgiveness after 10 years of public service',
    monthlyPayment,
    totalPaid,
    totalInterest: 0, // tax-free forgiveness, total "cost" is just what you paid
    payoffYears: 10,
    forgivenAmount,
    isEligible: true,
    pslfEligible: true,
  };
}
```

### Recommendation Logic

```typescript
export function getRecommendation(
  plans: PlanResult[],
  priority: Priority,
  pslfEligible: boolean
): { recommendedId: string; reason: string } {
  if (priority === 'forgiveness' && pslfEligible) {
    const savingsVsStandard = plans.find(p => p.id === 'standard')!.totalPaid
      - plans.find(p => p.id === 'pslf')!.totalPaid;
    return {
      recommendedId: 'pslf',
      reason: `PSLF will forgive your remaining balance after 10 years of public service payments — potentially saving you ${formatCurrency(savingsVsStandard)} compared to the Standard Plan.`
    };
  }
  if (priority === 'low_payment') {
    const save = plans.find(p => p.id === 'save')!;
    const standard = plans.find(p => p.id === 'standard')!;
    const savings = standard.monthlyPayment - save.monthlyPayment;
    return {
      recommendedId: 'save',
      reason: `The SAVE Plan gives you the lowest monthly payment — ${formatCurrency(savings)}/month less than the Standard Plan — with government-covered interest so your balance never grows.`
    };
  }
  if (priority === 'least_total') {
    // Standard usually wins unless PSLF forgiveness is massive
    const standard = plans.find(p => p.id === 'standard')!;
    if (pslfEligible) {
      const pslf = plans.find(p => p.id === 'pslf')!;
      if (pslf.totalPaid < standard.totalPaid) {
        return {
          recommendedId: 'pslf',
          reason: `Given your public sector work, PSLF actually costs you less total than paying off the full balance — ${formatCurrency(standard.totalPaid - pslf.totalPaid)} less.`
        };
      }
    }
    return {
      recommendedId: 'standard',
      reason: `The Standard Plan minimizes total interest paid. You'll pay ${formatCurrency(standard.totalInterest)} in interest over 10 years — the lowest of any plan (assuming no forgiveness).`
    };
  }
  if (priority === 'fastest') {
    return {
      recommendedId: 'standard',
      reason: `The Standard Plan has you completely debt-free in exactly 10 years with predictable fixed payments every month.`
    };
  }
  // Default
  return {
    recommendedId: 'save',
    reason: `Given your situation, the SAVE Plan offers the best balance of low payments and long-term flexibility.`
  };
}
```

### Main Entry Point

```typescript
export function calculatePlans(answers: QuizAnswers): CalculationResult {
  const { federalBalance, federalRate, privateBalance, privateRate,
          income, familySize, employment, priority } = answers;

  const pslfEligible = ['government', 'education', 'nonprofit'].includes(employment);

  const plans: PlanResult[] = [];

  if (federalBalance > 0) {
    const standard = calcStandard(federalBalance, federalRate);
    const ibr = calcIBR(federalBalance, federalRate, income, familySize);
    const save = calcSAVE(federalBalance, federalRate, income, familySize);
    plans.push(standard, ibr, save);

    if (pslfEligible) {
      const pslf = calcPSLF(save, ibr, federalBalance, federalRate, income, familySize);
      plans.push(pslf);
    }
  }

  const { recommendedId, reason } = getRecommendation(plans, priority, pslfEligible);

  return {
    plans,
    recommendedId,
    recommendationReason: reason,
    quizAnswers: answers,
    pslfEligible,
    hasFederal: federalBalance > 0,
    hasPrivate: (privateBalance ?? 0) > 0,
  };
}
```

---

## Types (`src/types/index.ts`)

```typescript
export type LoanType = 'federal' | 'private' | 'both' | 'unsure';
export type Employment = 'government' | 'education' | 'nonprofit' | 'private' | 'self_employed' | 'unsure';
export type Priority = 'low_payment' | 'least_total' | 'fastest' | 'forgiveness';

export interface QuizAnswers {
  loanType: LoanType | null;
  federalBalance: number;
  federalRate: number;
  privateBalance: number;
  privateRate: number;
  income: number;
  familySize: number;
  employment: Employment | null;
  priority: Priority | null;
}

export interface PlanResult {
  id: 'standard' | 'ibr' | 'save' | 'pslf';
  name: string;
  tagline: string;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  payoffYears: number;
  forgivenAmount: number;
  isEligible: boolean;
  pslfEligible?: boolean;
}

export interface CalculationResult {
  plans: PlanResult[];
  recommendedId: string;
  recommendationReason: string;
  quizAnswers: QuizAnswers;
  pslfEligible: boolean;
  hasFederal: boolean;
  hasPrivate: boolean;
}
```

---

## Results Page Design

Pass data from quiz to results via `sessionStorage` (same pattern as cc-recommender: `sessionStorage.setItem('loan-lab-result', JSON.stringify(result))`).

### Layout (top to bottom):

**1. Header**
```
Your repayment options
Based on a $[X] federal balance at [X]% interest on a $[X] income.
```

**2. Recommendation Banner** (green-bordered card, full width)
```
✓ Our recommendation: [PLAN NAME]
[recommendationReason]
```

**3. Plan Cards** — 2×2 grid on desktop, stacked single column on mobile
Each `PlanCard` shows:

```
[PLAN NAME]                    [BEST MATCH badge if recommended]
[tagline]

What is this?
[1-sentence plain English definition — hardcoded per plan]

Monthly payment    $[X]
Total paid         $[X]
Total interest     $[X]
Payoff timeline    [X] years
Amount forgiven    $[X]  ← only show row if forgivenAmount > 0, in green
```

**Plain-language "What is this?" definitions per plan:**
- **Standard:** Fixed payments spread evenly over exactly 10 years. No income math — same payment every month regardless of what you earn.
- **IBR:** Income-Based Repayment caps your payment at 10% of your discretionary income (what you earn above a certain threshold). Payments can drop to $0 if income is very low. Any balance remaining after 20 years is forgiven.
- **SAVE Plan:** The newest income-driven plan (2024). Payments are even lower than IBR — just 5% of discretionary income for undergrad loans. The government covers any unpaid interest, so your balance can never grow. Any remaining balance is forgiven in 10–20 years depending on your original balance.
- **PSLF:** Public Service Loan Forgiveness cancels 100% of your remaining federal loan balance after 10 years of payments while working for the government or a qualifying nonprofit. The forgiven amount is completely tax-free.

**4. Warning Flags** (amber section, shown conditionally)

Show each flag only if the condition applies:

- If `hasPrivate === true`:
  > ⚠️ **Private loans aren't eligible for these plans.** IBR, SAVE, and PSLF only work for federal loans. For private loans, your main options are refinancing to a lower rate or accelerating payoff.

- Always show:
  > ⚠️ **Thinking about refinancing federal loans to private?** Don't — at least not without understanding the trade-off. Refinancing federal loans to private permanently removes access to IBR, SAVE, and PSLF. It's almost never worth it unless you have a high income and no interest in forgiveness.

- If `pslfEligible === false` and `income > 60000`:
  > 💡 **Your income is on the higher end.** For high earners, the Standard Plan often wins because income-based payments end up similar to standard payments anyway — but without the 20-year commitment.

- If `pslfEligible === true` and `recommendedId !== 'pslf'` and user priority !== 'forgiveness':
  > 💡 **You may qualify for PSLF.** Since you work in the public sector, you could have your remaining balance forgiven after 10 years. Consider whether loan forgiveness changes your priority — if so, retake the quiz and select "Explore forgiveness."

**5. Footer CTA**

```
Want to see all your debt in one place?
The Cense Debt Dashboard tracks every balance, compares payoff strategies, 
and tells you exactly what to pay and when.
[Open Debt Dashboard →]   (link to Decimal app URL)
```

**6. Retake link** (small, bottom center):
```
← Retake the quiz
```

---

## Inline Jargon Definitions

Every time a term appears that a student might not know, follow the label with a small gray definition on the next line. These are always visible — NOT tooltips or expandable. Examples:

- Under "Average interest rate" input: *Your interest rate is the percentage your lender charges per year on your loan balance. It's shown next to each loan on studentaid.gov.*
- Under the IBR plan name: *IBR — Income-Based Repayment — a federal repayment plan*
- Under "Discretionary income" if you reference it: *Discretionary income = your salary minus a poverty-line threshold. It's the portion the government considers "extra."*
- Under "Forgiven amount": *Loan forgiveness means the government cancels whatever balance remains — you don't have to pay it back.*

---

## nav / Header

Minimal header — just the Cense wordmark + "Loan Lab" subtitle on the left. No links. No hamburger menu. Keep the user focused on completing the quiz.

```
[C]  Cense  /  Loan Lab          No data stored. All calculations run locally.
```

---

## `package.json` Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18",
    "framer-motion": "^11",
    "tailwindcss": "^3",
    "typescript": "^5",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

## Formatting Utility

```typescript
// src/lib/utils.ts
export function formatCurrency(n: number): string {
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

export function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
```

---

## Key UX Rules (Do Not Compromise)

1. **One question or one concept per step.** Never put two unrelated questions on the same screen.
2. **Never use a financial term without immediately defining it** in small gray text beneath the label.
3. **Continue button is always disabled until the step is complete.** Never let users advance with missing data.
4. **Mobile-first sizing.** All tap targets minimum 44×44px. All input fields full-width on mobile.
5. **No data is stored server-side.** Display "No data stored. All calculations run locally." in the nav.
6. **Results animate in.** Use staggered Framer Motion fade-up (same as cc-recommender) — it makes results feel earned and trustworthy, not like a spreadsheet dump.
7. **Recommendation comes first.** The user should understand the takeaway before they see any tables.
8. **Numbers should be human-readable.** Use `$28.4k` not `$28,400` in compact contexts. Spell it out fully in the plan cards.

---

## Deployment

```bash
npm run build
vercel --prod
```

The app is stateless (no environment variables needed). It should deploy to Vercel in one command.

---

## Questions to Ask Ben Before Starting

Before writing code, ask these:

1. **App name/URL slug:** Should this live at `loan-lab.vercel.app` or something Cense-branded like `cense-loans.vercel.app`? Or a custom domain?
2. **SAVE Plan status:** The SAVE Plan was paused by courts in 2025. Should we show it as paused/uncertain in the UI, or present it as-is for illustrative purposes?
3. **Income input:** Should income be a free text number input (more precise, better math) or selection buckets (easier UX but less accurate)? Spec uses free text — confirm this is okay.
4. **Private loan handling:** For private loans, the app currently only shows warnings (no IDR options apply). Should we add a basic payoff calculator for private loans too (just standard amortization with extra payments)?
