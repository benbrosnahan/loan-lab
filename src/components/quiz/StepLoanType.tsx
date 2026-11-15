"use client";

import { useRef } from "react";
import { LoanType } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import StepHeader, { ChoiceHint, SmallPrint } from "./StepHeader";
import { LOAN_SCOPE_NOTE } from "@/data/plans";

interface Props {
  value: LoanType | null;
  onChange: (v: LoanType) => void;
  onNext: (v: LoanType) => void;
}

const OPTIONS: { value: LoanType; label: string; description: string }[] = [
  { value: "federal", label: "Federal loans only", description: "From the U.S. Department of Education" },
  { value: "private", label: "Private loans only", description: "From a bank, credit union or lender like Sallie Mae" },
  { value: "both", label: "I have both", description: "Some federal, some private" },
  { value: "unsure", label: "Not sure", description: "Any loan listed on studentaid.gov is federal" },
];

export default function StepLoanType({ value, onChange, onNext }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choose = (v: LoanType) => {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onNext(v), 350);
  };

  return (
    <div>
      <StepHeader
        title="What kind of student loans do you have?"
        hint="Federal loans come with income-based plans and forgiveness. Private loans do not."
      />
      <ChoiceHint />
      <div className="space-y-3" role="group" aria-labelledby="step-heading">
        {OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={value === opt.value}
            onClick={() => choose(opt.value)}
          />
        ))}
      </div>
      <SmallPrint>{LOAN_SCOPE_NOTE}</SmallPrint>
    </div>
  );
}
