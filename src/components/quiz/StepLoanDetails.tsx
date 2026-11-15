"use client";

import { LoanType } from "@/types";
import NumberInput from "@/components/shared/NumberInput";
import StepHeader, { ContinueButton, Notice } from "./StepHeader";
import { formatDollarInput, formatPercentInput, parseDollarInput } from "@/lib/utils";
import { UNDERGRAD_RATE_2026_27 } from "@/data/plans";

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
  const showFederal = loanType === "federal" || loanType === "both" || loanType === "unsure";
  const showPrivate = loanType === "private" || loanType === "both";

  const federalValid =
    !showFederal || (parseDollarInput(federalBalance) > 0 && Number(federalRate) > 0 && Number(federalRate) <= 30);
  const privateValid =
    !showPrivate || (parseDollarInput(privateBalance) > 0 && Number(privateRate) > 0 && Number(privateRate) <= 50);

  return (
    <div>
      <StepHeader title="Tell us about your loans" hint="Rough numbers are fine. You can change them and run it again." />

      {loanType === "unsure" && (
        <div className="mt-5">
          <Notice>
            We will price these as federal loans, which have the most plans. Any
            loan listed on studentaid.gov is federal. Have private loans too? Go
            back and choose &ldquo;I have both&rdquo;.
          </Notice>
        </div>
      )}

      <div className="mt-8 space-y-7">
        {showFederal && (
          <>
            <NumberInput
              id="federal-balance"
              label="Total federal loan balance"
              helperText="On studentaid.gov under My Aid."
              value={federalBalance}
              onChange={(v) => onFieldChange("federalBalance", formatDollarInput(v))}
              placeholder="28,000"
              prefix="$"
            />
            <NumberInput
              id="federal-rate"
              label="Average interest rate"
              helperText="Shown beside each loan. Several loans? Use the average, weighted by balance."
              value={federalRate}
              onChange={(v) => onFieldChange("federalRate", formatPercentInput(v))}
              placeholder="6.5"
              suffix="%"
              quickFill={{
                label: `Use ${UNDERGRAD_RATE_2026_27}%, the 2026-27 undergrad rate`,
                value: String(UNDERGRAD_RATE_2026_27),
              }}
            />
          </>
        )}

        {showPrivate && (
          <>
            <NumberInput
              id="private-balance"
              label="Total private loan balance"
              value={privateBalance}
              onChange={(v) => onFieldChange("privateBalance", formatDollarInput(v))}
              placeholder="12,000"
              prefix="$"
            />
            <NumberInput
              id="private-rate"
              label="Average private loan interest rate"
              value={privateRate}
              onChange={(v) => onFieldChange("privateRate", formatPercentInput(v))}
              placeholder="7.2"
              suffix="%"
            />
            <Notice tone="warn">
              Income-based plans and forgiveness are for federal loans only. Your
              private loans are noted in the results, not priced.
            </Notice>
          </>
        )}
      </div>

      <ContinueButton disabled={!(federalValid && privateValid)} onClick={onNext} />
    </div>
  );
}
