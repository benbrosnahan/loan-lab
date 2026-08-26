"use client";

import { motion } from "framer-motion";
import { PlanResult } from "@/types";
import {
  PLAN_META,
  TIERED_STANDARD_DEFAULT_WARNING,
  TIERED_STANDARD_PSLF_WARNING,
} from "@/data/plans";
import { formatCurrencyFull } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  plan: PlanResult;
  isRecommended: boolean;
  index: number;
  pslfEligible: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  legacy_only: {
    label: "Pre-July 2026 loans only",
    className: "bg-amber-100 text-amber-800",
  },
  new: {
    label: "New plan",
    className: "bg-green-100 text-green-800",
  },
};

export default function PlanCard({ plan, isRecommended, index, pslfEligible }: Props) {
  const meta = PLAN_META[plan.id];
  const badge = STATUS_BADGES[plan.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 * index }}
      className={cn(
        "rounded-2xl border bg-white shadow-sm overflow-hidden",
        isRecommended ? "border-navy ring-1 ring-navy" : "border-slate-200"
      )}
    >
      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {badge && (
              <span
                className={cn(
                  "inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap",
                  badge.className
                )}
              >
                {badge.label}
              </span>
            )}
            {isRecommended && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-navy text-white whitespace-nowrap">
                Top pick
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>

        {/* Tiered Standard: PSLF is the headline risk, so it outranks the
            generic default-plan note when the borrower works in public service. */}
        {plan.id === "tiered_standard" && (
          <div
            className={cn(
              "mt-3 p-2.5 rounded-lg border",
              pslfEligible
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-100"
            )}
          >
            <p
              className={cn(
                "text-[11px] leading-relaxed",
                pslfEligible ? "text-red-800" : "text-amber-800"
              )}
            >
              {pslfEligible
                ? `⚠️ ${TIERED_STANDARD_PSLF_WARNING}`
                : TIERED_STANDARD_DEFAULT_WARNING}
            </p>
          </div>
        )}

        {/* Graduated: closed to anyone with a post-July 2026 loan, and it has
            never earned PSLF credit. */}
        {plan.id === "graduated" && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The Graduated Plan is closed to anyone holding a loan disbursed on
              or after July 1, 2026. Payments on it also do not count toward
              Public Service Loan Forgiveness.
            </p>
          </div>
        )}

        {/* What is this? */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            What is this?
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {meta.definition}
          </p>
        </div>

        {/* Numbers */}
        <div className="mt-4 space-y-2">
          <Row label="Monthly payment" value={formatCurrencyFull(plan.monthlyPayment)} />
          {plan.monthlyPaymentAsPercentOfTakeHome > 0 && (
            <p className="text-[11px] text-slate-400 -mt-1 pl-0">
              That&apos;s {plan.monthlyPaymentAsPercentOfTakeHome.toFixed(0)}%
              of your estimated monthly take-home
            </p>
          )}
          <Row label="Total paid" value={formatCurrencyFull(plan.totalPaid)} />
          <Row
            label="Total interest"
            value={formatCurrencyFull(plan.totalInterest)}
          />
          <Row
            label="Payoff timeline"
            value={`${plan.payoffYears} year${plan.payoffYears !== 1 ? "s" : ""}`}
          />
          {plan.forgivenAmount > 0 && (
            <>
              <Row
                label="Amount forgiven"
                value={formatCurrencyFull(plan.forgivenAmount)}
                valueClassName="text-green-600 font-semibold"
              />
              {plan.id === "pslf" ? (
                <p className="text-[11px] text-green-600 pl-0">
                  ✓ Public Service Loan Forgiveness is completely tax-free
                </p>
              ) : plan.taxBombEstimate > 0 ? (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    The forgiven amount counts as taxable income in the year it
                    is cancelled, and nothing is withheld for it. Setting aside
                    roughly {formatCurrencyFull(plan.taxBombEstimate)} covers
                    the estimated bill at a 22% rate.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Advantages and disadvantages, so the top pick stays judgeable */}
        <div className="mt-4 grid gap-3">
          <div>
            <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">
              Advantages
            </p>
            <ul className="mt-1 space-y-1">
              {meta.pros.map((pro, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5"
                >
                  <span className="text-green-600 flex-shrink-0">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Disadvantages
            </p>
            <ul className="mt-1 space-y-1">
              {meta.cons.map((con, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5"
                >
                  <span className="text-amber-600 flex-shrink-0">&minus;</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RAP-specific note */}
        {plan.id === "rap" && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              RAP guarantees at least $50/month goes toward your principal
              (the government covers the difference). Your balance shrinks
              every month.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn("text-sm font-semibold text-slate-900", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
