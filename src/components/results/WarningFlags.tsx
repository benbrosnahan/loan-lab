"use client";

import { motion } from "framer-motion";
import { CalculationResult } from "@/types";
import {
  SAVE_ENDED_WARNING,
  TEACHER_FORGIVENESS_INFO,
  TIERED_STANDARD_PSLF_WARNING,
  POST_2026_LOCKOUT_WARNING,
  CONSOLIDATION_WARNING,
  IDR_TAX_WARNING,
} from "@/data/plans";

interface Props {
  result: CalculationResult;
}

export default function WarningFlags({ result }: Props) {
  const {
    plans,
    pslfEligible,
    hasFederal,
    hasPrivate,
    quizAnswers,
    recommendedId,
    isLegacyBorrower,
    disbursementUnknown,
  } = result;
  const hasNonPslfForgiveness = plans.some(
    (p) => p.forgivenAmount > 0 && p.id !== "pslf"
  );
  const highIncome = (quizAnswers.income ?? 0) > 60000;
  const rapExceedsStandard =
    plans.find((p) => p.id === "rap") &&
    plans.find((p) => p.id === "standard") &&
    plans.find((p) => p.id === "rap")!.monthlyPayment >
      plans.find((p) => p.id === "standard")!.monthlyPayment;

  const flags: { icon: string; content: string; type: "amber" | "blue" | "red" }[] =
    [];

  // Highest stakes first. A public-service borrower who lands on Tiered
  // Standard makes on-time payments that earn zero PSLF credit.
  if (pslfEligible) {
    flags.push({
      icon: "⚠️",
      type: "red",
      content: TIERED_STANDARD_PSLF_WARNING,
    });
  }

  if (!isLegacyBorrower) {
    flags.push({
      icon: "⚠️",
      type: "amber",
      content: POST_2026_LOCKOUT_WARNING,
    });
  }

  if (disbursementUnknown && hasFederal) {
    flags.push({
      icon: "⚠️",
      type: "amber",
      content:
        "You weren't sure when your loans were disbursed, so these results assume all of them came before July 1, 2026 and show every plan. Confirm the dates under My Aid at studentaid.gov before you act on this. If even one loan was disbursed on or after July 1, 2026, then Standard, Graduated, Extended, and IBR are closed to you and only RAP and Tiered Standard remain.",
    });
  }

  if (hasFederal) {
    flags.push({
      icon: "⚠️",
      type: "amber",
      content: CONSOLIDATION_WARNING,
    });
  }

  if (hasPrivate) {
    flags.push({
      icon: "⚠️",
      type: "amber",
      content:
        "Private loans aren't eligible for income-driven plans. IBR, RAP, and Public Service Loan Forgiveness (PSLF) only apply to federal loans. For private loans, your main options are refinancing to a lower rate or paying them down faster.",
    });
  }

  if (hasFederal) {
    flags.push({
      icon: "💡",
      type: "blue",
      content:
        "Thinking about refinancing federal loans to private? It's worth understanding the trade-off first. Refinancing converts your federal loans to private, which permanently removes access to income-driven plans (IBR, RAP) and Public Service Loan Forgiveness (PSLF). For some borrowers with high incomes and no interest in forgiveness, refinancing to a lower rate can make sense. For most, keeping your federal protections is the safer choice.",
    });
  }

  if (!pslfEligible && highIncome) {
    flags.push({
      icon: "💡",
      type: "blue",
      content:
        "Your income is on the higher end. For high earners, a fixed plan often works out well, since income-based payments can end up similar to fixed payments anyway while committing you to a 20 or 30 year timeline.",
    });
  }

  if (
    pslfEligible &&
    recommendedId !== "pslf" &&
    quizAnswers.priority !== "forgiveness"
  ) {
    flags.push({
      icon: "💡",
      type: "blue",
      content:
        "You may qualify for Public Service Loan Forgiveness (PSLF). Since you work in the public sector, you could have your remaining balance forgiven tax-free after 10 years. If that changes your thinking, retake the quiz and select \"Explore forgiveness\" to see how PSLF compares.",
    });
  }

  // SAVE ended, and the 90-day clock is the live deadline for anyone who was in it.
  flags.push({
    icon: "⚠️",
    type: "amber",
    content: SAVE_ENDED_WARNING,
  });

  // Teacher Loan Forgiveness
  if (quizAnswers.employment === "education") {
    flags.push({
      icon: "💡",
      type: "blue",
      content: TEACHER_FORGIVENESS_INFO,
    });
  }

  // Tax on income-driven forgiveness, framed as something to plan for.
  if (hasNonPslfForgiveness) {
    flags.push({
      icon: "💡",
      type: "blue",
      content: IDR_TAX_WARNING,
    });
  }

  // RAP no cap warning
  if (rapExceedsStandard && highIncome) {
    flags.push({
      icon: "⚠️",
      type: "amber",
      content:
        "Under RAP, payments are not capped. At your income level, RAP payments may exceed the Standard Plan payment. Compare the monthly amounts carefully.",
    });
  }

  if (flags.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-bold text-slate-900">
        Things to know
      </h3>
      {flags.map((flag, i) => (
        <div
          key={i}
          className={
            flag.type === "red"
              ? "p-4 rounded-xl bg-red-50 border border-red-200"
              : flag.type === "amber"
                ? "p-4 rounded-xl bg-amber-50 border border-amber-100"
                : "p-4 rounded-xl bg-blue-50 border border-blue-100"
          }
        >
          <p
            className={
              flag.type === "red"
                ? "text-xs text-red-800 leading-relaxed"
                : flag.type === "amber"
                  ? "text-xs text-amber-800 leading-relaxed"
                  : "text-xs text-blue-700 leading-relaxed"
            }
          >
            {flag.icon} {flag.content}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
