// app/admin/users/[id]/page.tsx
// Detalle de usuario: enable/disable (status toggle) + cambiar rol + permission overrides

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  Key,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Mail,
  Calendar,
  ShieldAlert,
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import {
  getUserDetail,
  updateAccountStatus,
  assignRole,
  createPermissionOverride,
  deletePermissionOverride,
  getPermissionOverrides,
  listPermissions,
  listRoles,
} from '@/app/lib/api';
import { DashboardApiError } from '@/app/lib/api/management';
import type {
  UserAdminDetail,
  Permission,
  PermissionOverride,
  Role,
} from '@/app/lib/types/admin';
import FeatureLimitsCard from './feature-limits-card';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === userId;

  const [user, setUser] = useState<UserAdminDetail | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'disabled' | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [permissionReason, setPermissionReason] = useState('');
  const [permissionExpiresAt, setPermissionExpiresAt] = useState('');

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Usamos allSettled para que listRoles/listPermissions no bloqueen
      // la página si sus endpoints no existen aún en el backend.
      const results = await Promise.allSettled([
        getUserDetail(userId),
        getPermissionOverrides(userId),
        listPermissions(),
        listRoles(),
      ]);

      // getUserDetail — CRÍTICO: si falla, mostramos error
      const detailResult = results[0];
      if (detailResult.status === 'rejected') {
        const err = detailResult.reason;
        if (err instanceof DashboardApiError) {
          setError(err.detail);
        } else if (err instanceof Error) {
          setError(err.message || 'Error al cargar el usuario');
        } else {
          setError('Error desconocido al cargar el usuario');
        }
        return;
      }
      const detailRes = detailResult.value;
      setUser(detailRes.user);
      setEffectivePermissions(detailRes.effective_permissions ?? []);

      // getPermissionOverrides — no crítico
      const overridesResult = results[1];
      if (overridesResult.status === 'fulfilled') {
        setOverrides(overridesResult.value.overrides ?? []);
      }

      // listPermissions — no crítico, usar hardcoded fallback si falla
      const permsResult = results[2];
      if (permsResult.status === 'fulfilled') {
        setAllPermissions(permsResult.value.permissions ?? []);
      }

      // listRoles — no crítico, usar hardcoded fallback si falla
      const rolesResult = results[3];
      if (rolesResult.status === 'fulfilled') {
        setRoles(rolesResult.value.roles ?? []);
      } else {
        // Fallback: roles conocidos del sistema
        setRoles([
          { id: 'admin', name: 'admin', description: 'Administrador' },
          { id: 'staff', name: 'staff', description: 'Staff' },
          { id: 'client', name: 'client', description: 'Cliente' },
        ] as Role[]);
      }

      // Seleccionar rol actual (del fallback o de la API)
      const currentRoles = rolesResult.status === 'fulfilled'
        ? rolesResult.value.roles ?? []
        : [{ id: 'admin', name: 'admin' }, { id: 'staff', name: 'staff' }, { id: 'client', name: 'client' }] as Role[];
      const currentRole = currentRoles.find((r: Role) => r.name === detailRes.user.role_name);
      setSelectedRoleId(currentRole?.id ?? '');
    } catch (err) {
      // Error inesperado en Promise.allSettled (no debería ocurrir, pero por si acaso)
      if (err instanceof DashboardApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message || 'Error al cargar el usuario');
      } else {
        setError('Error desconocido al cargar el usuario');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ==================== ACCIONES ====================

  const handleStatusChange = async () => {
    if (!pendingStatus) return;
    setActionLoading('status');
    try {
      await updateAccountStatus(userId, pendingStatus);
      setShowStatusModal(false);
      setPendingStatus(null);
      await loadUser();
    } catch (error: unknown) {
      setError(
        error instanceof DashboardApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : 'Error actualizando estado'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openStatusModal = (targetStatus: 'active' | 'disabled') => {
    setPendingStatus(targetStatus);
    setShowStatusModal(true);
  };

  const handleAssignRole = async () => {
    setActionLoading('role');
    try {
      await assignRole(userId, selectedRoleId);
      setShowRoleModal(false);
      await loadUser();
    } catch (error: unknown) {
      setError(
        error instanceof DashboardApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : 'Error cambiando rol'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateOverride = async () => {
    if (!selectedPermissionId || !permissionReason.trim()) return;
    setActionLoading('permission');
    try {
      const body: { permission_id: string; granted: boolean; reason: string; expires_at?: string } = {
        permission_id: selectedPermissionId,
        granted: permissionGranted,
        reason: permissionReason.trim(),
      };
      if (permissionExpiresAt) body.expires_at = new Date(permissionExpiresAt).toISOString();

      await createPermissionOverride(userId, body);
      setShowPermissionModal(false);
      setPermissionReason('');
      setSelectedPermissionId('');
      setPermissionExpiresAt('');
      await loadUser();
    } catch (error: unknown) {
      setError(
        error instanceof DashboardApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : 'Error creando override'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este override?')) return;
    setActionLoading(`delete-${overrideId}`);
    try {
      await deletePermissionOverride(userId, overrideId);
      await loadUser();
    } catch (error: unknown) {
      setError(
        error instanceof DashboardApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : 'Error eliminando override'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#c54141]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Usuario no encontrado</h2>
        {error && (
          <p className="text-sm text-red-500 mt-2 max-w-md mx-auto">{error}</p>
        )}
        <Link href="/admin/users" className="text-[#c54141] hover:underline mt-4 inline-block">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  const isDisabled = user.status === 'disabled';
  const currentRoleId = roles.find((r) => r.name === user.role_name)?.id ?? '';

  // Filter active overrides for display (expired ones are shown with an indicator)
  const now = new Date();
  const activeOverrides = overrides.filter(
    (o) => !o.expires_at || new Date(o.expires_at) > now
  );
  const expiredOverrides = overrides.filter(
    (o) => o.expires_at && new Date(o.expires_at) <= now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Volver a usuarios"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Usuario</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Inline error display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar error"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info general + permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informacion general */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c54141]" />
              Informacion General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
              <InfoItem icon={<Shield className="w-4 h-4" />} label="Rol" value={user.role_name} />
              <InfoItem icon={<UserCheck className="w-4 h-4" />} label="Estado" value={user.status} />
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Registro"
                value={new Date(user.created_at).toLocaleDateString('es-ES')}
              />
              <InfoItem
                icon={<Clock className="w-4 h-4" />}
                label="Ultimo login"
                value={
                  user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString('es-ES')
                    : 'Nunca'
                }
              />
              <InfoItem
                icon={<Activity className="w-4 h-4" />}
                label="Total logins"
                value={String(user.login_count)}
              />
              <InfoItem
                icon={<Key className="w-4 h-4" />}
                label="Email verificado"
                value={user.email_verified ? 'Si' : 'No'}
              />
              <InfoItem
                icon={<ShieldAlert className="w-4 h-4" />}
                label="MFA activado"
                value={user.mfa_enabled ? 'Si' : 'No'}
              />
            </div>
          </div>

          {/* Permisos efectivos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#c54141]" />
              Permisos Efectivos
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Calculados como: (permisos del rol &cup; grants activos) &minus; denies activos
            </p>
            {effectivePermissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {effectivePermissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-mono"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">
                Este usuario no tiene permisos efectivos.
              </p>
            )}
          </div>

          {/* Feature Limits */}
          {user && (
            <FeatureLimitsCard userId={userId} roleId={user.role_id} />
          )}

          {/* Permission Overrides */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#c54141]" />
                Permission Overrides
              </h2>
              {/* Nuevo override — requiere GET /v1/management/permissions (no implementado en backend) */}
              {allPermissions.length > 0 && (
                <button
                  onClick={() => setShowPermissionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo override
                </button>
              )}
              {allPermissions.length === 0 && (
                <p className="text-xs text-gray-400">Gestión de overrides no disponible — catálogo de permisos no cargado</p>
              )}
            </div>

            {activeOverrides.length > 0 ? (
              <div className="space-y-3">
                {activeOverrides.map((o) => (
                  <OverrideRow
                    key={o.id}
                    override={o}
                    onDelete={() => handleDeleteOverride(o.id)}
                    deleteLoading={actionLoading === `delete-${o.id}`}
                    expired={false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Este usuario no tiene overrides activos.
              </p>
            )}

            {expiredOverrides.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Expirados</p>
                <div className="space-y-2">
                  {expiredOverrides.map((o) => (
                    <OverrideRow
                      key={o.id}
                      override={o}
                      onDelete={() => handleDeleteOverride(o.id)}
                      deleteLoading={actionLoading === `delete-${o.id}`}
                      expired
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions + Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-3">
              {/* Enable / Disable — oculto para el propio perfil (CANNOT_DISABLE_SELF) */}
              {isSelf ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  No puedes modificar el estado de tu propia cuenta
                </p>
              ) : isDisabled ? (
                <button
                  onClick={() => openStatusModal('active')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Habilitar cuenta
                </button>
              ) : (
                <button
                  onClick={() => openStatusModal('disabled')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Deshabilitar cuenta
                </button>
              )}

              {/* Cambiar rol — endpoint /v1/management/users/:id/role no implementado en backend aún */}
              {/* <button
                onClick={() => setShowRoleModal(true)}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-[#c54141] hover:text-[#c54141] transition-colors disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                Cambiar rol
              </button> */}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-gray-700 text-xs">{user.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className={
                  user.status === 'active'
                    ? 'text-green-600 capitalize'
                    : 'text-red-600 capitalize'
                }>
                  {user.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verificado</span>
                <span className={user.email_verified ? 'text-green-600' : 'text-yellow-600'}>
                  {user.email_verified ? 'Si' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Overrides activos</span>
                <span className="text-gray-700">{activeOverrides.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}

      {/* Modal Cambiar Estado */}
      {showStatusModal && pendingStatus && (
        <Modal
          onClose={() => { setShowStatusModal(false); setPendingStatus(null); }}
          title={pendingStatus === 'disabled' ? 'Deshabilitar cuenta' : 'Habilitar cuenta'}
        >
          <div className="space-y-4">
            {pendingStatus === 'disabled' ? (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Efectos de deshabilitar:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-red-600">
                    <li>Se incrementa el token_version del usuario</li>
                    <li>Todas las sesiones activas quedan invalidadas</li>
                    <li>El usuario recibira 401 en su proximo request</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                La cuenta de <strong>{user?.email}</strong> sera habilitada. El usuario
                podra acceder con sus tokens existentes sin necesidad de re-autenticarse.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading === 'status'}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  pendingStatus === 'disabled'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading === 'status' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : pendingStatus === 'disabled' ? (
                  'Deshabilitar'
                ) : (
                  'Habilitar'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cambiar Rol */}
      {showRoleModal && (
        <Modal onClose={() => setShowRoleModal(false)} title="Cambiar rol">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol actual: <span className="font-semibold capitalize">{user.role_name}</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.description || r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignRole}
                disabled={actionLoading === 'role' || selectedRoleId === currentRoleId}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50"
              >
                {actionLoading === 'role' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nuevo Override */}
      {showPermissionModal && (
        <Modal onClose={() => setShowPermissionModal(false)} title="Nuevo permission override">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permiso (permission_id)
              </label>
              <select
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              >
                <option value="">Selecciona un permiso...</option>
                {allPermissions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.resource}:{p.action} — {p.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPermissionGranted(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                    permissionGranted
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Grant
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionGranted(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                    !permissionGranted
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo <span className="text-gray-400">(1–500 caracteres)</span>
              </label>
              <textarea
                value={permissionReason}
                onChange={(e) => setPermissionReason(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141] text-sm"
                placeholder="Motivo del override..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expira el <span className="text-gray-400">(opcional)</span>
              </label>
              {!permissionGranted && (
                <p className="text-xs text-amber-600 mb-1">
                  Para denies, la expiracion no puede exceder 365 dias.
                </p>
              )}
              <input
                type="datetime-local"
                value={permissionExpiresAt}
                onChange={(e) => setPermissionExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141] text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOverride}
                disabled={actionLoading === 'permission' || !selectedPermissionId || !permissionReason.trim()}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50"
              >
                {actionLoading === 'permission' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Crear override'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function OverrideRow({
  override,
  onDelete,
  deleteLoading,
  expired,
}: {
  override: PermissionOverride;
  onDelete: () => void;
  deleteLoading: boolean;
  expired: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        expired
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-medium text-gray-900">{override.permission}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              override.granted
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {override.granted ? 'Grant' : 'Deny'}
          </span>
          {expired && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
              Expirado
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1 truncate">{override.reason}</p>
        {override.expires_at && (
          <p className="text-xs text-gray-400 mt-0.5">
            Expira: {new Date(override.expires_at).toLocaleDateString('es-ES')}
          </p>
        )}
      </div>
      <button
        onClick={onDelete}
        disabled={deleteLoading}
        className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
        aria-label="Eliminar override"
      >
        {deleteLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
