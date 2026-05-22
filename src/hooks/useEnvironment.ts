'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ENV_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useEnvironment() {
  const {
    data: environment,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.env.all,
    queryFn: () => fetchAndStoreEnvironment(),
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
