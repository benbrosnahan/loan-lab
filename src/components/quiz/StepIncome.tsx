"use client";

import NumberInput from "@/components/shared/NumberInput";
import SelectionCard from "@/components/shared/SelectionCard";
import { formatDollarInput, parseDollarInput } from "@/lib/utils";

interface Props {
  income: string;
  familySize: number;
  onFieldChange: (field: string, value: string | number) => void;
  onNext: () => void;
}

const FAMILY_OPTIONS: { value: number; label: string; description: string }[] =
  [
    { value: 1, label: "1", description: "Just me" },
    { value: 2, label: "2", description: "Me + partner or dependent" },
    { value: 3, label: "3", description: "Family of 3" },
    { value: 4, label: "4", description: "Family of 4" },
    { value: 5, label: "5+", description: "Family of 5 or more" },
  ];

export default function StepIncome({
  income,
  familySize,
  onFieldChange,
  onNext,
}: Props) {
  const incomeNum = parseDollarInput(income);
  const canContinue = incomeNum >= 0 && income.length > 0 && familySize > 0;

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        tabIndex={-1}
      >
        What&apos;s your annual income?
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        Income-based repayment plans tie your monthly payment to what you
        earn. Use your expected salary if you haven&apos;t started working
        yet — you can re-run this anytime.
      </p>

      <div className="mt-6 space-y-6">
        <NumberInput
          id="income"
          label="Annual income before taxes"
          helperText="Not working yet? Enter your best guess for your first job — that'll give you the most useful results. You can enter $0, but income-driven payments will all show as $0 since they're based on what you earn."
          value={income}
          onChange={(v) =>
            onFieldChange("income", formatDollarInput(v))
          }
          placeholder="e.g. 52,000"
          prefix="$"
        />

        {incomeNum <= 5000 && income.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              Still in school? Federal loans have a 6-month grace period
              after graduation before payments begin. Enter $0 or your
              expected starting salary to see what your payments will look
              like when repayment starts.
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-900">
            How many people are in your household?
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">
            This affects how &quot;discretionary income&quot; is calculated
            under income-based plans — larger households get a bigger
            exemption.
          </p>
          <div
            className="grid grid-cols-2 gap-2.5 mt-3"
            role="radiogroup"
            aria-label="Household size"
          >
            {FAMILY_OPTIONS.map((opt) => (
              <SelectionCard
                key={opt.value}
                label={opt.label}
                description={opt.description}
                selected={familySize === opt.value}
                onClick={() => onFieldChange("familySize", opt.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className="mt-8 w-full py-3.5 rounded-xl bg-navy text-white text-sm font-semibold transition-colors hover:bg-navy-hover disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
