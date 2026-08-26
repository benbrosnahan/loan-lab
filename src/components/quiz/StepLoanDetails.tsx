"use client";

import { LoanType } from "@/types";
import NumberInput from "@/components/shared/NumberInput";
import { formatDollarInput, formatPercentInput } from "@/lib/utils";
import { AVERAGE_FEDERAL_RATE } from "@/data/plans";

interface Props {
  loanType: LoanType | null;
  federalBalance: string;
  federalRate: string;
  privateBalance: string;
  privateRate: string;
  onFieldChange: (field: string, value: string) => void;
  onNext: () => void;
}

export default function StepLoanDetails({
  loanType,
  federalBalance,
  federalRate,
  privateBalance,
  privateRate,
  onFieldChange,
  onNext,
}: Props) {
  const showFederal =
    loanType === "federal" || loanType === "both" || loanType === "unsure";
  const showPrivate = loanType === "private" || loanType === "both";

  const federalValid =
    !showFederal ||
    (Number(federalBalance.replace(/,/g, "")) > 0 &&
      Number(federalRate) > 0);
  const privateValid =
    !showPrivate ||
    (Number(privateBalance.replace(/,/g, "")) > 0 &&
      Number(privateRate) > 0);
  const canContinue = federalValid && privateValid;

  return (
    <div>
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-900"
        tabIndex={-1}
      >
        Tell us about your loans
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        We&apos;ll use this to estimate your payments. You can always re-run
        with different numbers.
      </p>

      {loanType === "unsure" && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            Since you&apos;re not sure, we&apos;ll show options for federal
            loans (which have the most repayment plans). Check{" "}
            <span className="font-medium">studentaid.gov</span> to see your
            exact loans. If you have private loans too, come back and select
            &quot;I have both.&quot;
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {showFederal && (
          <>
            <NumberInput
              id="federal-balance"
              label="Total federal loan balance"
              helperText='You can find this at studentaid.gov under "My Aid"'
              value={federalBalance}
              onChange={(v) =>
                onFieldChange("federalBalance", formatDollarInput(v))
              }
              placeholder="e.g. 28,000"
              prefix="$"
            />
            <NumberInput
              id="federal-rate"
              label="Average interest rate"
              helperText="Your rate is shown next to each loan on studentaid.gov. If you have multiple loans, use the highest rate or average them."
              value={federalRate}
              onChange={(v) =>
                onFieldChange("federalRate", formatPercentInput(v))
              }
              placeholder="e.g. 6.5"
              suffix="%"
              quickFill={{
                label: `Use avg rate (${AVERAGE_FEDERAL_RATE}%)`,
                value: String(AVERAGE_FEDERAL_RATE),
              }}
            />
          </>
        )}

        {showPrivate && (
          <>
            {showFederal && (
              <hr className="border-slate-100" />
            )}
            <NumberInput
              id="private-balance"
              label="Total private loan balance"
              value={privateBalance}
              onChange={(v) =>
                onFieldChange("privateBalance", formatDollarInput(v))
              }
              placeholder="e.g. 12,000"
              prefix="$"
            />
            <NumberInput
              id="private-rate"
              label="Average private loan interest rate"
              value={privateRate}
              onChange={(v) =>
                onFieldChange("privateRate", formatPercentInput(v))
              }
              placeholder="e.g. 7.2"
              suffix="%"
            />
          </>
        )}

        {(loanType === "private" || loanType === "both") && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-800 leading-relaxed">
              ⚠️ Income-based repayment and forgiveness programs only apply
              to federal loans. Private loans will be shown separately.
            </p>
          </div>
        )}
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
