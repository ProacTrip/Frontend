'use client';

import { useQuery } from '@tanstack/react-query';
import { listMedicalConflicts } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { MedicalConflict } from '@/app/lib/types/user';

/**
 * Query hook for listing medical field conflicts.
 *
 * Usage:
 *   const { data, isPending, isFetching, error } = useMedicalConflicts('open');
 *
 * Backed by centralized query key `userKeys.medicalConflicts(status)`.
 * Stale time: PROFILE_STALE_TIME (30s).
 * Returns empty array when no conflicts exist or the API returns 404.
 */
export function useMedicalConflicts(status?: string) {
  const {
    data: response,
    isPending,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: userKeys.medicalConflicts(status),
    queryFn: () => listMedicalConflicts(status),
    staleTime: PROFILE_STALE_TIME,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    data: response?.conflicts as MedicalConflict[] | undefined,
    isPending,
    isFetching,
    error,
  };
}
