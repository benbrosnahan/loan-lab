export type LoanType = "federal" | "private" | "both" | "unsure";

/**
 * The single most consequential input in the tool.
 *
 * A borrower who receives any Direct Loan on or after July 1, 2026 can repay
 * only under Tiered Standard or RAP (34 CFR 685.210(a)(1)(ii)), and because
 * all of a borrower's Direct Loans are repaid on one plan (685.210(a)(3)),
 * that closes Standard, Graduated, Extended and IBR for the older loans too
 * (685.208(b), 685.209(d)(5)). A Direct Consolidation Loan made on or after
 * that date counts as a new loan.
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
  /** Adjusted gross income (AGI), the couple's combined AGI for a joint filer. */
  income: number;
  /**
   * Kept for share links made before dependents and filesJointly existed:
   * 1 + dependents + 1 if filing jointly. 0 means the question is unanswered.
   */
  familySize: number;
  /** People claimed as dependents on the borrower's tax return. */
  dependents: number;
  /** Married and filing a joint federal return. */
  filesJointly: boolean;
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
  /** The first month's payment. */
  monthlyPayment: number;
  /** Graduated only: the payment in its last two years. */
  finalPayment?: number;
  /** PSLF only: the income-driven plan its payments are made on. */
  via?: "ibr" | "rap";
  /** What the borrower pays, never counting a forgiven balance. */
  totalPaid: number;
  /** The part of what the borrower pays that goes to interest. */
  totalInterest: number;
  payoffYears: number;
  /** True when the balance is gone before forgiveness would apply. */
  paidOff: boolean;
  forgivenAmount: number;
  isEligible: boolean;
  status: PlanStatus;
  /** Estimated federal income tax on the forgiven balance. 0 for PSLF. */
  forgivenessTax: number;
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
  dependents: 0,
  filesJointly: false,
  employment: null,
  priority: null,
};

export const TOTAL_STEPS = 6;
