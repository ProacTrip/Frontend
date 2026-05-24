'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTravelPreferences } from '@/app/lib/api';
import type { UpdateTravelPreferencesBody } from '@/app/lib/types/user';
import { queryKeys, userKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for updating travel preferences.
 *
 * Usage:
 *   const updatePrefs = useUpdateTravelPreferences();
 *   await updatePrefs.mutateAsync({ preferred_class: 'business' });
 *
 * On success, invalidates both travelPreferences and profile caches.
 * Travel preferences are returned inline in the GET /v1/user/profile
 * response — not as a separate endpoint. Both keys must be invalidated
 * so that useProfile() refetches and the TravelForm receives fresh data.
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
      // Also invalidate the main profile query since travel_preferences
      // are returned inline in GET /v1/user/profile (ProfileResponse).
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.all,
      });
    },
  });
}
