'use client';

import type { HotelPrice } from '@/lib/types/search';

interface PriceDisplayProps {
  price: HotelPrice;
  variant?: 'card' | 'detail';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Formats a number as a locale-aware string with thousand separators.
 * E.g., 1200 → "1,200" (es-ES) or "1 200" depending on locale.
 */
function formatAmount(amount: number): string {
  return amount % 1 === 0 ? amount.toLocaleString('de-DE') : amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PriceDisplay({ price, variant = 'card' }: PriceDisplayProps) {
  const symbol = getCurrencySymbol(price.currency);
  const perNight = price.per_night.amount;

  if (variant === 'card') {
    return (
      <div className="flex flex-col items-end">
        <p className="text-sm font-semibold text-ink leading-tight">
          <span className="text-xs font-normal text-ink-muted">desde </span>
          {symbol}{formatAmount(perNight)}
          <span className="text-xs font-normal text-ink-muted"> /noche</span>
        </p>
        {price.total.amount > 0 && (
          <p className="text-xs text-ink-muted mt-0.5">
            {symbol}{formatAmount(price.total.amount)} en total
          </p>
        )}
      </div>
    );
  }

  // detail variant — full breakdown
  return (
    <div className="space-y-3">
      {/* Per night */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">Precio por noche</span>
        <span className="text-lg font-bold text-ink">
          {symbol}{formatAmount(perNight)}
        </span>
      </div>

      {price.per_night.before_taxes !== null && price.per_night.before_taxes !== undefined && (
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-muted ml-4">Antes de impuestos</span>
          <span className="text-xs text-ink-faint">
            {symbol}{formatAmount(price.per_night.before_taxes)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-paper-outline" />

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">Total</span>
        <span className="text-lg font-bold text-ink">
          {symbol}{formatAmount(price.total.amount)}
        </span>
      </div>

      {price.total.before_taxes !== null && price.total.before_taxes !== undefined && (
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-muted ml-4">Antes de impuestos</span>
          <span className="text-xs text-ink-faint">
            {symbol}{formatAmount(price.total.before_taxes)}
          </span>
        </div>
      )}
    </div>
  );
}
