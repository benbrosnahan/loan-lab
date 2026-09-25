"use client";

import { useReducer, useEffect, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Nav from "@/components/shared/Nav";
import QuizShell from "@/components/quiz/QuizShell";
import StepLoanType from "@/components/quiz/StepLoanType";
import StepDisbursement from "@/components/quiz/StepDisbursement";
import StepLoanDetails from "@/components/quiz/StepLoanDetails";
import StepIncome from "@/components/quiz/StepIncome";
import StepEmployment from "@/components/quiz/StepEmployment";
import StepPriority from "@/components/quiz/StepPriority";
import { QuizState, QuizAnswers, INITIAL_ANSWERS, TOTAL_STEPS, LoanType } from "@/types";
import { calculatePlans } from "@/lib/calculator";
import {
  storage,
  decodeQuizAnswers,
  parseDollarInput,
  formatDollarInput,
} from "@/lib/utils";
import { Suspense } from "react";

type Action =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SET_ANSWER"; field: string; value: unknown }
  | { type: "RESTORE"; payload: QuizState };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "NEXT":
      return {
        ...state,
        step: Math.min(state.step + 1, TOTAL_STEPS),
        direction: 1,
      };
    case "BACK":
      return {
        ...state,
        step: Math.max(state.step - 1, 1),
        direction: -1,
      };
    case "SET_ANSWER": {
      const newAnswers = {
        ...state.answers,
        [action.field]: action.value,
      };
      if (action.field === "loanType") {
        const lt = action.value as LoanType;
        if (lt === "federal") {
          newAnswers.privateBalance = 0;
          newAnswers.privateRate = 0;
        } else if (lt === "private") {
          newAnswers.federalBalance = 0;
          newAnswers.federalRate = 0;
        }
      }
      return { ...state, answers: newAnswers };
    }
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

const initialState: QuizState = {
  step: 1,
  direction: 1,
  answers: INITIAL_ANSWERS,
};

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  const fedBalDisplay = state.answers.federalBalance
    ? formatDollarInput(String(state.answers.federalBalance))
    : "";
  const privBalDisplay = state.answers.privateBalance
    ? formatDollarInput(String(state.answers.privateBalance))
    : "";

  // Rate inputs keep the exact text the user typed. Deriving the displayed
  // value from the stored number would drop a trailing decimal point
  // ("6." -> 6 -> "6"), making it impossible to ever type "6.5".
  const [rateRaw, setRateRaw] = useState({ federalRate: "", privateRate: "" });
  const fedRateDisplay = rateRaw.federalRate;
  const privRateDisplay = rateRaw.privateRate;
  const incomeTouched = useRef(false);
  const incomeDisplay = state.answers.income > 0
    ? formatDollarInput(String(state.answers.income))
    : incomeTouched.current
      ? "0"
      : "";

  useEffect(() => {
    const encoded = searchParams.get("q");
    if (encoded) {
      const answers = decodeQuizAnswers(encoded);
      if (answers) {
        const result = calculatePlans(answers);
        storage.set("loan-lab-result", JSON.stringify(result));
        router.push("/results");
        return;
      }
    }

    const saved = storage.get("loan-lab-progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.step && parsed.answers) {
          dispatch({ type: "RESTORE", payload: parsed });
          setRateRaw({
            federalRate: parsed.answers.federalRate
              ? String(parsed.answers.federalRate)
              : "",
            privateRate: parsed.answers.privateRate
              ? String(parsed.answers.privateRate)
              : "",
          });
        }
      } catch {
        // ignore corrupt data
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    storage.set("loan-lab-progress", JSON.stringify(state));
  }, [state]);

  const handleNext = useCallback(() => {
    if (state.step < TOTAL_STEPS) {
      dispatch({ type: "NEXT" });
    }
  }, [state.step]);

  const handleFinalStep = useCallback(
    (priorityOverride?: string) => {
      const answers = priorityOverride
        ? { ...state.answers, priority: priorityOverride as QuizAnswers["priority"] }
        : state.answers;
      const result = calculatePlans(answers);
      storage.set("loan-lab-result", JSON.stringify(result));
      storage.remove("loan-lab-progress");
      router.push("/results");
    },
    [state.answers, router]
  );

  const handleLoanDetailField = (field: string, value: string) => {
    if (field === "federalBalance" || field === "privateBalance") {
      dispatch({
        type: "SET_ANSWER",
        field,
        value: parseDollarInput(value),
      });
    } else {
      setRateRaw((prev) => ({ ...prev, [field]: value }));
      dispatch({
        type: "SET_ANSWER",
        field,
        value: Number(value) || 0,
      });
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <StepLoanType
            value={state.answers.loanType}
            onChange={(v) => {
              // Mirror the rate resets the reducer performs for this loan type.
              if (v === "federal") {
                setRateRaw((prev) => ({ ...prev, privateRate: "" }));
              } else if (v === "private") {
                setRateRaw((prev) => ({ ...prev, federalRate: "" }));
              }
              dispatch({ type: "SET_ANSWER", field: "loanType", value: v });
            }}
            onNext={(v) => {
              // Every plan Loan Lab compares is federal, so private-only
              // borrowers skip the rest of the quiz and go straight to the
              // explanation on the results page.
              if (v === "private") {
                const result = calculatePlans({
                  ...INITIAL_ANSWERS,
                  loanType: "private",
                });
                storage.set("loan-lab-result", JSON.stringify(result));
                storage.remove("loan-lab-progress");
                router.push("/results");
                return;
              }
              handleNext();
            }}
          />
        );
      case 2:
        return (
          <StepDisbursement
            value={state.answers.disbursement}
            onChange={(v) =>
              dispatch({ type: "SET_ANSWER", field: "disbursement", value: v })
            }
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <StepLoanDetails
            loanType={state.answers.loanType}
            federalBalance={fedBalDisplay}
            federalRate={fedRateDisplay}
            privateBalance={privBalDisplay}
            privateRate={privRateDisplay}
            onFieldChange={handleLoanDetailField}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <StepIncome
            income={incomeDisplay}
            familySize={state.answers.familySize}
            onFieldChange={(field, value) => {
              if (field === "income") {
                incomeTouched.current = true;
                dispatch({
                  type: "SET_ANSWER",
                  field: "income",
                  value: parseDollarInput(value as string),
                });
              } else {
                dispatch({ type: "SET_ANSWER", field, value });
              }
            }}
            onNext={handleNext}
          />
        );
      case 5:
        return (
          <StepEmployment
            value={state.answers.employment}
            onChange={(v) =>
              dispatch({ type: "SET_ANSWER", field: "employment", value: v })
            }
            onNext={handleNext}
          />
        );
      case 6:
        return (
          <StepPriority
            value={state.answers.priority}
            onChange={(v) =>
              dispatch({ type: "SET_ANSWER", field: "priority", value: v })
            }
            onNext={handleFinalStep}
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
            className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        )}
        {/*
          Plain inline transition objects rather than custom/variants.
          With function-based exit variants, AnimatePresence mode="wait" never
          received its exit-complete callback, so the outgoing step stayed
          mounted forever and the quiz froze on question 1 while the progress
          bar kept counting up.
        */}
        {/*
          Deliberately NOT wrapped in AnimatePresence.
          In framer-motion 12.38.0 the exiting child never reported exit
          completion here, so with mode="wait" the incoming step never mounted
          (the quiz froze on question 1 while the progress bar counted up) and
          in sync mode the old step never unmounted (steps stacked on top of
          each other). Keying the motion.div on the step gives us the same
          enter animation with no exit sequencing to get stuck on.
        */}
        <motion.div
          key={state.step}
          initial={{ x: state.direction > 0 ? 60 : -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </QuizShell>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <QuizContent />
    </Suspense>
  );
}
