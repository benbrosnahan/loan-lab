"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    label: "See your exact loans",
    url: "https://studentaid.gov",
    description:
      "Log in with your FSA ID to see every federal loan, balance, rate, and servicer",
  },
  {
    label: "Enroll in an income-driven plan",
    url: "https://studentaid.gov/idr",
    description:
      "Official IDR application — takes about 10 minutes",
  },
  {
    label: "Check PSLF eligibility",
    url: "https://studentaid.gov/pslf",
    description:
      "If you work in public service, submit an Employment Certification Form now — don't wait",
  },
];

export default function NextSteps() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <h3 className="text-sm font-bold text-slate-900 mb-3">
        Ready to act on this?
      </h3>
      <div className="space-y-2.5">
        {STEPS.map((step, i) => (
          <a
            key={i}
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-navy hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-navy transition-colors">
                  {i + 1}. {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step.description}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-slate-300 group-hover:text-navy transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
}
