export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
  role_name: string;
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

/**
 * GET /v1/auth/me
 * Retorna los datos del usuario autenticado usando la cookie __Secure-access_token.
 */
export interface MeResponse {
  user: AuthUser;
}

export interface LogoutResponse {
  message: string;
}

export interface LogoutAllResponse {
  message: string;
}

export interface RateLimitError {
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
