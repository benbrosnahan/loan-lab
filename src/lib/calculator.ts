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
  TIERED_STANDARD_MIN_PAYMENT,
} from "@/data/plans";
import { formatCurrencyFull, estimateTakeHomePay } from "./utils";

const TAX_RATE_ON_FORGIVENESS = 0.22;

function makePlan(
  id: PlanId,
  overrides: Partial<PlanResult> & {
    monthlyPayment: number;
    totalPaid: number;
    totalInterest: number;
    payoffYears: number;
    forgivenAmount: number;
  }
): PlanResult {
  const meta = PLAN_META[id];
  return {
    id,
    name: meta.name,
    tagline: meta.tagline,
    status: meta.status,
    isEligible: true,
    taxBombEstimate: 0,
    monthlyPaymentAsPercentOfTakeHome: 0,
    ...overrides,
  };
}

// ── Standard 10-Year ──

function calcStandard(balance: number, annualRate: number): PlanResult {
  const r = annualRate / 100 / 12;
  const n = 120;
  const payment =
    r === 0
      ? balance / n
      : (balance * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  const totalPaid = payment * n;

  return makePlan("standard", {
    monthlyPayment: payment,
    totalPaid,
    totalInterest: totalPaid - balance,
    payoffYears: 10,
    forgivenAmount: 0,
  });
}

// ── Graduated ──

function calcGraduated(balance: number, annualRate: number): PlanResult {
  const r = annualRate / 100 / 12;
  const g = Math.pow(3, 0.25); // 3^(1/4) ≈ 1.3161 — max allowed growth factor

  const monthlyInterest = balance * r;

  // Binary search for tier-1 payment P
  let lo = Math.max(1, monthlyInterest);
  let hi = Math.max(balance / 120 * 3, monthlyInterest * 2, balance / 60);
  let bestP = lo;

  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const remaining = simulateGraduated(balance, r, mid, g);
    if (Math.abs(remaining) < 0.01) {
      bestP = mid;
      break;
    }
    if (remaining > 0) {
      lo = mid; // payments too low
    } else {
      hi = mid; // payments too high
    }
    bestP = mid;
  }

  // Run final simulation with the solved P
  let remainingBalance = balance;
  let totalPaid = 0;
  const firstPayment = bestP;

  for (let month = 0; month < 120; month++) {
    const tier = Math.floor(month / 24);
    const payment = bestP * Math.pow(g, tier);
    const interest = remainingBalance * r;
    const principal = payment - interest;
    remainingBalance = Math.max(0, remainingBalance - principal);
    totalPaid += payment;
    if (remainingBalance <= 0) {
      return makePlan("graduated", {
        monthlyPayment: firstPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
      });
    }
  }

  return makePlan("graduated", {
    monthlyPayment: firstPayment,
    totalPaid,
    totalInterest: totalPaid - balance,
    payoffYears: 10,
    forgivenAmount: 0,
  });
}

function simulateGraduated(
  balance: number,
  monthlyRate: number,
  tierOnePayment: number,
  growthFactor: number
): number {
  let remaining = balance;
  for (let month = 0; month < 120; month++) {
    const tier = Math.floor(month / 24);
    const payment = tierOnePayment * Math.pow(growthFactor, tier);
    const interest = remaining * monthlyRate;
    remaining = remaining - (payment - interest);
    if (remaining <= 0) return remaining;
  }
  return remaining;
}

// ── IBR ──

function calcIBR(
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number
): PlanResult {
  const povertyLine = getPovertyLine(familySize);
  const discretionary = Math.max(0, annualIncome - 1.5 * povertyLine);
  const initialPayment = Math.max(0, (discretionary * 0.1) / 12);

  const standardPayment = calcStandard(balance, annualRate).monthlyPayment;
  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentIncome = annualIncome;
  let currentMonthlyPayment = Math.min(initialPayment, standardPayment);

  for (let month = 0; month < 240; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
      const newDiscretionary = Math.max(
        0,
        currentIncome - 1.5 * povertyLine
      );
      currentMonthlyPayment = Math.min(
        Math.max(0, (newDiscretionary * 0.1) / 12),
        standardPayment
      );
    }

    const interestAccrued = remainingBalance * monthlyRate;
    const principalPaid = Math.max(0, currentMonthlyPayment - interestAccrued);
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += currentMonthlyPayment;

    if (remainingBalance <= 0) {
      return makePlan("ibr", {
        monthlyPayment: initialPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
      });
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);
  return makePlan("ibr", {
    monthlyPayment: initialPayment,
    totalPaid,
    totalInterest: totalPaid - (balance - forgivenAmount),
    payoffYears: 20,
    forgivenAmount,
    taxBombEstimate: forgivenAmount * TAX_RATE_ON_FORGIVENESS,
  });
}

// ── Tiered Standard ──
//
// Launched July 1, 2026. Fixed amortizing payment over a term set by balance
// rather than income. No forgiveness, and no PSLF credit in any tier.

function calcTieredStandard(balance: number, annualRate: number): PlanResult {
  const years = getTieredStandardYears(balance);
  const r = annualRate / 100 / 12;
  const n = years * 12;

  const amortized =
    r === 0
      ? balance / n
      : (balance * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

  // The plan carries a $50/month floor (or the balance, if it is smaller).
  const payment = Math.min(
    Math.max(amortized, TIERED_STANDARD_MIN_PAYMENT),
    Math.max(balance, amortized)
  );

  // If the floor raises the payment above the amortized amount, the loan
  // clears early. Simulate so the timeline and interest stay honest.
  let remainingBalance = balance;
  let totalPaid = 0;
  for (let month = 0; month < n; month++) {
    const interest = remainingBalance * r;
    const principal = Math.max(0, payment - interest);
    remainingBalance = Math.max(0, remainingBalance - principal);
    totalPaid += Math.min(payment, principal + interest);
    if (remainingBalance <= 0) {
      return makePlan("tiered_standard", {
        monthlyPayment: payment,
        totalPaid,
        totalInterest: Math.max(0, totalPaid - balance),
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
      });
    }
  }

  return makePlan("tiered_standard", {
    monthlyPayment: payment,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - balance),
    payoffYears: years,
    forgivenAmount: 0,
  });
}

// ── RAP ──

function getRapTierPercent(agi: number): number {
  if (agi <= 10000) return 0;
  if (agi <= 20000) return 0.01;
  if (agi <= 30000) return 0.02;
  if (agi <= 40000) return 0.03;
  if (agi <= 50000) return 0.04;
  if (agi <= 60000) return 0.05;
  if (agi <= 70000) return 0.06;
  if (agi <= 80000) return 0.07;
  if (agi <= 90000) return 0.08;
  if (agi <= 100000) return 0.09;
  return 0.1;
}

function calcRapPayment(agi: number, dependents: number): number {
  if (agi <= 10000) return Math.max(10, 10 - 50 * dependents);
  const tierPercent = getRapTierPercent(agi);
  return Math.max(10, (tierPercent * agi) / 12 - 50 * dependents);
}

function calcRAP(
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number
): PlanResult {
  const dependents = Math.max(0, familySize - 1);
  const initialPayment = calcRapPayment(annualIncome, dependents);

  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentIncome = annualIncome;
  let currentMonthlyPayment = initialPayment;

  for (let month = 0; month < 360; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
      currentMonthlyPayment = calcRapPayment(currentIncome, dependents);
    }

    const interestAccrued = remainingBalance * monthlyRate;
    let principalPaid = currentMonthlyPayment - interestAccrued;

    // RAP: government covers unpaid interest (balance never grows)
    if (principalPaid < 0) principalPaid = 0;

    // RAP: $50/month principal match guarantee
    if (principalPaid < 50 && remainingBalance > 0) {
      const govContribution = Math.min(50 - principalPaid, remainingBalance);
      principalPaid += govContribution;
    }

    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += currentMonthlyPayment;

    if (remainingBalance <= 0) {
      return makePlan("rap", {
        monthlyPayment: initialPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
      });
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);
  return makePlan("rap", {
    monthlyPayment: initialPayment,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - (balance - forgivenAmount)),
    payoffYears: 30,
    forgivenAmount,
    taxBombEstimate: forgivenAmount * TAX_RATE_ON_FORGIVENESS,
  });
}

// ── PSLF ──

function calcPSLF(
  balance: number,
  annualRate: number,
  annualIncome: number,
  familySize: number,
  isLegacyBorrower: boolean
): PlanResult {
  const povertyLine = getPovertyLine(familySize);
  const dependents = Math.max(0, familySize - 1);
  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = balance;
  let totalPaid = 0;
  let currentIncome = annualIncome;

  // Only the 10-year Standard plan, IBR, and RAP produce payments that count
  // toward PSLF. Graduated, Extended, and Tiered Standard do not. IBR is
  // closed to anyone holding a loan disbursed on or after July 1, 2026.
  function getLowestPayment(income: number): number {
    const rapPay = calcRapPayment(income, dependents);
    if (!isLegacyBorrower) return rapPay;
    const ibrDisc = Math.max(0, income - 1.5 * povertyLine);
    const ibrPay = Math.max(0, (ibrDisc * 0.1) / 12);
    return Math.min(ibrPay, rapPay);
  }

  const initialPayment = getLowestPayment(annualIncome);
  let currentMonthlyPayment = initialPayment;

  for (let month = 0; month < 120; month++) {
    if (month > 0 && month % 12 === 0) {
      currentIncome *= 1.03;
      currentMonthlyPayment = getLowestPayment(currentIncome);
    }

    const interestAccrued = remainingBalance * monthlyRate;
    const principalPaid = Math.max(0, currentMonthlyPayment - interestAccrued);
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalPaid += currentMonthlyPayment;

    if (remainingBalance <= 0) {
      return makePlan("pslf", {
        monthlyPayment: initialPayment,
        totalPaid,
        totalInterest: totalPaid - balance,
        payoffYears: Math.ceil((month + 1) / 12),
        forgivenAmount: 0,
      });
    }
  }

  const forgivenAmount = Math.max(0, remainingBalance);
  return makePlan("pslf", {
    monthlyPayment: initialPayment,
    totalPaid,
    totalInterest: totalPaid - (balance - forgivenAmount),
    payoffYears: 10,
    forgivenAmount,
    taxBombEstimate: 0, // PSLF forgiveness is tax-free
  });
}

// ── Recommendation Logic ──

// Only the 10-year Standard plan and the income-driven plans produce payments
// that count toward PSLF. Graduated, Extended, and Tiered Standard do not.
const PSLF_QUALIFYING_PLANS: PlanId[] = ["standard", "ibr", "rap", "pslf"];

// PSLF only helps if a balance would still exist at month 120. Below this there
// is nothing meaningful left to forgive, so steering a public-service borrower
// onto a slower income-driven plan would cost them money and buy them nothing.
const MEANINGFUL_FORGIVENESS = 500;

function yrs(p: PlanResult): string {
  return `${p.payoffYears} year${p.payoffYears === 1 ? "" : "s"}`;
}

function byTotal(a: PlanResult, b: PlanResult) {
  return a.totalPaid - b.totalPaid;
}

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
  const lowestIdr = [...idr].sort(
    (a, b) => a.monthlyPayment - b.monthlyPayment
  )[0];

  // Working in public service is not by itself a reason to chase PSLF. If the
  // balance clears before month 120 there is nothing left to forgive, and the
  // borrower is better served by an ordinary recommendation. Gating on the
  // computed forgiveness amount rather than on employment alone is the whole
  // point of this check.
  const pslfPays =
    pslfEligible && !!pslf && pslf.forgivenAmount > MEANINGFUL_FORGIVENESS;
  const pslfEmpty = pslfEligible && !!pslf && !pslfPays;

  // Use the soonest payoff on the board so this never contradicts the plan we
  // end up recommending.
  const soonest = [...plans]
    .filter((p) => p.id !== "pslf")
    .sort((a, b) => a.payoffYears - b.payoffYears)[0];
  const emptyPslfNote = soonest
    ? `Your balance can clear in as little as ${yrs(soonest)}, well before the 120 payments PSLF requires, so PSLF would forgive almost nothing for you`
    : `Your balance clears before you would reach the 120 payments PSLF requires, so PSLF would forgive almost nothing for you`;

  // Candidates a public-service borrower can be steered toward without silently
  // breaking a forgiveness track they are actually on course for.
  const safe = (p?: PlanResult) =>
    p && (!pslfPays || PSLF_QUALIFYING_PLANS.includes(p.id)) ? p : undefined;

  // ── Forgiveness ──
  if (priority === "forgiveness") {
    if (pslfPays && pslf) {
      const alt = fixed ?? lowestIdr;
      return {
        recommendedId: "pslf",
        reasons: [
          `PSLF cancels the ${formatCurrencyFull(pslf.forgivenAmount)} you would still owe after 10 years of qualifying payments`,
          alt
            ? `You would pay ${formatCurrencyFull(pslf.totalPaid)} in total, against ${formatCurrencyFull(alt.totalPaid)} on ${alt.name}`
            : `You pay small income-driven payments the whole time`,
          `PSLF forgiveness is tax-free, while IBR and RAP forgiveness counts as taxable income`,
        ],
        tradeoff: `This only works if you stay in qualifying public-service work full time for all 10 years and stay on a qualifying plan. Leaving at year 8 forgives nothing.`,
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
          `${pick.name} forgives roughly ${formatCurrencyFull(pick.forgivenAmount)} after ${yrs(pick)}`,
          other
            ? `${other.name} would forgive ${formatCurrencyFull(other.forgivenAmount)} but takes ${yrs(other)}`
            : `Your payment tracks your income the whole way, so it falls if your income does`,
          pslfEmpty
            ? emptyPslfNote
            : `Payments here also count toward PSLF if you ever move into public-service work`,
        ],
        tradeoff: `Forgiveness under ${pick.name} counts as taxable income in the year it happens, and nothing is withheld for it. Budget for that bill.`,
      };
    }

    if (fixed) {
      return {
        recommendedId: fixed.id,
        reasons: [
          `On your numbers no plan actually forgives anything, since your balance clears on its own first`,
          `${fixed.name} gets you there in ${yrs(fixed)} for ${formatCurrencyFull(fixed.totalPaid)} total`,
          pslfEmpty ? emptyPslfNote : `Chasing forgiveness here would cost you interest and buy you nothing`,
        ],
      };
    }
  }

  // ── Lowest monthly payment ──
  if (priority === "low_payment") {
    const pick = safe(lowestIdr) ?? lowestIdr ?? safe(find("graduated")) ?? fixed;
    if (pick) {
      const reasons = [
        `${pick.name} has the lowest monthly payment available to you at ${formatCurrencyFull(pick.monthlyPayment)}`,
      ];
      if (fixed && fixed.id !== pick.id) {
        reasons.push(
          `That is ${formatCurrencyFull(Math.abs(fixed.monthlyPayment - pick.monthlyPayment))} a month ${pick.monthlyPayment < fixed.monthlyPayment ? "less" : "more"} than ${fixed.name}`
        );
      }
      reasons.push(
        pslfPays
          ? `Payments on this plan count toward PSLF, which would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} at year 10`
          : pslfEmpty
            ? emptyPslfNote
            : `Your payment moves with your income, so it drops if your income drops`
      );
      const costlier = fixed && fixed.totalPaid < pick.totalPaid;
      return {
        recommendedId: pick.id,
        reasons,
        tradeoff:
          costlier && fixed
            ? `A lower payment costs more overall. You would pay ${formatCurrencyFull(pick.totalPaid - fixed.totalPaid)} more in total than on ${fixed.name}, and finish ${pick.payoffYears - fixed.payoffYears} years later.`
            : undefined,
      };
    }
  }

  // ── Least paid overall ──
  if (priority === "least_total") {
    const pool = plans.filter((p) => (p.id === "pslf" ? pslfPays : true));
    const ranked = [...pool].sort(byTotal);
    const pick = safe(ranked[0]) ?? ranked.find((p) => !!safe(p)) ?? ranked[0];
    const runnerUp = ranked.find((p) => p.id !== pick?.id);
    if (pick) {
      return {
        recommendedId: pick.id,
        reasons: [
          `${pick.name} costs the least overall at ${formatCurrencyFull(pick.totalPaid)}`,
          runnerUp
            ? `Next closest is ${runnerUp.name} at ${formatCurrencyFull(runnerUp.totalPaid)}, a difference of ${formatCurrencyFull(runnerUp.totalPaid - pick.totalPaid)}`
            : `You pay ${formatCurrencyFull(pick.totalInterest)} in interest over ${yrs(pick)}`,
          pick.id === "pslf"
            ? `PSLF forgiveness is tax-free, so the ${formatCurrencyFull(pick.forgivenAmount)} cancelled is not taxed`
            : pslfEmpty
              ? emptyPslfNote
              : `Monthly payment is ${formatCurrencyFull(pick.monthlyPayment)} over ${yrs(pick)}`,
        ],
        tradeoff:
          pick.id === "pslf"
            ? `Requires 10 straight years of full-time qualifying public-service work. If you leave early, nothing is forgiven and you have been paying the minimum the whole time.`
            : fixed && pick.monthlyPayment > (lowestIdr?.monthlyPayment ?? Infinity)
              ? `Paying the least overall means the highest monthly payment. ${lowestIdr!.name} would cost ${formatCurrencyFull(lowestIdr!.monthlyPayment)} a month instead of ${formatCurrencyFull(pick.monthlyPayment)}.`
              : undefined,
      };
    }
  }

  // ── Fastest payoff ──
  if (priority === "fastest") {
    // PSLF belongs in this race when it actually pays, because ten years to a
    // zero balance beats every repayment term on the board. When it forgives
    // nothing it is excluded, and the genuinely fastest plan wins even if that
    // plan earns no PSLF credit. Suppressing the fastest option for someone who
    // asked for speed, in order to protect a forgiveness track worth nothing to
    // them, is exactly the wrong trade.
    const pool = plans.filter((p) => (p.id === "pslf" ? pslfPays : true));
    const ranked = [...pool].sort(
      (a, b) => a.payoffYears - b.payoffYears || a.totalPaid - b.totalPaid
    );
    const pick = ranked[0];
    if (pick) {
      const reasons = [
        `${pick.name} clears your balance fastest, in ${yrs(pick)}`,
        pick.id === "pslf"
          ? `Payment is ${formatCurrencyFull(pick.monthlyPayment)} a month and you pay ${formatCurrencyFull(pick.totalPaid)} in total before the rest is cancelled`
          : `Payment is ${formatCurrencyFull(pick.monthlyPayment)} a month and you pay ${formatCurrencyFull(pick.totalInterest)} in interest`,
      ];
      const breaksPslf =
        pslfPays && !PSLF_QUALIFYING_PLANS.includes(pick.id) && pslf;

      reasons.push(
        pick.id === "pslf"
          ? `Ten years to a zero balance beats every repayment term available to you, and ${formatCurrencyFull(pslf!.forgivenAmount)} is cancelled tax-free`
          : breaksPslf
            ? `Be careful here, because payments on ${pick.name} earn no PSLF credit`
            : pslfPays
              ? `This plan also keeps PSLF on the table, which matters because you would still owe ${formatCurrencyFull(pslf!.forgivenAmount)} at year 10`
              : pslfEmpty
                ? emptyPslfNote
                : `No forgiveness clock is needed, since the balance is gone before one would run out`
      );

      return {
        recommendedId: pick.id,
        reasons,
        tradeoff: breaksPslf
          ? `You asked for the fastest payoff and this is it, but it costs you PSLF. Staying on a qualifying plan for 10 years would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} tax-free and cost ${formatCurrencyFull(pick.totalPaid - pslf!.totalPaid)} less overall. Pick this only if being debt-free sooner is worth more to you than that.`
          : pick.id === "pslf"
            ? `This only works if you stay in full-time qualifying public-service work for all 10 years. Leaving at year 8 forgives nothing.`
            : lowestIdr && lowestIdr.monthlyPayment < pick.monthlyPayment
              ? `Finishing fast means a higher monthly payment. ${lowestIdr.name} would be ${formatCurrencyFull(lowestIdr.monthlyPayment)} a month instead of ${formatCurrencyFull(pick.monthlyPayment)}.`
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
        `${fallback.name} costs ${formatCurrencyFull(fallback.monthlyPayment)} a month over ${yrs(fallback)}`,
        `Total paid comes to ${formatCurrencyFull(fallback.totalPaid)}`,
        pslfPays
          ? `Payments count toward PSLF, which would cancel ${formatCurrencyFull(pslf!.forgivenAmount)} at year 10`
          : `Compare the cards below before you commit, since the right answer depends on what you care about most`,
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
  const {
    federalBalance,
    federalRate,
    privateBalance,
    income,
    familySize,
    employment,
    priority,
    disbursement,
  } = answers;

  const pslfEligible = ["government", "education", "nonprofit"].includes(
    employment ?? ""
  );

  // "Unsure" is treated as legacy so the borrower still sees every plan they
  // might qualify for, paired with a prominent flag telling them to confirm.
  const isLegacyBorrower = disbursement !== "on_or_after_july_2026";
  const disbursementUnknown =
    disbursement === "unsure" || disbursement === null;

  const plans: PlanResult[] = [];

  if (federalBalance > 0) {
    // RAP is the only plan open to everyone.
    //
    // Tiered Standard is NOT a universal option. Under the RISE final rule
    // (91 FR, May 1, 2026) it applies only to loans first disbursed on or after
    // July 1, 2026. A borrower whose loans all predate that cutoff keeps the
    // legacy lineup and cannot elect Tiered Standard at all.
    //
    // The legacy plans close the moment any loan is disbursed on or after
    // July 1, 2026, and that applies across the whole portfolio rather than to
    // the new loan alone.
    if (isLegacyBorrower) {
      plans.push(
        calcStandard(federalBalance, federalRate),
        calcGraduated(federalBalance, federalRate),
        calcIBR(federalBalance, federalRate, income, familySize)
      );
    } else {
      plans.push(calcTieredStandard(federalBalance, federalRate));
    }

    plans.push(calcRAP(federalBalance, federalRate, income, familySize));

    if (pslfEligible) {
      plans.push(
        calcPSLF(
          federalBalance,
          federalRate,
          income,
          familySize,
          isLegacyBorrower
        )
      );
    }
  }

  // Add take-home context to all plans
  const monthlyTakeHome = estimateTakeHomePay(income) / 12;
  for (const plan of plans) {
    if (monthlyTakeHome > 0) {
      plan.monthlyPaymentAsPercentOfTakeHome =
        (plan.monthlyPayment / monthlyTakeHome) * 100;
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
