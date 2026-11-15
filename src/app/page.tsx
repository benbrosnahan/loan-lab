"use client";

import { useReducer, useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/shared/Nav";
import SiteFooter from "@/components/shared/SiteFooter";
import QuizShell from "@/components/quiz/QuizShell";
import StepLoanType from "@/components/quiz/StepLoanType";
import StepDisbursement from "@/components/quiz/StepDisbursement";
import StepLoanDetails from "@/components/quiz/StepLoanDetails";
import StepIncome from "@/components/quiz/StepIncome";
import StepEmployment from "@/components/quiz/StepEmployment";
import StepPriority from "@/components/quiz/StepPriority";
import { QuizState, QuizAnswers, INITIAL_ANSWERS, TOTAL_STEPS, LoanType, Priority } from "@/types";
import {
  storage,
  KEYS,
  decodeQuizAnswers,
  parseDollarInput,
  formatDollarInput,
  sharedAnswersFromLocation,
} from "@/lib/utils";

type Action =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SET_ANSWER"; field: keyof QuizAnswers; value: unknown }
  | { type: "RESTORE"; payload: QuizState };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS), direction: 1 };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1), direction: -1 };
    case "SET_ANSWER": {
      const answers = { ...state.answers, [action.field]: action.value } as QuizAnswers;
      if (action.field === "loanType") {
        const lt = action.value as LoanType;
        if (lt === "federal") {
          answers.privateBalance = 0;
          answers.privateRate = 0;
        } else if (lt === "private") {
          answers.federalBalance = 0;
          answers.federalRate = 0;
        }
      }
      answers.familySize = 1 + answers.dependents + (answers.filesJointly ? 1 : 0);
      return { ...state, answers };
    }
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

const initialState: QuizState = { step: 1, direction: 1, answers: INITIAL_ANSWERS };

type RawFields = "federalBalance" | "federalRate" | "privateBalance" | "privateRate" | "income";
const EMPTY_RAW: Record<RawFields, string> = {
  federalBalance: "",
  federalRate: "",
  privateBalance: "",
  privateRate: "",
  income: "",
};

/** The text to show for a stored answer when progress is restored. */
function rawFrom(a: QuizAnswers, step: number): Record<RawFields, string> {
  const dollars = (n: number) => (n ? formatDollarInput(String(n)) : "");
  return {
    federalBalance: dollars(a.federalBalance),
    federalRate: a.federalRate ? String(a.federalRate) : "",
    privateBalance: dollars(a.privateBalance),
    privateRate: a.privateRate ? String(a.privateRate) : "",
    income: a.income || step > 4 ? formatDollarInput(String(a.income)) : "",
  };
}

export default function Home() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  // Every field keeps the exact text typed, so "6." or "27,000.5" can be
  // finished; the number is parsed from it on each change.
  const [raw, setRaw] = useState(EMPTY_RAW);
  const restored = useRef(false);
  const lastStep = useRef(state.step);

  const showResults = useCallback(
    (answers: QuizAnswers) => {
      storage.set(KEYS.answers, JSON.stringify(answers));
      storage.remove(KEYS.progress);
      router.push("/results");
    },
    [router]
  );

  useEffect(() => {
    // An old share link to the quiz page goes straight to its results.
    const shared = sharedAnswersFromLocation();
    if (shared) {
      const answers = decodeQuizAnswers(shared);
      if (answers) {
        showResults(answers);
        return;
      }
    }
    const saved = storage.get(KEYS.progress);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as QuizState;
        if (parsed && parsed.step && parsed.answers) {
          const answers = { ...INITIAL_ANSWERS, ...parsed.answers };
          dispatch({ type: "RESTORE", payload: { ...parsed, answers } });
          setRaw(rawFrom(answers, parsed.step));
        }
      } catch {
        // ignore corrupt data
      }
    }
    restored.current = true;
  }, [showResults]);

  useEffect(() => {
    if (restored.current) storage.set(KEYS.progress, JSON.stringify(state));
  }, [state]);

  // Move focus to the new question when the step changes, so keyboard and
  // screen reader users land on it instead of on a button that is gone.
  useEffect(() => {
    if (lastStep.current !== state.step) {
      lastStep.current = state.step;
      document.getElementById("step-heading")?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [state.step]);

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const set = (field: keyof QuizAnswers, value: unknown) => dispatch({ type: "SET_ANSWER", field, value });

  const setText = (field: RawFields, text: string) => {
    setRaw((prev) => ({ ...prev, [field]: text }));
    const isDollar = field === "federalBalance" || field === "privateBalance" || field === "income";
    set(field, isDollar ? parseDollarInput(text) : Number(text) || 0);
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <StepLoanType
            value={state.answers.loanType}
            onChange={(v) => {
              if (v === "federal") setRaw((p) => ({ ...p, privateBalance: "", privateRate: "" }));
              else if (v === "private") setRaw((p) => ({ ...p, federalBalance: "", federalRate: "" }));
              set("loanType", v);
            }}
            onNext={(v) => {
              // Every plan Loan Lab compares is federal, so a private-only
              // borrower goes straight to the explanation on the results page.
              if (v === "private") {
                showResults({ ...INITIAL_ANSWERS, loanType: "private" });
                return;
              }
              next();
            }}
          />
        );
      case 2:
        return (
          <StepDisbursement value={state.answers.disbursement} onChange={(v) => set("disbursement", v)} onNext={next} />
        );
      case 3:
        return (
          <StepLoanDetails
            loanType={state.answers.loanType}
            federalBalance={raw.federalBalance}
            federalRate={raw.federalRate}
            privateBalance={raw.privateBalance}
            privateRate={raw.privateRate}
            onFieldChange={(field, value) => setText(field as RawFields, value)}
            onNext={next}
          />
        );
      case 4:
        return (
          <StepIncome
            income={raw.income}
            dependents={state.answers.dependents}
            filesJointly={state.answers.filesJointly}
            onIncomeChange={(v) => setText("income", v)}
            onDependentsChange={(n) => set("dependents", Math.max(0, Math.min(10, n)))}
            onJointChange={(j) => set("filesJointly", j)}
            onNext={next}
          />
        );
      case 5:
        return <StepEmployment value={state.answers.employment} onChange={(v) => set("employment", v)} onNext={next} />;
      case 6:
        return (
          <StepPriority
            value={state.answers.priority}
            onChange={(v) => set("priority", v)}
            onNext={(p?: Priority) => showResults({ ...state.answers, priority: p ?? state.answers.priority })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Nav />
      <QuizShell currentStep={state.step}>
        {state.step > 1 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "BACK" })}
            className="-ml-2 mb-4 inline-flex min-h-[40px] items-center gap-1 rounded-full px-2 text-sm font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        {/* Keyed on the step so each question enters with one CSS rise. */}
        <div key={state.step} className="rise">
          {renderStep()}
        </div>
      </QuizShell>
      <SiteFooter />
    </>
  );
}
