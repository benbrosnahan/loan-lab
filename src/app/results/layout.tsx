import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your repayment options | Loan Lab by Cense",
  robots: { index: false, follow: true },
  alternates: { canonical: "/results" },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
