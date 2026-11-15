"use client";

import { useRef } from "react";
import { Employment } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";
import StepHeader, { ChoiceHint, Notice } from "./StepHeader";

interface Props {
  value: Employment | null;
  onChange: (v: Employment) => void;
  onNext: () => void;
}

const OPTIONS: { value: Employment; label: string; description: string }[] = [
  { value: "government", label: "Government", description: "Federal, state, local or tribal" },
  { value: "education", label: "Education", description: "A public school, or a nonprofit college or school" },
  { value: "nonprofit", label: "Nonprofit", description: "A 501(c)(3) organization" },
  { value: "private", label: "Private company", description: "A for-profit employer" },
  { value: "self_employed", label: "Self-employed", description: "Freelance, contract or your own business" },
  { value: "unsure", label: "Not sure yet", description: "Still figuring it out" },
];

const PSLF_EMPLOYERS: Employment[] = ["government", "education", "nonprofit"];

export default function StepEmployment({ value, onChange, onNext }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choose = (v: Employment) => {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onNext, 900);
  };

  return (
    <div>
      <StepHeader
        title="Where do you work, or plan to?"
        hint="Full-time work (30+ hours a week) for a government agency or qualifying nonprofit can earn Public Service Loan Forgiveness (PSLF): what is left after 120 payments is cancelled, untaxed."
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
      <div className="mt-5" aria-live="polite">
        {value && (
          <Notice>
            {PSLF_EMPLOYERS.includes(value)
              ? "You may qualify for PSLF if the job is full time. We will price it."
              : value === "unsure"
                ? "We will show PSLF so you can see what it would be worth."
                : "PSLF needs government or qualifying nonprofit work, so we will show the other plans."}
          </Notice>
        )}
      </div>
    </div>
  );
}
