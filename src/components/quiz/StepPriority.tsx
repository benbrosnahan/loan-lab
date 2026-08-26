"use client";

import { useRef } from "react";
import { Priority } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";

interface Props {
  value: Priority | null;
  onChange: (v: Priority) => void;
  onNext: (value?: string) => void;
}

const OPTIONS: {
  value: Priority;
  label: string;
  description: string;
}[] = [
  {
    value: "low_payment",
    label: "Keep payments as low as possible",
    description: "I need room in my budget right now",
  },
  {
    value: "least_total",
    label: "Pay the least overall",
    description: "I'm okay with higher payments to save on interest",
  },
  {
    value: "fastest",
    label: "Pay off loans as fast as possible",
    description: "I want to be debt-free as quickly as I can",
  },
  {
    value: "forgiveness",
    label: "Explore loan forgiveness",
    description: "I want to see if my loans can be cancelled",
  },
];

export default function StepPriority({ value, onChange, onNext }: Props) {
  const advanceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (v: Priority) => {
    onChange(v);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => onNext(v), 400);
  };

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        tabIndex={-1}
      >
        What&apos;s your main goal with your student loans?
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        Pick the one that best describes where you&apos;re at right now.
      </p>

      <p className="text-xs text-slate-400 mt-5 mb-2">
        Selecting an option will advance to the next step.
      </p>

      <div className="space-y-2.5" role="radiogroup" aria-label="Repayment priority">
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
