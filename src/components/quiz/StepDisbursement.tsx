"use client";

import { useRef } from "react";
import { Disbursement } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import StepHeader, { ChoiceHint, SmallPrint } from "./StepHeader";

interface Props {
  value: Disbursement | null;
  onChange: (v: Disbursement) => void;
  onNext: () => void;
}

const OPTIONS: { value: Disbursement; label: string; description: string }[] = [
  {
    value: "before_july_2026",
    label: "All of them came before July 1, 2026",
    description: "You stopped borrowing before then and have not consolidated since",
  },
  {
    value: "on_or_after_july_2026",
    label: "At least one came on or after July 1, 2026",
    description: "True for most students borrowing for the 2026-27 school year",
  },
  { value: "unsure", label: "Not sure", description: "We will show every plan and flag what to check" },
];

export default function StepDisbursement({ value, onChange, onNext }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choose = (v: Disbursement) => {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onNext, 350);
  };

  return (
    <div>
      <StepHeader
        title="When was your newest federal loan paid out?"
        hint="This one date decides which plans you are allowed to use."
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
      <SmallPrint>
        Paid out means the day the money reached your school. One loan paid out
        on or after July 1, 2026 closes Standard, Graduated, Extended and IBR for
        all your loans, older ones included. A new consolidation loan counts too.
        Your dates are under My Aid on{" "}
        <a
          href="https://studentaid.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-navy underline underline-offset-2"
        >
          studentaid.gov
        </a>
        .
      </SmallPrint>
    </div>
  );
}
