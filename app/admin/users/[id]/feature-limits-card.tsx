// app/admin/users/[id]/feature-limits-card.tsx
// Feature Limits UI — ceepii clean style
// Dashboard API: GET/POST/DELETE /v1/dashboard/users/:id/feature-limits

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

export default function FeatureLimitsCard({ userId, roleId }: FeatureLimitsCardProps) {
  const [userLimits, setUserLimits] = useState<FeatureLimit[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<FeatureLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLimitsError, setUserLimitsError] = useState<string | null>(null);
  const [roleDefaultsError, setRoleDefaultsError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<FeatureLimit | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [limitType, setLimitType] = useState<LimitType>('quota');
  const [formData, setFormData] = useState<LimitFormData>({
    feature_key: '',
    limit_value: 1,
    window: 'month',
  });

  const [deletingLimit, setDeletingLimit] = useState<FeatureLimit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setUserLimitsError(null);
    setRoleDefaultsError(null);

    try {
      const results = await Promise.allSettled([
        getUserFeatureLimits(userId),
        getRoleFeatureLimits(roleId),
      ]);

      if (results[0].status === 'fulfilled') {
        setUserLimits(results[0].value.limits ?? []);
      } else {
        const err = results[0].reason;
        setUserLimitsError(
          err instanceof Error ? err.message : 'Error cargando límites del usuario.'
        );
      }

      if (results[1].status === 'fulfilled') {
        setRoleDefaults(results[1].value.limits ?? []);
      } else {
        const err = results[1].reason;
        setRoleDefaultsError(
          err instanceof Error ? err.message : 'Error cargando defaults del rol.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, roleId]);

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
        await setUserFeatureLimit(userId, body);
        setUserLimits((prev) =>
          prev.map((l) =>
            l.feature_key === editingLimit.feature_key && l.window === editingLimit.window
              ? { ...body, limit_value: body.limit_value, window: body.window }
              : l
          )
        );
      } else {
        const created = await setUserFeatureLimit(userId, body);
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
          setModalError('Este límite ya existe para la ventana seleccionada.');
        } else {
          setModalError(error.detail || error.message);
        }
      } else {
        setModalError(error instanceof Error ? error.message : 'Error guardando límite.');
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
        setUserLimits((prev) =>
          prev.filter((l) => l.feature_key !== deletingLimit.feature_key)
        );
        setDeletingLimit(null);
      } else {
        setUserLimitsError(
          error instanceof Error ? error.message : 'Error eliminando límite.'
        );
        setDeletingLimit(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-base font-semibold text-neutral-900 mb-1 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-neutral-400" />
        Límites de Feature
      </h2>
      <p className="text-xs text-neutral-400 mb-6">
        Configura límites de uso para features. Los límites del usuario sobrescriben los defaults del rol.
      </p>

      {/* User Limits */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Límites del Usuario
          </h3>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar límite
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-neutral-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : userLimitsError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{userLimitsError}</p>
          </div>
        ) : userLimits.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">
            No hay límites configurados para este usuario.
          </p>
        ) : (
          <div className="space-y-2">
            {userLimits.map((limit) => (
              <div
                key={`${limit.feature_key}-${limit.window}`}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 font-mono">
                    {limit.feature_key}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {formatLimitValue(limit.limit_value)}
                    <span className="text-neutral-300 mx-1.5">·</span>
                    {formatWindow(limit.window)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(limit)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label={`Editar límite ${limit.feature_key}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingLimit(limit)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Eliminar límite ${limit.feature_key}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Defaults */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Defaults del Rol
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-neutral-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : roleDefaultsError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{roleDefaultsError}</p>
          </div>
        ) : roleDefaults.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">
            El rol no tiene límites por defecto.
          </p>
        ) : (
          <div className="space-y-2">
            {roleDefaults.map((limit) => (
              <div
                key={`${limit.feature_key}-${limit.window}`}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-700 font-mono">
                    {limit.feature_key}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {formatLimitValue(limit.limit_value)}
                    <span className="text-neutral-300 mx-1.5">·</span>
                    {formatWindow(limit.window)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingLimit ? 'Editar límite' : 'Agregar límite'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{modalError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Clave de feature <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.feature_key}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, feature_key: e.target.value }))
                  }
                  list="common-features"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
                  placeholder="Ej: projects, searches, exports"
                  disabled={!!editingLimit}
                />
                <datalist id="common-features">
                  {COMMON_FEATURES.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tipo de límite
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLimitType('unlimited');
                      setFormData((prev) => ({ ...prev, limit_value: null }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-xl text-xs font-medium transition-colors ${
                      limitType === 'unlimited'
                        ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                        : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-xl text-xs font-medium transition-colors ${
                      limitType === 'blocked'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-2 rounded-xl text-xs font-medium transition-colors ${
                      limitType === 'quota'
                        ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                        : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    Cuota
                  </button>
                </div>
              </div>

              {limitType === 'quota' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
                    placeholder="Cantidad máxima"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Ventana
                </label>
                <select
                  value={formData.window}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, window: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
                >
                  <option value="minute">Minuto</option>
                  <option value="hour">Hora</option>
                  <option value="day">Día</option>
                  <option value="month">Mes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-100">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !isFormValid()}
                className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium transition-colors"
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

      {/* Delete confirmation */}
      {deletingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Eliminar límite</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  ¿Eliminar límite &apos;{deletingLimit.feature_key}&apos;?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLimit(null)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
