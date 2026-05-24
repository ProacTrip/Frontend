'use client';

import { useMemo } from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

/**
 * Resolved locale preferences from the priority chain.
 *
 * Language priority: profile.language_code > environment.location.language > "es"
 * Currency priority: activeSearchChoice > profile.currency_code > environment.location.currency > "EUR"
 */
export interface LocalePreferences {
  language: string;
  currency: string;
}

/**
 * Unified hook for language and currency resolution.
 *
 * Reads from three sources and applies the defined priority chains:
 * - `useEnvironment()` for environment-derived language/currency
 * - `useAuthContext()` for profile-persisted language/currency
 * - `useCurrencyContext()` for active user override (search choice)
 *
 * All values are nullable at each tier — the hook safely falls through
 * to hard defaults ("es" / "EUR").
 */
export function useLocalePreferences(): LocalePreferences {
  const { environment } = useEnvironment();
  const { profileLanguage, profileCurrency } = useAuthContext();
  const { activeCurrency } = useCurrencyContext();

  return useMemo<LocalePreferences>(() => {
    const language =
      profileLanguage ??
      environment?.location?.language ??
      'es';

    const currency =
      activeCurrency ??
      profileCurrency ??
      environment?.location?.currency ??
      'EUR';

    return { language, currency };
  }, [profileLanguage, profileCurrency, activeCurrency, environment]);
}
