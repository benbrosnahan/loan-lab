import { PlanId, PlanStatus } from "@/types";

// 2025 Federal Poverty Guidelines (48 contiguous states + DC)
export const POVERTY_LINE: Record<number, number> = {
  1: 15650,
  2: 21150,
  3: 26650,
  4: 32150,
  5: 37650,
};

const POVERTY_INCREMENT = 5500;

export function getPovertyLine(familySize: number): number {
  if (familySize <= 1) return POVERTY_LINE[1];
  if (familySize <= 5) return POVERTY_LINE[familySize];
  return POVERTY_LINE[5] + (familySize - 5) * POVERTY_INCREMENT;
}

// Direct Subsidized/Unsubsidized undergraduate rate for loans first disbursed
// July 1, 2026 through June 30, 2027.
export const AVERAGE_FEDERAL_RATE = 6.52;

// Tiered Standard Plan repayment term, set by total Direct Loan balance.
export const TIERED_STANDARD_TERMS: { maxBalance: number; years: number }[] = [
  { maxBalance: 25000, years: 10 },
  { maxBalance: 50000, years: 15 },
  { maxBalance: 100000, years: 20 },
  { maxBalance: Infinity, years: 25 },
];

export const TIERED_STANDARD_MIN_PAYMENT = 50;

export function getTieredStandardYears(balance: number): number {
  return (
    TIERED_STANDARD_TERMS.find((t) => balance < t.maxBalance)?.years ?? 25
  );
}

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
    tagline: "Fixed payments, out in a decade",
    status: "legacy_only",
    statusLabel: "Pre-July 2026 loans only",
    definition:
      "Fixed payments spread evenly over exactly 10 years. Same payment every month regardless of income. Counts toward Public Service Loan Forgiveness (PSLF). Only available if all of your loans were disbursed before July 1, 2026.",
    pros: [
      "Lowest total interest of any plan, since the term is the shortest",
      "Payments count toward Public Service Loan Forgiveness",
      "Fixed payment that never changes and no annual paperwork",
    ],
    cons: [
      "Highest monthly payment of any plan available to you",
      "No forgiveness at the end unless you are pursuing PSLF",
      "The payment does not drop if your income drops",
    ],
  },
  graduated: {
    name: "Graduated",
    tagline: "Start low, payments rise over time",
    status: "legacy_only",
    statusLabel: "Pre-July 2026 loans only",
    definition:
      "Payments start lower and increase every 2 years over 10 years. Good if your income is growing and you want predictable payments that aren’t tied to income. You’ll pay more total interest than Standard. Only available if all of your loans were disbursed before July 1, 2026.",
    pros: [
      "Starts at roughly half the Standard payment",
      "Still finishes in 10 years, and the schedule is predictable",
    ],
    cons: [
      "Payments do NOT count toward Public Service Loan Forgiveness",
      "You pay more total interest than Standard",
      "Payments step up every 2 years whether your income did or not",
    ],
  },
  ibr: {
    name: "IBR",
    tagline: "Payments tied to your income",
    status: "legacy_only",
    statusLabel: "Pre-July 2026 loans only",
    definition:
      "Caps your payment at 10% of discretionary income (what you earn above 150% of the poverty line). Payments drop to $0 if income is very low, and $0 still counts as a qualifying payment. Remaining balance forgiven after 20 years. Unpaid interest is added to your balance, so your balance can grow. Only available if all of your loans were disbursed before July 1, 2026.",
    pros: [
      "Usually the lowest monthly payment, since it only counts income above the poverty floor",
      "A $0 payment is possible and still counts as a qualifying payment",
      "Payments count toward Public Service Loan Forgiveness",
      "Balance forgiven after 20 years, which is 10 years sooner than RAP",
    ],
    cons: [
      "Unpaid interest is added to your balance, so your balance can grow for years",
      "Forgiveness after 20 years counts as taxable income",
      "You have to recertify your income every year or the payment jumps",
      "Closed to you if any loan was disbursed on or after July 1, 2026",
    ],
  },
  tiered_standard: {
    name: "Tiered Standard",
    tagline: "Fixed payments, term set by your balance",
    status: "new",
    statusLabel: "New plan",
    definition:
      "A fixed-payment plan launched July 1, 2026, available only if at least one of your loans was disbursed on or after that date. Your term is set by your balance rather than your income: 10 years under $25,000, 15 years to $50,000, 20 years to $100,000, and 25 years above that. There is no forgiveness at the end, and payments do NOT count toward Public Service Loan Forgiveness in any tier. This is the plan you get automatically if you never pick one.",
    pros: [
      "Predictable fixed payment with no annual income paperwork",
      "Lower monthly payment than the 10-year Standard plan if your balance is large",
      "One of only two plans open to you once any loan is disbursed on or after July 1, 2026",
    ],
    cons: [
      "Payments do NOT count toward Public Service Loan Forgiveness, in any tier",
      "No forgiveness at the end, ever",
      "A longer term means more total interest paid",
      "This is the plan you are placed in automatically if you ignore your notice",
    ],
  },
  rap: {
    name: "RAP",
    tagline: "Income-driven, with interest protection",
    status: "new",
    statusLabel: "New plan",
    definition:
      "The Repayment Assistance Plan, launched July 1, 2026. Payment is a percentage of your total income (1–10% depending on what you earn) rather than your discretionary income, with a $10/month minimum and $50 off per dependent. Any interest your payment doesn’t cover is waived instead of added to your balance, and the government makes sure at least $50/month goes toward your principal. Forgiveness after 30 years, and payments count toward Public Service Loan Forgiveness.",
    pros: [
      "Unpaid interest is waived rather than added to your balance",
      "The government puts at least $50/month toward your principal, so the balance always shrinks",
      "Payments count toward Public Service Loan Forgiveness",
      "Available even if you borrowed on or after July 1, 2026",
    ],
    cons: [
      "Charges a percentage of your total income rather than income above the poverty floor, so it often costs more per month than IBR",
      "Forgiveness takes 30 years, 10 longer than IBR",
      "The payment is not capped at the Standard amount, so high earners can pay more than they would on a fixed plan",
      "Forgiveness after 30 years counts as taxable income",
    ],
  },
  pslf: {
    name: "PSLF",
    tagline: "Full forgiveness after 10 years of public service",
    status: "active",
    definition:
      "Cancels 100% of your remaining federal balance after 10 years of payments while working for the government or a qualifying nonprofit. The forgiven amount is completely tax-free.",
    pros: [
      "Your entire remaining balance is cancelled after 10 years",
      "The forgiven amount is completely tax-free, unlike IBR or RAP forgiveness",
      "Your balance size barely matters, since what is left is wiped",
      "You make small income-driven payments the whole time",
    ],
    cons: [
      "Requires full-time work for a government agency or qualifying nonprofit for the entire 10 years",
      "You must stay on a qualifying plan the whole time, so Tiered Standard, Graduated, and Extended break it",
      "All or nothing, since leaving public service at year 8 forgives nothing",
      "Only worth pursuing if you would still owe a balance at year 10",
    ],
  },
};

export const SAVE_ENDED_WARNING =
  "The SAVE Plan has ended and is no longer an option. If you were enrolled, your servicer started mailing a notice on or after July 1, 2026 giving you 90 days to pick a new plan. That deadline is personal, so check the date on your own notice. Miss it and you get enrolled automatically in the Standard or Tiered Standard plan, and Tiered Standard does not count toward Public Service Loan Forgiveness. Interest also resumed on SAVE balances on August 1, 2025, and months spent in that forbearance earned no forgiveness credit.";

export const TIERED_STANDARD_PSLF_WARNING =
  "Payments under the Tiered Standard Plan do not count toward Public Service Loan Forgiveness, and that is true for every tier including the 10-year one. Since you work in public service, choosing this plan means making on-time payments that move you zero months closer to forgiveness. RAP, which is income-driven, is the alternative that keeps PSLF on the table.";

export const TIERED_STANDARD_DEFAULT_WARNING =
  "This is the plan you are enrolled in automatically if you never choose one. It has no forgiveness at the end and does not count toward Public Service Loan Forgiveness.";

export const POST_2026_LOCKOUT_WARNING =
  "Because at least one of your loans was disbursed on or after July 1, 2026, Standard, Graduated, Extended, and IBR are closed to you across your entire portfolio, even for the loans you took out earlier. RAP and Tiered Standard are your only two options.";

export const CONSOLIDATION_WARNING =
  "Avoid consolidating right now unless someone has confirmed you need to. A Direct Consolidation Loan is legally a brand new loan, so consolidating today disburses after July 1, 2026 and permanently closes IBR for every loan you own. It also resets your forgiveness progress to zero and never lowers your rate, since the new rate is the weighted average of the old ones rounded up. Older FFEL and Perkins loans are the real exception, because those often must be consolidated to qualify for income-driven plans or PSLF at all.";

export const IDR_TAX_WARNING =
  "Forgiveness under IBR or RAP counts as taxable income. The temporary rule that shielded it expired on December 31, 2025 and was not renewed, so a balance forgiven in year 20 or 30 lands on your tax return as income that year with nothing withheld. Public Service Loan Forgiveness stays permanently tax-free under its own section of the tax code.";

export const TEACHER_FORGIVENESS_INFO =
  "Teacher Loan Forgiveness: If you teach full-time for 5 consecutive years at a low-income school, you may qualify for up to $17,500 in loan forgiveness — separate from PSLF. Unlike PSLF, Teacher Loan Forgiveness applies after just 5 years, but the forgiven amount is capped. Many teachers pursue both: get Teacher Loan Forgiveness at year 5, then continue toward PSLF forgiveness at year 10. Learn more at studentaid.gov/teach-forgiveness.";

export const LEGAL_DISCLAIMER =
  "These calculations are estimates for educational purposes and do not constitute financial advice. Actual payment amounts are determined by your loan servicer. Loan forgiveness amounts may be subject to income tax depending on the program and year. Consult studentaid.gov or a financial advisor for decisions specific to your situation.";

export const DECIMAL_CTA_URL =
  "https://cense-loan-desk.vercel.app/?utm_source=loan-lab&utm_medium=tool&utm_campaign=loan-lab-footer";
