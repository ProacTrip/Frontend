'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, DollarSign, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar USA' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar canadiense' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar australiano' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino' },
];

/** Key where the user's explicit currency choice survives page reloads. */
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
    // localStorage blocked in private mode
  }
}

export default function CurrencySelector() {
  const { context, setContext } = useAuthContext();
  const [currentCurrency, setCurrentCurrency] = useState('EUR');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve initial currency: user preference > environment > EUR
  useEffect(() => {
    const saved = getSavedPreference();
    const envCurrency = context?.location?.currency;
    const resolved = saved || envCurrency || 'EUR';

    setCurrentCurrency(resolved);
    setIsLoading(false);
  }, [context]);

  const handleChange = useCallback(
    (currencyCode: string) => {
      if (currencyCode === currentCurrency) {
        setIsOpen(false);
        return;
      }

      // Persist so it survives F5 / page reload
      savePreference(currencyCode);

      // Sync AuthContext so all consumers see the change (no reload needed)
      if (context?.location) {
        setContext({
          ...context,
          location: {
            ...context.location,
            currency: currencyCode,
          },
        });
      }

      setCurrentCurrency(currencyCode);
      setIsOpen(false);
    },
    [currentCurrency, context, setContext]
  );

  const current = CURRENCIES.find((c) => c.code === currentCurrency) || CURRENCIES[0];

  // Loading skeleton while environment is being fetched
  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-white/70" />
      </div>
    );
  }

  // Always render — even without context (anonymous users or before env loads)
  // Falls back to saved preference or EUR.
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
      >
        <DollarSign className="w-4 h-4" />
        <span>{current.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Selecciona moneda
            </p>
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleChange(currency.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                  currency.code === currentCurrency ? 'bg-red-50 text-[#c54141]' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-8">{currency.symbol}</span>
                  <span className="text-sm">{currency.name}</span>
                </div>
                <span className="text-xs font-medium text-gray-400">{currency.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
