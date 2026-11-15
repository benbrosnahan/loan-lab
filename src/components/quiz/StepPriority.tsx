"use client";

import { useRef } from "react";
import { Priority } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import StepHeader, { ChoiceHint } from "./StepHeader";

interface Props {
  value: Priority | null;
  onChange: (v: Priority) => void;
  onNext: (value?: Priority) => void;
}

const OPTIONS: { value: Priority; label: string; description: string }[] = [
  { value: "low_payment", label: "Keep payments as low as possible", description: "I need room in my budget right now" },
  { value: "least_total", label: "Pay the least overall", description: "Higher payments are fine if I save in the end" },
  { value: "fastest", label: "Pay off loans as fast as possible", description: "I want to be debt-free soonest" },
  { value: "forgiveness", label: "Explore loan forgiveness", description: "Show me what could be cancelled" },
];

export default function StepPriority({ value, onChange, onNext }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choose = (v: Priority) => {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onNext(v), 350);
  };

  return (
    <div>
      <StepHeader title="What matters most right now?" hint="Pick one. You can retake it with another answer." />
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
    </div>
  );
}
