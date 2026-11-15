// Header shared in form with Loan Desk and Decode: Cense in orange, the tool
// in green, and a plain statement of where the data lives.
export default function Nav() {
  return (
    <header className="bg-page">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <nav aria-label="Cense" className="flex items-center gap-1.5 font-display text-lg font-bold">
          <a
            href="https://cense.beehiiv.com"
            className="inline-flex min-h-[40px] items-center rounded-full text-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Cense
          </a>
          <a
            href="/"
            className="inline-flex min-h-[40px] items-center rounded-full text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Loan Lab
          </a>
        </nav>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-selected px-3 py-1.5 text-xs font-semibold text-slate-800">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 118 0v4" strokeLinecap="round" />
          </svg>
          Stays on this device
        </p>
      </div>
    </header>
  );
}
