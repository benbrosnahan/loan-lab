"use client";

import { LoanType } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import { useRef } from "react";

interface Props {
  value: LoanType | null;
  onChange: (v: LoanType) => void;
  onNext: () => void;
}

const OPTIONS: { value: LoanType; label: string; description: string }[] = [
  {
    value: "federal",
    label: "Federal loans only",
    description:
      "Stafford, Direct, or PLUS loans — from the government",
  },
  {
    value: "private",
    label: "Private loans only",
    description:
      "From a bank, credit union, or lender like Sallie Mae",
  },
  {
    value: "both",
    label: "I have both",
    description: "A mix of federal and private loans",
  },
  {
    value: "unsure",
    label: "Not sure",
    description: "I'll look it up at studentaid.gov",
  },
];

export default function StepLoanType({ value, onChange, onNext }: Props) {
  const advanceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (v: LoanType) => {
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
        What kind of student loans do you have?
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        This determines which repayment options are available to you.
      </p>

      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-xs text-slate-400 leading-relaxed">
          <em>
            Federal loans come directly from the U.S. government and offer
            the most repayment options, including income-based plans and
            forgiveness programs. Private loans come from banks or lenders
            like Sallie Mae and have fewer protections.
          </em>
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-5 mb-2">
        Selecting an option will advance to the next step.
      </p>

      <div className="space-y-2.5" role="radiogroup" aria-label="Loan type">
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
    </div>
  );
}
