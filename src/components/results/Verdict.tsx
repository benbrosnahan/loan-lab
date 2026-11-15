import { PlanResult } from "@/types";
import { formatCurrencyFull } from "@/lib/utils";
import ShareButton from "./ShareButton";
import { QuizAnswers } from "@/types";

interface Props {
  plan: PlanResult;
  reasons: string[];
  tradeoff?: string;
  answers: QuizAnswers;
}

const ACTION: Record<PlanResult["id"], { href: string; label: string; note: string }> = {
  ibr: { href: "https://studentaid.gov/idr", label: "Apply on studentaid.gov", note: "The official income-driven application. About 10 minutes." },
  rap: { href: "https://studentaid.gov/idr", label: "Apply on studentaid.gov", note: "The official income-driven application. About 10 minutes." },
  pslf: { href: "https://studentaid.gov/pslf", label: "Start PSLF on studentaid.gov", note: "Certify your employer, then apply for the income-driven plan." },
  standard: { href: "https://studentaid.gov/manage-loans/repayment/servicers", label: "Find your servicer", note: "Your servicer switches fixed plans. You are on Standard unless you chose another." },
  graduated: { href: "https://studentaid.gov/manage-loans/repayment/servicers", label: "Find your servicer", note: "Your servicer switches fixed plans for you." },
  tiered_standard: { href: "https://studentaid.gov/manage-loans/repayment/servicers", label: "Find your servicer", note: "You land on Tiered Standard if you never pick a plan." },
};

/** The answer, first: the pick in a sentence, its monthly figure, why, what it costs you, and one next step. */
export default function Verdict({ plan, reasons, tradeoff, answers }: Props) {
  const action = ACTION[plan.id];
  return (
    <section aria-labelledby="verdict" data-recommended={plan.id} className="rise">
      <h1
        id="verdict"
        className="font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-slate-900 text-balance sm:text-[3.5rem]"
      >
        {plan.id === "pslf" ? "PSLF looks like your best fit." : `${plan.name} looks like your best fit.`}
      </h1>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="figure text-[2.75rem] font-bold leading-none text-slate-900 sm:text-[3.5rem]">
          {formatCurrencyFull(plan.monthlyPayment)}
        </span>
        <span className="text-lg text-slate-700">
          a month
          {plan.id === "graduated" && plan.finalPayment
            ? `, rising to ${formatCurrencyFull(plan.finalPayment)}`
            : plan.id === "pslf"
              ? ` on ${plan.via === "ibr" ? "IBR" : "RAP"}`
              : ""}
        </span>
      </p>

      <ul className="mt-6 max-w-2xl space-y-2.5">
        {reasons.map((reason, i) => (
          <li key={i} className="flex gap-3 text-base leading-relaxed text-slate-800">
            <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      {tradeoff && (
        <p className="mt-5 max-w-2xl border-l-4 border-accent pl-4 text-base leading-relaxed text-slate-800">
          <span className="font-semibold text-accent-hover">What you give up. </span>
          {tradeoff}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col">
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-navy px-6 text-base font-semibold text-white transition-colors hover:bg-navy-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          {action.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <p className="mt-2 text-sm text-slate-600 sm:max-w-[16rem]">{action.note}</p>
        </div>
        <ShareButton answers={answers} />
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
        A starting point, not an answer. The right plan depends on what you value most, so compare the plans below.
      </p>
    </section>
  );
}
