// lib/utils/currency.ts
import { CountryCurrency } from '@/lib/config/currency';

/**
 * Format currency for DISPLAY (on screen) - shows symbol only
 */
export function formatCurrencyForDisplay(
  amount: number,
  currency: CountryCurrency
): string {
  const formattedAmount = new Intl.NumberFormat(currency.locale, {
    style: 'decimal',
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);

  return currency.position === 'before'
    ? `${currency.symbol} ${formattedAmount}`
    : `${formattedAmount} ${currency.symbol}`;
}

/**
 * Format currency for SPEECH (voice output) - says full currency name
 */
export function formatCurrencyForSpeech(
  amount: number,
  currency: CountryCurrency
): string {
  return `${currency.name} ${amount.toLocaleString()}`;
}

/**
 * Format currency with both display and speech (convenience)
 */
export function formatCurrency(
  amount: number,
  currency: CountryCurrency
): { display: string; speech: string } {
  return {
    display: formatCurrencyForDisplay(amount, currency),
    speech: formatCurrencyForSpeech(amount, currency)
  };
}

/**
 * Parse amount from string (for input fields)
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}