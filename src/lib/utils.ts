import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Indian Financial Year helpers (April - March)
export function getCurrentFY(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 4) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

export function getFYOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const fys: string[] = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    fys.push(`${y}-${String(y + 1).slice(2)}`);
  }
  return fys;
}

export function getFYDateRange(fy: string): { start: Date; end: Date } {
  const startYear = parseInt(fy.split("-")[0]);
  return {
    start: new Date(startYear, 3, 1),   // April 1
    end: new Date(startYear + 1, 2, 31), // March 31
  };
}

export function getDaysUntilDue(dueDate: string | Date): number {
  return differenceInDays(new Date(dueDate), new Date());
}

export function getDaysRemaining(dueDate: string | Date): number {
  return differenceInDays(new Date(dueDate), new Date());
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy");
}

export function getWhatsAppLink(mobile: string, message?: string): string {
  const cleaned = mobile.replace(/\D/g, "");
  const number = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  const msg = message ? encodeURIComponent(message) : "";
  return `https://wa.me/${number}${msg ? `?text=${msg}` : ""}`;
}

export function getDueBadgeColor(days: number): string {
  if (days < 0) return "bg-red-600 text-white";
  if (days <= 7) return "bg-red-500 text-white";
  if (days <= 30) return "bg-orange-500 text-white";
  return "bg-emerald-500 text-white";
}

export function getFYMonths(fy: string): Date[] {
  const { start } = getFYDateRange(fy);
  const months: Date[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(addMonths(start, i));
  }
  return months;
}
