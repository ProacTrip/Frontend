'use client';

import { useState, useCallback, useEffect } from 'react';
import { listFavorites, addFavorite, deleteFavorite } from '@/lib/api/user';
import type { Favorite, EntityType, CreateFavoriteBody } from '@/lib/api/types';

// ── Return type ──

export interface UseFavoritesReturn {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  isFavorite: (entityId: string) => boolean;
  toggleFavorite: (entityId: string, entityType: EntityType, title: string) => Promise<boolean>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Hook ──

export function useFavorites(entityType?: EntityType): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listFavorites(entityType);
      setFavorites(response.favorites ?? []);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Error al cargar favoritos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    load();
  }, [load]);

  // Check if an entity is favorited
  const isFavorite = useCallback(
    (entityId: string): boolean => {
      return favorites.some((f) => f.entity_id === entityId);
    },
    [favorites]
  );

  // Toggle favorite — optimistic update with rollback
  const toggleFavorite = useCallback(
    async (entityId: string, type: EntityType, title: string): Promise<boolean> => {
      const existing = favorites.find(
        (f) => f.entity_id === entityId
      );

      if (existing) {
        // Optimistically remove
        const previous = favorites;
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        try {
          await deleteFavorite(existing.id);
          return false;
        } catch {
          // Rollback on failure
          setFavorites(previous);
          return true;
        }
      } else {
        // Optimistically add a temporary item
        const tempId = `temp-${Date.now()}`;
        const tempFavorite: Favorite = {
          id: tempId,
          entity_id: entityId,
          entity_type: type,
          title,
          notes: null,
          created_at: new Date().toISOString(),
        };
        setFavorites((prev) => [...prev, tempFavorite]);
        try {
          const body: CreateFavoriteBody = {
            entity_id: entityId,
            entity_type: type,
            title,
          };
          const response = await addFavorite(body);
          // Replace temp with real id
          setFavorites((prev) =>
            prev.map((f) =>
              f.id === tempId ? { ...f, id: response.favorite_id } : f
            )
          );
          return true;
        } catch {
          // Rollback on failure
          setFavorites((prev) => prev.filter((f) => f.id !== tempId));
          return false;
        }
      }
    },
    [favorites]
  );

  // Remove favorite by its own id (not entity_id)
  const removeFavorite = useCallback(
    async (favoriteId: string) => {
      const previous = favorites;
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      try {
        await deleteFavorite(favoriteId);
      } catch {
        // Rollback
        setFavorites(previous);
        throw new Error('No se pudo eliminar el favorito.');
      }
    },
    [favorites]
  );

  // Refresh from server
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    favorites,
    isLoading,
    error,
    load,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refresh,
  };
}
