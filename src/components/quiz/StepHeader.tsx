/** The question for one step. The h1 takes focus when the step changes. */
export default function StepHeader({ title, hint }: { title: string; hint?: React.ReactNode }) {
  return (
    <div>
      <h1
        id="step-heading"
        tabIndex={-1}
        className="font-display text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.025em] text-slate-900 text-balance focus:outline-none sm:text-[2.75rem]"
      >
        {title}
      </h1>
      {hint && <p className="mt-3 max-w-prose text-base leading-relaxed text-slate-700 text-pretty">{hint}</p>}
    </div>
  );
}

export function ChoiceHint() {
  return <p className="mb-3 mt-6 text-sm text-slate-600">Choosing an answer moves you on.</p>;
}

export function SmallPrint({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 max-w-prose text-sm leading-relaxed text-slate-600 text-pretty">{children}</p>;
}

export function ContinueButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-8 min-h-[52px] w-full rounded-full bg-navy text-base font-semibold text-white transition-colors hover:bg-navy-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-40"
    >
      Continue
    </button>
  );
}

export function Notice({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warn" }) {
  return (
    <div
      className={
        tone === "warn"
          ? "unfold rounded-3xl border border-accent/30 bg-accent-light/60 px-5 py-4 text-sm leading-relaxed text-slate-900"
          : "unfold rounded-3xl border border-line bg-white px-5 py-4 text-sm leading-relaxed text-slate-700"
      }
    >
      {children}
    </div>
  );
}
