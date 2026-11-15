import ProgressBar from "@/components/shared/ProgressBar";

export default function QuizShell({ currentStep, children }: { currentStep: number; children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <ProgressBar currentStep={currentStep} />
      <div className="mt-8">{children}</div>
    </main>
  );
}
