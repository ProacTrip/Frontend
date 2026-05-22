'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  togglePriceAlert,
} from '@/app/lib/api/saved-searches';
import { UserApiError } from '@/app/lib/api/user';
import type {
  SavedSearch,
  CreateSavedSearchBody,
  UpdateSavedSearchBody,
  SavedSearchListResponse,
  CreateSavedSearchResponse,
  UpdateSavedSearchResponse,
} from '@/app/lib/types/saved-search';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { SAVED_SEARCHES_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useSavedSearches() {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.savedSearches.all;

  // ── LIST (query) ────────────────────────────────────
  const {
    data,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => listSavedSearches(signal),
    staleTime: SAVED_SEARCHES_STALE_TIME,
  });

  const searches: SavedSearch[] = data?.searches ?? [];

  const queryErrorMsg =
    queryError instanceof Error
      ? queryError.message
      : null;

  // ── CREATE (mutation) ───────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: CreateSavedSearchBody) => createSavedSearch(body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── UPDATE (mutation) ───────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSavedSearchBody;
    }) => updateSavedSearch(id, body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── REMOVE (mutation + optimistic) ──────────────────
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSavedSearch(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SavedSearchListResponse>(queryKey);

      if (previous) {
        queryClient.setQueryData<SavedSearchListResponse>(queryKey, {
          searches: previous.searches.filter((s) => s.id !== id),
        });
      }

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── TOGGLE ALERT (mutation + optimistic) ────────────
  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      togglePriceAlert(id, enabled),

    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SavedSearchListResponse>(queryKey);

      // Optimistic: toggle alert_enabled in-place
      if (previous) {
        queryClient.setQueryData<SavedSearchListResponse>(queryKey, {
          searches: previous.searches.map((s) =>
            s.id === id ? { ...s, alert_enabled: enabled } : s,
          ),
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── DERIVED ─────────────────────────────────────────
  const isLoading = isPending || isQueryLoading;

  // ── PUBLIC API ──────────────────────────────────────
  const create = useCallback(
    async (
      body: CreateSavedSearchBody,
    ): Promise<CreateSavedSearchResponse | { conflict: true }> => {
      return createMutation.mutateAsync(body);
    },
    [createMutation],
  );

  const update = useCallback(
    async (
      id: string,
      body: UpdateSavedSearchBody,
    ): Promise<UpdateSavedSearchResponse> => {
      return updateMutation.mutateAsync({ id, body });
    },
    [updateMutation],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await removeMutation.mutateAsync(id);
    },
    [removeMutation],
  );

  const toggleAlert = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      await toggleAlertMutation.mutateAsync({ id, enabled });
    },
    [toggleAlertMutation],
  );

  return {
    searches,
    isLoading,
    error: queryErrorMsg,
    load: () => refetch(),
    create,
    update,
    remove,
    toggleAlert,
  };
}
