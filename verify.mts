import { calculatePlans } from "@/lib/calculator";
import { INITIAL_ANSWERS, QuizAnswers } from "@/types";
import { getTieredStandardYears } from "@/data/plans";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

function run(over: Partial<QuizAnswers>) {
  return calculatePlans({ ...INITIAL_ANSWERS, ...over } as QuizAnswers);
}

const base: Partial<QuizAnswers> = {
  loanType: "federal",
  federalBalance: 27000,
  federalRate: 6.39,
  income: 45000,
  familySize: 1,
  employment: "private",
  priority: "low_payment",
};

console.log("\n1. Legacy borrower (all loans before July 1, 2026)");
const legacy = run({ ...base, disbursement: "before_july_2026" });
const legacyIds = legacy.plans.map((p) => p.id).sort();
check("gets 4 plans", legacy.plans.length === 4, `got ${legacyIds.join(",")}`);
check(
  "includes standard, graduated, ibr, rap",
  ["graduated", "ibr", "rap", "standard"].every((id) =>
    legacyIds.includes(id as never)
  ),
  legacyIds.join(",")
);
check("SAVE is gone", !legacyIds.includes("save" as never));
check("isLegacyBorrower true", legacy.isLegacyBorrower);

console.log("\n2. Post-2026 borrower (any loan on/after July 1, 2026)");
const post = run({ ...base, disbursement: "on_or_after_july_2026" });
const postIds = post.plans.map((p) => p.id).sort();
check("gets exactly 2 plans", post.plans.length === 2, `got ${postIds.join(",")}`);
check(
  "only rap + tiered_standard",
  postIds.join(",") === "rap,tiered_standard",
  postIds.join(",")
);
check("isLegacyBorrower false", !post.isLegacyBorrower);

console.log("\n3. 'Unsure' is treated as legacy but flagged");
const unsure = run({ ...base, disbursement: "unsure" });
check("disbursementUnknown true", unsure.disbursementUnknown);

console.log("\n3b. Tiered Standard eligibility (RISE final rule)");
const legacyPlans = run({ ...base, disbursement: "before_july_2026" }).plans.map((p) => p.id);
const newPlans = run({ ...base, disbursement: "on_or_after_july_2026" }).plans.map((p) => p.id);
check(
  "legacy borrower is NOT offered Tiered Standard",
  !legacyPlans.includes("tiered_standard"),
  `got ${legacyPlans.join(", ")}`
);
check(
  "legacy borrower keeps Standard, Graduated, IBR, RAP",
  ["standard", "graduated", "ibr", "rap"].every((id) => legacyPlans.includes(id as never)),
  `got ${legacyPlans.join(", ")}`
);
check(
  "post-2026 borrower gets exactly Tiered Standard and RAP",
  newPlans.length === 2 &&
    newPlans.includes("tiered_standard") &&
    newPlans.includes("rap"),
  `got ${newPlans.join(", ")}`
);
check(
  "post-2026 borrower loses Standard, Graduated, IBR",
  !["standard", "graduated", "ibr"].some((id) => newPlans.includes(id as never)),
  `got ${newPlans.join(", ")}`
);

console.log("\n4. Tiered Standard term brackets");
check("$24,999 -> 10 years", getTieredStandardYears(24999) === 10);
check("$25,000 -> 15 years", getTieredStandardYears(25000) === 15);
check("$49,999 -> 15 years", getTieredStandardYears(49999) === 15);
check("$50,000 -> 20 years", getTieredStandardYears(50000) === 20);
check("$99,999 -> 20 years", getTieredStandardYears(99999) === 20);
check("$100,000 -> 25 years", getTieredStandardYears(100000) === 25);

// Tiered Standard is post-July-2026 only (RISE final rule, 91 FR, May 1 2026),
// so it must be built from a post-cutoff borrower.
const ts27k = run({ ...base, disbursement: "on_or_after_july_2026" }).plans.find(
  (p) => p.id === "tiered_standard"
)!;
check("$27k lands in the 15-year tier", ts27k.payoffYears === 15, `got ${ts27k.payoffYears}`);
check("Tiered Standard forgives nothing", ts27k.forgivenAmount === 0);
check("Tiered Standard has no tax bomb", ts27k.taxBombEstimate === 0);

console.log("\n5. PSLF-eligible borrower is never steered to Tiered Standard");
for (const priority of ["low_payment", "least_total", "fastest", "forgiveness"] as const) {
  for (const disbursement of ["before_july_2026", "on_or_after_july_2026"] as const) {
    const r = run({ ...base, employment: "nonprofit", priority, disbursement });
    check(
      `${priority} / ${disbursement} -> not tiered_standard`,
      r.recommendedId !== "tiered_standard",
      `got ${r.recommendedId}`
    );
  }
}

console.log("\n6. RAP mechanics");
const lowIncome = run({
  ...base,
  income: 9000,
  disbursement: "on_or_after_july_2026",
});
const rapLow = lowIncome.plans.find((p) => p.id === "rap")!;
check("RAP floor is $10/mo at sub-$10k income", Math.round(rapLow.monthlyPayment) === 10, `got ${rapLow.monthlyPayment}`);

const rap45 = legacy.plans.find((p) => p.id === "rap")!;
// $45,000 AGI sits in the 4% bracket -> 45000 * 0.04 / 12 = $150/mo
check("RAP at $45k AGI = $150/mo (4% bracket)", Math.round(rap45.monthlyPayment) === 150, `got ${rap45.monthlyPayment}`);

console.log("\n7. Forgiveness tax treatment");
const forg = run({
  ...base,
  income: 22000,
  employment: "nonprofit",
  priority: "forgiveness",
  disbursement: "before_july_2026",
});
const pslfPlan = forg.plans.find((p) => p.id === "pslf")!;
check("PSLF forgiveness is tax-free", pslfPlan.taxBombEstimate === 0);
const idrForgiven = forg.plans.filter(
  (p) => p.forgivenAmount > 0 && p.id !== "pslf"
);
check(
  "every IDR plan with forgiveness carries a tax estimate",
  idrForgiven.length > 0 && idrForgiven.every((p) => p.taxBombEstimate > 0),
  `${idrForgiven.map((p) => `${p.id}:${Math.round(p.taxBombEstimate)}`).join(" ")}`
);

console.log("\n8. Standard 10-year amortization sanity");
const std = legacy.plans.find((p) => p.id === "standard")!;
// $27,000 at 6.39% over 120 months -> ~$304/mo
check("Standard ~$304/mo", Math.abs(std.monthlyPayment - 304) < 3, `got ${std.monthlyPayment.toFixed(2)}`);
check("Standard payoff is 10 years", std.payoffYears === 10);
check("Tiered Standard (15yr) costs more interest than Standard (10yr)", ts27k.totalInterest > std.totalInterest);

console.log(
  failures === 0
    ? "\nAll checks passed.\n"
    : `\n${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
