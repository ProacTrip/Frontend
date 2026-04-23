// app/lib/types/admin.ts
//Utilidad: Define estructura de datos: usuarios, permisos, logs, avatares, roles

// Tipos del módulo de administración (Management + Audit)
// Basado en la API de Marco Aurelio

// ==========================================
// 1. USUARIOS (Management)
// ==========================================

export interface UserAdmin {
  id: string;
  email: string;
  status: 'active' | 'pending_verification' | 'suspended' | 'blocked';
  role: 'user' | 'staff' | 'admin';
  created_at: string;
}

export interface UserAdminDetail {
  id: string;
  email: string;
  status: string;
  role: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  failed_login_attempts: number;
  last_login_at: string | null;
  locked_until: string | null;
  blocked_until: string | null;
  block_reason: string | null;
  created_at: string;
  permissions: PermissionOverride[];
}

export interface UserListResponse {
  users: UserAdmin[];
  total: number;
}

export interface UserListParams {
  status?: string;
  role?: string;
  email?: string;   // ← NUEVO: búsqueda serverside por email
  limit?: number;
  offset?: number;
}

// ==========================================
// 2. ROLES (Management)
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
// 3. PERMISOS (Management)
// ==========================================

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface PermissionOverride {
  permission_id: string;
  resource: string;
  action: string;
  granted: boolean;
  reason: string;
  expires_at: string | null;
}

export interface PermissionListResponse {
  permissions: Permission[];
}

export interface GrantPermissionRequest {
  user_id: string;
  permission_id: string;
  granted: boolean;
  reason: string;
  expires_at?: string;
}

// ==========================================
// 4. BLOQUEO / DESBLOQUEO (Management)
// ==========================================

export interface BlockUserRequest {
  user_id: string;
  days: number;      // 0 = permanente
  reason: string;
}

export interface BlockUserResponse {
  message: string;
  blocked_until?: string;
}

export interface UnblockUserRequest {
  user_id: string;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
}

// ==========================================
// 5. AVATARES (Management)
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
// 6. AUDIT LOGS (Audit Module)
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
    [key: string]: any;
  };
  metadata: {
    user_agent?: string;
    [key: string]: any;
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
// 7. SSE (Audit Real-time)
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
  payload: Record<string, any>;
  timestamp: string;
}