// ==========================================
// 1. CONFIGURACIÓN
// ==========================================

import type { AuthUser, LoginSuccessResponse, LoginMfaResponse, RegisterResponse, VerifyEmailResponse, ResendVerificationResponse, ForgotPasswordResponse, ResetPasswordResponse, AuthError } from '@/app/lib/types/auth';
import { getErrorMessage } from '@/app/lib/utils/errors';
import { generateUUIDv7 } from '@/app/lib/utils/uuid';
import { rateLimitStore } from '@/app/lib/api/rate-limit';

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

  constructor(
    message: string,
    status: number,
    action: 'verify_email' | 'none' = 'none'
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.action = action;
    this.status = status;
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

  // Extraer rate limit headers de TODAS las respuestas (pre-429 warning)
  const rlLimit = parseInt(response.headers.get('RateLimit-Limit') || '', 10);
  const rlRemaining = parseInt(response.headers.get('RateLimit-Remaining') || '', 10);
  const rlReset = parseInt(response.headers.get('RateLimit-Reset') || '', 10);

  if (!Number.isNaN(rlLimit) && !Number.isNaN(rlRemaining) && !Number.isNaN(rlReset)) {
    rateLimitStore.update({
      limit: rlLimit,
      remaining: rlRemaining,
      reset: rlReset,
      endpoint,
      timestamp: Date.now(),
    });
  }

  if (response.status === 401) {
    throw new Error('[Auth] No autorizado. El usuario debe volver a iniciar sesión.');
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
    rateLimitStore.block(retryAfter);

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
// 3. USUARIO (User Profile)
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  preferred_language: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  avatar_url: string | null;
  travel_preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  role?: string;
}

// ==========================================
// 4. AUTH ME
// ==========================================

/**
 * GET /v1/auth/me
 * Obtiene los datos del usuario autenticado usando la cookie __Secure-access_token.
 * El backend maneja el refresco de tokens transparentemente vía middleware.
 * Retorna null si no hay sesión activa (401).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${API_URL}/v1/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user ?? null;
  } catch {
    return null;
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
  const response = await apiFetch('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message, action } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status, action);
  }

  return data;
}

/**
 * POST /v1/auth/register
 *
 * Backend AUTH_API.md § Register: el ejemplo 201 muestra solo {message} (sin campo user),
 * pero las líneas 669/704 indican que register devuelve datos del usuario.
 * La documentación del backend es contradictoria.
 * El código maneja ambos casos defensivamente: si user está presente → usarlo; si no → ignorar.
 */
export async function registerUser(
  email: string,
  password: string,
  first_name?: string
): Promise<RegisterResponse> {
  const body: Record<string, string> = { email, password };
  if (first_name) {
    body.first_name = first_name;
  }

  const response = await apiFetch('/v1/auth/register', {
    method: 'POST',
    headers: {
      'Idempotency-Key': generateUUIDv7(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status);
  }

  return data;
}

/**
 * POST /v1/auth/verify-email
 * Verifica el email del usuario usando el token enviado por correo.
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await apiFetch('/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status);
  }

  return data;
}

/**
 * POST /v1/auth/resend-verification
 * Reenvía el email de verificación al usuario.
 */
export async function resendVerification(
  email: string
): Promise<ResendVerificationResponse> {
  const response = await apiFetch('/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status);
  }

  return data;
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
  const response = await apiFetch('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status);
  }

  return data;
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
  const response = await apiFetch('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    const { message } = getErrorMessage(data as AuthError, response.status);
    throw new AuthApiError(message, response.status);
  }

  return data;
}

// ==========================================
// 6. LOGOUT
// ==========================================

/**
 * Cierra la sesión actual.
 * El backend responde con Clear-Site-Data: "cookies" que limpia las cookies automáticamente.
 */
export async function logoutUser(): Promise<void> {
  await apiFetch('/v1/auth/logout', {
    method: 'POST',
  });
}

/**
 * Cierra TODAS las sesiones del usuario.
 * El backend responde con Clear-Site-Data: "cookies" que limpia las cookies automáticamente.
 */
export async function logoutAllSessions(): Promise<void> {
  await apiFetch('/v1/auth/logout/all', {
    method: 'POST',
  });
}

// ==========================================
// 7. USUARIO (User Profile)
// ==========================================

/**
 * Obtiene el perfil del usuario autenticado desde el backend.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiFetch('/v1/user/profile', {
      method: 'GET',
    });

    if (response.ok) {
      const profile = await response.json();
      return profile;
    }

    console.error('[API] Error obteniendo perfil:', response.status);
    return null;
  } catch (error) {
    console.error('[API] Error en getUserProfile:', error);
    return null;
  }
}
