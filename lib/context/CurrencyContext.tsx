// lib/context/CurrencyContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_CURRENCY_MAP, DEFAULT_COUNTRY, CountryCurrency, getDefaultCurrencyForLanguage } from '@/lib/config/currency';

interface CurrencyContextType {
  country: string;
  currency: CountryCurrency;
  setCountry: (country: string) => void;
  setDisplayCurrency: (currencyCode: string) => void; // Manual override
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [country, setCountryState] = useState<string>(DEFAULT_COUNTRY);
  const [currency, setCurrencyState] = useState<CountryCurrency>(COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY]);
  const [userSelectedCurrency, setUserSelectedCurrency] = useState<boolean>(false);

  // Load saved country and manual override flag on mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('selected-country');
    if (savedCountry) {
      const normalizedSaved = savedCountry.toLowerCase(); // Normalize case
      if (COUNTRY_CURRENCY_MAP[normalizedSaved]) {
        setCountryState(normalizedSaved);
        setCurrencyState(COUNTRY_CURRENCY_MAP[normalizedSaved]);
      }
    } else {
      // If no saved country, use language default (if available)
      const langDefault = getDefaultCurrencyForLanguage(i18n.language);
      const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
        c => COUNTRY_CURRENCY_MAP[c].code === langDefault
      );
      if (matchingCountry) {
        setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      }
    }

    const manualFlag = localStorage.getItem('userSelectedCurrency');
    if (manualFlag === 'true') {
      setUserSelectedCurrency(true);
    }
  }, [i18n.language]);

  // Listen to language changes – only override if no manual selection
  useEffect(() => {
    if (!userSelectedCurrency) {
      const lang = i18n.language;
      const targetCurrencyCode = getDefaultCurrencyForLanguage(lang);
      // Find any country that uses this currency (take the first match)
      const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
        c => COUNTRY_CURRENCY_MAP[c].code === targetCurrencyCode
      );
      if (matchingCountry) {
        setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      } else {
        // Fallback: keep current currency, or default to KES
        if (!currency.code) {
          setCurrencyState(COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY]);
        }
      }
    }
  }, [i18n.language, userSelectedCurrency]);

  // Called from interview when user selects country – NORMALIZE the input
  const handleSetCountry = (newCountry: string) => {
    const normalized = newCountry.toLowerCase(); // ✅ Convert to lowercase
    if (COUNTRY_CURRENCY_MAP[normalized]) {
      setCountryState(normalized);
      // If user hasn't manually overridden currency, update it to the country's default
      if (!userSelectedCurrency) {
        setCurrencyState(COUNTRY_CURRENCY_MAP[normalized]);
      }
      localStorage.setItem('selected-country', normalized);
    }
  };

  // Manual override from currency switcher
  const setDisplayCurrency = (currencyCode: string) => {
    // Find the first country that uses this currency
    const matchingCountry = Object.keys(COUNTRY_CURRENCY_MAP).find(
      c => COUNTRY_CURRENCY_MAP[c].code === currencyCode
    );
    if (matchingCountry) {
      setCurrencyState(COUNTRY_CURRENCY_MAP[matchingCountry]);
      setUserSelectedCurrency(true);
      localStorage.setItem('userSelectedCurrency', 'true');
    } else if (currencyCode === 'EUR') {
      // Direct fallback for Euro (if not present in map)
      setCurrencyState({
        code: 'EUR',
        symbol: '€',
        name: 'Euros',
        locale: 'de-DE',
        position: 'after',
        decimalPlaces: 2
      });
      setUserSelectedCurrency(true);
      localStorage.setItem('userSelectedCurrency', 'true');
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        country,
        currency,
        setCountry: handleSetCountry,
        setDisplayCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
}