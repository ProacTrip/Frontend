'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Favorite, EntityType, CreateFavoriteBody } from '@/app/lib/types/user';

const STORAGE_KEY = 'proactrip_favorites';

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Favorite[];
  } catch {
    return [];
  }
}

function persistFavorites(favs: Favorite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useFavorites(entityType?: EntityType) {
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFavorites());

  // Filter by entity type if requested
  const filtered = entityType
    ? favorites.filter((f) => f.entity_type === entityType)
    : favorites;

  const isFavorite = useCallback(
    (entityId: string): boolean =>
      favorites.some((f) => f.entity_id === entityId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (body: CreateFavoriteBody): Promise<boolean> => {
      const exists = favorites.some((f) => f.entity_id === body.entity_id);

      if (exists) {
        // Remove from local state
        const updated = favorites.filter((f) => f.entity_id !== body.entity_id);
        setFavorites(updated);
        persistFavorites(updated);
        return false; // false = now unfavorited
      } else {
        // Add to local state
        const newFav: Favorite = {
          id: `local-${body.entity_id}-${Date.now()}`,
          entity_id: body.entity_id,
          entity_type: body.entity_type,
          title: body.title,
          notes: body.notes ?? null,
          created_at: new Date().toISOString(),
        };
        const updated = [...favorites, newFav];
        setFavorites(updated);
        persistFavorites(updated);
        return true; // true = now favorited
      }
    },
    [favorites],
  );

  const removeFavorite = useCallback(
    async (favoriteId: string): Promise<void> => {
      const updated = favorites.filter((f) => f.id !== favoriteId);
      setFavorites(updated);
      persistFavorites(updated);
    },
    [favorites],
  );

  // Keep localStorage in sync if another tab modifies it
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavorites(loadFavorites());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    favorites: filtered,
    isLoading: false,
    isToggling: false,
    error: null as string | null,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refresh: () => {
      setFavorites(loadFavorites());
    },
  };
}
