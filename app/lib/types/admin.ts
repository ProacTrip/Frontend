// app/lib/types/admin.ts
// Tipos del módulo de administración — Dashboard API (Cookie-Based Authorization)
// Base URL: /v1/dashboard

// ==========================================
// 1. USUARIOS — List Users
// ==========================================

/**
 * Ítem devuelto por GET /v1/dashboard/users
 * NUNCA incluye password_hash, locked_until, failed_attempts ni datos OAuth.
 */
export interface UserAdmin {
  id: string;
  email: string;
  status: 'active' | 'disabled' | 'suspended' | 'pending_verification' | string;
  role_id: string;
  role_name: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Paginación por cursor (opaco base64) devuelta por GET /v1/dashboard/users
 */
export interface UserListMeta {
  next_cursor: string | null;
  prev_cursor: string | null;
  has_next: boolean;
  limit: number;
}

export interface UserListResponse {
  users: UserAdmin[];
  meta: UserListMeta;
  /** Total de usuarios que coinciden con los filtros. Opcional porque los endpoints con cursor-based pagination pueden no devolverlo. */
  total?: number;
}

export interface UserListParams {
  limit?: number;
  cursor?: string;
  role?: string;
  status?: string;
  /** Búsqueda por email (ILIKE en el backend) */
  search?: string;
  created_before?: string;
  created_after?: string;
}

// ==========================================
// 2. USUARIO — User Detail
// ==========================================

/**
 * Detalle de un usuario devuelto por GET /v1/dashboard/users/:id
 * Incluye permisos efectivos calculados: (rol ∪ grants) − denies
 */
export interface UserAdminDetail {
  id: string;
  email: string;
  status: string;
  role_id: string;
  role_name: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDetailResponse {
  user: UserAdminDetail;
  /** Permisos efectivos: (rol_permissions ∪ active_grants) − active_denies */
  effective_permissions: string[];
}

// ==========================================
// 3. ACCOUNT STATUS
// ==========================================

/**
 * PUT /v1/dashboard/users/:id/status
 * Solo acepta transiciones active ↔ disabled.
 * Deshabilitar incrementa token_version e invalida sesiones cacheadas.
 */
export interface UpdateAccountStatusBody {
  status: 'active' | 'disabled';
}

export interface AccountStatusResponse {
  user_id: string;
  previous_status: string;
  new_status: string;
  token_version: number;
  sessions_invalidated: number;
}

// ==========================================
// 4. FEATURE LIMITS — Usuario
// ==========================================

export interface FeatureLimit {
  feature_key: string;
  /** null = ilimitado, 0 = bloqueado, >0 = cuota */
  limit_value: number | null;
  /** "minute" | "hour" | "day" | "month" */
  window: string;
}

export interface FeatureLimitsResponse {
  limits: FeatureLimit[];
}

export interface FeatureLimitBody {
  feature_key: string;
  limit_value: number | null;
  window?: string;
}

// ==========================================
// 5. FEATURE LIMITS — Rol
// ==========================================

// Comparten los mismos tipos que Feature Limits de usuario
// GET  /v1/dashboard/roles/:id/feature-limits  → FeatureLimitsResponse
// POST /v1/dashboard/roles/:id/feature-limits  → FeatureLimit (201)
// DELETE /v1/dashboard/roles/:id/feature-limits/:key → 204

// ==========================================
// 6. PERMISSION OVERRIDES
// ==========================================

export interface PermissionOverride {
  id: string;
  permission: string;
  granted: boolean;
  reason: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionOverridesResponse {
  overrides: PermissionOverride[];
}

export interface CreateOverrideBody {
  permission_id: string;
  granted: boolean;
  /** 1–500 caracteres, no vacío, no solo whitespace */
  reason: string;
  /** ISO 8601. Para denies, no puede exceder 365 días. */
  expires_at?: string;
}

// ==========================================
// 7. ROLES (para el selector de roles)
// ==========================================

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface RoleListResponse {
  roles: Role[];
}

// ==========================================
// 8. PERMISOS (catálogo del sistema)
// ==========================================

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface PermissionListResponse {
  permissions: Permission[];
}

// ==========================================
// 9. AVATARES (Management — sin cambios)
// ==========================================

export interface Avatar {
  name: string;
  download_url: string;
}

export interface AvatarListResponse {
  avatars: Avatar[];
}

export interface UploadAvatarRequest {
  file_name: string;
  file_size?: number;
  mime_type: string;
  avatar_name: string;
  ttl_minutes?: number;
}

export interface UploadAvatarResponse {
  avatar_name: string;
  upload_url: string;
  message: string;
}

// ==========================================
// 10. AUDIT LOGS (sin cambios)
// ==========================================

export type AuditEventType =
  | 'http_request'
  | 'user_registered'
  | 'user_login'
  | 'user_logout'
  | 'password_changed'
  | 'mfa_setup'
  | 'mfa_verified'
  | 'mfa_disabled'
  | 'role_assigned'
  | 'tokens_revoked'
  | 'user_blocked'
  | 'user_unblocked'
  | 'permission_granted'
  | 'permission_revoked';

export type AuditEventSource = 'auth_api' | 'management_api' | 'domain_event';
export type AuditOutcome = 'success' | 'failure';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  event_id: string;
  event_type: AuditEventType;
  event_source: AuditEventSource;
  actor_id: string | null;
  actor_type: 'user' | 'system';
  outcome: AuditOutcome;
  severity: AuditSeverity;
  ip_address: string;
  payload: {
    action?: string;
    resource?: string;
    status_code?: number;
    duration_ms?: number;
    [key: string]: unknown;
  };
  metadata: {
    user_agent?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
}

export interface AuditLogListParams {
  limit?: number;
  offset?: number;
  event_type?: string;
  event_source?: string;
  actor_id?: string;
  actor_type?: string;
  outcome?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
}

// ==========================================
// 11. SSE (Audit Real-time)
// ==========================================

export interface AuditSSEEvent {
  type: 'audit_entry';
  id: string;
  event_type: AuditEventType;
  event_source: AuditEventSource;
  actor_id: string | null;
  action: string;
  resource: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  payload: Record<string, unknown>;
  timestamp: string;
}
