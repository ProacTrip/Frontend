'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFavorites, addFavorite, deleteFavorite } from '@/app/lib/api';
import type {
  Favorite,
  EntityType,
  CreateFavoriteBody,
  FavoritesResponse,
  AddFavoriteResponse,
} from '@/app/lib/types/user';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { FAVORITES_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useFavorites(entityType?: EntityType) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.favorites.byType(entityType);

  // ── LIST (query) ────────────────────────────────────
  const {
    data,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => listFavorites(entityType, signal),
    staleTime: FAVORITES_STALE_TIME,
  });

  const favorites: Favorite[] = data?.favorites ?? [];

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  // ── TOGGLE (mutation + optimistic) ───────────────────
  const toggleMutation = useMutation({
    mutationFn: async (
      body: CreateFavoriteBody,
    ): Promise<
      | { _result: 'removed'; id: string }
      | { _result: 'added'; response: AddFavoriteResponse | { conflict: true } }
    > => {
      // Determine whether to add or remove based on current cache
      const current = queryClient.getQueryData<FavoritesResponse>(queryKey);
      const existing = current?.favorites.find(
        (f) => f.entity_id === body.entity_id,
      );

      if (existing) {
        await deleteFavorite(existing.id);
        return { _result: 'removed', id: existing.id };
      }

      const response = await addFavorite(body);
      return { _result: 'added', response };
    },

    onMutate: async (body) => {
      // Cancel in-flight list queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FavoritesResponse>(queryKey);

      if (previous) {
        const exists = previous.favorites.some(
          (f) => f.entity_id === body.entity_id,
        );

        const updated: FavoritesResponse = exists
          ? {
              favorites: previous.favorites.filter(
                (f) => f.entity_id !== body.entity_id,
              ),
            }
          : {
              favorites: [
                ...previous.favorites,
                {
                  id: `optimistic-${body.entity_id}`,
                  entity_id: body.entity_id,
                  entity_type: body.entity_type,
                  title: body.title,
                  notes: body.notes ?? null,
                  created_at: new Date().toISOString(),
                },
              ],
            };

        queryClient.setQueryData(queryKey, updated);
      }

      return { previous };
    },

    onError: (_err, _body, context) => {
      // Rollback to snapshot on failure
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      // Always re-sync with server after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // ── REMOVE (mutation) ───────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (favoriteId: string) => deleteFavorite(favoriteId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // ── DERIVED HELPERS ─────────────────────────────────
  const isLoading = isPending || isQueryLoading;

  const isFavorite = useCallback(
    (entityId: string): boolean =>
      favorites.some((f) => f.entity_id === entityId),
    [favorites],
  );

  // ── PUBLIC API ──────────────────────────────────────
  const toggleFavorite = useCallback(
    async (body: CreateFavoriteBody): Promise<boolean> => {
      // Prevent double-click
      if (toggleMutation.isPending) return false;

      try {
        const result = await toggleMutation.mutateAsync(body);

        if (result._result === 'removed') {
          return false;
        }

        // Added — check for conflict
        const addResult = result.response;
        if ('conflict' in addResult && addResult.conflict) {
          // Already exists on server, refetch
          await refetch();
          return true;
        }

        return true;
      } catch {
        throw new Error('Error al modificar favorito.');
      }
    },
    [toggleMutation, refetch],
  );

  const removeFavorite = useCallback(
    async (favoriteId: string): Promise<void> => {
      await removeMutation.mutateAsync(favoriteId);
    },
    [removeMutation],
  );

  return {
    favorites,
    isLoading,
    isToggling: toggleMutation.isPending,
    error: queryErrorMsg,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refresh: () => refetch(),
  };
}
