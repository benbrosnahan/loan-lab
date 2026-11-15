// Loan Lab plan data. Every number here is traced to the primary source named
// beside it. Re-check the citation before changing a value.

import { PlanId, PlanStatus } from "@/types";

/**
 * 2026 HHS poverty guidelines, 48 contiguous states and DC (aspe.hhs.gov,
 * published January 2026): $15,960 for one person, $5,680 for each extra.
 * IBR uses 150% of the guideline for the borrower's family size
 * (34 CFR 685.209(b)(4)(ii), (b)(14)).
 */
export const POVERTY_BASE_2026 = 15960;
export const POVERTY_INCREMENT_2026 = 5680;

export function getPovertyLine(familySize: number): number {
  const n = Math.max(1, Math.floor(familySize || 1));
  return POVERTY_BASE_2026 + (n - 1) * POVERTY_INCREMENT_2026;
}

/**
 * Direct Subsidized and Unsubsidized undergraduate rate for loans first
 * disbursed July 1, 2026 through June 30, 2027 (studentaid.gov interest rates
 * page). It is a new-loan rate, not an average: older loans carry their own
 * year's rate. Update it each June for the next award year.
 */
export const UNDERGRAD_RATE_2026_27 = 6.52;

/** Tiered Standard term by total Direct Loan balance, 34 CFR 685.208(c)(1)(iii). */
export const TIERED_STANDARD_TERMS: { maxBalance: number; years: number }[] = [
  { maxBalance: 25000, years: 10 },
  { maxBalance: 50000, years: 15 },
  { maxBalance: 100000, years: 20 },
  { maxBalance: Infinity, years: 25 },
];

/** Standard (685.208(b)(1)(ii)) and Tiered Standard ((c)(1)(ii)) are at least $50 a month. */
export const FIXED_PLAN_MIN_PAYMENT = 50;

export function getTieredStandardYears(balance: number): number {
  return (
    TIERED_STANDARD_TERMS.find((t) => balance < t.maxBalance)?.years ?? 25
  );
}

/** RAP: $10 floor (685.209(g)(3)(ii)) and $50 off per dependent ((f)(5)). */
export const RAP_MIN_MONTHLY = 10;
export const RAP_DEPENDENT_CREDIT = 50;

/** RAP annual base payment by AGI, 34 CFR 685.209(b)(2)(i)-(xi), verbatim. */
export function rapAnnualBasePayment(agi: number): number {
  if (agi <= 10000) return 120;
  if (agi <= 20000) return agi * 0.01;
  if (agi <= 30000) return agi * 0.02;
  if (agi <= 40000) return agi * 0.03;
  if (agi <= 50000) return agi * 0.04;
  if (agi <= 60000) return agi * 0.05;
  if (agi <= 70000) return agi * 0.06;
  if (agi <= 80000) return agi * 0.07;
  if (agi <= 90000) return agi * 0.08;
  if (agi <= 100000) return agi * 0.09;
  return agi * 0.1;
}

/**
 * 2026 federal income tax (IRS, Rev. Proc. 2025-32). Used to estimate the tax
 * on a balance forgiven at the end of IBR or RAP: Pub. L. 119-21 sec. 70119
 * kept the IRC 108(f)(5) exclusion after 2025 only for death and disability
 * discharges, so that balance is taxable income in the year it is forgiven.
 * PSLF forgiveness stays excluded under 108(f)(1) and is never taxed here.
 */
export const FEDERAL_TAX_2026 = {
  single: {
    standardDeduction: 16100,
    brackets: [
      { upTo: 12400, rate: 0.1 },
      { upTo: 50400, rate: 0.12 },
      { upTo: 105700, rate: 0.22 },
      { upTo: 201775, rate: 0.24 },
      { upTo: 256225, rate: 0.32 },
      { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  },
  joint: {
    standardDeduction: 32200,
    brackets: [
      { upTo: 24800, rate: 0.1 },
      { upTo: 100800, rate: 0.12 },
      { upTo: 211400, rate: 0.22 },
      { upTo: 403550, rate: 0.24 },
      { upTo: 512450, rate: 0.32 },
      { upTo: 768700, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  },
} as const;

/** Employee Social Security and Medicare tax, 7.65%, for the take-home estimate. */
export const FICA_RATE = 0.0765;
/** A stated guess at state and local income tax, for the take-home estimate only. */
export const STATE_TAX_GUESS = 0.04;

export const PLAN_META: Record<
  PlanId,
  {
    name: string;
    tagline: string;
    status: PlanStatus;
    statusLabel?: string;
    definition: string;
    pros: string[];
    cons: string[];
  }
> = {
  standard: {
    name: "Standard 10-Year",
    tagline: "Fixed payments, done in 10 years",
    status: "legacy_only",
    statusLabel: "Loans before July 2026",
    definition:
      "The same payment every month for 10 years, at least $50. Only open if every loan was paid out before July 1, 2026.",
    pros: [
      "Least interest of the repayment plans, since the term is short",
      "Counts toward Public Service Loan Forgiveness (PSLF)",
      "No yearly income paperwork",
    ],
    cons: [
      "The highest monthly payment",
      "The payment does not drop if your income does",
    ],
  },
  graduated: {
    name: "Graduated",
    tagline: "Starts low, steps up every 2 years",
    status: "legacy_only",
    statusLabel: "Loans before July 2026",
    definition:
      "Starts a little over half the Standard payment and steps up every two years, ending in 10. The last payment can be up to three times the first. Only open if every loan was paid out before July 1, 2026.",
    pros: [
      "A lower start while your income grows",
      "Still done in 10 years",
    ],
    cons: [
      "More total interest than Standard",
      "Steps up whether your income does or not",
      "Early payments are below Standard, so those months earn no PSLF credit",
      "The steps shown are a model. Your servicer sets the exact schedule",
    ],
  },
  ibr: {
    name: "IBR",
    tagline: "Payment tied to your income",
    status: "legacy_only",
    statusLabel: "Loans before July 2026",
    definition:
      "10% of your AGI above 150% of the poverty line, never more than the Standard payment. It can be $0, and $0 still counts. What is left after 20 years is forgiven. Only open if every loan was paid out before July 1, 2026.",
    pros: [
      "Often the lowest payment, since income below the poverty floor is not counted",
      "A $0 payment still counts toward forgiveness and PSLF",
      "Forgiveness at 20 years, 10 sooner than RAP",
    ],
    cons: [
      "Interest your payment does not cover keeps adding up, so you can owe more over time",
      "Forgiveness at 20 years is taxed as federal income",
      "You recertify your income every year",
      "If you had federal loans before July 2014, it is 15% and 25 years",
    ],
  },
  tiered_standard: {
    name: "Tiered Standard",
    tagline: "Fixed payments, term set by your balance",
    status: "new",
    statusLabel: "New July 2026",
    definition:
      "Fixed payments, at least $50, over a term set by your balance: 10 years under $25,000, 15 under $50,000, 20 under $100,000, 25 above. For anyone with a loan paid out on or after July 1, 2026. No PSLF credit in any tier.",
    pros: [
      "A predictable payment, no income paperwork",
      "Lower monthly than 10 years when your balance is large",
    ],
    cons: [
      "Earns no PSLF credit, in any tier, including the 10-year one",
      "Nothing is forgiven at the end",
      "A longer term means more interest",
      "Where you land if you never pick a plan",
    ],
  },
  rap: {
    name: "RAP",
    tagline: "Income-driven, and the balance always shrinks",
    status: "new",
    statusLabel: "New July 2026",
    definition:
      "The Repayment Assistance Plan: 1% to 10% of your whole AGI, minus $50 a month per dependent, at least $10. Interest your on-time payment does not cover is waived. What is left after 30 years is forgiven.",
    pros: [
      "Unpaid interest is waived, never added",
      "ED adds up to $50 a month to principal (the lesser of $50 or your payment), so the balance always falls",
      "Counts toward PSLF",
      "Open whenever your loans were paid out",
    ],
    cons: [
      "Counts all your income, not just income above the poverty line",
      "30 years to forgiveness, 10 more than IBR",
      "Forgiveness is taxed as federal income",
      "No cap, so high earners can pay more than Standard",
    ],
  },
  pslf: {
    name: "PSLF",
    tagline: "Forgiveness after 120 payments in public service",
    status: "active",
    definition:
      "Public Service Loan Forgiveness cancels what is left after 120 qualifying payments while you work full time (30+ hours a week) for a government agency or qualifying nonprofit. The payments do not have to be in a row. The forgiven amount is not taxed.",
    pros: [
      "Everything left after 120 payments is cancelled",
      "Not taxed as federal income, unlike IBR or RAP forgiveness",
      "You pay a small income-driven amount the whole time",
    ],
    cons: [
      "Needs full-time qualifying work when you make the 120th payment and when you apply",
      "IBR, RAP and 10-year Standard payments count. Tiered Standard never does",
      "Leave public service early and the clock pauses until you return",
      "Only worth it if a balance would be left at payment 120",
    ],
  },
};

export const SAVE_ENDED_WARNING =
  "A court ended the SAVE plan in March 2026. If you were on it, your servicer's notice gives you 90 days to pick a new plan, then a final 30-day notice. Do nothing and you are put on Standard, or Tiered Standard if a loan from July 2026 or later is in repayment. Months in the SAVE forbearance earn no PSLF credit, but you can buy back those months once you have 120 months of qualifying work. PAYE and ICR end by July 1, 2028.";

export const TIERED_STANDARD_PSLF_WARNING =
  "Tiered Standard payments never count toward PSLF, in any tier, including the 10-year one. Pick RAP to keep PSLF open.";

export const TIERED_STANDARD_DEFAULT_WARNING =
  "This is where you land if you never pick a plan. No forgiveness, and no PSLF credit.";

export const POST_2026_LOCKOUT_WARNING =
  "One loan paid out on or after July 1, 2026 closes Standard, Graduated, Extended and IBR for all your loans, including older ones. RAP and Tiered Standard are left.";

export const DISBURSEMENT_UNKNOWN_WARNING =
  "You were not sure when your loans were paid out, so this shows every plan. If any loan came on or after July 1, 2026 (true for most students borrowing this school year), only RAP and Tiered Standard are open. Check the dates under My Aid on studentaid.gov.";

export const CONSOLIDATION_WARNING =
  "Think twice before consolidating. A consolidation loan is a new loan, so one made now closes IBR for everything you owe, can lower the payments already counted toward forgiveness, and never lowers your rate (it is the weighted average, rounded up). FFEL and Perkins loans are the exception: they usually need consolidating to use RAP or PSLF.";

export const IDR_TAX_WARNING =
  "Forgiveness at the end of IBR or RAP is taxed as federal income under current law. The exclusion that covered it ended December 31, 2025, and was kept only for death and disability. Nothing is withheld, so the bill comes with that year's return. PSLF forgiveness is not taxed.";

export const TEACHER_FORGIVENESS_INFO =
  "Teaching? Teacher Loan Forgiveness cancels up to $17,500 (secondary math, science or special education) or $5,000 (other subjects) after 5 full years at a low-income school. The same years cannot count toward both it and PSLF: take it and PSLF needs 120 more payments after it. If PSLF would forgive more, it usually wins.";

export const LOAN_SCOPE_NOTE =
  "This prices Direct Loans you borrowed for your own education. Parent PLUS, FFEL and Perkins loans follow different rules: check studentaid.gov, or use Loan Desk, which handles Parent PLUS.";

/**
 * MONEY-05: projections hold income flat (Ben confirmed 2026-11-15). Said in plain words next to the numbers,
 * not only in the fine print, because a student whose pay will rise sees payments too low and forgiveness too high.
 */
export function flatIncomeNote(income: number): string {
  const amount = `$${Math.round(income).toLocaleString("en-US")}`;
  return `These numbers assume your income stays at ${amount} a year the whole time. If you earn more later, IBR, RAP and PSLF payments rise with it, so you would pay more and have less forgiven than shown.`;
}

export const FLAT_INCOME_CARD_NOTE = "Assumes your income never changes. A raise means a higher payment.";

export const ASSUMPTIONS =
  "Estimates. Income is held flat for the whole term, so if it rises, IBR and RAP cost more and forgive less. Payments start this month. Tax on forgiveness is federal only, at 2026 brackets. Poverty lines are the 2026 figures for the 48 states and DC.";

export const LEGAL_DISCLAIMER =
  "Estimates for learning, not financial advice. Your servicer sets your actual payment, and studentaid.gov is the authority on your loans.";

/** Autopay rate cut: 1 point through June 30, 2028 for Direct Loans paid out on or after July 1, 2012, if enrolled by Dec. 31, 2026 (studentaid.gov SAVE FAQ, Oct. 2026). */
export const AUTOPAY_DEADLINE = "2027-01-01T05:00:00Z";

export const LOAN_DESK_URL =
  "https://cense-loan-desk.vercel.app/?utm_source=loan-lab&utm_medium=tool&utm_campaign=loan-lab-footer";
