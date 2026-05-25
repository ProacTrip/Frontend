'use client';

import { useCallback, useState, useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Globe } from 'lucide-react';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useLocalePreferences } from '@/hooks/useLocalePreferences';

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

interface CurrencySelectorProps {
  isScrolled?: boolean;
}

export default function CurrencySelector({ isScrolled = true }: CurrencySelectorProps) {
  const { setActiveCurrency } = useCurrencyContext();
  const { currency: displayCurrency } = useLocalePreferences();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleChange = useCallback(
    (currencyCode: string) => {
      setActiveCurrency(currencyCode);
    },
    [setActiveCurrency]
  );

  const current = CURRENCIES.find((c) => c.code === displayCurrency);
  const isLanding = !isScrolled;

  return (
    <Menu>
      <MenuButton
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isLanding
            ? "bg-white/15 text-white hover:bg-white/20 data-[open]:bg-white/25"
            : "text-neutral-600 hover:bg-neutral-100 data-[open]:bg-neutral-100"
        }`}
        aria-label="Seleccionar moneda"
      >
        <Globe className="w-5 h-5" />
        {mounted && current && !isLanding && (
          <span className="hidden xl:inline ml-1.5 text-xs font-medium tabular-nums">
            {current.symbol}
          </span>
        )}
      </MenuButton>

      <MenuItems
        portal
        anchor={{ to: "bottom end", gap: 8 }}
        transition
        className="bg-white rounded-2xl shadow-xl border border-neutral-200 z-[9999] py-2 overflow-hidden min-w-[120px] origin-top-right transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {CURRENCIES.map((currency) => (
          <MenuItem key={currency.code}>
            {({ focus }) => (
              <button
                onClick={() => handleChange(currency.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                  focus ? "bg-neutral-50" : ""
                } ${
                  currency.code === displayCurrency
                    ? "text-[#0A0A0A] font-semibold"
                    : "text-neutral-700"
                }`}
              >
                <span className="text-sm tabular-nums">{currency.symbol}</span>
                <span className="text-xs font-medium text-neutral-400 tabular-nums">{currency.code}</span>
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
