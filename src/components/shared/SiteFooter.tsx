import { LEGAL_DISCLAIMER } from "@/data/plans";

export default function SiteFooter() {
  return (
    <footer className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
      <p className="border-t border-line pt-6 text-sm leading-relaxed text-slate-600">
        {LEGAL_DISCLAIMER} Loan Lab is part of{" "}
        <a
          href="https://cense.beehiiv.com"
          className="font-semibold text-navy underline decoration-slate-300 underline-offset-4 hover:decoration-navy"
        >
          Cense
        </a>
        .
      </p>
    </footer>
  );
}
