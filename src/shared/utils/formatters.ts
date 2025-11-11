import { getLocale } from "../../app/providers/I18nProvider";

export const formatCurrency = (
  amount: number,
  currency: string = "FCFA",
  locale?: string
): string => {
  const loc = locale || getLocale();
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date, locale?: string): string => {
  const loc = locale || getLocale();
  return new Intl.DateTimeFormat(loc, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 8) return accountNumber;
  const visiblePart = accountNumber.slice(-4);
  return `****${visiblePart}`;
};
