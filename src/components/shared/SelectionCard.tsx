import { cn } from "@/lib/utils";

interface SelectionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/** One answer. A toggle button: choosing it records the answer and moves on. */
export default function SelectionCard({
  label,
  description,
  selected,
  onClick,
  disabled = false,
  className,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-3xl border-2 px-5 py-3.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        selected
          ? "border-navy bg-selected"
          : "border-line bg-white hover:border-slate-400",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-slate-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm leading-snug text-slate-600">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-navy bg-navy" : "border-slate-300 bg-white"
        )}
      >
        {selected && (
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}
