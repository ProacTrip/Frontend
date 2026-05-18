// ==========================================
// 1. CONFIGURACIÓN
// ==========================================

import type { AuthUser, LoginSuccessResponse, LoginMfaResponse, RegisterResponse, VerifyEmailResponse, ResendVerificationResponse, ForgotPasswordResponse, ResetPasswordResponse, AuthApiErrorCode } from '@/app/lib/types/auth';
import { generateUUIDv7 } from '@/app/lib/utils/uuid';
import { rateLimitStore } from '@/app/lib/api/rate-limit';
import { parseProblemDetails, type ProblemDetails } from '@/app/lib/utils/problem-details';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Feature flag para forgot/reset password.
 * Se activa con NEXT_PUBLIC_FEATURE_PASSWORD_RESET=true.
 * Por defecto false (funcionalidad oculta hasta que el backend la implemente).
 */
export const FEATURE_PASSWORD_RESET =
  process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET === 'true';

export class RateLimitError extends Error {
  retryAfter: number;
  /** Límite total de peticiones en la ventana (header RateLimit-Limit) */
  limit?: number;
  /** Peticiones restantes en la ventana (header RateLimit-Remaining) */
  remaining?: number;
  /** Timestamp Unix cuando se resetea la ventana (header RateLimit-Reset) */
  reset?: number;

  constructor(
    message: string,
    retryAfter: number,
    limit?: number,
    remaining?: number,
    reset?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
  }
}

export class AuthApiError extends Error {
  action: 'verify_email' | 'none';
  status: number;
  code: AuthApiErrorCode;
  traceId?: string;
  retryAfter?: number;

  constructor(
    code: AuthApiErrorCode,
    status: number,
    message: string,
    action: 'verify_email' | 'none' = 'none',
    traceId?: string,
    retryAfter?: number,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.action = action;
    this.traceId = traceId;
    this.retryAfter = retryAfter;
  }
}

// ==========================================
// 2. API FETCH (cookie-based auth v2)
// ==========================================

/**
 * Wrapper de fetch que envía cookies automáticamente.
 * El backend maneja el refresco de tokens transparentemente.
 * Si el backend responde 401, tiramos el error y la app redirige al login.
 * Si el backend responde 429, tiramos RateLimitError con Retry-After y rate limit headers.
 *
 * Content-Type solo se envía cuando hay body (evita header innecesario en GET y body-less POST como logout).
 *
 * En TODAS las respuestas exitosas, extrae RateLimit-* headers y actualiza el store
 * para que los componentes puedan mostrar warnings preventivos.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Construir headers: solo Content-Type cuando hay body y no lo especifica el caller
  const baseHeaders: Record<string, string> = {};
  if (options.body) {
    baseHeaders['Content-Type'] = 'application/json';
  }
  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: mergedHeaders,
  });

  // Extract rate limit headers from ALL responses for pre-429 warning
  extractRateLimitHeaders(response, endpoint);

  if (response.status === 401) {
    throw new Error('[Auth] No autorizado. El usuario debe volver a iniciar sesión.');
  }

  if (response.status === 403) {
    try {
      const problem = await parseProblemDetails(response.clone());
      // Redirect inmediato si la cuenta fue deshabilitada — no importa
      // qué componente hizo la llamada, el usuario debe ver la página.
      if (problem.type.includes('account-disabled') ||
          (problem.type.includes('forbidden') && problem.detail?.toLowerCase().includes('deshabilitada'))) {
        window.location.href = '/auth/account-disabled';
        throw new AuthApiError('ACCOUNT_DISABLED', 403, problem.detail || 'Cuenta deshabilitada', 'none', problem.trace_id);
      }
      if (problem.type.includes('missing-permission')) {
        throw new AuthApiError('MISSING_PERMISSION', 403, problem.detail || 'Permiso denegado', 'none', problem.trace_id);
      }
      if (problem.type.includes('forbidden')) {
        throw new AuthApiError('FORBIDDEN', 403, problem.detail || 'Acceso denegado', 'none', problem.trace_id);
      }
      throw new AuthApiError('FORBIDDEN', 403, problem.detail || 'Acceso denegado', 'none', problem.trace_id);
    } catch (e: unknown) {
      if (e instanceof AuthApiError) throw e;
      throw new AuthApiError('FORBIDDEN', 403, 'Acceso denegado', 'none');
    }
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
    rateLimitStore.block(retryAfter);

    const rlLimit = parseInt(response.headers.get('RateLimit-Limit') || '', 10);
    const rlRemaining = parseInt(response.headers.get('RateLimit-Remaining') || '', 10);
    const rlReset = parseInt(response.headers.get('RateLimit-Reset') || '', 10);

    const limit = !Number.isNaN(rlLimit) ? rlLimit : undefined;
    const remaining = !Number.isNaN(rlRemaining) ? rlRemaining : undefined;
    const reset = !Number.isNaN(rlReset) ? rlReset : undefined;

    let detail = `Demasiadas peticiones${retryAfter > 0 ? `. Intenta de nuevo en ${retryAfter} segundos.` : '. Intenta más tarde.'}`;

    try {
      const errorData = await response.clone().json();
      if (errorData.detail) {
        detail = retryAfter > 0
          ? `${errorData.detail} Intenta de nuevo en ${retryAfter} segundos.`
          : errorData.detail;
      }
    } catch {
      // body no es JSON, usamos el mensaje por defecto
    }

    throw new RateLimitError(detail, retryAfter, limit, remaining, reset);
  }

  return response;
}

// ==========================================
// 2.5. HELPERS — Rate limit extraction + error parsing
// ==========================================

/**
 * Extract rate limit headers from ANY response (success or error)
 * and update the global rateLimitStore.
 * Exact copy of user.ts pattern.
 */
function extractRateLimitHeaders(response: Response, endpoint: string): void {
  const limit = response.headers.get('RateLimit-Limit');
  const remaining = response.headers.get('RateLimit-Remaining');
  const reset = response.headers.get('RateLimit-Reset');

  if (limit !== null && remaining !== null && reset !== null) {
    rateLimitStore.update({
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      endpoint,
      timestamp: Date.now(),
    });
  }
}

/**
 * Parse a non-ok Response into a typed AuthApiError.
 * Uses shared parseProblemDetails for RFC 9457 body parsing.
 * Maps problem.type URI → AuthApiErrorCode via post-processing.
 * On 429, calls rateLimitStore.block() with Retry-After.
 * Always calls extractRateLimitHeaders before throwing.
 */
async function parseAuthError(response: Response, endpoint: string): Promise<never> {
  const problem = await parseProblemDetails(response);
  const type = problem.type;
  const status = problem.status;

  let code: AuthApiErrorCode;

  // 1. Account locked — must be checked before rate limit (backend may return 429 status
  //    for account-locked errors, which would be misclassified as RATE_LIMIT_EXCEEDED)
  if (type.includes('account-locked') || type.includes('account_locked')) {
    code = 'ACCOUNT_LOCKED';
  }
  // 2. Rate limit
  else if (status === 429 || type.includes('rate_limit') || type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // 3. Type URI-based mapping (last path segment)
  else if (type.includes('invalid-credentials') || type.includes('invalid_credentials')) {
    code = 'INVALID_CREDENTIALS';
  } else if (type.includes('email-not-verified') || type.includes('email_not_verified')) {
    code = 'EMAIL_NOT_VERIFIED';
  } else if (type.includes('email-already-exists') || type.includes('email_already_exists')) {
    code = 'EMAIL_ALREADY_EXISTS';
  } else if (type.includes('account-suspended') || type.includes('account_suspended')) {
    code = 'ACCOUNT_SUSPENDED';
  } else if (type.includes('account-inactive') || type.includes('account_inactive')) {
    code = 'ACCOUNT_INACTIVE';
  } else if (type.includes('token-invalid') || type.includes('token_invalid')) {
    code = 'TOKEN_INVALID';
  } else if (type.includes('token-expired') || type.includes('token_expired')) {
    code = 'TOKEN_EXPIRED';
  } else if (type.includes('invalid-email') || type.includes('invalid_email')) {
    code = 'INVALID_EMAIL';
  } else if (type.includes('weak-password') || type.includes('weak_password')) {
    code = 'WEAK_PASSWORD';
  } else if (type.includes('invalid-input') || type.includes('invalid_input')) {
    code = 'INVALID_INPUT';
  } else if (type.includes('oauth-provider-not-found') || type.includes('oauth_provider_not_found')) {
    code = 'OAUTH_PROVIDER_NOT_FOUND';
  } else if (type.includes('oauth-code-missing') || type.includes('oauth_code_missing')) {
    code = 'OAUTH_CODE_MISSING';
  } else if (type.includes('oauth-state-missing') || type.includes('oauth_state_missing')) {
    code = 'OAUTH_STATE_MISSING';
  } else if (type.includes('oauth-state-invalid') || type.includes('oauth_state_invalid')) {
    code = 'OAUTH_STATE_INVALID';
  } else if (type.includes('oauth-access-denied') || type.includes('oauth_access_denied')) {
    code = 'OAUTH_ACCESS_DENIED';
  } else if (type.includes('oauth-exchange-failed') || type.includes('oauth_exchange_failed')) {
    code = 'OAUTH_EXCHANGE_FAILED';
  } else if (type.includes('conflict')) {
    code = 'CONFLICT';
  } else if (type.includes('user-not-found') || type.includes('user_not_found')) {
    code = 'USER_NOT_FOUND';
  } else if (type.includes('validation')) {
    code = 'VALIDATION_ERROR';
  }
  // Dashboard error codes — MUST be checked before status-based fallback
  // to prevent ACCOUNT_DISABLED/MISSING_PERMISSION from falling to INTERNAL_ERROR.
  else if (type.includes('not-authenticated')) {
    code = 'NOT_AUTHENTICATED';
  } else if (type.includes('token-version-stale')) {
    code = 'TOKEN_VERSION_STALE';
  } else if (type.includes('account-disabled')) {
    code = 'ACCOUNT_DISABLED';
  } else if (type.includes('missing-permission')) {
    code = 'MISSING_PERMISSION';
  } else if (type.includes('cannot-disable-self')) {
    code = 'CANNOT_DISABLE_SELF';
  } else if (type.includes('invalid-status')) {
    code = 'INVALID_STATUS';
  } else if (type.includes('forbidden')) {
    code = 'FORBIDDEN';
  } else if (type.includes('feature-limit-already-exists')) {
    code = 'FEATURE_LIMIT_ALREADY_EXISTS';
  } else if (type.includes('feature-limit-not-found')) {
    code = 'FEATURE_LIMIT_NOT_FOUND';
  } else if (type.includes('permission-override-already-exists')) {
    code = 'PERMISSION_OVERRIDE_ALREADY_EXISTS';
  } else if (type.includes('permission-override-not-found')) {
    code = 'PERMISSION_OVERRIDE_NOT_FOUND';
  } else if (type.includes('invalid-reason')) {
    code = 'INVALID_REASON';
  } else if (type.includes('invalid-block-duration')) {
    code = 'INVALID_BLOCK_DURATION';
  }
  // 4. Status-based fallback
  else if (status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (status === 401) {
    code = 'TOKEN_INVALID';
  } else if (status === 404) {
    code = 'USER_NOT_FOUND';
  } else if (status === 409) {
    code = 'CONFLICT';
  } else if (status === 403) {
    code = 'FORBIDDEN';
  } else {
    code = 'INTERNAL_ERROR';
  }

  const retryAfterHeader = response.headers.get('Retry-After');

  // On 429, block the rate limit store for the specified duration
  if (code === 'RATE_LIMIT_EXCEEDED' && retryAfterHeader) {
    rateLimitStore.block(parseInt(retryAfterHeader, 10));
  }

  // Always extract rate limit headers from error responses too
  extractRateLimitHeaders(response, endpoint);

  // Determine action for backward compatibility
  const action: 'verify_email' | 'none' =
    code === 'EMAIL_NOT_VERIFIED' ? 'verify_email' : 'none';

  throw new AuthApiError(
    code,
    status,
    problem.detail || problem.title || `Error ${status}`,
    action,
    problem.trace_id,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

// ==========================================
// 4. AUTH ME
// ==========================================

/**
 * GET /v1/auth/me
 * Obtiene los datos del usuario autenticado usando la cookie __Secure-access_token.
 * El backend maneja el refresco de tokens transparentemente vía middleware.
 *
 * Throws AuthApiError con status 401 cuando no hay sesión activa.
 * Throws AuthApiError para otros errores del backend.
 * Los callers deben distinguir: 401 = "no autenticado" (no es error), otros = error real.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const endpoint = '/v1/auth/me';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      // 401 = no session cookie or expired — typed error so callers can distinguish
      if (response.status === 401) {
        throw new AuthApiError('NOT_AUTHENTICATED', 401, 'No autenticado');
      }
      // Other errors — parse via standard error handler
      await parseAuthError(response, endpoint);
    }

    const data = await response.json();
    return data.user ?? null;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw typed errors as-is
    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    // Network errors, JSON parse errors, etc. — propagate
    throw error;
  }
}

// ==========================================
// 5. AUTH — Funciones centralizadas
// ==========================================

/**
 * POST /v1/auth/login
 * Inicia sesión con email y contraseña.
 * Retorna LoginSuccessResponse (user) o LoginMfaResponse (mfa_required).
 * Throws AuthApiError en errores de dominio (credenciales inválidas, email no verificado, etc.).
 * Throws RateLimitError cuando se excede el límite de peticiones.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginSuccessResponse | LoginMfaResponse> {
  const endpoint = '/v1/auth/login';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * POST /v1/auth/register
 *
 * Registers a new user account.
 * The `user` field in the response is intentionally optional: the backend only
 * includes it when the account is pre-verified (auto-login). In the default
 * flow (email verification required), only `message` is returned.
 */
export async function registerUser(
  email: string,
  password: string,
  first_name?: string
): Promise<RegisterResponse> {
  const endpoint = '/v1/auth/register';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const body: Record<string, string> = { email, password };
  if (first_name) {
    body.first_name = first_name;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': generateUUIDv7(),
      },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * POST /v1/auth/verify-email
 * Verifica el email del usuario usando el token enviado por correo.
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const endpoint = '/v1/auth/verify-email';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * POST /v1/auth/resend-verification
 * Reenvía el email de verificación al usuario.
 */
export async function resendVerification(
  email: string
): Promise<ResendVerificationResponse> {
  const endpoint = '/v1/auth/resend-verification';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 5. PASSWORD RESET (🚧 planificado en backend)
// ==========================================

/**
 * POST /v1/auth/forgot-password
 * Solicita un enlace de recuperación de contraseña.
 * 🚧 Endpoint planificado — no implementado en backend aún.
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const endpoint = '/v1/auth/forgot-password';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * POST /v1/auth/reset-password
 * Cambia la contraseña usando un token de recuperación.
 * 🚧 Endpoint planificado — no implementado en backend aún.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const endpoint = '/v1/auth/reset-password';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 6. OAUTH
// ==========================================

/**
 * GET /v1/auth/oauth/:provider
 * Inicia el flujo OAuth. Retorna la URL de autorización del proveedor.
 * El frontend debe redirigir al usuario a `auth_url` con window.location.href.
 *
 * IMPORTANTE: No cachear esta respuesta — el state anti-CSRF es one-time.
 */
export interface OAuthUrlResponse {
  auth_url: string;
}

export async function getOAuthUrl(provider: string): Promise<OAuthUrlResponse> {
  const endpoint = `/v1/auth/oauth/${encodeURIComponent(provider)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 7. LOGOUT
// ==========================================

/**
 * Cierra la sesión actual.
 * El backend responde con Clear-Site-Data: "cookies" que limpia las cookies automáticamente.
 */
export async function logoutUser(): Promise<void> {
  const endpoint = '/v1/auth/logout';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * Cierra TODAS las sesiones del usuario.
 * El backend responde con Clear-Site-Data: "cookies" que limpia las cookies automáticamente.
 */
export async function logoutAllSessions(): Promise<void> {
  const endpoint = '/v1/auth/logout/all';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAuthError(response, endpoint);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof AuthApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}
