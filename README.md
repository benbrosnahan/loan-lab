# Loan Lab

**Live: [loan-lab.vercel.app](https://loan-lab.vercel.app)**

Six questions and a personalized federal student loan repayment recommendation, comparing
Standard, Graduated, IBR, RAP, Tiered Standard, and PSLF side by side under the July 2026
rules.

> Superseded by **[Cense Loan Desk](https://cense-loan-desk.vercel.app)**, which handles a
> full multi-loan portfolio rather than a single recommendation. Kept public because
> `src/data/plans.ts` is the ancestor of the Loan Desk plan data, and because the quiz format
> still converts better as a newsletter tool than the full dashboard does.

## The correction worth reading

An early version of this recommended Tiered Standard to some users pursuing Public Service
Loan Forgiveness. That is wrong. **Tiered Standard never earns PSLF credit, in any tier,
including the 10-year one.** It is omitted from the qualifying plan list in 34 CFR
685.219(b)(28)(ii), which pulls only the consolidation plan out of 685.208(c). The 10-year
tier looks equivalent to the Standard plan, which is exactly why it is a trap.

Getting this wrong would have cost a real person years of qualifying payments. It is the
reason the successor project traces every number to a citation in code.

## How it is built

- Next.js App Router, TypeScript, Tailwind, Framer Motion
- `src/data/plans.ts` for plan rules, `src/lib/calculator.ts` for the comparison math
- Client side only, shareable by URL, nothing stored

Part of [Cense](https://cense.beehiiv.com).
