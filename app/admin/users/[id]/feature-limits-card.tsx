// app/admin/users/[id]/feature-limits-card.tsx
// Feature Limits UI — editable user limits + read-only role defaults
// Self-contained client component. Props: userId, roleId.

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Infinity,
  Ban,
  Gauge,
} from 'lucide-react';
import {
  getUserFeatureLimits,
  setUserFeatureLimit,
  deleteUserFeatureLimit,
  getRoleFeatureLimits,
  DashboardApiError,
} from '@/app/lib/api/management';
import type { FeatureLimit } from '@/app/lib/types/admin';

// ==================== HELPERS ====================

function formatLimitValue(value: number | null): string {
  if (value === null) return 'Ilimitado';
  if (value === 0) return 'Bloqueado';
  return value.toString();
}

function formatWindow(window: string): string {
  const map: Record<string, string> = {
    minute: 'Minuto',
    hour: 'Hora',
    day: 'Día',
    month: 'Mes',
  };
  return map[window] || window;
}

const COMMON_FEATURES = ['projects', 'searches', 'exports', 'api_calls', 'storage_mb'];

// ==================== TYPES ====================

interface FeatureLimitsCardProps {
  userId: string;
  roleId: string;
}

type LimitType = 'unlimited' | 'blocked' | 'quota';

interface LimitFormData {
  feature_key: string;
  limit_value: number | null;
  window: string;
}

// ==================== COMPONENT ====================

export default function FeatureLimitsCard({ userId, roleId }: FeatureLimitsCardProps) {
  // ---- Data state ----
  const [userLimits, setUserLimits] = useState<FeatureLimit[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<FeatureLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLimitsError, setUserLimitsError] = useState<string | null>(null);
  const [roleDefaultsError, setRoleDefaultsError] = useState<string | null>(null);

  // ---- Modal state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<FeatureLimit | null>(null); // null = create
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [limitType, setLimitType] = useState<LimitType>('quota');
  const [formData, setFormData] = useState<LimitFormData>({
    feature_key: '',
    limit_value: 1,
    window: 'month',
  });

  // ---- Delete confirm ----
  const [deletingLimit, setDeletingLimit] = useState<FeatureLimit | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ==================== DATA FETCHING ====================

  const loadData = async () => {
    setLoading(true);
    setUserLimitsError(null);
    setRoleDefaultsError(null);

    try {
      const results = await Promise.allSettled([
        getUserFeatureLimits(userId),
        getRoleFeatureLimits(roleId),
      ]);

      // User limits
      if (results[0].status === 'fulfilled') {
        setUserLimits(results[0].value.limits ?? []);
      } else {
        const err = results[0].reason;
        if (err instanceof DashboardApiError && err.code === 'MISSING_PERMISSION') {
          setUserLimitsError('Sin permisos para ver limites de features.');
        } else {
          setUserLimitsError(
            err instanceof Error ? err.message : 'Error cargando limites del usuario.'
          );
        }
      }

      // Role defaults
      if (results[1].status === 'fulfilled') {
        setRoleDefaults(results[1].value.limits ?? []);
      } else {
        const err = results[1].reason;
        if (err instanceof DashboardApiError && err.code === 'MISSING_PERMISSION') {
          setRoleDefaultsError('Sin permisos para ver defaults del rol.');
        } else {
          setRoleDefaultsError(
            err instanceof Error ? err.message : 'Error cargando defaults del rol.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, roleId]);

  // ==================== MODAL HELPERS ====================

  function openCreateModal() {
    setEditingLimit(null);
    setLimitType('quota');
    setFormData({ feature_key: '', limit_value: 1, window: 'month' });
    setModalError(null);
    setModalOpen(true);
  }

  function openEditModal(limit: FeatureLimit) {
    setEditingLimit(limit);
    setFormData({
      feature_key: limit.feature_key,
      limit_value: limit.limit_value,
      window: limit.window,
    });
    if (limit.limit_value === null) {
      setLimitType('unlimited');
    } else if (limit.limit_value === 0) {
      setLimitType('blocked');
    } else {
      setLimitType('quota');
    }
    setModalError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingLimit(null);
    setModalError(null);
  }

  function isFormValid(): boolean {
    if (!formData.feature_key.trim()) return false;
    if (limitType === 'quota') {
      if (formData.limit_value === null || formData.limit_value <= 0 || !Number.isInteger(formData.limit_value)) {
        return false;
      }
    }
    return true;
  }

  // ==================== ACTIONS ====================

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setModalError('Completa todos los campos requeridos.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const body = {
        feature_key: formData.feature_key.trim(),
        limit_value: limitType === 'unlimited' ? null : limitType === 'blocked' ? 0 : formData.limit_value,
        window: formData.window,
      };

      if (editingLimit) {
        // Update via set (POST upserts)
        await setUserFeatureLimit(userId, body);
        // Refresh list
        setUserLimits((prev) =>
          prev.map((l) =>
            l.feature_key === editingLimit.feature_key && l.window === editingLimit.window
              ? { ...body, limit_value: body.limit_value, window: body.window }
              : l
          )
        );
      } else {
        const created = await setUserFeatureLimit(userId, body);
        // Ensure the created response matches FeatureLimit shape
        const newLimit: FeatureLimit = {
          feature_key: created.feature_key,
          limit_value: created.limit_value,
          window: created.window,
        };
        setUserLimits((prev) => [...prev, newLimit]);
      }

      closeModal();
    } catch (error: unknown) {
      if (error instanceof DashboardApiError) {
        if (error.code === 'FEATURE_LIMIT_ALREADY_EXISTS') {
          setModalError('Este limite ya existe para la ventana seleccionada.');
        } else if (error.code === 'MISSING_PERMISSION') {
          setModalError('Sin permisos para modificar limites de features.');
        } else {
          setModalError(error.detail || error.message);
        }
      } else {
        setModalError(error instanceof Error ? error.message : 'Error guardando limite.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLimit) return;

    setDeleting(true);
    try {
      await deleteUserFeatureLimit(userId, deletingLimit.feature_key);
      setUserLimits((prev) =>
        prev.filter((l) => l.feature_key !== deletingLimit.feature_key)
      );
      setDeletingLimit(null);
    } catch (error: unknown) {
      if (error instanceof DashboardApiError && error.code === 'FEATURE_LIMIT_NOT_FOUND') {
        // Stale state cleanup — remove from list anyway
        setUserLimits((prev) =>
          prev.filter((l) => l.feature_key !== deletingLimit.feature_key)
        );
        setDeletingLimit(null);
      } else {
        // For other errors, close confirm and show error in section
        setUserLimitsError(
          error instanceof Error ? error.message : 'Error eliminando limite.'
        );
        setDeletingLimit(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-[#c54141]" />
        Limites de Feature
      </h2>
      <p className="text-xs text-gray-500 mb-6">
        Configura limites de uso para features como projects, searches, exports, etc.
        Los limites del usuario sobrescriben los defaults del rol.
      </p>

      {/* ========== SECTION 1: User Limits ========== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Limites del Usuario
          </h3>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c54141] text-white rounded-lg text-xs font-medium hover:bg-[#a93535] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar limite
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : userLimitsError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{userLimitsError}</p>
          </div>
        ) : userLimits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No hay limites configurados para este usuario.
          </p>
        ) : (
          <div className="space-y-2">
            {userLimits.map((limit) => (
              <div
                key={`${limit.feature_key}-${limit.window}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {limit.feature_key}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {formatLimitValue(limit.limit_value)}
                    <span className="text-gray-400 mx-1.5">·</span>
                    {formatWindow(limit.window)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(limit)}
                    className="p-1.5 text-gray-400 hover:text-[#c54141] hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Editar limite ${limit.feature_key}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingLimit(limit)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Eliminar limite ${limit.feature_key}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== SECTION 2: Role Defaults ========== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Defaults del Rol
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : roleDefaultsError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{roleDefaultsError}</p>
          </div>
        ) : roleDefaults.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            El rol no tiene limites por defecto.
          </p>
        ) : (
          <div className="space-y-2">
            {roleDefaults.map((limit) => (
              <div
                key={`${limit.feature_key}-${limit.window}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 font-mono">
                    {limit.feature_key}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatLimitValue(limit.limit_value)}
                    <span className="text-gray-400 mx-1.5">·</span>
                    {formatWindow(limit.window)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingLimit ? 'Editar limite' : 'Agregar limite'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal error */}
            {modalError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{modalError}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Feature Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de feature <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.feature_key}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, feature_key: e.target.value }))
                  }
                  list="common-features"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141] text-sm"
                  placeholder="Ej: projects, searches, exports"
                  disabled={!!editingLimit}
                />
                <datalist id="common-features">
                  {COMMON_FEATURES.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              {/* Limit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de limite
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType('unlimited');
                      setFormData((prev) => ({ ...prev, limit_value: null }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-lg text-xs font-medium transition-colors ${
                      limitType === 'unlimited'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Infinity className="w-3.5 h-3.5" />
                    Ilimitado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType('blocked');
                      setFormData((prev) => ({ ...prev, limit_value: 0 }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-lg text-xs font-medium transition-colors ${
                      limitType === 'blocked'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Bloqueado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType('quota');
                      setFormData((prev) => ({
                        ...prev,
                        limit_value: prev.limit_value ?? 1,
                      }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-lg text-xs font-medium transition-colors ${
                      limitType === 'quota'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    Cuota
                  </button>
                </div>
              </div>

              {/* Value (only for quota) */}
              {limitType === 'quota' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.limit_value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                      setFormData((prev) => ({ ...prev, limit_value: isNaN(val) ? 1 : val }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141] text-sm"
                    placeholder="Cantidad maxima"
                  />
                </div>
              )}

              {/* Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ventana
                </label>
                <select
                  value={formData.window}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, window: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141] text-sm"
                >
                  <option value="minute">Minuto</option>
                  <option value="hour">Hora</option>
                  <option value="day">Dia</option>
                  <option value="month">Mes</option>
                </select>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !isFormValid()}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : editingLimit ? (
                  'Guardar cambios'
                ) : (
                  'Agregar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION ==================== */}
      {deletingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar limite</h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Eliminar limite &apos;{deletingLimit.feature_key}&apos;?
                  Esta accion no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLimit(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
