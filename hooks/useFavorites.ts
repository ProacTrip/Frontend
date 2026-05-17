'use client';

import { useState, useEffect, useCallback } from 'react';
import { listFavorites, addFavorite, deleteFavorite } from '@/app/lib/api'; // ← Usando el barrel export
import { Favorite, EntityType, CreateFavoriteBody, AddFavoriteResponse } from '@/app/lib/types/user';

export function useFavorites(entityType?: EntityType) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false); // ← Estado separado para el spinner del corazón
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listFavorites(entityType);
      setFavorites(data.favorites);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const isFavorite = useCallback(
    (entityId: string) => favorites.some((f) => f.entity_id === entityId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (body: CreateFavoriteBody) => {
      // ← Prevenir doble click
      if (isToggling) return;

      const existing = favorites.find((f) => f.entity_id === body.entity_id);
      setIsToggling(true);

      try {
        if (existing) {
          // ELIMINAR
          await deleteFavorite(existing.id);
          setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
          return false;
        } else {
          // AGREGAR
          const res = await addFavorite(body);

          // El favorito ya existía — estado local desincronizado
          if ('conflict' in res && res.conflict) {
            await load(); // Sincronizar con el backend
            return true;
          }

          // Construir localmente para evitar el GET extra (await load())
          const addRes = res as AddFavoriteResponse;
          const newFavorite: Favorite = {
            id: addRes.favorite_id,
            entity_id: body.entity_id,
            entity_type: body.entity_type,
            title: body.title,
            notes: body.notes ?? null,
            created_at: new Date().toISOString(),
          };
          setFavorites((prev) => [...prev, newFavorite]);
          return true;
        }
      } catch (err: any) {
        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    [favorites, isToggling, load]
  );

  // ← NUEVO: Eliminar directamente por ID (para página de favoritos)
  const removeFavorite = useCallback(
    async (favoriteId: string) => {
      try {
        await deleteFavorite(favoriteId);
        setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      } catch (err) {
        console.error('Error al eliminar favorito:', err);
        throw err;
      }
    },
    []
  );

  return { 
    favorites, 
    isLoading, 
    isToggling, 
    error, 
    isFavorite, 
    toggleFavorite, 
    removeFavorite, 
    refresh: load 
  };
}