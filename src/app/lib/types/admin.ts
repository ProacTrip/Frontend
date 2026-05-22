// app/lib/types/admin.ts
// Tipos del módulo de administración — Dashboard API (Cookie-Based Authorization)
// Base URL: /v1/dashboard
// Alcance: Usuarios, feature limits y verificación de documentos.

// ==========================================
// 1. USUARIOS — List Users
// ==========================================

export interface UserAdmin {
  id: string;
  email: string;
  status: 'active' | 'disabled' | string;
  role_id: string;
  role_name: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListMeta {
  next_cursor: string | null;
  prev_cursor: string | null;
  has_next: boolean;
  limit: number;
}

export interface UserListResponse {
  users: UserAdmin[];
  meta: UserListMeta;
  total?: number;
}

export interface UserListParams {
  limit?: number;
  cursor?: string;
  role?: string;
  status?: string;
  search?: string;
  created_before?: string;
  created_after?: string;
}

// ==========================================
// 2. USUARIO — User Detail
// ==========================================

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
  effective_permissions: string[];
}

// ==========================================
// 3. ACCOUNT STATUS
// ==========================================

export interface UpdateAccountStatusBody {
  status: 'active' | 'disabled';
}

export interface AccountStatusResponse {
  user_id: string;
  previous_status: string;
  new_status: string;
  token_version: number;
}

// ==========================================
// 4. FEATURE LIMITS — Usuario
// ==========================================

export interface FeatureLimit {
  feature_key: string;
  limit_value: number | null;
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
// 5. DOCUMENT VERIFICATION
// ==========================================

export type DocumentVerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'manual_review'
  | 'suspicious';

export interface VerificationHistoryEntry {
  previous_status: string;
  new_status: string;
  verified_by: string;
  reason: string;
  changed_at: string;
}

export interface DocumentVerification {
  document_id: string;
  status: DocumentVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  history: VerificationHistoryEntry[];
}

export interface UpdateVerificationBody {
  status: Exclude<DocumentVerificationStatus, 'pending'>;
  reason?: string;
}

export interface UpdateVerificationResponse {
  document_id: string;
  status: string;
  message: string;
}

export interface ReprocessResponse {
  document_id: string;
  status: string;
  message: string;
}
