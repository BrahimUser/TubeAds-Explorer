import type { Currency } from '../types/Ad';

export function formatPriceMad(priceCents: number, currency: Currency): string {
  const value = priceCents / 100;
  try {
    if (currency === 'MAD') {
      return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} MAD`;
    }
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}
