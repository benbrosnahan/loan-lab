"use client";

import { motion } from "framer-motion";

interface Props {
  planName: string;
  reasons: string[];
  tradeoff?: string;
}

export default function RecommendationBanner({
  planName,
  reasons,
  tradeoff,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full p-5 rounded-2xl border-2 border-green-200 bg-green-50"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
        <div>
          <h2 className="text-lg font-bold text-green-900">
            Our top pick: {planName}
          </h2>
          <ul className="mt-2 space-y-1">
            {reasons.map((reason, i) => (
              <li
                key={i}
                className="text-sm text-green-800 leading-relaxed flex items-start gap-2"
              >
                <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                {reason}
              </li>
            ))}
          </ul>
          {tradeoff && (
            <div className="mt-3 p-3 rounded-lg bg-white/70 border border-green-200">
              <p className="text-[11px] font-semibold text-green-900 uppercase tracking-wider">
                What you give up
              </p>
              <p className="text-sm text-green-800 leading-relaxed mt-1">
                {tradeoff}
              </p>
            </div>
          )}
          <p className="text-xs text-green-700/80 leading-relaxed mt-3">
            This is a starting point rather than an answer. Read the advantages
            and disadvantages on each card below, since the right plan depends
            on what you value most.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
