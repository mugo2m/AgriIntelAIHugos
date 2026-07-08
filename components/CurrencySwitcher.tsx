// components/CurrencySwitcher.tsx
"use client";

import { useCurrency } from '@/lib/context/CurrencyContext';
import { CURRENCY_CONFIG } from '@/lib/config/currency';

export function CurrencySwitcher() {
  const { currency, setDisplayCurrency } = useCurrency();

  // Get all unique currency configurations (already in CURRENCY_CONFIG)
  const currencies = Object.entries(CURRENCY_CONFIG);

  return (
    <select
      value={currency.code}
      onChange={(e) => setDisplayCurrency(e.target.value)}
      className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20"
    >
      {currencies.map(([code, config]) => (
        <option key={code} value={code} className="text-gray-900">
          {config.symbol} - {config.name}
        </option>
      ))}
    </select>
  );
}