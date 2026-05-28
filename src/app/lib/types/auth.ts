export interface AuthUser {
  id: string;
  email: string;
  role_name: string;
  /** RBAC permissions resolved by the backend (e.g. "users:read", "users:write") */
  permissions: string[];
}

/**
 * POST /v1/auth/login — Sin MFA
 * El backend NO devuelve context en login. El frontend debe llamar GET /v1/environment por separado.
 */
export interface LoginSuccessResponse {
  user: AuthUser;
  mfa_required?: false;
}

/**
 * POST /v1/auth/login — Con MFA requerido
 * No se establecen cookies hasta completar /login/mfa.
 */
export interface LoginMfaResponse {
  user: { email: string };
  mfa_required: true;
  mfa_methods: string[];
  session_id: string;
}

/**
 * POST /v1/auth/register
 * El backend NO devuelve context en register. El frontend debe llamar GET /v1/environment por separado.
 */
export interface RegisterResponse {
  message: string;
  user?: AuthUser;
}

/**
 * POST /v1/auth/verify-email
 * El backend NO devuelve context en verify-email. El frontend debe llamar GET /v1/environment por separado.
 */
export interface VerifyEmailResponse {
  user: AuthUser;
}

export interface RateLimitErrorBody {
  type: string;
  title: string;
  status: 429;
  detail: string;
  instance: string;
  trace_id: string;
  /** Seconds until the rate limit resets (from Retry-After header) */
  retry_after?: number;
}

export interface AuthError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  trace_id: string;
}

export interface ResendVerificationResponse {
  message: string;
}

/**
 * Resultado de validación de contraseña.
 * Usado por validatePassword() para feedback en tiempo real en el formulario de registro.
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Machine-readable error codes for auth API errors.
 * Maps to RFC 9457 type URI last path segments from the backend.
 * Follows UserErrorCode pattern (UPPER_SNAKE_CASE).
 */
export type AuthApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_INACTIVE'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'VALIDATION_ERROR'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'INVALID_INPUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'OAUTH_PROVIDER_NOT_FOUND'
  | 'OAUTH_CODE_MISSING'
  | 'OAUTH_STATE_MISSING'
  | 'OAUTH_STATE_INVALID'
  | 'OAUTH_ACCESS_DENIED'
  | 'OAUTH_EXCHANGE_FAILED'
  | 'CONFLICT'
  | 'USER_NOT_FOUND'
  | 'INTERNAL_ERROR'
  // Dashboard error codes (shared with management API)
  | 'NOT_AUTHENTICATED'
  | 'TOKEN_VERSION_STALE'
  | 'ACCOUNT_DISABLED'
  | 'MISSING_PERMISSION'
  | 'CANNOT_DISABLE_SELF'
  | 'INVALID_STATUS'
  | 'FORBIDDEN'
  | 'FEATURE_LIMIT_ALREADY_EXISTS'
  | 'FEATURE_LIMIT_NOT_FOUND'
  | 'PERMISSION_OVERRIDE_ALREADY_EXISTS'
  | 'PERMISSION_OVERRIDE_NOT_FOUND'
  | 'INVALID_REASON'
  | 'INVALID_BLOCK_DURATION';

/**
 * Error codes for dashboard/management API endpoints.
 * Subset of AuthApiErrorCode — standalone type for management.ts imports.
 * Includes all 14 dashboard-specific codes (the 13 above + USER_NOT_FOUND).
 */
export type DashboardApiErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'TOKEN_VERSION_STALE'
  | 'ACCOUNT_DISABLED'
  | 'MISSING_PERMISSION'
  | 'USER_NOT_FOUND'
  | 'DOCUMENT_NOT_FOUND'
  | 'CANNOT_DISABLE_SELF'
  | 'INVALID_STATUS'
  | 'FORBIDDEN'
  | 'FEATURE_LIMIT_ALREADY_EXISTS'
  | 'FEATURE_LIMIT_NOT_FOUND'
  | 'PERMISSION_OVERRIDE_ALREADY_EXISTS'
  | 'PERMISSION_OVERRIDE_NOT_FOUND'
  | 'INVALID_REASON'
  | 'INVALID_BLOCK_DURATION'
  | 'INVALID_INPUT'
  | 'NOT_IMPLEMENTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';
