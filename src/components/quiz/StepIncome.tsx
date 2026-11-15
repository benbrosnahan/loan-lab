"use client";

import NumberInput from "@/components/shared/NumberInput";
import StepHeader, { ContinueButton, Notice } from "./StepHeader";
import { formatDollarInput, parseDollarInput, hasDigit, cn } from "@/lib/utils";

interface Props {
  income: string;
  dependents: number;
  filesJointly: boolean;
  onIncomeChange: (display: string) => void;
  onDependentsChange: (n: number) => void;
  onJointChange: (joint: boolean) => void;
  onNext: () => void;
}

const MAX_DEPENDENTS = 10;

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-line bg-white text-xl font-semibold text-slate-900 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:opacity-40"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

export default function StepIncome({
  income,
  dependents,
  filesJointly,
  onIncomeChange,
  onDependentsChange,
  onJointChange,
  onNext,
}: Props) {
  const typed = hasDigit(income);
  const incomeNum = parseDollarInput(income);

  return (
    <div>
      <StepHeader
        title="What do you earn?"
        hint="IBR and RAP set your payment from your income. Not working yet? Use your best guess for your first job."
      />

      <div className="mt-8 space-y-8">
        <NumberInput
          id="income"
          label={filesJointly ? "Combined adjusted gross income (AGI)" : "Adjusted gross income (AGI), per year"}
          helperText="Line 11 of your tax return: pay minus pre-tax 401(k) and health premiums. $0 works too: IBR can be $0, and RAP is at least $10."
          value={income}
          onChange={(v) => onIncomeChange(formatDollarInput(v))}
          placeholder="52,000"
          prefix="$"
        />

        {typed && incomeNum < 5000 && (
          <Notice>
            Still in school? Payments start after a six-month grace period. Try
            your expected starting salary to see what repayment will look like.
          </Notice>
        )}

        <fieldset>
          <legend className="text-base font-semibold text-slate-900">Dependents you claim on your taxes</legend>
          <p id="dependents-help" className="mt-1 text-sm leading-snug text-slate-600">
            Children or others you support. Each one lowers RAP by $50 a month.
          </p>
          <div className="mt-3 flex items-center gap-4">
            <StepButton label="One fewer dependent" onClick={() => onDependentsChange(dependents - 1)} disabled={dependents <= 0}>
              &minus;
            </StepButton>
            <output aria-live="polite" aria-describedby="dependents-help" className="figure min-w-[3ch] text-center text-3xl font-bold text-slate-900">
              {dependents}
            </output>
            <StepButton label="One more dependent" onClick={() => onDependentsChange(dependents + 1)} disabled={dependents >= MAX_DEPENDENTS}>
              +
            </StepButton>
          </div>
        </fieldset>

        <label className="flex min-h-[56px] cursor-pointer items-center gap-4 rounded-3xl border-2 border-line bg-white px-5 py-3.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy">
          <input
            type="checkbox"
            checked={filesJointly}
            onChange={(e) => onJointChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              "relative h-7 w-12 flex-shrink-0 rounded-full border-2 transition-colors",
              filesJointly ? "border-navy bg-navy" : "border-slate-500 bg-white"
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] h-[18px] w-[18px] rounded-full transition-transform",
                filesJointly ? "translate-x-[22px] bg-white" : "translate-x-[2px] bg-slate-500"
              )}
            />
          </span>
          <span>
            <span className="block text-base font-semibold text-slate-900">Married, filing taxes jointly</span>
            <span className="block text-sm text-slate-600">Counts your spouse in IBR, never as a RAP dependent</span>
          </span>
        </label>

        {filesJointly && (
          <Notice>
            Enter your combined AGI above. If your spouse has federal loans too,
            your payment is split by balance, which Loan Desk can work out.
          </Notice>
        )}
      </div>

      <ContinueButton disabled={!typed} onClick={onNext} />
    </div>
  );
}
