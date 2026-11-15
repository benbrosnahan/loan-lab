import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

// Two faces, shared with Loan Desk and Decode so the Cense tools read as one
// family. Bricolage carries questions and headline figures; Instrument Sans
// carries everything that gets read or compared.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE = "https://loan-lab.vercel.app";
const DESCRIPTION =
  "Six quick questions, then a student loan repayment plan that fits you, with Standard, Graduated, IBR, RAP, Tiered Standard and PSLF compared on one screen under the July 2026 rules. Free, and nothing leaves your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Loan Lab by Cense: student loan repayment quiz",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Loan Lab by Cense",
    description: "Find the federal student loan repayment plan that fits you, in about three minutes.",
    type: "website",
    url: SITE,
    siteName: "Cense",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loan Lab by Cense",
    description: "Find the federal student loan repayment plan that fits you, in about three minutes.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFCEC",
  width: "device-width",
  initialScale: 1,
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Loan Lab by Cense",
  url: SITE,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: DESCRIPTION,
  publisher: { "@type": "Organization", name: "Cense", url: "https://cense.beehiiv.com" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <script
          type="application/ld+json"
          // Static, author-written JSON. No user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <noscript>
          <div style={{ padding: "1rem 16px", textAlign: "center" }}>
            Loan Lab needs JavaScript to price your plans. Turn it on in your
            browser settings.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
