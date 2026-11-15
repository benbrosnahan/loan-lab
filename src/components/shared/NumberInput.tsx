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
  quickFill?: { label: string; value: string };
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
      <label htmlFor={id} className="block text-base font-semibold text-slate-900">
        {label}
      </label>
      {helperText && (
        <p id={`${id}-help`} className="mt-1 text-sm leading-snug text-slate-600">
          {helperText}
        </p>
      )}
      <div className="relative mt-2">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={helperText ? `${id}-help` : undefined}
          className={cn(
            "tnum min-h-[52px] w-full rounded-2xl border-2 border-line bg-white text-base text-slate-900",
            "placeholder:text-slate-500/70 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20",
            prefix ? "pl-9 pr-4" : "px-4",
            suffix ? "pr-10" : ""
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {quickFill && (
        <button
          type="button"
          onClick={() => onChange(quickFill.value)}
          className="mt-1 min-h-[40px] rounded-full text-sm font-semibold text-navy underline decoration-slate-300 underline-offset-4 hover:decoration-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          {quickFill.label}
        </button>
      )}
    </div>
  );
}
