"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/shared/Nav";
import SiteFooter from "@/components/shared/SiteFooter";
import Verdict from "@/components/results/Verdict";
import PlanCard from "@/components/results/PlanCard";
import YearsRuler from "@/components/results/YearsRuler";
import ThingsToKnow from "@/components/results/ThingsToKnow";
import NextSteps from "@/components/results/NextSteps";
import { CalculationResult, INITIAL_ANSWERS, QuizAnswers } from "@/types";
import { calculatePlans, costOf } from "@/lib/calculator";
import {
  storage,
  KEYS,
  decodeQuizAnswers,
  formatCurrencyFull,
  sharedAnswersFromLocation,
  householdOf,
} from "@/lib/utils";
import {
  LOAN_DESK_URL,
  LEGAL_DISCLAIMER,
  ASSUMPTIONS,
  DISBURSEMENT_UNKNOWN_WARNING,
  LOAN_SCOPE_NOTE,
} from "@/data/plans";

function loadAnswers(): QuizAnswers | null {
  const shared = sharedAnswersFromLocation();
  if (shared) {
    const answers = decodeQuizAnswers(shared);
    if (answers) return answers;
  }
  const saved = storage.get(KEYS.answers);
  if (saved) {
    try {
      return { ...INITIAL_ANSWERS, ...(JSON.parse(saved) as QuizAnswers) };
    } catch {
      // corrupt data
    }
  }
  return null;
}

const linkClass =
  "font-semibold text-navy underline decoration-slate-300 underline-offset-4 hover:decoration-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const answers = loadAnswers();
    if (answers) {
      setResult(calculatePlans(answers));
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace("/");
  }, [router]);

  const retake = () => {
    storage.remove(KEYS.answers);
    storage.remove(KEYS.progress);
    router.push("/");
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="sr-only">Your repayment options</h1>
          <p className="text-base text-slate-700">Pricing your plans&hellip;</p>
        </main>
      </>
    );
  }

  // Every plan this tool compares is federal, so a private-only borrower
  // gets an explanation instead of an empty comparison.
  if (result && result.quizAnswers.loanType === "private") {
    return (
      <>
        <Nav />
        <main id="main" className="rise mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
          <h1 className="font-display text-[2.25rem] font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 text-balance">
            Federal repayment plans don&apos;t apply to private loans
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Loan Lab compares federal plans: Standard, Graduated, IBR, RAP, Tiered
            Standard and Public Service Loan Forgiveness (PSLF). None of them
            cover loans from a bank, credit union or private lender.
          </p>
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-line bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">What to do instead</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700">
                Ask your lender what repayment options they offer. Your terms come
                from your loan agreement, so they are the ones who can say,
                especially if a payment is getting hard to make.
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Not sure every loan is private?</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700">
                Log in to studentaid.gov. Any loan listed there is federal. Found
                one? Retake the quiz and choose &ldquo;I have both&rdquo;.
              </p>
              <a href="https://studentaid.gov" target="_blank" rel="noopener noreferrer" className={`mt-3 inline-block ${linkClass}`}>
                Check studentaid.gov
              </a>
            </div>
          </div>
          <button
            onClick={retake}
            className="mt-8 min-h-[48px] rounded-full bg-navy px-6 text-base font-semibold text-white hover:bg-navy-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Retake the quiz
          </button>
          <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-slate-600">{LEGAL_DISCLAIMER}</p>
        </main>
      </>
    );
  }

  if (!result || result.plans.length === 0) {
    return (
      <>
        <Nav />
        <main id="main" className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-slate-900">No results yet</h1>
          <p className="mt-3 text-base text-slate-700">Answer six questions and your plans show up here.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 min-h-[48px] rounded-full bg-navy px-6 text-base font-semibold text-white hover:bg-navy-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Take the quiz
          </button>
        </main>
      </>
    );
  }

  const recommended = result.plans.find((p) => p.id === result.recommendedId);
  const answers = result.quizAnswers;
  const household = householdOf(answers);
  const sortedPlans = [...result.plans].sort((a, b) => {
    if (a.id === result.recommendedId) return -1;
    if (b.id === result.recommendedId) return 1;
    return costOf(a) - costOf(b);
  });

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-20 pt-4 sm:px-6 sm:pt-8">
        <p className="text-sm text-slate-700 tnum">
          For {formatCurrencyFull(answers.federalBalance)} at {answers.federalRate}% and{" "}
          {formatCurrencyFull(answers.income)} AGI
          {household.dependents > 0 ? `, ${household.dependents} dependent${household.dependents === 1 ? "" : "s"}` : ""}
          {household.filesJointly ? ", filing jointly" : ""}.{" "}
          <button type="button" onClick={retake} className={`inline-flex min-h-[40px] items-center ${linkClass}`}>
            Change answers
          </button>
        </p>

        {result.disbursementUnknown && result.hasFederal && (
          <p className="unfold mt-4 max-w-2xl rounded-3xl border border-accent/30 bg-accent-light/60 px-5 py-4 text-base leading-relaxed text-slate-900">
            {DISBURSEMENT_UNKNOWN_WARNING}
          </p>
        )}

        {answers.income < 5000 && result.hasFederal && (
          <p className="unfold mt-4 max-w-2xl rounded-3xl border border-line bg-white px-5 py-4 text-base leading-relaxed text-slate-800">
            At this income IBR can be $0 and RAP is $10, which is right for now.
            Payments rise once you earn more, so try your expected starting
            salary for the fuller picture.{" "}
            <button type="button" onClick={retake} className={linkClass}>
              Re-run with a salary
            </button>
          </p>
        )}

        {recommended && (
          <div className="mt-6">
            <Verdict
              plan={recommended}
              reasons={result.recommendationReasons}
              tradeoff={result.recommendationTradeoff}
              answers={answers}
            />
          </div>
        )}

        <div className="mt-14 border-t border-line pt-10">
          <YearsRuler plans={result.plans} recommendedId={result.recommendedId} />
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-600">{ASSUMPTIONS}</p>
        </div>

        <section aria-labelledby="plans-title" className="mt-14">
          <h2 id="plans-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[1.75rem]">
            Each plan, side by side
          </h2>
          <p className="mt-2 max-w-2xl text-base text-slate-700">
            {LOAN_SCOPE_NOTE}
            {result.isLegacyBorrower && result.quizAnswers.federalBalance > 30000
              ? " Extended (up to 25 years, for balances over $30,000) is open to you but not priced here; Loan Desk prices it."
              : ""}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={plan.id === result.recommendedId}
                pslfEligible={result.pslfEligible}
              />
            ))}
          </div>
        </section>

        <div className="mt-14">
          <ThingsToKnow result={result} />
        </div>

        <div className="mt-14">
          <NextSteps now={now} />
        </div>

        <section aria-labelledby="desk-title" className="mt-14 rounded-3xl bg-navy px-6 py-8 text-white sm:px-10">
          <h2 id="desk-title" className="font-display text-2xl font-bold tracking-[-0.01em] sm:text-[1.75rem]">
            Want every loan on one screen?
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-white/90">
            Loan Desk takes each loan at its own rate, shows which plans you
            actually qualify for, and ranks which loan to pay down first.
          </p>
          <a
            href={LOAN_DESK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-base font-semibold text-navy hover:bg-selected focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            Open Loan Desk
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>

        <p className="mt-10">
          <button type="button" onClick={retake} className={`inline-flex min-h-[40px] items-center text-base ${linkClass}`}>
            Retake the quiz
          </button>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
