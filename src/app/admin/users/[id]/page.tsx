// app/admin/users/[id]/page.tsx
// Detalle de usuario: enable/disable + feature limits (alcance DASHBOARD_API.md)
// Dashboard API: GET /v1/dashboard/users/:id, PUT /v1/dashboard/users/:id/status
// Alcance real: solo account status + feature limits. Sin roles, sin overrides.

'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  Mail,
  Calendar,
  ShieldAlert,
  Loader2,
  Activity,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  getUserDetail,
  updateAccountStatus,
} from '@/app/lib/api';
import { DashboardApiError } from '@/app/lib/api/management';
import type { UserAdminDetail } from '@/app/lib/types/admin';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ADMIN_STALE_TIME } from '@/app/lib/queries/staleTimes';
import FeatureLimitsCard from './feature-limits-card';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === userId;
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'disabled' | null>(null);

  // ---- useQuery for user detail ----
  const {
    data: detailRes,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.admin.userById(userId),
    queryFn: () => getUserDetail(userId),
    enabled: !!userId,
    staleTime: ADMIN_STALE_TIME,
  });

  const user = detailRes?.user ?? null;
  const effectivePermissions = detailRes?.effective_permissions ?? [];

  // ---- useMutation for status change ----
  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'disabled') =>
      updateAccountStatus(userId, status),
    onSuccess: () => {
      setShowStatusModal(false);
      setPendingStatus(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userById(userId) });
    },
    onError: (err: unknown) => {
      setError(
        err instanceof DashboardApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : 'Error actualizando estado'
      );
    },
  });

  const actionLoading = statusMutation.isPending ? 'status' : null;

  const handleStatusChange = useCallback(() => {
    if (!pendingStatus) return;
    statusMutation.mutate(pendingStatus);
  }, [pendingStatus, statusMutation]);

  const openStatusModal = (targetStatus: 'active' | 'disabled') => {
    setPendingStatus(targetStatus);
    setShowStatusModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-700">Usuario no encontrado</h2>
        {error && (
          <p className="text-sm text-red-500 mt-2 max-w-md mx-auto">{error}</p>
        )}
        <Link href="/admin/users" className="text-neutral-900 font-medium hover:underline mt-4 inline-block text-sm">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  const isDisabled = user.status === 'disabled';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          aria-label="Volver a usuarios"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 font-display tracking-tight">
            Detalle de Usuario
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
      </div>

      {/* Error inline */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar error"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: info + feature limits */}
        <div className="lg:col-span-2 space-y-5">
          {/* Información general */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              Información General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={user.email} />
              <InfoItem icon={<Shield className="w-3.5 h-3.5" />} label="Rol" value={user.role_name} />
              <InfoItem icon={<UserCheck className="w-3.5 h-3.5" />} label="Estado" value={user.status} />
              <InfoItem
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Registro"
                value={new Date(user.created_at).toLocaleDateString('es-ES')}
              />
              <InfoItem
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Último login"
                value={
                  user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString('es-ES')
                    : 'Nunca'
                }
              />
              <InfoItem
                icon={<Activity className="w-3.5 h-3.5" />}
                label="Total logins"
                value={String(user.login_count)}
              />
              <InfoItem
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                label="Email verificado"
                value={user.email_verified ? 'Sí' : 'No'}
              />
              <InfoItem
                icon={<ShieldAlert className="w-3.5 h-3.5" />}
                label="MFA"
                value={user.mfa_enabled ? 'Sí' : 'No'}
              />
            </div>
          </div>

          {/* Permisos efectivos (solo lectura) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-neutral-400" />
              Permisos Efectivos
            </h2>
            <p className="text-xs text-neutral-400 mb-3">
              Calculados por el backend: (rol ∪ grants) − denies
            </p>
            {effectivePermissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {effectivePermissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center px-2.5 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-mono"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-4">
                Este usuario no tiene permisos efectivos.
              </p>
            )}
          </div>

          {/* Feature Limits */}
          {user && (
            <FeatureLimitsCard userId={userId} roleId={user.role_id} />
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Acciones</h2>
            <div className="space-y-3">
              {isSelf ? (
                <p className="text-xs text-neutral-400 text-center py-2">
                  No puedes modificar el estado de tu propia cuenta
                </p>
              ) : isDisabled ? (
                <button
                  onClick={() => openStatusModal('active')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Habilitar cuenta
                </button>
              ) : (
                <button
                  onClick={() => openStatusModal('disabled')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Deshabilitar cuenta
                </button>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">ID</span>
                <span className="font-mono text-neutral-600 text-xs">{user.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Estado</span>
                <span className="text-neutral-600 capitalize">{user.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Verificado</span>
                <span className={user.email_verified ? 'text-neutral-600' : 'text-neutral-400'}>
                  {user.email_verified ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Login count</span>
                <span className="text-neutral-600">{user.login_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Estado */}
      {showStatusModal && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                {pendingStatus === 'disabled' ? 'Deshabilitar cuenta' : 'Habilitar cuenta'}
              </h3>
              <button
                onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              {pendingStatus === 'disabled' ? (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-1">Efectos de deshabilitar:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-red-600">
                      <li>Se incrementa el token_version del usuario</li>
                      <li>Todas las sesiones activas quedan invalidadas</li>
                      <li>El usuario recibirá 401 en su próximo request</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">
                  La cuenta de <strong>{user?.email}</strong> será habilitada.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={actionLoading === 'status'}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors ${
                    pendingStatus === 'disabled'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-neutral-900 hover:bg-neutral-800'
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
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
      <div className="text-neutral-400 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-neutral-900 truncate">{value}</p>
      </div>
    </div>
  );
}
