"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Employment } from "@/types";
import SelectionCard from "@/components/shared/SelectionCard";

interface Props {
  value: Employment | null;
  onChange: (v: Employment) => void;
  onNext: () => void;
}

const OPTIONS: {
  value: Employment;
  label: string;
  description: string;
}[] = [
  {
    value: "government",
    label: "Government",
    description: "Federal, state, or local government agency",
  },
  {
    value: "education",
    label: "Education",
    description: "Public school, university, community college",
  },
  {
    value: "nonprofit",
    label: "Nonprofit",
    description: "501(c)(3) organization",
  },
  {
    value: "private",
    label: "Private company",
    description: "For-profit employer or corporation",
  },
  {
    value: "self_employed",
    label: "Self-employed",
    description: "Freelance, contractor, or own your own business",
  },
  {
    value: "unsure",
    label: "Not sure yet",
    description: "I'm still figuring it out",
  },
];

function isPslfEligible(emp: Employment | null): boolean {
  return emp === "government" || emp === "education" || emp === "nonprofit";
}

export default function StepEmployment({ value, onChange, onNext }: Props) {
  const advanceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (v: Employment) => {
    onChange(v);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onNext, 800);
  };

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        tabIndex={-1}
      >
        Where do you work — or plan to work?
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        Your employer type determines whether you qualify for Public Service
        Loan Forgiveness (PSLF) — a program that cancels your remaining
        federal loan balance after 10 years.
      </p>

      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-xs text-slate-400 leading-relaxed">
          <em>
            PSLF — Public Service Loan Forgiveness — is a federal program
            that forgives 100% of your remaining loan balance after you make
            10 years of qualifying payments while working full-time for the
            government or a qualifying nonprofit. The forgiven amount is
            tax-free.
          </em>
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-5 mb-2">
        Selecting an option will advance to the next step.
      </p>

      <div className="space-y-2.5" role="radiogroup" aria-label="Employment type">
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

      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {isPslfEligible(value) ? (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-800 leading-relaxed">
                  ✓ You may qualify for PSLF. We&apos;ll include that option
                  in your results.
                </p>
              </div>
            ) : value === "unsure" ? (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  No problem — we&apos;ll show all options including PSLF so
                  you can see what&apos;s possible.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  PSLF requires government or nonprofit employment. We&apos;ll
                  show you the best alternatives.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
