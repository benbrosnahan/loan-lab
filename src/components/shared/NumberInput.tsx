"use client";

import { cn } from "@/lib/utils";

interface NumberInputProps {
  id: string;
  label: string;
  helperText?: string;
  value: string;
  onChange: (displayValue: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  quickFill?: {
    label: string;
    value: string;
  };
}

export default function NumberInput({
  id,
  label,
  helperText,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  className,
  quickFill,
}: NumberInputProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-900"
        >
          {label}
        </label>
        {quickFill && (
          <button
            type="button"
            onClick={() => onChange(quickFill.value)}
            className="text-xs text-navy hover:underline font-medium"
          >
            {quickFill.label}
          </button>
        )}
      </div>
      {helperText && (
        <p
          id={`${id}-help`}
          className="text-xs text-slate-400 mt-0.5 leading-snug"
        >
          {helperText}
        </p>
      )}
      <div className="relative mt-1.5">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={helperText ? `${id}-help` : undefined}
          className={cn(
            "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white text-sm text-slate-900",
            "placeholder:text-slate-300",
            "focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy",
            "transition-colors",
            prefix ? "pl-8 pr-3" : "px-3",
            suffix ? "pr-8" : ""
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
