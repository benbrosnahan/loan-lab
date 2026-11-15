// Independent money oracle for Loan Lab. Created with Claude Code.
//
// Every rule here is written from the primary source named beside it, never from the app's code, so a test can
// say what a figure should be without asking the app. Sources (checked 2026-11-15):
//   34 CFR 685.208, 685.209, 685.210, 685.219 (eCFR, current through 2026-11-12)
//   HHS 2026 poverty guidelines, aspe.hhs.gov
//   IRS 2026 inflation adjustments (Rev. Proc. 2025-32)
//   studentaid.gov interest rates page (2026-27 undergraduate rate 6.52%)

/** HHS 2026 poverty guideline, 48 contiguous states and DC: $15,960 for one person, $5,680 per extra person. */
export const povertyLine = familySize => 15960 + 5680 * (Math.max(1, familySize) - 1);

/** Level payment that repays `balance` in `months` at an annual percentage rate. */
export function amortized(balance, ratePct, months) {
  const r = ratePct / 1200;
  return r ? (balance * r) / (1 - Math.pow(1 + r, -months)) : balance / months;
}

/** A fixed payment until the balance clears, the last payment being only what is owed. */
export function payDown(balance, ratePct, payment, maxMonths = 1200) {
  const r = ratePct / 1200;
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
  return { months, paid, interest: paid - balance, cleared: owed <= 0.005 };
}

/** 10-year Standard, 34 CFR 685.208(b)(1)(i)-(ii): 120 level payments, at least $50 a month. */
export function standard(balance, ratePct) {
  const payment = Math.max(50, amortized(balance, ratePct, 120));
  return { payment, ...payDown(balance, ratePct, payment) };
}

/** Tiered Standard term by balance, 34 CFR 685.208(c)(1)(iii). */
export const tieredYears = balance => (balance < 25000 ? 10 : balance < 50000 ? 15 : balance < 100000 ? 20 : 25);

/** Tiered Standard, 685.208(c)(1)(ii)-(iii): level payments over the tier's term, at least $50 a month. */
export function tiered(balance, ratePct) {
  const payment = Math.max(50, amortized(balance, ratePct, tieredYears(balance) * 12));
  return { payment, years: tieredYears(balance), ...payDown(balance, ratePct, payment) };
}

/**
 * Graduated model, 685.208(b)(6): repaid within 10 years at two or more levels, no payment more than three
 * times any other, no $50 minimum. Modelled as five two-year levels each 3^(1/4) times the last, so the last
 * is exactly three times the first, with the first solved so the schedule repays in month 120.
 */
export function graduated(balance, ratePct) {
  const r = ratePct / 1200;
  const g = Math.pow(3, 1 / 4);
  let pvPerDollar = 0;
  for (let m = 0; m < 120; m++) pvPerDollar += Math.pow(g, Math.floor(m / 24)) / Math.pow(1 + r, m + 1);
  const first = balance / pvPerDollar;
  let owed = balance;
  let paid = 0;
  for (let m = 0; m < 120 && owed > 0.005; m++) {
    const due = owed * (1 + r);
    const pay = Math.min(first * Math.pow(g, Math.floor(m / 24)), due);
    owed = due - pay;
    paid += pay;
  }
  return { first, last: first * 3, paid, interest: paid - balance };
}

/**
 * IBR for a new borrower: 685.209(b)(1)(ii) and (f)(2), 10% of income above 150% of the poverty guideline, over
 * 12, never more than the 10-year Standard payment; (g)(1)(iii) under $5 is $0, $5 to under $10 is $10.
 */
export function ibrPayment(agi, familySize, balance, ratePct) {
  let p = (Math.max(0, agi - 1.5 * povertyLine(familySize)) * 0.1) / 12;
  if (p < 5) p = 0;
  else if (p < 10) p = 10;
  return Math.min(p, standard(balance, ratePct).payment);
}

/**
 * RAP: 685.209(b)(2) base payment by AGI ("not more than" each ceiling), (f)(5) over 12 minus $50 per dependent,
 * (g)(3)(ii) at least $10.
 */
export function rapPayment(agi, dependents) {
  const steps = [[10000, null], [20000, 0.01], [30000, 0.02], [40000, 0.03], [50000, 0.04],
    [60000, 0.05], [70000, 0.06], [80000, 0.07], [90000, 0.08], [100000, 0.09]];
  const hit = steps.find(([ceiling]) => agi <= ceiling);
  const base = !hit ? agi * 0.1 : hit[1] === null ? 120 : agi * hit[1];
  return Math.max(10, base / 12 - 50 * dependents);
}

/**
 * Months on IBR, 685.209(j)(2): while the borrower stays on IBR, unpaid interest is not capitalized. It sits
 * beside principal and earns none, and each payment goes to accrued interest first (685.211(a)(1)). What is left
 * after 240 payments is forgiven (685.209(k)(2)).
 */
export function ibrPath(balance, ratePct, payment, months = 240) {
  const r = ratePct / 1200;
  let principal = balance;
  let unpaid = 0;
  let paid = 0;
  let interest = 0;
  let n = 0;
  for (; n < months && principal + unpaid > 0.005; n++) {
    unpaid += principal * r;
    const pay = Math.min(payment, principal + unpaid);
    const toInterest = Math.min(pay, unpaid);
    unpaid -= toInterest;
    principal -= pay - toInterest;
    paid += pay;
    interest += toInterest;
  }
  const left = Math.max(0, principal + unpaid);
  return { paid, interest, left, months: n, cleared: left <= 0.005 };
}

/**
 * Months on RAP. 685.209(h)(4)(i): interest the on-time payment does not cover is not charged. (o)(2)(i): when a
 * payment lowers principal by less than $50, ED lowers it by the lesser of $50 or the payment, minus what the
 * payment already put on principal. What is left after 360 payments is forgiven (685.209(k)(7)).
 */
export function rapPath(balance, ratePct, payment, months = 360) {
  const r = ratePct / 1200;
  let owed = balance;
  let paid = 0;
  let interestPaid = 0;
  let n = 0;
  for (; n < months && owed > 0.005; n++) {
    const interest = owed * r;
    const pay = Math.min(payment, owed + interest);
    const charged = Math.min(interest, pay);
    const toPrincipal = pay - charged;
    let cut = toPrincipal;
    if (toPrincipal < 50) cut = Math.min(50, pay);
    owed = Math.max(0, owed - cut);
    paid += pay;
    interestPaid += charged;
  }
  return { paid, interest: interestPaid, left: owed, months: n, cleared: owed <= 0.005 };
}

const SINGLE = { deduction: 16100, brackets: [[12400, 0.1], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]] };
const JOINT = { deduction: 32200, brackets: [[24800, 0.1], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]] };

/** 2026 federal income tax on taxable income (IRS, Rev. Proc. 2025-32). */
export function incomeTax(taxable, joint = false) {
  let tax = 0;
  let lower = 0;
  for (const [upTo, rate] of (joint ? JOINT : SINGLE).brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

/**
 * Federal tax on a balance forgiven at the end of IBR or RAP: Pub. L. 119-21 sec. 70119 kept the IRC 108(f)(5)
 * exclusion only for death and disability after 2025, so the forgiven balance is income in the year it is
 * forgiven. Tax with it, less tax without it, at 2026 brackets and the standard deduction.
 */
export function forgivenessTax(agi, forgiven, joint = false) {
  if (forgiven <= 0) return 0;
  const d = (joint ? JOINT : SINGLE).deduction;
  return incomeTax(Math.max(0, agi + forgiven - d), joint) - incomeTax(Math.max(0, agi - d), joint);
}

/** Parses a figure such as "$1,234" or "-$12" into a number. Returns null when there is none. */
export function money(text) {
  const m = String(text ?? '').match(/-?\$\s?-?[\d,]+(\.\d+)?/);
  return m ? Number(m[0].replace(/[$,\s]/g, '')) : null;
}
