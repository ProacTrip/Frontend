'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ENV_STALE_TIME } from '@/app/lib/queries/staleTimes';

/**
 * Declarative environment data hook (TanStack Query).
 *
 * Fetches `GET /v1/environment` with the correct Accept-Language header:
 *   - Authenticated: profile.language_code (explicit user preference)
 *   - Anonymous: "es" (hard default for the Spanish-speaking target market)
 *
 * navigator.language is deliberately NOT used — it reflects the browser UI
 * language, not the user's geographic context or the app's target market.
 *
 * Language is part of the query key — when the profile loads or the user
 * changes their preferred language, the query auto-refetches.
 *
 * Runs for ALL users (auth + unauth). TanStack Query handles dedup,
 * staleTime (10 min), and background refetch on window focus.
 */
export function useEnvironment() {
  const { profileLanguage } = useAuthContext();

  // Profile preference takes priority. Anonymous users default to Spanish.
  const lang = profileLanguage || 'es';

  const {
    data: environment,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery({
    queryKey: [...queryKeys.env.all, lang],
    queryFn: () => fetchAndStoreEnvironment(lang),
    staleTime: ENV_STALE_TIME,
  });

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  return {
    environment: environment ?? null,
    isLoading: isPending || isQueryLoading,
    error: queryErrorMsg,
  };
}
