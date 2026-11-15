import { AUTOPAY_DEADLINE } from "@/data/plans";

const STEPS = [
  {
    label: "See your exact loans",
    url: "https://studentaid.gov",
    description: "Log in to see every federal loan, balance, rate and servicer.",
  },
  {
    label: "Apply for an income-driven plan",
    url: "https://studentaid.gov/idr",
    description: "The official IBR and RAP application. About 10 minutes.",
  },
  {
    label: "Check PSLF",
    url: "https://studentaid.gov/pslf",
    description: "In public service? Certify your employer now, and each year.",
  },
];

const AUTOPAY = {
  label: "Turn on autopay by Dec. 31, 2026",
  url: "https://studentaid.gov/manage-loans/repayment/servicers",
  description: "Direct Loans on autopay get 1 point off the rate through June 2028. Your servicer sets it up.",
};

export default function NextSteps({ now }: { now: number }) {
  const steps = now < Date.parse(AUTOPAY_DEADLINE) ? [...STEPS, AUTOPAY] : STEPS;
  return (
    <section aria-labelledby="next-title">
      <h2 id="next-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[1.75rem]">
        Ready to act on it?
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.label}>
            <a
              href={step.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full min-h-[48px] items-start justify-between gap-3 rounded-3xl border border-line bg-white px-5 py-4 transition-colors hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              <span>
                <span className="block text-base font-semibold text-slate-900 group-hover:underline group-hover:underline-offset-4">
                  {step.label}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-slate-700">{step.description}</span>
              </span>
              <svg aria-hidden="true" className="mt-1 h-4 w-4 flex-shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
