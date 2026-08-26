"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function SelectionCard({
  label,
  description,
  selected,
  onClick,
  disabled = false,
  className,
}: SelectionCardProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border-2 px-4 py-3.5 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
        selected
          ? "border-navy bg-selected"
          : "border-slate-200 bg-white hover:border-slate-400",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-navy flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
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
          </div>
        )}
      </div>
    </motion.button>
  );
}
