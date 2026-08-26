import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loan Lab by Cense — Student Loan Repayment Quiz",
  description:
    "Answer 6 quick questions and get a personalized student loan repayment recommendation. Compare Standard, Graduated, IBR, RAP, Tiered Standard, and PSLF plans side by side, updated for the July 2026 rules.",
  openGraph: {
    title: "Loan Lab by Cense — Student Loan Repayment Quiz",
    description:
      "Find the best repayment plan for your student loans in under 3 minutes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loan Lab by Cense",
    description:
      "Find the best repayment plan for your student loans in under 3 minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            This tool requires JavaScript to run. Please enable JavaScript in
            your browser settings.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
