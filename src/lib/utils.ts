import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QuizAnswers, INITIAL_ANSWERS } from "@/types";
import { FEDERAL_TAX_2026, FICA_RATE, STATE_TAX_GUESS } from "@/data/plans";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Formats what a person types in a dollar field: digits get thousands
 * separators, and one decimal point keeps up to two digits of cents. A typed
 * "27,000.50" stays 27,000.50; it is never read as 2,700,050.
 */
export function formatDollarInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const dot = cleaned.indexOf(".");
  const whole = (dot < 0 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const cents = dot < 0 ? null : cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  const grouped = whole ? Number(whole).toLocaleString("en-US") : "0";
  return cents === null ? grouped : `${grouped}.${cents}`;
}

/** Reads a dollar field: "27,000.50" is 27000.5. Blank or a lone "." is 0. */
export function parseDollarInput(formatted: string): number {
  const cleaned = formatted.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  const normal = dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
  const n = Number(normal);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** True when a dollar field holds at least one digit, so a typed 0 counts as an answer. */
export const hasDigit = (s: string) => /\d/.test(s);

export function formatPercentInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  return cleaned;
}

/** Federal income tax at 2026 brackets on `taxable` dollars (IRS, Rev. Proc. 2025-32). */
export function federalTax(taxable: number, joint: boolean): number {
  const table = joint ? FEDERAL_TAX_2026.joint : FEDERAL_TAX_2026.single;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of table.brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

/**
 * A rough yearly take-home: AGI less 2026 federal income tax after the
 * standard deduction, 7.65% FICA, and a stated 4% guess at state tax. Only
 * used to put a payment in proportion, and labeled as rough where shown.
 */
export function estimateTakeHomePay(agi: number, joint = false): number {
  if (agi <= 0) return 0;
  const d = (joint ? FEDERAL_TAX_2026.joint : FEDERAL_TAX_2026.single).standardDeduction;
  return agi - federalTax(Math.max(0, agi - d), joint) - agi * (FICA_RATE + STATE_TAX_GUESS);
}

/**
 * Dependents and joint filing, read from new answers or, for a share link made
 * before those fields existed, from the old household size (everyone after
 * the borrower read as a dependent, as that version priced it).
 */
export function householdOf(a: Partial<QuizAnswers>): { dependents: number; filesJointly: boolean } {
  if (typeof a.dependents === "number" || typeof a.filesJointly === "boolean") {
    return {
      dependents: Math.max(0, Math.min(20, Math.floor(a.dependents ?? 0))),
      filesJointly: a.filesJointly === true,
    };
  }
  return { dependents: Math.max(0, Math.floor((a.familySize ?? 1) - 1)), filesJointly: false };
}

export function encodeQuizAnswers(answers: QuizAnswers): string {
  try {
    return btoa(JSON.stringify(answers));
  } catch {
    return "";
  }
}

const num = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;

/** Reads a share link's answers, rejecting anything that is not a plausible quiz answer. */
export function decodeQuizAnswers(encoded: string): QuizAnswers | null {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (
      parsed &&
      num(parsed.federalBalance, 10_000_000) &&
      num(parsed.federalRate, 30) &&
      num(parsed.income, 100_000_000) &&
      num(parsed.familySize ?? 1, 30)
    ) {
      const answers = { ...INITIAL_ANSWERS, ...parsed } as QuizAnswers;
      const h = householdOf(parsed);
      return {
        ...answers,
        ...h,
        familySize: Math.max(1, 1 + h.dependents + (h.filesJointly ? 1 : 0)),
        privateBalance: num(parsed.privateBalance, 10_000_000) ? parsed.privateBalance : 0,
        privateRate: num(parsed.privateRate, 50) ? parsed.privateRate : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * A link that rebuilds these results. The answers ride in the # fragment,
 * which browsers never send to a server, so a balance and income do not land
 * in anyone's request logs.
 */
export function buildShareUrl(answers: QuizAnswers): string {
  const encoded = encodeQuizAnswers(answers);
  if (!encoded) return "";
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/results#q=${encodeURIComponent(encoded)}`;
}

/** The encoded answers in a share link, from the fragment or, for older links, the query string. */
export function sharedAnswersFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("q");
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get("q");
}

function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Safari private browsing or storage full
  }
}

function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export const storage = {
  get: safeSessionGet,
  set: safeSessionSet,
  remove: safeSessionRemove,
};

/** Session storage keys: quiz progress, and the answers behind the last results. */
export const KEYS = {
  progress: "loan-lab-progress",
  answers: "loan-lab-answers",
};
