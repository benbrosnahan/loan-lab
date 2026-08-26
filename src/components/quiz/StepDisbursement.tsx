"use client";

import { Disbursement } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import { useRef } from "react";

interface Props {
  value: Disbursement | null;
  onChange: (v: Disbursement) => void;
  onNext: () => void;
}

const OPTIONS: { value: Disbursement; label: string; description: string }[] = [
  {
    value: "before_july_2026",
    label: "All of them came before July 1, 2026",
    description:
      "You finished borrowing before that date and haven't consolidated since",
  },
  {
    value: "on_or_after_july_2026",
    label: "At least one came on or after July 1, 2026",
    description:
      "Includes anyone still in school and borrowing for the 2026-27 year",
  },
  {
    value: "unsure",
    label: "Not sure",
    description: "We'll show you everything and flag what to confirm",
  },
];

export default function StepDisbursement({ value, onChange, onNext }: Props) {
  const advanceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (v: Disbursement) => {
    onChange(v);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onNext, 400);
  };

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        tabIndex={-1}
      >
        When was your most recent loan disbursed?
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        This one question decides which repayment plans you are legally allowed
        to use.
      </p>

      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-xs text-slate-400 leading-relaxed">
          <em>
            &ldquo;Disbursed&rdquo; means the day the money actually landed at
            your school, rather than the day you signed anything. Under the law
            passed in July 2025, a single loan disbursed on or after July 1,
            2026 closes the Standard, Graduated, Extended, and IBR plans across
            your entire portfolio, including the loans you took out years
            earlier. A consolidation loan counts as a new loan for this test.
          </em>
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-5 mb-2">
        Selecting an option will advance to the next step.
      </p>

      <div
        className="space-y-2.5"
        role="radiogroup"
        aria-label="Loan disbursement timing"
      >
        {OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={value === opt.value}
            onClick={() => handleSelect(opt.value)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-5 leading-relaxed">
        You can check your disbursement dates by logging into{" "}
        <a
          href="https://studentaid.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-600"
        >
          studentaid.gov
        </a>{" "}
        and opening My Aid.
      </p>
    </div>
  );
}
