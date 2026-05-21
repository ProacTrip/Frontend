'use client';

import { useState, useEffect } from 'react';
import { X, Loader, Save } from 'lucide-react';
import type { SavedSearch, CreateSavedSearchBody, UpdateSavedSearchBody } from '@/app/lib/types/saved-search';

// ==========================================
// COMPONENT
// ==========================================

interface SavedSearchFormModalProps {
  initialData?: SavedSearch | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateSavedSearchBody | UpdateSavedSearchBody) => void | Promise<void>;
  onCancel: () => void;
}

export default function SavedSearchFormModal({
  initialData,
  isSubmitting,
  onSubmit,
  onCancel,
}: SavedSearchFormModalProps) {
  const isEditing = !!initialData;

  // --- Form fields ---
  const [name, setName] = useState(initialData?.name || '');
  const [parametersText, setParametersText] = useState(
    initialData ? JSON.stringify(initialData.parameters, null, 2) : '{\n  \n}',
  );
  const [filtersText, setFiltersText] = useState(
    initialData?.filters ? JSON.stringify(initialData.filters, null, 2) : '',
  );
  const [alertEnabled, setAlertEnabled] = useState(
    initialData?.alert_enabled ?? false,
  );

  // --- Validation state ---
  const [paramsError, setParamsError] = useState<string | null>(null);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form if initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setParametersText(JSON.stringify(initialData.parameters, null, 2));
      setFiltersText(initialData.filters ? JSON.stringify(initialData.filters, null, 2) : '');
      setAlertEnabled(initialData.alert_enabled);
    }
  }, [initialData]);

  // ==========================================
  // VALIDATION
  // ==========================================

  function validateJson(value: string, setError: (msg: string | null) => void): boolean {
    if (!value.trim()) {
      setError(null);
      return true; // Optional field
    }
    try {
      JSON.parse(value);
      setError(null);
      return true;
    } catch {
      setError('JSON inválido');
      return false;
    }
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit() {
    setSubmitError(null);

    // Validate JSON fields
    const paramsOk = validateJson(parametersText, setParamsError);
    const filtersOk = validateJson(filtersText, setFiltersError);

    if (!paramsOk || !filtersOk) {
      setSubmitError('Corregí los errores de JSON antes de continuar.');
      return;
    }

    try {
      const parameters = JSON.parse(parametersText);
      const filters = filtersText.trim() ? JSON.parse(filtersText) : undefined;

      await onSubmit({
        name: name.trim() || undefined,
        parameters,
        ...(filters !== undefined ? { filters } : {}),
        ...(isEditing ? {} : { alert_enabled: alertEnabled }),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar la búsqueda.');
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {isEditing ? 'Editar búsqueda' : 'Nueva búsqueda guardada'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditing
                ? 'Modificá los campos que quieras actualizar.'
                : 'Guardá los parámetros de búsqueda para usarlos después.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vuelos a Madrid en agosto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent"
            />
          </div>

          {/* Parameters (JSON textarea) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parámetros <span className="text-red-500">*</span>
            </label>
            <textarea
              value={parametersText}
              onChange={(e) => {
                setParametersText(e.target.value);
                setParamsError(null);
              }}
              onBlur={() => validateJson(parametersText, setParamsError)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent resize-y ${
                paramsError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-[#FF6B6B]'
              }`}
              placeholder='{"origin": "EZE", "destination": "MAD", ...}'
            />
            {paramsError && (
              <p className="text-xs text-red-600 mt-1">{paramsError}</p>
            )}
          </div>

          {/* Filters (JSON textarea, optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtros <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <textarea
              value={filtersText}
              onChange={(e) => {
                setFiltersText(e.target.value);
                setFiltersError(null);
              }}
              onBlur={() => validateJson(filtersText, setFiltersError)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent resize-y ${
                filtersError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-[#FF6B6B]'
              }`}
              placeholder='{"max_price": 500, ...}'
            />
            {filtersError && (
              <p className="text-xs text-red-600 mt-1">{filtersError}</p>
            )}
          </div>

          {/* Alert toggle (only on create) */}
          {!isEditing && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <div>
                <span className="text-sm font-medium text-gray-700">Alerta de precio</span>
                <p className="text-xs text-gray-500">
                  Recibir notificaciones cuando cambien los precios
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${alertEnabled ? 'bg-[#FF6B6B]' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${alertEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B6B] rounded-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Actualizar' : 'Crear búsqueda'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
