import {
  QuizAnswers,
  PlanResult,
  CalculationResult,
  Priority,
  PlanId,
} from "@/types";
import {
  getPovertyLine,
  PLAN_META,
  getTieredStandardYears,
  FIXED_PLAN_MIN_PAYMENT,
  rapAnnualBasePayment,
  RAP_MIN_MONTHLY,
  RAP_DEPENDENT_CREDIT,
  FEDERAL_TAX_2026,
} from "@/data/plans";
import { formatCurrencyFull, estimateTakeHomePay, householdOf, federalTax } from "./utils";

// Forgiveness clocks: IBR 240 payments for a new borrower (34 CFR
// 685.209(k)(2)), RAP 360 ((k)(7)), PSLF 120 (685.219(c)(1)(iii)).
const IBR_MONTHS = 240;
const RAP_MONTHS = 360;
const PSLF_MONTHS = 120;

// Income is held flat for the whole term. Raising it would also mean raising
// the poverty line every year, and a friendlier projection is not one we can
// defend. The results page says so.

type PlanFields = Omit<
  PlanResult,
  | "id"
  | "name"
  | "tagline"
  | "status"
  | "isEligible"
  | "monthlyPaymentAsPercentOfTakeHome"
  | "forgivenessTax"
> &
  Partial<Pick<PlanResult, "forgivenessTax">>;

function makePlan(id: PlanId, fields: PlanFields): PlanResult {
  const meta = PLAN_META[id];
  return {
    id,
    name: meta.name,
    tagline: meta.tagline,
    status: meta.status,
    isEligible: true,
    forgivenessTax: 0,
    monthlyPaymentAsPercentOfTakeHome: 0,
    ...fields,
  };
}

const years = (months: number) => Math.max(1, Math.ceil(months / 12));

/** Level payment that repays `balance` in `months`. */
export function amortized(balance: number, ratePct: number, months: number): number {
  if (balance <= 0 || months <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r <= 0) return balance / months;
  return (balance * r) / (1 - Math.pow(1 + r, -months));
}

/** A fixed payment held until the balance is gone; the last payment is only what is owed. */
function payDown(balance: number, ratePct: number, payment: number, maxMonths = 1200) {
  const r = ratePct / 100 / 12;
  let owed = balance;
  let paid = 0;
  let months = 0;
  while (owed > 0.005 && months < maxMonths) {
    const due = owed * (1 + r);
    const pay = Math.min(payment, due);
    owed = due - pay;
    paid += pay;
    months++;
  }
  return { paid, interest: Math.max(0, paid - balance), months };
}

// ── Standard 10-Year ── 685.208(b)(1): 120 level payments, at least $50.

export function standardPayment(balance: number, ratePct: number): number {
  return Math.max(FIXED_PLAN_MIN_PAYMENT, amortized(balance, ratePct, 120));
}

function calcStandard(balance: number, ratePct: number): PlanResult {
  const payment = standardPayment(balance, ratePct);
  const run = payDown(balance, ratePct, payment);
  return makePlan("standard", {
    monthlyPayment: payment,
    totalPaid: run.paid,
    totalInterest: run.interest,
    payoffYears: years(run.months),
    paidOff: true,
    forgivenAmount: 0,
  });
}

// ── Graduated ── 685.208(b)(6): repaid within 10 years at two or more levels,
// no payment more than three times any other, no $50 minimum. Modelled as five
// two-year levels, each 3^(1/4) times the last, with the start solved so the
// schedule repays in month 120. If that start would not cover the month's
// interest, the start is the interest and a smaller step is solved instead.

function calcGraduated(balance: number, ratePct: number): PlanResult {
  const r = ratePct / 100 / 12;
  const maxGrowth = Math.pow(3, 1 / 4);
  const level = (m: number) => Math.floor(m / 24);

  let perDollar = 0;
  for (let m = 0; m < 120; m++) {
    perDollar += Math.pow(maxGrowth, level(m)) / Math.pow(1 + r, m + 1);
  }
  const start = Math.max(balance / perDollar, balance * r);
  let growth = maxGrowth;
  if (start > balance / perDollar) {
    const left = (g: number) => {
      let owed = balance;
      for (let m = 0; m < 120; m++) owed = owed * (1 + r) - start * Math.pow(g, level(m));
      return owed;
    };
    let lo = 1;
    let hi = maxGrowth;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (left(mid) > 0) lo = mid;
      else hi = mid;
    }
    growth = hi;
  }

  let owed = balance;
  let paid = 0;
  let months = 0;
  for (let m = 0; m < 120 && owed > 0.005; m++) {
    const due = owed * (1 + r);
    const pay = Math.min(start * Math.pow(growth, level(m)), due);
    owed = due - pay;
    paid += pay;
    months++;
  }
  return makePlan("graduated", {
    monthlyPayment: start,
    finalPayment: start * Math.pow(growth, 4),
    totalPaid: paid,
    totalInterest: Math.max(0, paid - balance),
    payoffYears: years(months),
    paidOff: true,
    forgivenAmount: 0,
  });
}

// ── Tiered Standard ── 685.208(c)(1): level payments over a term set by the
// balance, at least $50. No forgiveness, and no PSLF credit in any tier.

function calcTieredStandard(balance: number, ratePct: number): PlanResult {
  const term = getTieredStandardYears(balance);
  const payment = Math.max(FIXED_PLAN_MIN_PAYMENT, amortized(balance, ratePct, term * 12));
  const run = payDown(balance, ratePct, payment);
  return makePlan("tiered_standard", {
    monthlyPayment: payment,
    totalPaid: run.paid,
    totalInterest: run.interest,
    payoffYears: years(run.months),
    paidOff: true,
    forgivenAmount: 0,
  });
}

// ── Income-driven payments ──

/**
 * IBR for a new borrower, 685.209(f)(2): 10% of AGI above 150% of the poverty
 * guideline, over 12, never more than the 10-year Standard payment.
 * (g)(1)(iii): under $5 is $0, and $5 to under $10 is $10.
 */
export function ibrMonthly(agi: number, familySize: number, cap: number): number {
  let p = (Math.max(0, agi - 1.5 * getPovertyLine(familySize)) * 0.1) / 12;
  if (p < 5) p = 0;
  else if (p < 10) p = 10;
  return Math.min(p, cap);
}

/** RAP, 685.209(f)(5) and (g)(3)(ii): base payment over 12, less $50 per dependent, at least $10. */
export function rapMonthly(agi: number, dependents: number): number {
  return Math.max(
    RAP_MIN_MONTHLY,
    rapAnnualBasePayment(agi) / 12 - RAP_DEPENDENT_CREDIT * Math.max(0, dependents)
  );
}

/**
 * Months on IBR. Unpaid interest is not capitalized while the borrower stays
 * on IBR (685.209(j)(2)): it sits beside principal, earns no interest, stays
 * owed, and each payment goes to it first (685.211(a)(1)). The three-year
 * subsidy on subsidized loans ((h)(2)) is not modelled.
 */
function ibrPath(balance: number, ratePct: number, payment: number, maxMonths: number) {
  const r = ratePct / 100 / 12;
  let principal = balance;
  let unpaid = 0;
  let paid = 0;
  let interest = 0;
  let months = 0;
  while (months < maxMonths && principal + unpaid > 0.005) {
    unpaid += principal * r;
    const pay = Math.min(payment, principal + unpaid);
    const toInterest = Math.min(pay, unpaid);
    unpaid -= toInterest;
    principal -= pay - toInterest;
    paid += pay;
    interest += toInterest;
    months++;
  }
  const left = Math.max(0, principal + unpaid);
  return { paid, interest, months, left, paidOff: left <= 0.005 };
}

/**
 * Months on RAP. Interest the on-time payment does not cover is not charged
 * (685.209(h)(4)(i)). When a payment lowers principal by less than $50, ED
 * lowers it by the lesser of $50 or the payment, minus what the payment
 * already put on principal ((o)(2)(i)).
 */
function rapPath(balance: number, ratePct: number, payment: number, maxMonths: number) {
  const r = ratePct / 100 / 12;
  let owed = balance;
  let paid = 0;
  let interest = 0;
  let months = 0;
  while (months < maxMonths && owed > 0.005) {
    const accrued = owed * r;
    const pay = Math.min(payment, owed + accrued);
    const charged = Math.min(accrued, pay);
    const toPrincipal = pay - charged;
    const cut = toPrincipal < 50 ? Math.max(toPrincipal, Math.min(50, pay)) : toPrincipal;
    owed = Math.max(0, owed - cut);
    paid += pay;
    interest += charged;
    months++;
  }
  return { paid, interest, months, left: owed, paidOff: owed <= 0.005 };
}

/**
 * Estimated federal tax on a forgiven IBR or RAP balance: tax on the year's
 * AGI plus the forgiven amount, less tax on the AGI alone, after the standard
 * deduction. Today's brackets, no state tax. PSLF never comes here.
 */
export function forgivenessTax(agi: number, forgiven: number, joint: boolean): number {
  if (forgiven <= 0) return 0;
  const d = (joint ? FEDERAL_TAX_2026.joint : FEDERAL_TAX_2026.single).standardDeduction;
  return federalTax(Math.max(0, agi + forgiven - d), joint) - federalTax(Math.max(0, agi - d), joint);
}

interface Household {
  agi: number;
  ibrFamilySize: number;
  dependents: number;
  joint: boolean;
}

function calcIBR(balance: number, ratePct: number, h: Household): PlanResult {
  const payment = ibrMonthly(h.agi, h.ibrFamilySize, standardPayment(balance, ratePct));
  const run = ibrPath(balance, ratePct, payment, IBR_MONTHS);
  return makePlan("ibr", {
    monthlyPayment: payment,
    totalPaid: run.paid,
    totalInterest: run.interest,
    payoffYears: run.paidOff ? years(run.months) : IBR_MONTHS / 12,
    paidOff: run.paidOff,
    forgivenAmount: run.paidOff ? 0 : run.left,
    forgivenessTax: run.paidOff ? 0 : forgivenessTax(h.agi, run.left, h.joint),
  });
}

function calcRAP(balance: number, ratePct: number, h: Household): PlanResult {
  const payment = rapMonthly(h.agi, h.dependents);
  const run = rapPath(balance, ratePct, payment, RAP_MONTHS);
  return makePlan("rap", {
    monthlyPayment: payment,
    totalPaid: run.paid,
    totalInterest: run.interest,
    payoffYears: run.paidOff ? years(run.months) : RAP_MONTHS / 12,
    paidOff: run.paidOff,
    forgivenAmount: run.paidOff ? 0 : run.left,
    forgivenessTax: run.paidOff ? 0 : forgivenessTax(h.agi, run.left, h.joint),
  });
}

// ── PSLF ── 120 qualifying payments on the income-driven plan with the lower
// payment (IBR is closed once any loan is from July 2026 or later), run with
// that plan's own interest rules. What is left is cancelled, untaxed.

function calcPSLF(balance: number, ratePct: number, h: Household, legacy: boolean): PlanResult {
  const rap = rapMonthly(h.agi, h.dependents);
  const ibr = legacy
    ? ibrMonthly(h.agi, h.ibrFamilySize, standardPayment(balance, ratePct))
    : Infinity;
  const via: "ibr" | "rap" = ibr < rap ? "ibr" : "rap";
  const payment = via === "ibr" ? ibr : rap;
  const run =
    via === "ibr"
      ? ibrPath(balance, ratePct, payment, PSLF_MONTHS)
      : rapPath(balance, ratePct, payment, PSLF_MONTHS);
  return makePlan("pslf", {
    monthlyPayment: payment,
    via,
    totalPaid: run.paid,
    totalInterest: run.interest,
    payoffYears: run.paidOff ? years(run.months) : PSLF_MONTHS / 12,
    paidOff: run.paidOff,
    forgivenAmount: run.paidOff ? 0 : run.left,
    forgivenessTax: 0,
  });
}

// ── Recommendation Logic ──

// Plans whose payments count toward PSLF in full: 10-year Standard and the
// income-driven plans (685.219(b)(28)). Graduated's early payments and every
// Tiered Standard payment do not.
const PSLF_QUALIFYING_PLANS: PlanId[] = ["standard", "ibr", "rap", "pslf"];

// PSLF only helps if a balance would still exist at payment 120.
const MEANINGFUL_FORGIVENESS = 500;

/** What a plan costs the borrower: payments plus the estimated tax on any forgiven balance. */
export const costOf = (p: PlanResult) => p.totalPaid + p.forgivenessTax;

function yrs(p: PlanResult): string {
  return `${p.payoffYears} year${p.payoffYears === 1 ? "" : "s"}`;
}

const withTax = (p: PlanResult) =>
  p.forgivenessTax > 0 ? ", counting the tax on what is forgiven" : "";

export function getRecommendation(
  plans: PlanResult[],
  priority: Priority,
  pslfEligible: boolean
): { recommendedId: string; reasons: string[]; tradeoff?: string } {
  const find = (id: PlanId) => plans.find((p) => p.id === id);
  const standard = find("standard");
  const tiered = find("tiered_standard");
  const rap = find("rap");
  const ibr = find("ibr");
  const pslf = find("pslf");

  // The shortest-term fixed plan this borrower can actually enroll in.
  const fixed = standard ?? tiered;
  const idr = [ibr, rap].filter(Boolean) as PlanResult[];
  const lowestIdr = [...idr].sort((a, b) => a.monthlyPayment - b.monthlyPayment)[0];

  // Working in public service is not by itself a reason to chase PSLF: if the
  // balance clears before payment 120 there is nothing left to forgive.
  const pslfPays = pslfEligible && !!pslf && pslf.forgivenAmount > MEANINGFUL_FORGIVENESS;
  const pslfEmpty = pslfEligible && !!pslf && !pslfPays;

  const soonest = [...plans]
    .filter((p) => p.id !== "pslf")
    .sort((a, b) => a.payoffYears - b.payoffYears)[0];
  const emptyPslfNote = soonest
    ? `Your balance can be gone in ${yrs(soonest)}, before PSLF's 120 payments, so PSLF would forgive almost nothing`
    : `Your balance clears before PSLF's 120 payments, so PSLF would forgive almost nothing`;

  // Never steer a borrower who is on course for PSLF onto a plan that earns no credit.
  const safe = (p?: PlanResult) =>
    p && (!pslfPays || PSLF_QUALIFYING_PLANS.includes(p.id)) ? p : undefined;

  const pslfTerms = `PSLF needs full-time work (30+ hours a week) for a qualifying employer until payment 120. The payments need not be in a row.`;

  // ── Forgiveness ──
  if (priority === "forgiveness") {
    if (pslfPays && pslf) {
      const alt = fixed ?? lowestIdr;
      return {
        recommendedId: "pslf",
        reasons: [
          `PSLF cancels the ${formatCurrencyFull(pslf.forgivenAmount)} you would still owe after 120 payments`,
          alt
            ? `You would pay ${formatCurrencyFull(pslf.totalPaid)} in total, against ${formatCurrencyFull(costOf(alt))} on ${alt.name}${withTax(alt)}`
            : `You pay a small income-driven amount the whole time`,
          `PSLF forgiveness is not taxed. IBR and RAP forgiveness is`,
        ],
        tradeoff: pslfTerms,
      };
    }

    const forgiving = [ibr, rap]
      .filter((p): p is PlanResult => !!p && p.forgivenAmount > MEANINGFUL_FORGIVENESS)
      .sort((a, b) => a.payoffYears - b.payoffYears);

    if (forgiving.length) {
      const pick = forgiving[0];
      const other = forgiving[1];
      return {
        recommendedId: pick.id,
        reasons: [
          `${pick.name} forgives about ${formatCurrencyFull(pick.forgivenAmount)} after ${yrs(pick)}`,
          other
            ? `${other.name} would forgive ${formatCurrencyFull(other.forgivenAmount)} but takes ${yrs(other)}`
            : `Your payment follows your income, so it falls if your income does`,
          pslfEmpty
            ? emptyPslfNote
            : `Payments here also count toward PSLF if you move into public service`,
        ],
        tradeoff: `The forgiven amount is taxed as federal income that year, about ${formatCurrencyFull(pick.forgivenessTax)} at today's brackets, and nothing is withheld. Plan for it.`,
      };
    }

    if (fixed) {
      return {
        recommendedId: fixed.id,
        reasons: [
          `On your numbers no plan forgives anything, since your balance clears first`,
          `${fixed.name} gets you there in ${yrs(fixed)} for ${formatCurrencyFull(fixed.totalPaid)} total`,
          pslfEmpty
            ? emptyPslfNote
            : `Chasing forgiveness here would cost you interest and buy you nothing`,
        ],
      };
    }
  }

  // ── Lowest monthly payment ──
  if (priority === "low_payment") {
    const pick = safe(lowestIdr) ?? lowestIdr ?? safe(find("graduated")) ?? fixed;
    if (pick) {
      const reasons = [
        `${pick.name} has your lowest monthly payment, ${formatCurrencyFull(pick.monthlyPayment)}`,
      ];
      if (fixed && fixed.id !== pick.id) {
        reasons.push(
          `That is ${formatCurrencyFull(Math.abs(fixed.monthlyPayment - pick.monthlyPayment))} a month ${pick.monthlyPayment < fixed.monthlyPayment ? "less" : "more"} than ${fixed.name}`
        );
      }
      reasons.push(
        pslfPays
          ? `It counts toward PSLF, which would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} after 120 payments`
          : pslfEmpty
            ? emptyPslfNote
            : `Your payment follows your income, so it drops if your income does`
      );
      const costlier = fixed && costOf(fixed) < costOf(pick);
      const extraYears = fixed ? pick.payoffYears - fixed.payoffYears : 0;
      const extra = costlier && fixed ? formatCurrencyFull(costOf(pick) - costOf(fixed)) : null;
      const taxed = pick.forgivenessTax > 0 ? ", tax included" : "";
      return {
        recommendedId: pick.id,
        reasons,
        tradeoff:
          pslfPays && PSLF_QUALIFYING_PLANS.includes(pick.id)
            ? `${pslfTerms}${extra && fixed ? ` Leave for good and ${pick.name} costs about ${extra} more than ${fixed.name}${taxed}.` : ""}`
            : extra && fixed
              ? `A lower payment costs more overall: about ${extra} more than ${fixed.name}${taxed}${extraYears > 0 ? `, over ${extraYears} more years` : ""}.`
              : undefined,
      };
    }
  }

  // ── Least paid overall ── ranked on payments plus the tax on any forgiven balance.
  if (priority === "least_total") {
    const pool = plans.filter((p) => (p.id === "pslf" ? pslfPays : true));
    const ranked = [...pool].sort((a, b) => costOf(a) - costOf(b));
    const pick = safe(ranked[0]) ?? ranked.find((p) => !!safe(p)) ?? ranked[0];
    const runnerUp = ranked.find((p) => p.id !== pick?.id);
    if (pick) {
      return {
        recommendedId: pick.id,
        reasons: [
          `${pick.name} costs the least overall, ${formatCurrencyFull(costOf(pick))}${withTax(pick)}`,
          runnerUp
            ? `Next is ${runnerUp.name} at ${formatCurrencyFull(costOf(runnerUp))}${withTax(runnerUp)}`
            : `You pay ${formatCurrencyFull(pick.totalInterest)} in interest over ${yrs(pick)}`,
          pick.id === "pslf"
            ? `The ${formatCurrencyFull(pick.forgivenAmount)} PSLF cancels is not taxed`
            : pslfEmpty
              ? emptyPslfNote
              : `${formatCurrencyFull(pick.monthlyPayment)} a month over ${yrs(pick)}`,
        ],
        tradeoff:
          pick.id === "pslf"
            ? pslfTerms
            : lowestIdr && pick.monthlyPayment > lowestIdr.monthlyPayment
              ? `Paying the least overall means a higher payment. ${lowestIdr.name} would be ${formatCurrencyFull(lowestIdr.monthlyPayment)} a month instead of ${formatCurrencyFull(pick.monthlyPayment)}.`
              : undefined,
      };
    }
  }

  // ── Fastest payoff ──
  if (priority === "fastest") {
    // PSLF joins this race only when it actually forgives something. When it
    // forgives nothing, the genuinely fastest plan wins even if it earns no
    // PSLF credit: protecting a worthless forgiveness track is the wrong trade.
    const pool = plans.filter((p) => (p.id === "pslf" ? pslfPays : true));
    const ranked = [...pool].sort(
      (a, b) => a.payoffYears - b.payoffYears || costOf(a) - costOf(b)
    );
    const pick = ranked[0];
    if (pick) {
      const reasons = [
        pick.paidOff
          ? `${pick.name} clears your balance fastest, in ${yrs(pick)}`
          : `${pick.name} gets you to a zero balance fastest, in ${yrs(pick)}`,
        pick.id === "pslf"
          ? `${formatCurrencyFull(pick.monthlyPayment)} a month, ${formatCurrencyFull(pick.totalPaid)} in total before the rest is cancelled`
          : `${formatCurrencyFull(pick.monthlyPayment)} a month, ${formatCurrencyFull(pick.totalInterest)} in interest`,
      ];
      const breaksPslf = pslfPays && !PSLF_QUALIFYING_PLANS.includes(pick.id) && pslf;

      reasons.push(
        pick.id === "pslf"
          ? `${formatCurrencyFull(pslf!.forgivenAmount)} is cancelled, untaxed, after 120 payments`
          : breaksPslf
            ? `Careful: payments on ${pick.name} earn no PSLF credit`
            : pslfPays
              ? `It also keeps PSLF open, which matters since ${formatCurrencyFull(pslf!.forgivenAmount)} would be left at payment 120`
              : pslfEmpty
                ? emptyPslfNote
                : `No forgiveness clock needed, since the balance is gone first`
      );

      return {
        recommendedId: pick.id,
        reasons,
        tradeoff: breaksPslf
          ? `This is the fastest, but it gives up PSLF. Staying on a qualifying plan would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} untaxed and cost ${formatCurrencyFull(costOf(pick) - pslf!.totalPaid)} less overall.`
          : pick.id === "pslf"
            ? pslfTerms
            : lowestIdr && lowestIdr.monthlyPayment < pick.monthlyPayment
              ? `Finishing fast means a higher payment. ${lowestIdr.name} would be ${formatCurrencyFull(lowestIdr.monthlyPayment)} a month instead of ${formatCurrencyFull(pick.monthlyPayment)}.`
              : undefined,
      };
    }
  }

  // ── Default ──
  const fallback = safe(rap) ?? safe(fixed) ?? plans[0];
  if (fallback) {
    return {
      recommendedId: fallback.id,
      reasons: [
        `${fallback.name} is ${formatCurrencyFull(fallback.monthlyPayment)} a month over ${yrs(fallback)}`,
        `${formatCurrencyFull(costOf(fallback))} in total${withTax(fallback)}`,
        pslfPays
          ? `It counts toward PSLF, which would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} after 120 payments`
          : `Compare the plans below before you commit`,
      ],
    };
  }

  return {
    recommendedId: "tiered_standard",
    reasons: [`A predictable fixed payment and a clear end date`],
  };
}

// ── Main Entry Point ──

export function calculatePlans(answers: QuizAnswers): CalculationResult {
  const { federalBalance, federalRate, privateBalance, income, employment, priority, disbursement } =
    answers;
  const household = householdOf(answers);
  const h: Household = {
    agi: Math.max(0, income),
    ibrFamilySize: 1 + household.dependents + (household.filesJointly ? 1 : 0),
    dependents: household.dependents,
    joint: household.filesJointly,
  };

  const pslfEligible = ["government", "education", "nonprofit"].includes(employment ?? "");

  // "Unsure" is priced as all-before-July-2026 so the borrower sees every plan
  // they might have, with a warning at the top telling them to confirm.
  const isLegacyBorrower = disbursement !== "on_or_after_july_2026";
  const disbursementUnknown = disbursement === "unsure" || disbursement === null;

  const plans: PlanResult[] = [];

  if (federalBalance > 0) {
    // Tiered Standard applies only to a borrower with a loan made on or after
    // July 1, 2026 (685.208(b)(8), (c)(1)), and such a loan closes Standard,
    // Graduated and IBR for the whole portfolio (685.210(a)(1)(ii), (a)(3)).
    if (isLegacyBorrower) {
      plans.push(
        calcStandard(federalBalance, federalRate),
        calcGraduated(federalBalance, federalRate),
        calcIBR(federalBalance, federalRate, h)
      );
    } else {
      plans.push(calcTieredStandard(federalBalance, federalRate));
    }

    plans.push(calcRAP(federalBalance, federalRate, h));

    if (pslfEligible) {
      plans.push(calcPSLF(federalBalance, federalRate, h, isLegacyBorrower));
    }
  }

  const monthlyTakeHome = estimateTakeHomePay(h.agi, h.joint) / 12;
  for (const plan of plans) {
    if (monthlyTakeHome > 0) {
      plan.monthlyPaymentAsPercentOfTakeHome = (plan.monthlyPayment / monthlyTakeHome) * 100;
    }
  }

  const { recommendedId, reasons, tradeoff } = getRecommendation(
    plans,
    priority ?? "low_payment",
    pslfEligible
  );

  return {
    plans,
    recommendedId,
    recommendationReasons: reasons,
    recommendationTradeoff: tradeoff,
    quizAnswers: answers,
    pslfEligible,
    hasFederal: federalBalance > 0,
    hasPrivate: (privateBalance ?? 0) > 0,
    isLegacyBorrower,
    disbursementUnknown,
  };
}
