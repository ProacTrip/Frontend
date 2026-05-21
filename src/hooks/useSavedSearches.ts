'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CreateSavedSearchResponse,
  UpdateSavedSearchResponse,
} from '@/app/lib/types/saved-search';

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // LOAD
  // ==========================================

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listSavedSearches();
      setSearches(data.searches);
    } catch (err: unknown) {
      if (err instanceof UserApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar las búsquedas guardadas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================
  // CREATE
  // ==========================================

  const create = useCallback(
    async (body: CreateSavedSearchBody): Promise<CreateSavedSearchResponse | { conflict: true }> => {
      try {
        const result = await createSavedSearch(body);

        // Conflict — search already exists
        if ('conflict' in result) {
          return result;
        }

        // Success — re-fetch full list (API returns {search_id, message}, not full entity)
        await load();
        return result;
      } catch (err) {
        throw err;
      }
    },
    [load],
  );

  // ==========================================
  // UPDATE
  // ==========================================

  const update = useCallback(
    async (id: string, body: UpdateSavedSearchBody): Promise<UpdateSavedSearchResponse> => {
      try {
        const result = await updateSavedSearch(id, body);

        // Re-fetch full list (API returns {message}, not full entity)
        await load();

        return result;
      } catch (err) {
        throw err;
      }
    },
    [load],
  );

  // ==========================================
  // REMOVE
  // ==========================================

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteSavedSearch(id);

      // Optimistic: remove from list
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  // ==========================================
  // TOGGLE ALERT
  // ==========================================

  const toggleAlert = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      // Snapshot current state for rollback
      const previous = searches.find((s) => s.id === id);
      if (!previous) return;

      // Optimistic update
      setSearches((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, alert_enabled: enabled } : s,
        ),
      );

      try {
        await togglePriceAlert(id, enabled);
        // Success — backend confirmed, no action needed
      } catch {
        // Revert on failure
        setSearches((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, alert_enabled: previous.alert_enabled } : s,
          ),
        );
        throw new Error('No se pudo cambiar el estado de la alerta.');
      }
    },
    [searches],
  );

  return {
    searches,
    isLoading,
    error,
    load,
    create,
    update,
    remove,
    toggleAlert,
  };
}
