"use client";

import { motion } from "framer-motion";
import { PlanResult } from "@/types";
import { formatCurrencyFull } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  plans: PlanResult[];
  recommendedId: string;
}

export default function ComparisonChart({ plans, recommendedId }: Props) {
  const sorted = [...plans].sort((a, b) => a.totalPaid - b.totalPaid);
  const maxTotal = Math.max(...sorted.map((p) => p.totalPaid));

  return (
    <div className="w-full">
      <h3 className="text-sm font-bold text-slate-900 mb-4">
        Total cost comparison
      </h3>
      <div className="space-y-3">
        {sorted.map((plan, i) => {
          const paidWidth = maxTotal > 0 ? (plan.totalPaid / maxTotal) * 100 : 0;
          const isRec = plan.id === recommendedId;

          return (
            <div key={plan.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-24 flex-shrink-0 text-right">
                {plan.name}
              </span>
              <div className="flex-1 h-6 bg-slate-50 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paidWidth}%` }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + i * 0.1,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "h-full rounded-full",
                    isRec ? "bg-navy" : "bg-slate-300"
                  )}
                />
                {plan.forgivenAmount > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(plan.forgivenAmount / maxTotal) * 100}%`,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.5 + i * 0.1,
                      ease: "easeOut",
                    }}
                    className="absolute top-0 h-full rounded-full bg-green-200 opacity-60"
                    style={{ left: `${paidWidth}%` }}
                  />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-700 w-20 flex-shrink-0">
                {formatCurrencyFull(plan.totalPaid)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-navy" />
          <span>Recommended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-300" />
          <span>Total paid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-200" />
          <span>Forgiven</span>
        </div>
      </div>
    </div>
  );
}
