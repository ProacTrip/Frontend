// app/lib/api/management.ts
// Dashboard API — Cookie-Based Authorization
// Base URL: /v1/dashboard
//
// Rewritten to use direct fetch() with AbortController, rate limit extraction,
// and typed DashboardApiError with ERROR_MAP Spanish translations.
// Follows the canonical pattern established in user.ts.

import { API_URL, extractRateLimitHeaders } from './user';
import { ERROR_MAP } from '@/app/lib/utils/errors';
import { parseProblemDetails } from '@/app/lib/utils/problem-details';
import type { DashboardApiErrorCode } from '@/app/lib/types/auth';
import { rateLimitStore } from './rate-limit';
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
// TYPED ERROR — DashboardApiError
// ==========================================

/**
 * Typed error class for dashboard/management API errors.
 * Follows DashboardApiError pattern: machine-readable code, HTTP status,
 * human detail, trace ID, and optional retry-after for rate limiting.
 */
export class DashboardApiError extends Error {
  constructor(
    public readonly code: DashboardApiErrorCode,
    public readonly status: number,
    public readonly detail: string,
    public readonly traceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(`[${code}] ${detail}`);
    this.name = 'DashboardApiError';
  }
}

/**
 * Extracts the error type segment from a type URI and maps it to a
 * DashboardApiErrorCode. Falls back to status-based mapping.
 */
function extractDashboardErrorCode(type: string, status: number): DashboardApiErrorCode {
  if (!type) {
    if (status === 403) return 'FORBIDDEN';
    return 'INTERNAL_ERROR';
  }

  // Type URI-based mapping — match against known dashboard error type segments
  if (type.includes('not-authenticated')) return 'NOT_AUTHENTICATED';
  if (type.includes('token-version-stale')) return 'TOKEN_VERSION_STALE';
  if (type.includes('account-disabled')) return 'ACCOUNT_DISABLED';
  if (type.includes('missing-permission')) return 'MISSING_PERMISSION';
  if (type.includes('user-not-found') || type.includes('user_not_found')) return 'USER_NOT_FOUND';
  if (type.includes('cannot-disable-self')) return 'CANNOT_DISABLE_SELF';
  if (type.includes('invalid-status')) return 'INVALID_STATUS';
  if (type.includes('forbidden')) return 'FORBIDDEN';
  if (type.includes('feature-limit-already-exists')) return 'FEATURE_LIMIT_ALREADY_EXISTS';
  if (type.includes('feature-limit-not-found')) return 'FEATURE_LIMIT_NOT_FOUND';
  if (type.includes('permission-override-already-exists')) return 'PERMISSION_OVERRIDE_ALREADY_EXISTS';
  if (type.includes('permission-override-not-found')) return 'PERMISSION_OVERRIDE_NOT_FOUND';
  if (type.includes('invalid-reason')) return 'INVALID_REASON';
  if (type.includes('invalid-block-duration')) return 'INVALID_BLOCK_DURATION';

  // Status-based fallback
  if (status === 403) return 'FORBIDDEN';
  return 'INTERNAL_ERROR';
}

/**
 * Parse a non-ok Response into a typed DashboardApiError.
 * Uses shared parseProblemDetails for RFC 9457 body parsing.
 * Maps problem.type URI → DashboardApiErrorCode.
 * Uses ERROR_MAP for Spanish user-facing messages.
 * On 429, calls rateLimitStore.block() with Retry-After.
 * Always calls extractRateLimitHeaders before throwing.
 */
async function parseDashboardError(response: Response, endpoint: string): Promise<never> {
  const problem = await parseProblemDetails(response);
  const status = problem.status;

  let code: DashboardApiErrorCode;

  // 1. Rate limit
  if (status === 429 || problem.type.includes('rate-limit') || problem.type.includes('rate_limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // 2. Type URI-based mapping for dashboard codes
  else {
    code = extractDashboardErrorCode(problem.type, status);
  }

  const retryAfterHeader = response.headers.get('Retry-After');

  // On 429, block the rate limit store for the specified duration
  if (code === 'RATE_LIMIT_EXCEEDED' && retryAfterHeader) {
    rateLimitStore.block(parseInt(retryAfterHeader, 10));
  }

  // Always extract rate limit headers from error responses too
  extractRateLimitHeaders(response, endpoint);

  // Get Spanish message from ERROR_MAP
  let message: string;
  if (code in ERROR_MAP) {
    message = ERROR_MAP[code];
  } else {
    // Try converting UPPER_SNAKE_CASE to kebab-case for ERROR_MAP lookup
    const kebabKey = code.toLowerCase().replace(/_/g, '-');
    if (kebabKey in ERROR_MAP) {
      message = ERROR_MAP[kebabKey];
    } else {
      message = problem.detail || problem.title || `Error ${status}`;
    }
  }

  throw new DashboardApiError(
    code,
    status,
    message,
    problem.trace_id,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

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

  const endpoint = `/v1/dashboard/users?${query.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * GET /v1/dashboard/users/:id
 * Detalle de un usuario con permisos efectivos calculados.
 * Requiere permiso: users:read
 */
export async function getUserDetail(userId: string): Promise<UserDetailResponse> {
  const endpoint = `/v1/dashboard/users/${userId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
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
  const endpoint = `/v1/dashboard/users/${userId}/status`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// FEATURE LIMITS — Usuario
// ==========================================

/**
 * GET /v1/dashboard/users/:id/feature-limits
 * Requiere permiso: feature_limits:read
 */
export async function getUserFeatureLimits(userId: string): Promise<FeatureLimitsResponse> {
  const endpoint = `/v1/dashboard/users/${userId}/feature-limits`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
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
  const endpoint = `/v1/dashboard/users/${userId}/feature-limits`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * DELETE /v1/dashboard/users/:id/feature-limits/:key
 * Elimina un límite de feature del usuario.
 * Requiere permiso: feature_limits:write
 */
export async function deleteUserFeatureLimit(userId: string, key: string): Promise<void> {
  const endpoint = `/v1/dashboard/users/${userId}/feature-limits/${key}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
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
  const endpoint = `/v1/dashboard/roles/${roleId}/feature-limits`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
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
  const endpoint = `/v1/dashboard/roles/${roleId}/feature-limits`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * DELETE /v1/dashboard/roles/:id/feature-limits/:key
 * Requiere permiso: feature_limits:write
 */
export async function deleteRoleFeatureLimit(roleId: string, key: string): Promise<void> {
  const endpoint = `/v1/dashboard/roles/${roleId}/feature-limits/${key}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
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
  const endpoint = `/v1/dashboard/users/${userId}/permission-overrides`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
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
  const endpoint = `/v1/dashboard/users/${userId}/permission-overrides`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * DELETE /v1/dashboard/users/:id/permission-overrides/:overrideId
 * Invalida la sesión cacheada del usuario (best-effort).
 * Requiere permiso: permissions:write
 */
export async function deletePermissionOverride(userId: string, overrideId: string): Promise<void> {
  const endpoint = `/v1/dashboard/users/${userId}/permission-overrides/${overrideId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
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
  const endpoint = '/v1/management/roles';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * POST /v1/management/users/:id/role
 * Asigna un rol a un usuario por UUID de rol.
 */
export async function assignRole(userId: string, roleId: string): Promise<{ message: string }> {
  const endpoint = `/v1/management/users/${userId}/role`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role_id: roleId }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// PERMISOS (catálogo del sistema)
// ==========================================

/**
 * GET /v1/management/permissions
 * Catálogo completo de permisos disponibles en el sistema.
 */
export async function listPermissions(): Promise<PermissionListResponse> {
  const endpoint = '/v1/management/permissions';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// AVATARES (Management — sin cambios de ruta)
// ==========================================

export async function listAvatars(): Promise<AvatarListResponse> {
  const endpoint = '/v1/management/avatars/default';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

export async function uploadAvatar(data: UploadAvatarRequest): Promise<UploadAvatarResponse> {
  const endpoint = '/v1/management/avatars/default';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
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

  const endpoint = `/v1/management/audit-logs?${query.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof DashboardApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}
