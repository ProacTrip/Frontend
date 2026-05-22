'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/app/lib/api';
import type { ProfileResponse, UpdateProfileBody } from '@/app/lib/types/user';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useProfile() {
  const queryClient = useQueryClient();

  // ── QUERY ───────────────────────────────────────────
  const {
    data: profile,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: PROFILE_STALE_TIME,
  });

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  // ── MUTATION (no optimistic) ────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileBody) => updateProfile(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });

  return {
    profile: profile ?? null,
    isLoading: isPending || isQueryLoading,
    error: queryErrorMsg,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
