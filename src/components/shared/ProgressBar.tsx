import { TOTAL_STEPS } from "@/types";
import { cn } from "@/lib/utils";

// Six short segments: the quiz really is a sequence, so the count is shown.
export default function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600">
        Question {currentStep} of {TOTAL_STEPS}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < currentStep ? "bg-navy" : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
