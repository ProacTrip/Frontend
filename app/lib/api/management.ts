// app/lib/api/management.ts
//Utilidad: Funciones para llamar al backend de Marco (bloquear, listar, etc.)

// API del panel de administración (Management + Audit)
// Conecta con los proxies /api/v1/management/*

import { apiFetch } from './auth';
import type {
  UserListResponse,
  UserListParams,
  UserAdminDetail,
  RoleListResponse,
  BlockUserRequest,
  BlockUserResponse,
  UnblockUserRequest,
  AssignRoleRequest,
  PermissionListResponse,
  GrantPermissionRequest,
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
 * 📋 Listar usuarios (con filtros y paginación)
 */
export async function listUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.role) query.set('role', params.role);
  if (params.email) query.set('email', params.email); // ← NUEVO
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const response = await apiFetch(`/api/v1/management/users?${query.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * 🔍 Ver detalle de un usuario
 */
export async function getUserDetail(userId: string): Promise<UserAdminDetail> {
  const response = await apiFetch(`/api/v1/management/users/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Usuario no encontrado');
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ==========================================
// ROLES
// ==========================================

/**
 * 🎭 Listar roles del sistema
 */
export async function listRoles(): Promise<RoleListResponse> {
  const response = await apiFetch('/api/v1/management/roles', {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * 🎭 Asignar rol a usuario (por UUID de rol)
 */
export async function assignRole(userId: string, roleId: string): Promise<{ message: string }> {
  const body: AssignRoleRequest = { user_id: userId, role_id: roleId };

  const response = await apiFetch(`/api/v1/management/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// BLOQUEO / DESBLOQUEO
// ==========================================

/**
 * 🚫 Bloquear usuario
 */
export async function blockUser(userId: string, days: number, reason: string): Promise<BlockUserResponse> {
  const body: BlockUserRequest = { user_id: userId, days, reason };

  const response = await apiFetch(`/api/v1/management/users/${userId}/block`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ✅ Desbloquear usuario
 */
export async function unblockUser(userId: string): Promise<{ message: string }> {
  const body: UnblockUserRequest = { user_id: userId };

  const response = await apiFetch(`/api/v1/management/users/${userId}/unblock`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// PERMISOS
// ==========================================

/**
 * 📜 Listar todos los permisos del sistema
 */
export async function listPermissions(): Promise<PermissionListResponse> {
  const response = await apiFetch('/api/v1/management/permissions', {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ➕ Conceder/Revocar permiso override a usuario
 */
export async function grantPermission(userId: string, data: Omit<GrantPermissionRequest, 'user_id'>): Promise<{ message: string }> {
  const body: GrantPermissionRequest = { user_id: userId, ...data };

  const response = await apiFetch(`/api/v1/management/users/${userId}/permissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ➖ Revocar permiso override específico
 */
export async function revokePermission(userId: string, permissionId: string): Promise<{ message: string }> {
  const response = await apiFetch(`/api/v1/management/users/${userId}/permissions/${permissionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// AVATARES
// ==========================================

/**
 * 🖼️ Listar avatares por defecto
 */
export async function listAvatars(): Promise<AvatarListResponse> {
  const response = await apiFetch('/api/v1/management/avatars/default', {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ⬆️ Generar URL para subir avatar (presigned URL)
 */
export async function uploadAvatar(data: UploadAvatarRequest): Promise<UploadAvatarResponse> {
  const response = await apiFetch('/api/v1/management/avatars/default', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// AUDIT LOGS
// ==========================================

/**
 * 📋 Consultar logs de auditoría (con filtros)
 */
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

  const response = await apiFetch(`/api/v1/management/audit-logs?${query.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}