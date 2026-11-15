import { PlanResult } from "@/types";
import { formatCurrencyFull, cn } from "@/lib/utils";
import { flatIncomeNote } from "@/data/plans";

interface Props {
  plans: PlanResult[];
  recommendedId: string;
  /** The AGI the projections hold flat. */
  income: number;
}

/**
 * The signature element: every plan as a lane on one shared axis of years, so
 * the trade a student is really making (a lower payment for longer, and a
 * taxed forgiveness at the end) is visible at a glance. The lanes are
 * decoration over a plain list: every number is in the text.
 */
export default function YearsRuler({ plans, recommendedId, income }: Props) {
  const longest = Math.max(10, ...plans.map((p) => p.payoffYears));
  const span = Math.ceil(longest / 10) * 10;
  const ticks = Array.from({ length: span / 5 + 1 }, (_, i) => i * 5);
  const lanes = [...plans].sort(
    (a, b) => a.payoffYears - b.payoffYears || a.totalPaid + a.forgivenessTax - (b.totalPaid + b.forgivenessTax)
  );

  return (
    <section aria-labelledby="ruler-title">
      <h2 id="ruler-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[1.75rem]">
        How long each plan lasts
      </h2>
      <p className="mt-2 max-w-2xl text-base text-slate-700">
        A lower payment usually means more years. An orange end means a balance is left and forgiven.
      </p>
      <p data-flat-income className="mt-4 max-w-2xl rounded-2xl bg-selected px-4 py-3 text-sm leading-relaxed text-slate-800">
        {flatIncomeNote(income)}
      </p>

      <div className="mt-6">
        <div aria-hidden="true" className="relative h-5 text-xs text-slate-600 tnum">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
              style={{ left: `${(t / span) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
        <ol className="mt-2 space-y-5">
          {lanes.map((p, i) => {
            const rec = p.id === recommendedId;
            const width = (p.payoffYears / span) * 100;
            const forgiven = p.forgivenAmount > 0;
            return (
              <li key={p.id} data-lane={p.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    {p.name}
                    {rec && <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">Our pick</span>}
                  </span>
                  <span className="tnum text-base font-semibold text-slate-900">
                    {formatCurrencyFull(p.monthlyPayment)}
                    <span className="font-normal text-slate-600">/mo</span>
                  </span>
                </div>
                <div aria-hidden="true" className="relative mt-2 h-3 rounded-full bg-chart-track">
                  {ticks.slice(1, -1).map((t) => (
                    <span key={t} className="absolute inset-y-0 w-px bg-white" style={{ left: `${(t / span) * 100}%` }} />
                  ))}
                  <span
                    className={cn("lane absolute inset-y-0 left-0 rounded-full", rec ? "bg-chart-green" : "bg-chart-mute")}
                    style={{ width: `${width}%`, animationDelay: `${120 + i * 70}ms` }}
                  />
                  {forgiven && (
                    <span
                      className="appear absolute top-1/2 h-5 w-5 -translate-x-full -translate-y-1/2 rounded-full border-[3px] border-page bg-chart-orange"
                      style={{ left: `${width}%`, animationDelay: `${700 + i * 70}ms` }}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-slate-700 tnum">
                  {p.payoffYears} years, {formatCurrencyFull(p.totalPaid)} paid
                  {forgiven && (
                    <>
                      , then {formatCurrencyFull(p.forgivenAmount)} forgiven
                      {p.forgivenessTax > 0
                        ? ` (about ${formatCurrencyFull(p.forgivenessTax)} in federal tax)`
                        : p.id === "pslf"
                          ? ", untaxed"
                          : ""}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
