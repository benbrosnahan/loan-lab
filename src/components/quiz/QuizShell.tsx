"use client";

import ProgressBar from "@/components/shared/ProgressBar";

interface QuizShellProps {
  currentStep: number;
  children: React.ReactNode;
}

export default function QuizShell({ currentStep, children }: QuizShellProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-xl">
        <ProgressBar currentStep={currentStep} />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
