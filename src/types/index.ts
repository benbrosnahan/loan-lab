export type LoanType = "federal" | "private" | "both" | "unsure";

/**
 * The single most consequential input in the tool.
 *
 * Under the July 2025 reconciliation law (OBBBA), any federal Direct Loan
 * disbursed on or after July 1, 2026 reclassifies the borrower's ENTIRE
 * portfolio under the new rules. That closes Standard, Graduated, Extended,
 * and IBR and leaves only RAP and the Tiered Standard Plan.
 *
 * A Direct Consolidation Loan counts as a new disbursement for this test.
 */
export type Disbursement =
  | "before_july_2026"
  | "on_or_after_july_2026"
  | "unsure";

export type Employment =
  | "government"
  | "education"
  | "nonprofit"
  | "private"
  | "self_employed"
  | "unsure";

export type Priority =
  | "low_payment"
  | "least_total"
  | "fastest"
  | "forgiveness";

export interface QuizAnswers {
  loanType: LoanType | null;
  disbursement: Disbursement | null;
  federalBalance: number;
  federalRate: number;
  privateBalance: number;
  privateRate: number;
  income: number;
  familySize: number;
  employment: Employment | null;
  priority: Priority | null;
}

export type PlanId =
  | "standard"
  | "graduated"
  | "ibr"
  | "tiered_standard"
  | "rap"
  | "pslf";

export type PlanStatus = "active" | "legacy_only" | "new";

export interface PlanResult {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  payoffYears: number;
  forgivenAmount: number;
  isEligible: boolean;
  status: PlanStatus;
  taxBombEstimate: number;
  monthlyPaymentAsPercentOfTakeHome: number;
}

export interface CalculationResult {
  plans: PlanResult[];
  recommendedId: string;
  recommendationReasons: string[];
  /** What the recommended plan costs you relative to the runner-up. */
  recommendationTradeoff?: string;
  quizAnswers: QuizAnswers;
  pslfEligible: boolean;
  hasFederal: boolean;
  hasPrivate: boolean;
  /** False when any loan was disbursed on or after July 1, 2026. */
  isLegacyBorrower: boolean;
  /** True when the borrower could not answer the disbursement question. */
  disbursementUnknown: boolean;
}

export interface QuizState {
  step: number;
  direction: 1 | -1;
  answers: QuizAnswers;
}

export const INITIAL_ANSWERS: QuizAnswers = {
  loanType: null,
  disbursement: null,
  federalBalance: 0,
  federalRate: 0,
  privateBalance: 0,
  privateRate: 0,
  income: 0,
  familySize: 0,
  employment: null,
  priority: null,
};

export const TOTAL_STEPS = 6;
