'use client';

import { useQuery } from '@tanstack/react-query';
import { getTravelPreferences } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { TravelPreferences } from '@/app/lib/types/user';

export function useTravelPreferences() {
  return useQuery<TravelPreferences | null>({
    queryKey: userKeys.travelPreferences(),
    queryFn: ({ signal }) => getTravelPreferences(signal),
    staleTime: PROFILE_STALE_TIME,
  });
}
