export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 8) return accountNumber;
  const visiblePart = accountNumber.slice(-4);
  return `****${visiblePart}`;
};