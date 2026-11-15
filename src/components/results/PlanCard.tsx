import { PlanResult } from "@/types";
import {
  PLAN_META,
  TIERED_STANDARD_DEFAULT_WARNING,
  TIERED_STANDARD_PSLF_WARNING,
  FLAT_INCOME_CARD_NOTE,
} from "@/data/plans";
import { formatCurrencyFull, cn } from "@/lib/utils";

interface Props {
  plan: PlanResult;
  isRecommended: boolean;
  pslfEligible: boolean;
}

export default function PlanCard({ plan, isRecommended, pslfEligible }: Props) {
  const meta = PLAN_META[plan.id];
  const forgiven = plan.forgivenAmount > 0;

  return (
    <article
      data-plan={plan.id}
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex flex-col rounded-3xl border bg-white p-5 shadow-card sm:p-6",
        isRecommended ? "border-navy ring-1 ring-navy" : "border-line"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={`plan-${plan.id}`} className="font-display text-xl font-bold text-slate-900">
          {plan.name}
        </h3>
        {isRecommended && (
          <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-white">Our pick</span>
        )}
        {meta.statusLabel && (
          <span className="rounded-full bg-selected px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {meta.statusLabel}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{plan.tagline}</p>

      {plan.id === "tiered_standard" && (
        <p
          className={cn(
            "mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed",
            pslfEligible ? "bg-accent-light text-slate-900" : "bg-selected text-slate-800"
          )}
        >
          {pslfEligible ? TIERED_STANDARD_PSLF_WARNING : TIERED_STANDARD_DEFAULT_WARNING}
        </p>
      )}

      <dl className="mt-5 divide-y divide-line border-y border-line">
        <Row label="Monthly payment" value={formatCurrencyFull(plan.monthlyPayment)} strong />
        {plan.id === "graduated" && plan.finalPayment ? (
          <Row label="Rises to" value={formatCurrencyFull(plan.finalPayment)} />
        ) : null}
        <Row label="Total paid" value={formatCurrencyFull(plan.totalPaid)} />
        <Row label="Interest paid" value={formatCurrencyFull(plan.totalInterest)} />
        <Row
          label={forgiven ? "Forgiven after" : "Paid off in"}
          value={`${plan.payoffYears} year${plan.payoffYears === 1 ? "" : "s"}`}
        />
        {forgiven && <Row label="Amount forgiven" value={formatCurrencyFull(plan.forgivenAmount)} />}
      </dl>

      {forgiven && (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {plan.id === "pslf"
            ? "PSLF forgiveness is not taxed."
            : `Estimated federal tax on it: ${formatCurrencyFull(plan.forgivenessTax)}, due with that year's return. Nothing is withheld.`}
        </p>
      )}
      {plan.id === "pslf" && (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Priced on {plan.via === "ibr" ? "IBR" : "RAP"}, your lower qualifying payment.
        </p>
      )}
      {(plan.id === "ibr" || plan.id === "rap" || plan.id === "pslf") && (
        <p data-flat-income-card className="mt-2 text-sm leading-relaxed text-slate-700">
          {FLAT_INCOME_CARD_NOTE}
        </p>
      )}
      {plan.monthlyPaymentAsPercentOfTakeHome > 0 && (
        <p className="mt-2 text-sm text-slate-600">
          About {plan.monthlyPaymentAsPercentOfTakeHome.toFixed(0)}% of a rough monthly take-home.
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{meta.definition}</p>

      <details className="group mt-auto pt-4">
        <summary className="flex min-h-[40px] cursor-pointer list-none items-center gap-2 rounded-full text-sm font-semibold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy [&::-webkit-details-marker]:hidden">
          <svg aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Good and bad
        </summary>
        <div className="unfold mt-2 grid gap-4">
          <List title="Good" items={meta.pros} mark="+" />
          <List title="Bad" items={meta.cons} mark={"\u2212"} />
        </div>
      </details>
    </article>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-sm text-slate-700">{label}</dt>
      <dd className={cn("tnum text-slate-900", strong ? "figure text-2xl font-bold" : "text-base font-semibold")}>{value}</dd>
    </div>
  );
}

function List({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <span aria-hidden="true" className="w-3 flex-shrink-0 font-semibold text-slate-900">{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
