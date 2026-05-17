'use client';

import { useState, useCallback } from 'react';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { UserApiError } from '@/app/lib/api/user';
import SavedSearchCard from './components/SavedSearchCard';
import SavedSearchFormModal from './components/SavedSearchFormModal';
import SavedSearchDeleteDialog from './components/SavedSearchDeleteDialog';
import type { SavedSearch, CreateSavedSearchBody, UpdateSavedSearchBody } from '@/app/lib/types/saved-search';

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function BusquedasPage() {
  const { searches, isLoading, error, load, create, update, remove, toggleAlert } =
    useSavedSearches();

  // --- Form modal state ---
  const [showForm, setShowForm] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Delete dialog state ---
  const [searchToDelete, setSearchToDelete] = useState<SavedSearch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // --- Alert toggle tracking (per-card loading) ---
  const [togglingAlertId, setTogglingAlertId] = useState<string | null>(null);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleOpenCreate = useCallback(() => {
    setEditingSearch(null);
    setShowForm(true);
  }, []);

  const handleOpenEdit = useCallback((search: SavedSearch) => {
    setEditingSearch(search);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingSearch(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CreateSavedSearchBody | UpdateSavedSearchBody) => {
      setIsSubmitting(true);
      try {
        if (editingSearch) {
          await update(editingSearch.id, data as UpdateSavedSearchBody);
        } else {
          const result = await create(data as CreateSavedSearchBody);
          if ('conflict' in result && result.conflict) {
            throw new Error('Ya existe una búsqueda con estos parámetros.');
          }
        }
        setShowForm(false);
        setEditingSearch(null);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Error al guardar la búsqueda.';
        throw new Error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingSearch, create, update],
  );

  const handleDelete = useCallback(async () => {
    if (!searchToDelete) return;
    setIsDeleting(true);
    try {
      await remove(searchToDelete.id);
      setSearchToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof UserApiError ? err.message : 'Error al eliminar la búsqueda.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [searchToDelete, remove]);

  const handleToggleAlert = useCallback(
    async (id: string, enabled: boolean) => {
      setTogglingAlertId(id);
      try {
        await toggleAlert(id, enabled);
      } catch {
        // Error message handled by hook (reverts state)
      } finally {
        setTogglingAlertId(null);
      }
    },
    [toggleAlert],
  );

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (isLoading && searches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-[#FF6B6B]" />
          Búsquedas Guardadas
        </h1>
        <p className="text-gray-500 mb-8">Cargando tus búsquedas guardadas...</p>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE (no searches loaded)
  // ==========================================
  if (error && searches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-[#FF6B6B]" />
          Búsquedas Guardadas
        </h1>

        <div className="mt-12 flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-1">
              Error al cargar las búsquedas guardadas
            </p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (!isLoading && searches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-[#FF6B6B]" />
          Búsquedas Guardadas
        </h1>

        <div className="mt-12 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No tenés búsquedas guardadas
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Guardá una búsqueda para recibir alertas de precio.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors font-medium"
            >
              Crear búsqueda
            </button>
          </div>
        </div>

        {/* Form modal (for creation from empty state) */}
        {showForm && (
          <SavedSearchFormModal
            initialData={null}
            isSubmitting={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN CONTENT
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-3">
            <Search className="w-8 h-8 text-[#FF6B6B]" />
            Búsquedas Guardadas
          </h1>
          <p className="text-gray-500">
            {searches.length} búsqueda{searches.length !== 1 ? 's' : ''} guardada
            {searches.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors font-medium flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Nueva búsqueda
        </button>
      </div>

      {/* Error banner (non-fatal — searches are shown behind it) */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-800 text-sm">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => load()}
            className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Search Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searches.map((search) => (
          <SavedSearchCard
            key={search.id}
            search={search}
            isTogglingAlert={togglingAlertId === search.id}
            onEdit={handleOpenEdit}
            onDelete={(s) => setSearchToDelete(s)}
            onToggleAlert={handleToggleAlert}
          />
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <SavedSearchFormModal
          initialData={editingSearch}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {searchToDelete && (
        <>
          {deleteError && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center pb-20 pointer-events-none">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3 pointer-events-auto shadow-lg mx-4 max-w-md">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{deleteError}</p>
                <button
                  onClick={() => setDeleteError(null)}
                  className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
          <SavedSearchDeleteDialog
            searchName={searchToDelete.name || 'Búsqueda sin nombre'}
            isDeleting={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => {
              setSearchToDelete(null);
              setDeleteError(null);
            }}
          />
        </>
      )}
    </div>
  );
}
