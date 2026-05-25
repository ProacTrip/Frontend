'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

const CURRENCY_PREF_KEY = 'user_currency_preference';

function getSavedPreference(): string | null {
  try {
    return localStorage.getItem(CURRENCY_PREF_KEY);
  } catch {
    return null;
  }
}

function savePreference(code: string): void {
  try {
    localStorage.setItem(CURRENCY_PREF_KEY, code);
  } catch {
    // localStorage may be blocked in private mode
  }
}

export interface CurrencyContextType {
  activeCurrency: string | null;
  setActiveCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [activeCurrency, setActiveCurrencyState] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedPreference();
    if (saved) setActiveCurrencyState(saved);
  }, []);

  const setActiveCurrency = useCallback((code: string) => {
    savePreference(code);
    setActiveCurrencyState(code);
  }, []);

  return (
    <CurrencyContext.Provider value={{ activeCurrency, setActiveCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrencyContext debe usarse dentro de <CurrencyProvider>');
  }
  return ctx;
}
