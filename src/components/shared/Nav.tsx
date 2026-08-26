"use client";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-page/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a
            href="https://cense.beehiiv.com"
            className="flex items-center gap-2 rounded-lg hover:opacity-75 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            aria-label="Cense newsletter home"
          >
            <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-slate-900">Cense</span>
          </a>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 text-sm">Loan Lab</span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          No data stored. All calculations run locally.
        </span>
      </div>
    </header>
  );
}
