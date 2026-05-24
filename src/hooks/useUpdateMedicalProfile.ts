'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMedicalProfile,
  adaptMedicalProfile,
  updateMedicalProfile,
} from '@/app/lib/api';
import type {
  UpdateMedicalProfileBody,
  GetMedicalProfileResponse,
} from '@/app/lib/types/user';
import { userKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';

/**
 * Query + Mutation hook for the medical profile.
 *
 * useQuery: loads the medical profile via GET /v1/user/profile/medical.
 *   Returns null when the user has no medical profile yet (404 → null).
 *   adaptMedicalProfile unwraps MedicalField<T> → raw values for form display.
 *
 * useMutation: wraps updateMedicalProfile (PATCH).
 *   On success, invalidates userKeys.medical() to refetch the query.
 *
 * Usage:
 *   const { medicalProfile, isLoading, updateMutation } = useUpdateMedicalProfile();
 *   // medicalProfile is the ADAPTED plain object (raw values)
 *   await updateMutation.mutateAsync({ blood_type: 'O+', allergies: ['Penicilina'] });
 */
export function useUpdateMedicalProfile() {
  const queryClient = useQueryClient();

  // ── QUERY ───────────────────────────────────────────
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: userKeys.medical(),
    queryFn: async (): Promise<Record<string, unknown> | null> => {
      const response: GetMedicalProfileResponse | null = await getMedicalProfile();
      if (!response?.data) return null;
      // Adapt MedicalField<T> wrappers → plain values for form display
      const adapted = adaptMedicalProfile(
        response as unknown as Record<string, unknown>,
      );
      return adapted as Record<string, unknown>;
    },
    staleTime: PROFILE_STALE_TIME,
  });

  // ── MUTATION ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: UpdateMedicalProfileBody) => updateMedicalProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.medical() });
    },
  });

  return {
    medicalProfile: rawData ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    updateMutation,
  };
}
