'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  Loader2,
  AlertCircle,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';
import {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  toggleAlert,
} from '@/app/lib/api';
import type { SavedSearch } from '@/app/lib/types/user';

export function SavedSearchesForm() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listSavedSearches();
      setSearches(res.searches);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleAlert = async (searchId: string, currentEnabled: boolean) => {
    setTogglingId(searchId);
    // Optimistic update
    setSearches((prev) =>
      prev.map((s) =>
        s.id === searchId ? { ...s, alert_enabled: !currentEnabled } : s
      )
    );
    try {
      await toggleAlert(searchId, !currentEnabled);
    } catch (e: any) {
      // Revert on error
      setSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, alert_enabled: currentEnabled } : s
        )
      );
      setError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!window.confirm('¿Eliminar esta búsqueda guardada?')) return;
    setDeletingId(searchId);
    try {
      await deleteSavedSearch(searchId);
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditName(search.name);
  };

  const handleSaveEdit = async (searchId: string) => {
    if (!editName.trim()) return;
    try {
      await updateSavedSearch(searchId, { name: editName.trim() });
      setSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, name: editName.trim() } : s
        )
      );
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await createSavedSearch({
        name: newName.trim(),
        parameters: {},
      });
      const newSearch: SavedSearch = {
        id: res.search_id,
        name: newName.trim(),
        parameters: {},
        filters: null,
        alert_enabled: false,
        last_executed_at: null,
        result_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSearches((prev) => [newSearch, ...prev]);
      setNewName('');
      setIsCreating(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-paper-dim rounded-xl p-5 h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-5 h-5 text-coral" />
        <h2 className="text-xl font-bold text-ink">Búsquedas guardadas</h2>
      </div>

      {error && (
        <div className="bg-error-container text-error p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Create new */}
      {isCreating ? (
        <div className="bg-paper-dim rounded-xl border border-paper-outline p-4 flex items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la búsqueda"
            className="flex-1 p-2 border border-paper-outline rounded-lg bg-white text-ink text-sm focus:ring-2 focus:ring-coral focus:border-transparent outline-none"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-2 bg-coral text-white rounded-lg text-sm font-medium hover:bg-coral-hover disabled:opacity-50 transition-colors"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewName('');
            }}
            className="px-3 py-2 text-ink-muted hover:text-ink text-sm"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coral text-white rounded-lg font-medium hover:bg-coral-hover transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva búsqueda guardada
        </button>
      )}

      {/* Search list */}
      {searches.length === 0 ? (
        <div className="text-center py-10">
          <Search className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-ink-muted text-sm">
            No tenés búsquedas guardadas. Guardá una desde Hoteles o Vuelos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-paper-dim rounded-xl border border-paper-outline p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {editingId === search.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 p-1.5 border border-paper-outline rounded-lg bg-white text-ink text-sm focus:ring-2 focus:ring-coral focus:border-transparent outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(search.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-coral text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-paper-container text-ink-muted"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-ink text-sm">
                        {search.name || 'Búsqueda sin nombre'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-faint">
                        <span>
                          Última ejecución: {formatDate(search.last_executed_at)}
                        </span>
                        {search.result_count > 0 && (
                          <span>{search.result_count} resultados</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Alert toggle */}
                  <button
                    onClick={() =>
                      handleToggleAlert(search.id, search.alert_enabled)
                    }
                    disabled={togglingId === search.id}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      search.alert_enabled
                        ? 'bg-mustard-container text-mustard hover:bg-mustard/20'
                        : 'hover:bg-paper-container text-ink-faint'
                    }`}
                    title={
                      search.alert_enabled
                        ? 'Alertas activadas'
                        : 'Alertas desactivadas'
                    }
                  >
                    {togglingId === search.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : search.alert_enabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Edit name */}
                  {editingId !== search.id && (
                    <button
                      onClick={() => handleStartEdit(search)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-container text-ink-muted hover:text-ink transition-colors"
                      title="Renombrar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(search.id)}
                    disabled={deletingId === search.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container text-ink-muted hover:text-error transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === search.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Alert enabled badge */}
              {search.alert_enabled && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium bg-mustard-container text-mustard">
                    <Bell className="w-3 h-3" />
                    Alerta de precio activa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
