/**
 * Auth error utilities — maps backend error codes to Spanish user messages,
 * extracts user-friendly messages from errors, and parses field-level errors.
 *
 * Replaces inline AUTH_ERROR_MESSAGES maps in login and register pages.
 */

import type { AuthApiErrorCode } from '@/app/lib/types/auth';
import { AuthApiError } from '@/app/lib/api';

// ── Error code → Spanish user message map ─────────────────────────

export const AUTH_ERROR_MESSAGES: Record<AuthApiErrorCode | string, string> = {
  // Login errors
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  EMAIL_NOT_VERIFIED: 'Verificá tu email primero. ¿No recibiste el email?',
  ACCOUNT_LOCKED:
    'Cuenta bloqueada por demasiados intentos. Esperá unos minutos.',
  ACCOUNT_SUSPENDED: 'Tu cuenta fue suspendida. Contactá a soporte.',
  ACCOUNT_INACTIVE: 'Tu cuenta está deshabilitada.',
  // Register errors
  EMAIL_ALREADY_EXISTS:
    'Este email ya está registrado. ¿Querés iniciar sesión?',
  WEAK_PASSWORD: 'La contraseña no cumple los requisitos de seguridad',
  // OAuth errors
  OAUTH_EXCHANGE_FAILED: 'Error al conectar con Google. Intentá de nuevo.',
  OAUTH_ACCESS_DENIED: 'Acceso denegado. No autorizaste la aplicación.',
  OAUTH_STATE_INVALID:
    'Error de seguridad. La sesión expiró. Intentá de nuevo.',
  OAUTH_STATE_MISSING: 'Error de seguridad. Intentá de nuevo.',
  OAUTH_CODE_MISSING:
    'Error al procesar la autenticación. Intentá de nuevo.',
  OAUTH_PROVIDER_NOT_FOUND: 'Proveedor de autenticación no soportado.',
  // General
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Esperá unos segundos.',
  TOKEN_INVALID: 'El enlace de verificación expiró o es inválido.',
  TOKEN_EXPIRED: 'El enlace de verificación expiró.',
  VALIDATION_ERROR: 'Revisá los datos ingresados',
  INVALID_EMAIL: 'El email no es válido',
  INVALID_INPUT: 'Revisá los datos ingresados',
  USER_NOT_FOUND: 'No se encontró el usuario',
  INTERNAL_ERROR: 'Error inesperado. Intentá de nuevo.',
  CONFLICT: 'Conflicto. Revisá los datos e intentá de nuevo.',
  // Account status codes (used in OAuth callback)
  ACCOUNT_DISABLED:
    'Tu cuenta fue deshabilitada. Contactá a soporte.',
  NOT_AUTHENTICATED:
    'No se encontró una sesión activa. Volvé a iniciar sesión.',
};

// ── Extract a user-friendly message from any error ────────────────

/**
 * Extracts a human-readable Spanish message from any error value.
 *
 * Priority:
 *   1. AuthApiError with known code → mapped message from AUTH_ERROR_MESSAGES
 *   2. AuthApiError with unknown code → err.message
 *   3. Error instance → error.message
 *   4. Fallback → 'Error inesperado. Intentá de nuevo.'
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[error.code];
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado. Intentá de nuevo.';
}

// ── Field-level error extraction ──────────────────────────────────

export interface FieldErrors {
  email?: string;
  password?: string;
  first_name?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

/**
 * Extracts per-field error messages from a server error response.
 *
 * Supports multiple backend formats:
 *   1. RFC 9457 `errors[]` array: `{ errors: [{ field: "email", message: "..." }] }`
 *   2. Direct field mapping on the error object: `{ email: "error", password: "error" }`
 *
 * Returns an empty object if no field errors could be extracted.
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  const fields: FieldErrors = {};

  if (!error || typeof error !== 'object') return fields;

  const err = error as Record<string, unknown>;

  // Format 1: RFC 9457 errors[] array
  if (Array.isArray(err.errors)) {
    for (const e of err.errors) {
      if (e && typeof e === 'object' && 'field' in e && 'message' in e) {
        const field = (e as Record<string, unknown>).field;
        const message = (e as Record<string, unknown>).message;
        if (typeof field === 'string' && typeof message === 'string') {
          fields[field] = message;
        }
      }
    }
  }

  // Format 2: Direct field properties on the error body
  if (!Object.keys(fields).length) {
    for (const key of ['email', 'password', 'first_name', 'confirmPassword']) {
      if (typeof err[key] === 'string') {
        fields[key] = err[key] as string;
      }
    }
  }

  return fields;
}
