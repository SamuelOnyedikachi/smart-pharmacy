import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const diff = new Date(expiryDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(expiryDate: Date | string, thresholdDays = 90): boolean {
  return daysUntilExpiry(expiryDate) <= thresholdDays && daysUntilExpiry(expiryDate) > 0;
}

export function isExpired(expiryDate: Date | string): boolean {
  return daysUntilExpiry(expiryDate) <= 0;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${timestamp}-${random}`;
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    OWNER: "bg-purple-50 text-purple-700 border border-purple-100",
    STOCK_KEEPER: "bg-blue-50 text-blue-700 border border-blue-100",
    CASHIER: "bg-green-50 text-green-700 border border-green-100",
    PHARMACIST: "bg-teal-50 text-teal-700 border border-teal-100",
    DRIVER: "bg-orange-50 text-orange-700 border border-orange-100",
    QA_PERSONNEL: "bg-yellow-50 text-yellow-700 border border-yellow-100",
    SECURITY: "bg-red-50 text-red-700 border border-red-100",
    SUPPLIER: "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return colors[role] ?? "bg-gray-100 text-gray-700 border border-gray-200";
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    MILD: "bg-yellow-50 text-yellow-800 border-yellow-200",
    MODERATE: "bg-orange-50 text-orange-800 border-orange-200",
    SEVERE: "bg-red-50 text-red-800 border-red-200",
    CONTRAINDICATED: "bg-red-100 text-red-900 border-red-300",
  };
  return colors[severity] ?? "bg-gray-100 text-gray-700 border-gray-200";
}
