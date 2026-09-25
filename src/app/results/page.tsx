"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/shared/Nav";
import RecommendationBanner from "@/components/results/RecommendationBanner";
import PlanCard from "@/components/results/PlanCard";
import ComparisonChart from "@/components/results/ComparisonChart";
import WarningFlags from "@/components/results/WarningFlags";
import NextSteps from "@/components/results/NextSteps";
import ShareButton from "@/components/results/ShareButton";
import { CalculationResult } from "@/types";
import { calculatePlans } from "@/lib/calculator";
import {
  storage,
  decodeQuizAnswers,
  formatCurrencyFull,
} from "@/lib/utils";
import { PLAN_META, DECIMAL_CTA_URL, LEGAL_DISCLAIMER } from "@/data/plans";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encoded = searchParams.get("q");
    if (encoded) {
      const answers = decodeQuizAnswers(encoded);
      if (answers) {
        const calc = calculatePlans(answers);
        setResult(calc);
        setLoading(false);
        return;
      }
    }

    const raw = storage.get("loan-lab-result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CalculationResult;
        setResult(parsed);
        setLoading(false);
        return;
      } catch {
        // corrupt data
      }
    }

    setLoading(false);
    router.push("/");
  }, [searchParams, router]);

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  // Every plan this tool compares is federal, so a private-only borrower
  // gets an explanation instead of an empty comparison.
  if (result && result.quizAnswers.loanType === "private") {
    return (
      <>
        <Nav />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Federal repayment plans don&apos;t apply to private loans
          </h1>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Loan Lab compares federal repayment plans: Standard, Graduated,
            IBR, RAP, Tiered Standard, and Public Service Loan Forgiveness
            (PSLF). Those plans only cover federal student loans, so none of
            them apply to loans from a bank, credit union, or private lender.
          </p>

          <div className="mt-6 p-5 rounded-2xl border border-slate-200 bg-white">
            <h2 className="text-sm font-bold text-slate-900">
              What to do instead
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Contact your lender and ask what repayment options they offer.
              Your terms come from your loan agreement, so your lender is the
              one who can tell you what&apos;s available, especially if your
              payment is hard to keep up with.
            </p>
          </div>

          <div className="mt-4 p-5 rounded-2xl border border-slate-200 bg-white">
            <h2 className="text-sm font-bold text-slate-900">
              Not sure every loan is private?
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Log in to studentaid.gov with your FSA ID. Any loan listed there
              is federal. If you find one, retake the quiz and choose &quot;I
              have both&quot; to see the plans you qualify for.
            </p>
            <a
              href="https://studentaid.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-semibold text-navy hover:text-navy-hover transition-colors"
            >
              Check studentaid.gov →
            </a>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                storage.remove("loan-lab-result");
                storage.remove("loan-lab-progress");
                router.push("/");
              }}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition-colors"
            >
              Retake the quiz
            </button>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 leading-relaxed text-center max-w-2xl mx-auto">
              {LEGAL_DISCLAIMER}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!result || result.plans.length === 0) {
    return (
      <>
        <Nav />
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-slate-500 text-sm">
            No results found. Take the quiz first.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition-colors"
          >
            Take the quiz
          </button>
        </div>
      </>
    );
  }

  const recommendedPlan = result.plans.find(
    (p) => p.id === result.recommendedId
  );
  const answers = result.quizAnswers;

  // Sort: top pick first, then by total paid (lowest first)
  const sortedPlans = [...result.plans].sort((a, b) => {
    if (a.id === result.recommendedId) return -1;
    if (b.id === result.recommendedId) return 1;
    return a.totalPaid - b.totalPaid;
  });

  return (
    <>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Your repayment options
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Based on a {formatCurrencyFull(answers.federalBalance)} federal
              balance at {answers.federalRate}% interest on a{" "}
              {formatCurrencyFull(answers.income)} income.
            </p>
          </div>
          <ShareButton answers={answers} />
        </div>

        {/* Low income context banner */}
        {answers.income < 5000 && result.hasFederal && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm font-semibold text-blue-900">
              These results reflect a {answers.income === 0 ? "$0" : formatCurrencyFull(answers.income)} income
            </p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              With little or no income, income-driven plans show $0 monthly
              payments — which is accurate for right now. But once you start
              earning, your payments will adjust based on your salary. For a
              more realistic picture of what you&apos;ll actually pay, try
              re-running with your expected starting salary.
            </p>
            <button
              onClick={() => {
                storage.remove("loan-lab-result");
                router.push("/");
              }}
              className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              ← Re-run with expected salary
            </button>
          </div>
        )}

        {/* Top Pick */}
        {recommendedPlan && (
          <RecommendationBanner
            planName={PLAN_META[recommendedPlan.id].name}
            reasons={result.recommendationReasons}
            tradeoff={result.recommendationTradeoff}
          />
        )}

        {/* Plan Cards Grid — top pick first */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isRecommended={plan.id === result.recommendedId}
              index={i}
              pslfEligible={result.pslfEligible}
            />
          ))}
        </div>

        {/* Comparison Chart */}
        <div className="mt-10 p-5 rounded-2xl border border-slate-200 bg-white">
          <ComparisonChart
            plans={result.plans}
            recommendedId={result.recommendedId}
          />
        </div>

        {/* Warning Flags */}
        <div className="mt-10">
          <WarningFlags result={result} />
        </div>

        {/* Next Steps */}
        <div className="mt-10">
          <NextSteps />
        </div>

        {/* Footer CTA */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <h3 className="text-base font-bold text-slate-900">
            Want to see all your loans in one place?
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Cense Loan Desk puts every federal loan on one screen, shows which
            repayment plans you actually qualify for, and ranks which loan to
            pay down first.
          </p>
          <a
            href={DECIMAL_CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition-colors"
          >
            Open Loan Desk →
          </a>
        </div>

        {/* Retake */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              storage.remove("loan-lab-result");
              storage.remove("loan-lab-progress");
              router.push("/");
            }}
            className="text-sm text-slate-400 hover:text-navy transition-colors"
          >
            ← Retake the quiz
          </button>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 pt-6 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center max-w-2xl mx-auto">
            {LEGAL_DISCLAIMER}
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
