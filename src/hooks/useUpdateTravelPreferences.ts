'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTravelPreferences } from '@/app/lib/api';
import type { UpdateTravelPreferencesBody } from '@/app/lib/types/user';
import { userKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for updating travel preferences.
 *
 * Usage:
 *   const updatePrefs = useUpdateTravelPreferences();
 *   await updatePrefs.mutateAsync({ preferred_class: 'business' });
 *
 * On success, invalidates userKeys.travelPreferences().
 */
export function useUpdateTravelPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTravelPreferencesBody) =>
      updateTravelPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.travelPreferences(),
      });
    },
  });
}
