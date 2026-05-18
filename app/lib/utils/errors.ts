import type { AuthError, RateLimitErrorBody } from '@/app/lib/types/auth';

/**
 * El backend usa RFC 9457 Problem Details.
 * El campo `type` es una URL completa, por ejemplo:
 *   "https://api.proactrip.com/errors/email-not-verified"
 * Esta función extrae el último segmento del path para usarlo como clave.
 */
function extractErrorCode(type: string): string {
  if (!type) return '';
  try {
    // Si es una URL válida, extraemos el último segmento del path
    const url = new URL(type);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
  } catch {
    // Si no es una URL, lo usamos tal cual (compatibilidad con entornos de desarrollo)
    return type.toLowerCase().replace(/ /g, '-');
  }
}

export const ERROR_MAP: Record<string, string> = {
  'email-not-verified': 'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
  'email_not_verified': 'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
  'invalid-credentials': 'Email o contraseña incorrectos.',
  'invalid_credentials': 'Email o contraseña incorrectos.',
  'email-already-exists': 'Este email ya está registrado.',
  'email_already_exists': 'Este email ya está registrado.',
  'account-locked': 'Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.',
  'account_locked': 'Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.',
  'account-suspended': 'Tu cuenta ha sido suspendida. Contacta al soporte.',
  'account_suspended': 'Tu cuenta ha sido suspendida. Contacta al soporte.',
  'account-inactive': 'Tu cuenta está inactiva. Contacta al soporte.',
  'account_inactive': 'Tu cuenta está inactiva. Contacta al soporte.',
  'validation-error': 'Datos inválidos.',
  'validation_error': 'Datos inválidos.',
  'invalid-email': 'El formato del email es inválido.',
  'invalid_email': 'El formato del email es inválido.',
  'weak-password': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un carácter especial.',
  'weak_password': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un carácter especial.',
  'invalid-input': 'Datos de entrada invalidos.',
  'invalid_input': 'Datos de entrada invalidos.',
  'token-invalid': 'El token es inválido o ha expirado.',
  'token_invalid': 'El token es inválido o ha expirado.',
  'token-expired': 'El token ha expirado. Solicita uno nuevo.',
  'token_expired': 'El token ha expirado. Solicita uno nuevo.',
  'internal-error': 'Error del servidor. Intenta de nuevo.',
  'internal_error': 'Error del servidor. Intenta de nuevo.',
  'rate-limit-exceeded': 'Demasiadas peticiones. Intenta más tarde.',
  'rate_limit_exceeded': 'Demasiadas peticiones. Intenta más tarde.',
  'conflict': 'El recurso ya existe.',
  'oauth-provider-not-found': 'Proveedor OAuth no soportado.',
  'oauth_provider_not_found': 'Proveedor OAuth no soportado.',

  // Dashboard API errors (RFC 9457 type URLs)
  'not-authenticated': 'No autenticado. Inicia sesion nuevamente.',
  'token-version-stale': 'Tu sesion fue invalidada. Inicia sesion nuevamente.',
  'account-disabled': 'Tu cuenta esta deshabilitada. Contacta al soporte.',
  'missing-permission': 'No tienes permiso para realizar esta accion.',
  'user-not-found': 'Usuario no encontrado.',
  'cannot-disable-self': 'No puedes deshabilitar tu propia cuenta.',
  'invalid-status': 'Estado invalido. Solo se permiten los valores active y disabled.',
  'feature-limit-already-exists': 'Ya existe un limite para ese feature y ventana.',
  'feature-limit-not-found': 'Limite de feature no encontrado.',
  'permission-override-already-exists': 'Ya existe un override para ese usuario y permiso.',
  'permission-override-not-found': 'Override de permiso no encontrado.',
  'invalid-reason': 'La razon del override debe tener entre 1 y 500 caracteres.',
  'invalid-block-duration': 'Los denies no pueden exceder 365 dias de duracion.',
  'forbidden': 'Acceso denegado.',
};

export function parseApiError(response: Response): Promise<string> {
  return response.json().then((data: AuthError | RateLimitErrorBody) => {
    if (response.status === 429) {
      const rd = data as RateLimitErrorBody;
      if (rd.detail) return rd.detail;
      return 'Demasiadas peticiones. Intenta más tarde.';
    }

    const code = extractErrorCode(data.type || '');
    if (code && code in ERROR_MAP) {
      const base = ERROR_MAP[code];
      if (data.detail && data.detail !== base) {
        return data.detail;
      }
      return base;
    }

    if (data.detail) return data.detail;
    if (data.title) return data.title;

    return `Error ${response.status}: ${response.statusText}`;
  }).catch(() => {
    if (response.statusText) return `Error ${response.status}: ${response.statusText}`;
    return `Error ${response.status}: Error del servidor`;
  });
}

export function getErrorMessage(
  data: AuthError | RateLimitErrorBody,
  status?: number
): { message: string; action: 'verify_email' | 'none' } {
  const code = extractErrorCode(data.type || '');

  if (status === 429) {
    const rd = data as RateLimitErrorBody;
    const detail = rd.detail || 'Demasiadas peticiones. Intenta más tarde.';
    return { message: detail, action: 'none' };
  }

  if (code && code in ERROR_MAP) {
    const base = ERROR_MAP[code];
    const message = (data.detail && data.detail !== base) ? data.detail : base;
    const action = (code === 'email-not-verified' || code === 'email_not_verified') ? 'verify_email' : 'none';
    return { message, action };
  }

  if (data.detail) return { message: data.detail, action: 'none' };
  if (data.title) return { message: data.title, action: 'none' };

  return {
    message: status ? `Error ${status}: ${data.title || 'Error del servidor'}` : 'Error del servidor. Intenta de nuevo.',
    action: 'none',
  };
}

export function formatRateLimitError(retryAfterSeconds: number): string {
  if (retryAfterSeconds <= 0) return 'Demasiadas peticiones. Intenta más tarde.';
  if (retryAfterSeconds < 60) return `Demasiadas peticiones. Intenta en ${retryAfterSeconds} segundos.`;
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Demasiadas peticiones. Intenta en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
}
