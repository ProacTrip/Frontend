'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveMedicalConflict } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';
import type { ConflictAction } from '@/app/lib/types/user';

/**
 * Mutation hook for resolving a medical field conflict.
 *
 * Usage:
 *   const resolve = useResolveConflict();
 *   await resolve.mutateAsync({ conflictId: 'c1', action: 'accept' });
 *   await resolve.mutateAsync({ conflictId: 'c2', action: 'custom', value: 'O+' });
 *
 * On success, invalidates both `userKeys.medicalConflicts()` and
 * `userKeys.medical()` so the conflict list and medical profile refetch.
 */
export function useResolveConflict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conflictId,
      action,
      value,
    }: {
      conflictId: string;
      action: string;
      value?: string;
    }) =>
      resolveMedicalConflict(conflictId, {
        action: action as ConflictAction,
        value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.medicalConflicts() });
      queryClient.invalidateQueries({ queryKey: userKeys.medical() });
    },
  });
}
