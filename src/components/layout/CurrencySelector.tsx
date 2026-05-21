'use client';

import { useState, useCallback } from 'react';
import { Globe } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
];

const CURRENCY_PREF_KEY = 'user_currency_preference';

function getSavedPreference(): string | null {
  try { return localStorage.getItem(CURRENCY_PREF_KEY); }
  catch { return null; }
}

function savePreference(code: string): void {
  try { localStorage.setItem(CURRENCY_PREF_KEY, code); }
  catch { /* noop */ }
}

interface CurrencySelectorProps {
  isScrolled?: boolean;
}

export default function CurrencySelector({ isScrolled = true }: CurrencySelectorProps) {
  const { context, setContext } = useAuthContext();
  const [currentCurrency, setCurrentCurrency] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Resolve currency during render — no effect needed.
  // Priority: user preference > environment > null (no hardcoded default).
  const resolvedCurrency = (() => {
    const saved = getSavedPreference();
    return saved || context?.location?.currency || null;
  })();

  const displayCurrency = currentCurrency || resolvedCurrency;

  const handleChange = useCallback(
    (currencyCode: string) => {
      savePreference(currencyCode);
      if (context?.location) {
        setContext({
          ...context,
          location: { ...context.location, currency: currencyCode },
        });
      }
      setCurrentCurrency(currencyCode);
      setIsOpen(false);
    },
    [context, setContext]
  );

  const current = CURRENCIES.find((c) => c.code === displayCurrency);
  const isLanding = !isScrolled;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isLanding
            ? "glass text-white hover:bg-white/20"
            : "text-neutral-600 hover:bg-neutral-100"
        }`}
        aria-label="Seleccionar moneda"
      >
        <Globe className="w-5 h-5" />
        {current && !isLanding && (
          <span className="hidden xl:inline ml-1.5 text-xs font-medium tabular-nums">
            {current.symbol}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 py-2 overflow-hidden min-w-[120px]">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleChange(currency.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-colors ${
                  currency.code === displayCurrency
                    ? "bg-brand/5 text-brand font-semibold"
                    : "text-neutral-700"
                }`}
              >
                <span className="text-sm tabular-nums">{currency.symbol}</span>
                <span className="text-xs font-medium text-neutral-400 tabular-nums">{currency.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
