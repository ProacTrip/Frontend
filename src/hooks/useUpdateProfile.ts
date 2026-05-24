'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '@/app/lib/api';
import type { UpdateProfileBody } from '@/app/lib/types/user';
import { queryKeys, userKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for updating the user profile (includes locale fields).
 *
 * Usage:
 *   const updateProfile = useUpdateProfile();
 *   await updateProfile.mutateAsync({ first_name: 'Juan', language: 'es' });
 *
 * On success, invalidates both userKeys.profile() (new) and
 * queryKeys.profile.all (legacy consumers) to keep all caches consistent.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileBody) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
