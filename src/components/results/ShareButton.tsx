"use client";

import { useState } from "react";
import { QuizAnswers } from "@/types";
import { buildShareUrl } from "@/lib/utils";

export default function ShareButton({ answers }: { answers: QuizAnswers }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = buildShareUrl(answers);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-line bg-white px-6 text-base font-semibold text-slate-900 transition-colors hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
    >
      <span aria-live="polite">{copied ? "Link copied" : "Copy a link to these results"}</span>
    </button>
  );
}
