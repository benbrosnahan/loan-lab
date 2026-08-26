import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QuizAnswers } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number): string {
  if (!isFinite(n)) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}$${Math.round(abs)}`;
}

export function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDollarInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

export function parseDollarInput(formatted: string): number {
  const digits = formatted.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function formatPercentInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  return cleaned;
}

export function estimateTakeHomePay(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  const fica = 0.0765;
  const state = 0.04;
  let federalRate: number;
  if (annualIncome <= 30000) federalRate = 0.06;
  else if (annualIncome <= 50000) federalRate = 0.09;
  else if (annualIncome <= 75000) federalRate = 0.12;
  else federalRate = 0.15;
  return annualIncome * (1 - federalRate - fica - state);
}

export function encodeQuizAnswers(answers: QuizAnswers): string {
  try {
    return btoa(JSON.stringify(answers));
  } catch {
    return "";
  }
}

export function decodeQuizAnswers(encoded: string): QuizAnswers | null {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (
      parsed &&
      typeof parsed.federalBalance === "number" &&
      typeof parsed.federalRate === "number" &&
      typeof parsed.income === "number" &&
      typeof parsed.familySize === "number" &&
      parsed.federalBalance >= 0 &&
      parsed.federalRate >= 0 &&
      parsed.income >= 0 &&
      parsed.familySize >= 0
    ) {
      return parsed as QuizAnswers;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(answers: QuizAnswers): string {
  const encoded = encodeQuizAnswers(answers);
  if (!encoded) return "";
  const base =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/results?q=${encodeURIComponent(encoded)}`;
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
