// app/admin/users/[id]/page.tsx
// Detalle de usuario: bloquear/desbloquear + cambiar rol (por UUID) + permisos

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Key,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Mail,
  Calendar,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import {
  getUserDetail,
  blockUser,
  unblockUser,
  assignRole,
  grantPermission,
  revokePermission,
  listPermissions,
  listRoles, // ← NUEVO: necesitas añadirlo en management.ts
} from '@/app/lib/api';
import type { UserAdminDetail, Permission, PermissionOverride, Role } from '@/app/lib/types/admin';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserAdminDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]); // ← NUEVO
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modales
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false); // ← NUEVO
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(''); // ← ahora guarda UUID
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [permissionReason, setPermissionReason] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, permsData, rolesData] = await Promise.all([
        getUserDetail(userId),
        listPermissions(),
        listRoles(), // ← NUEVO
      ]);
      setUser(userData);
      setAllPermissions(permsData.permissions || []);
      setRoles(rolesData.roles || []);

      // Encontrar el UUID del rol actual para preseleccionar en el modal
      const currentRole = rolesData.roles?.find((r: Role) => r.name === userData.role);
      setSelectedRoleId(currentRole?.id || '');
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ==================== ACCIONES ====================

  const handleBlock = async () => {
    setActionLoading('block');
    try {
      await blockUser(userId, blockDays, blockReason || 'Sin motivo especificado');
      setShowBlockModal(false);
      setBlockReason('');
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Error bloqueando usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async () => {
    setActionLoading('unblock');
    try {
      await unblockUser(userId);
      setShowUnblockModal(false); // ← cierra modal bonito
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Error desbloqueando usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignRole = async () => {
    setActionLoading('role');
    try {
      // ← CORREGIDO: enviamos UUID directamente
      await assignRole(userId, selectedRoleId);
      setShowRoleModal(false);
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Error cambiando rol');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantPermission = async () => {
    setActionLoading('permission');
    try {
      await grantPermission(userId, {
        permission_id: selectedPermission,
        granted: permissionGranted,
        reason: permissionReason || 'Sin motivo',
      });
      setShowPermissionModal(false);
      setPermissionReason('');
      setSelectedPermission('');
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Error concediendo permiso');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!confirm('¿Seguro que quieres revocar este permiso?')) return;
    setActionLoading(`revoke-${permissionId}`);
    try {
      await revokePermission(userId, permissionId);
      await loadUser();
    } catch (error: any) {
      alert(error.message || 'Error revocando permiso');
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
        <Link href="/admin/users" className="text-[#c54141] hover:underline mt-2 inline-block">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  const isBlocked = user.status === 'blocked' || user.status === 'suspended';
  const currentRoleId = roles.find(r => r.name === user.role)?.id || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Usuario</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Info general */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de información */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c54141]" />
              Información General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
              <InfoItem icon={<Shield className="w-4 h-4" />} label="Rol" value={user.role} />
              <InfoItem icon={<UserCheck className="w-4 h-4" />} label="Estado" value={user.status} />
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Registro"
                value={new Date(user.created_at).toLocaleDateString('es-ES')}
              />
              <InfoItem
                icon={<Clock className="w-4 h-4" />}
                label="Último login"
                value={user.last_login_at ? new Date(user.last_login_at).toLocaleString('es-ES') : 'Nunca'}
              />
              <InfoItem
                icon={<Key className="w-4 h-4" />}
                label="Email verificado"
                value={user.email_verified ? 'Sí' : 'No'}
              />
              <InfoItem
                icon={<ShieldAlert className="w-4 h-4" />}
                label="MFA activado"
                value={user.mfa_enabled ? 'Sí' : 'No'}
              />
              <InfoItem
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Intentos fallidos"
                value={String(user.failed_login_attempts)}
              />
            </div>

            {user.block_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Motivo de bloqueo:</p>
                <p className="text-sm text-red-700 mt-1">{user.block_reason}</p>
                {user.blocked_until && (
                  <p className="text-xs text-red-600 mt-1">
                    Hasta: {new Date(user.blocked_until).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Permisos del usuario */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#c54141]" />
                Permisos Override
              </h2>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir permiso
              </button>
            </div>

            {user.permissions && user.permissions.length > 0 ? (
              <div className="space-y-3">
                {user.permissions.map((perm: PermissionOverride) => (
                  <div
                    key={perm.permission_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {perm.resource}:{perm.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            perm.granted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {perm.granted ? 'Concedido' : 'Denegado'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{perm.reason}</p>
                      {perm.expires_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Expira: {new Date(perm.expires_at).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevokePermission(perm.permission_id)}
                      disabled={actionLoading === `revoke-${perm.permission_id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `revoke-${perm.permission_id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Este usuario no tiene permisos override asignados.
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: Acciones */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-3">
              {/* Bloquear / Desbloquear */}
              {isBlocked ? (
                <button
                  onClick={() => setShowUnblockModal(true)} // ← NUEVO: abre modal
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'unblock' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  Desbloquear usuario
                </button>
              ) : (
                <button
                  onClick={() => setShowBlockModal(true)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  Bloquear usuario
                </button>
              )}

              {/* Cambiar rol */}
              <button
                onClick={() => setShowRoleModal(true)}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-[#c54141] hover:text-[#c54141] transition-colors disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                Cambiar rol
              </button>
            </div>
          </div>

          {/* Resumen de estado */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de estado</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-gray-700">{user.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verificado</span>
                <span className={user.email_verified ? 'text-green-600' : 'text-yellow-600'}>
                  {user.email_verified ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bloqueado hasta</span>
                <span className="text-gray-700">
                  {user.blocked_until
                    ? new Date(user.blocked_until).toLocaleDateString('es-ES')
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALES ==================== */}

      {/* Modal Bloquear */}
      {showBlockModal && (
        <Modal onClose={() => setShowBlockModal(false)} title="Bloquear usuario">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (días)
              </label>
              <input
                type="number"
                min={0}
                value={blockDays}
                onChange={(e) => setBlockDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              />
              <p className="text-xs text-gray-500 mt-1">0 = bloqueo permanente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                placeholder="Motivo del bloqueo..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlock}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'block' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Bloquear'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ← NUEVO: Modal Desbloquear */}
      {showUnblockModal && (
        <Modal onClose={() => setShowUnblockModal(false)} title="Confirmar desbloqueo">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres desbloquear a <strong>{user?.email}</strong>? 
              Podrá acceder al sistema de inmediato.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowUnblockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnblock}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'unblock' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Desbloquear'
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
                Rol actual: <span className="font-semibold capitalize">{user.role}</span>
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
                disabled={!!actionLoading || selectedRoleId === currentRoleId}
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

      {/* Modal Añadir Permiso */}
      {showPermissionModal && (
        <Modal onClose={() => setShowPermissionModal(false)} title="Añadir permiso override">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permiso
              </label>
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acceso
              </label>
              <select
                value={String(permissionGranted)}
                onChange={(e) => setPermissionGranted(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              >
                <option value="true">Conceder</option>
                <option value="false">Denegar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input
                type="text"
                value={permissionReason}
                onChange={(e) => setPermissionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                placeholder="Motivo del permiso..."
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
                onClick={handleGrantPermission}
                disabled={!!actionLoading || !selectedPermission}
                className="flex-1 px-4 py-2 bg-[#c54141] text-white rounded-lg hover:bg-[#a93535] disabled:opacity-50"
              >
                {actionLoading === 'permission' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Añadir'
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
        <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
      </div>
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
          >
            <AlertTriangle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}