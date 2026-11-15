import { CalculationResult } from "@/types";
import {
  SAVE_ENDED_WARNING,
  TEACHER_FORGIVENESS_INFO,
  TIERED_STANDARD_PSLF_WARNING,
  POST_2026_LOCKOUT_WARNING,
  CONSOLIDATION_WARNING,
  IDR_TAX_WARNING,
} from "@/data/plans";
import { cn } from "@/lib/utils";

type Note = { tone: "warn" | "tip"; text: string };

/** Every caveat that applies, highest stakes first. The first few show; the rest wait behind one click. */
export function notesFor(result: CalculationResult): Note[] {
  const { plans, pslfEligible, hasFederal, hasPrivate, quizAnswers, recommendedId, isLegacyBorrower } = result;
  const find = (id: string) => plans.find((p) => p.id === id);
  const highIncome = (quizAnswers.income ?? 0) > 60000;
  const rap = find("rap");
  const standard = find("standard");
  const notes: Note[] = [];

  if (pslfEligible) notes.push({ tone: "warn", text: TIERED_STANDARD_PSLF_WARNING });
  if (!isLegacyBorrower) notes.push({ tone: "warn", text: POST_2026_LOCKOUT_WARNING });
  if (plans.some((p) => p.forgivenAmount > 0 && p.id !== "pslf")) notes.push({ tone: "warn", text: IDR_TAX_WARNING });
  if (quizAnswers.employment === "education") notes.push({ tone: "warn", text: TEACHER_FORGIVENESS_INFO });
  if (hasFederal) notes.push({ tone: "warn", text: SAVE_ENDED_WARNING });
  if (hasFederal) notes.push({ tone: "warn", text: CONSOLIDATION_WARNING });
  if (hasPrivate)
    notes.push({
      tone: "warn",
      text: "Private loans cannot use IBR, RAP or PSLF. Your options there are your lender's: ask what they offer, refinance to a lower rate, or pay them down faster.",
    });
  if (pslfEligible && recommendedId !== "pslf" && quizAnswers.priority !== "forgiveness")
    notes.push({
      tone: "tip",
      text: "Working full time in public service? PSLF could cancel what is left after 120 payments, untaxed. Retake the quiz and choose “Explore loan forgiveness” to see it priced.",
    });
  if (rap && standard && rap.monthlyPayment > standard.monthlyPayment && highIncome)
    notes.push({
      tone: "tip",
      text: "RAP has no cap. At your income it costs more each month than Standard, so compare the two before you choose.",
    });
  if (!pslfEligible && highIncome)
    notes.push({
      tone: "tip",
      text: "On a higher income, a fixed plan often costs less: income-driven payments end up close to fixed ones while committing you to 20 or 30 years.",
    });
  if (hasFederal)
    notes.push({
      tone: "tip",
      text: "Refinancing federal loans with a private lender turns them private for good: no IBR, RAP or PSLF afterward. It can make sense on a high income with no use for forgiveness. For most students, keeping federal protections is safer.",
    });
  return notes;
}

const SHOWN = 3;

export default function ThingsToKnow({ result }: { result: CalculationResult }) {
  const notes = notesFor(result);
  if (!notes.length) return null;
  const first = notes.slice(0, SHOWN);
  const rest = notes.slice(SHOWN);

  return (
    <section aria-labelledby="know-title">
      <h2 id="know-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[1.75rem]">
        Before you choose
      </h2>
      <ul className="mt-4 space-y-3">
        {first.map((n) => (
          <NoteItem key={n.text} note={n} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-full text-base font-semibold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy [&::-webkit-details-marker]:hidden">
            <svg aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {rest.length} more {rest.length === 1 ? "thing" : "things"} to know
          </summary>
          <ul className="unfold mt-3 space-y-3">
            {rest.map((n) => (
              <NoteItem key={n.text} note={n} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function NoteItem({ note }: { note: Note }) {
  return (
    <li className="flex gap-3 rounded-3xl border border-line bg-white px-5 py-4">
      <span
        aria-hidden="true"
        className={cn("mt-1 w-1 flex-shrink-0 self-stretch rounded-full", note.tone === "warn" ? "bg-chart-orange" : "bg-chart-green")}
      />
      <p className="text-base leading-relaxed text-slate-800 text-pretty">{note.text}</p>
    </li>
  );
}
