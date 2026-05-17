// app/lib/api/management.ts
// Dashboard API — Cookie-Based Authorization
// Base URL: /v1/dashboard

import { apiFetch } from './auth';
import type {
  UserListResponse,
  UserListParams,
  UserDetailResponse,
  UpdateAccountStatusBody,
  AccountStatusResponse,
  FeatureLimitsResponse,
  FeatureLimitBody,
  FeatureLimit,
  PermissionOverridesResponse,
  CreateOverrideBody,
  PermissionOverride,
  RoleListResponse,
  PermissionListResponse,
  AvatarListResponse,
  UploadAvatarRequest,
  UploadAvatarResponse,
  AuditLogListResponse,
  AuditLogListParams,
} from '@/app/lib/types/admin';

// ==========================================
// USUARIOS
// ==========================================

/**
 * GET /v1/dashboard/users
 * Lista usuarios con paginación por cursor y filtros combinables.
 * Requiere permiso: users:read
 */
export async function listUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.created_before) query.set('created_before', params.created_before);
  if (params.created_after) query.set('created_after', params.created_after);

  const response = await apiFetch(`/v1/dashboard/users?${query.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * GET /v1/dashboard/users/:id
 * Detalle de un usuario con permisos efectivos calculados.
 * Requiere permiso: users:read
 */
export async function getUserDetail(userId: string): Promise<UserDetailResponse> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Usuario no encontrado');
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// ACCOUNT STATUS
// ==========================================

/**
 * PUT /v1/dashboard/users/:id/status
 * Habilita o deshabilita una cuenta. Solo acepta active ↔ disabled.
 * Deshabilitar incrementa token_version e invalida sesiones cacheadas.
 * Requiere permiso: users:write
 */
export async function updateAccountStatus(
  userId: string,
  status: 'active' | 'disabled'
): Promise<AccountStatusResponse> {
  const body: UpdateAccountStatusBody = { status };

  const response = await apiFetch(`/v1/dashboard/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// FEATURE LIMITS — Usuario
// ==========================================

/**
 * GET /v1/dashboard/users/:id/feature-limits
 * Requiere permiso: feature_limits:read
 */
export async function getUserFeatureLimits(userId: string): Promise<FeatureLimitsResponse> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}/feature-limits`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * POST /v1/dashboard/users/:id/feature-limits
 * Crea o actualiza un límite de feature para el usuario.
 * Requiere permiso: feature_limits:write
 */
export async function setUserFeatureLimit(
  userId: string,
  body: FeatureLimitBody
): Promise<FeatureLimit> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}/feature-limits`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE /v1/dashboard/users/:id/feature-limits/:key
 * Elimina un límite de feature del usuario.
 * Requiere permiso: feature_limits:write
 */
export async function deleteUserFeatureLimit(userId: string, key: string): Promise<void> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}/feature-limits/${key}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }
}

// ==========================================
// FEATURE LIMITS — Rol
// ==========================================

/**
 * GET /v1/dashboard/roles/:id/feature-limits
 * Requiere permiso: feature_limits:read
 */
export async function getRoleFeatureLimits(roleId: string): Promise<FeatureLimitsResponse> {
  const response = await apiFetch(`/v1/dashboard/roles/${roleId}/feature-limits`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * POST /v1/dashboard/roles/:id/feature-limits
 * Crea o actualiza el default de feature para el rol.
 * Requiere permiso: feature_limits:write
 */
export async function setRoleFeatureLimit(
  roleId: string,
  body: FeatureLimitBody
): Promise<FeatureLimit> {
  const response = await apiFetch(`/v1/dashboard/roles/${roleId}/feature-limits`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE /v1/dashboard/roles/:id/feature-limits/:key
 * Requiere permiso: feature_limits:write
 */
export async function deleteRoleFeatureLimit(roleId: string, key: string): Promise<void> {
  const response = await apiFetch(`/v1/dashboard/roles/${roleId}/feature-limits/${key}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }
}

// ==========================================
// PERMISSION OVERRIDES
// ==========================================

/**
 * GET /v1/dashboard/users/:id/permission-overrides
 * Los overrides expirados se incluyen — el cliente o PermissionResolver los filtra.
 * Requiere permiso: permissions:read
 */
export async function getPermissionOverrides(userId: string): Promise<PermissionOverridesResponse> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}/permission-overrides`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * POST /v1/dashboard/users/:id/permission-overrides
 * Crea un override (grant o deny). Invalida la sesión cacheada del usuario (best-effort).
 * Requiere permiso: permissions:write
 */
export async function createPermissionOverride(
  userId: string,
  body: CreateOverrideBody
): Promise<PermissionOverride> {
  const response = await apiFetch(`/v1/dashboard/users/${userId}/permission-overrides`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE /v1/dashboard/users/:id/permission-overrides/:overrideId
 * Invalida la sesión cacheada del usuario (best-effort).
 * Requiere permiso: permissions:write
 */
export async function deletePermissionOverride(userId: string, overrideId: string): Promise<void> {
  const response = await apiFetch(
    `/v1/dashboard/users/${userId}/permission-overrides/${overrideId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }
}

// ==========================================
// ROLES (catálogo)
// ==========================================

/**
 * GET /v1/management/roles
 * Sigue usando la ruta de management para el catálogo de roles del sistema.
 */
export async function listRoles(): Promise<RoleListResponse> {
  const response = await apiFetch('/v1/management/roles', { method: 'GET' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * POST /v1/management/users/:id/role
 * Asigna un rol a un usuario por UUID de rol.
 */
export async function assignRole(userId: string, roleId: string): Promise<{ message: string }> {
  const response = await apiFetch(`/v1/management/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role_id: roleId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// PERMISOS (catálogo del sistema)
// ==========================================

/**
 * GET /v1/management/permissions
 * Catálogo completo de permisos disponibles en el sistema.
 */
export async function listPermissions(): Promise<PermissionListResponse> {
  const response = await apiFetch('/v1/management/permissions', { method: 'GET' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// AVATARES (Management — sin cambios de ruta)
// ==========================================

export async function listAvatars(): Promise<AvatarListResponse> {
  const response = await apiFetch('/v1/management/avatars/default', { method: 'GET' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

export async function uploadAvatar(data: UploadAvatarRequest): Promise<UploadAvatarResponse> {
  const response = await apiFetch('/v1/management/avatars/default', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// AUDIT LOGS (sin cambios de ruta)
// ==========================================

export async function queryAuditLogs(params: AuditLogListParams = {}): Promise<AuditLogListResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.event_type) query.set('event_type', params.event_type);
  if (params.event_source) query.set('event_source', params.event_source);
  if (params.actor_id) query.set('actor_id', params.actor_id);
  if (params.actor_type) query.set('actor_type', params.actor_type);
  if (params.outcome) query.set('outcome', params.outcome);
  if (params.severity) query.set('severity', params.severity);
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);

  const response = await apiFetch(`/v1/management/audit-logs?${query.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.title || `Error ${response.status}`);
  }

  return response.json();
}
