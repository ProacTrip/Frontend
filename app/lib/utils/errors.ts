import type { AuthError, RateLimitError as RateLimitErrorType } from '@/app/lib/types/auth';

const ERROR_MAP: Record<string, string> = {
  email_not_verified: 'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_already_exists: 'Este email ya está registrado.',
  account_locked: 'Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.',
  validation_error: 'Datos inválidos.',
  internal_error: 'Error del servidor. Intenta de nuevo.',
  too_many_requests: 'Demasiados intentos. Espera un momento.',
  rate_limit: 'Demasiadas peticiones. Intenta más tarde.',
  unauthorized: 'No autorizado. Inicia sesión para continuar.',
  forbidden: 'No tienes permisos para esta acción.',
  not_found: 'El recurso solicitado no existe.',
  conflict: 'El recurso ya existe.',
};

export function parseApiError(response: Response): Promise<string> {
  return response.json().then((data: AuthError | RateLimitErrorType) => {
    const type = (data.type || '').toLowerCase();

    if (response.status === 429) {
      const rd = data as RateLimitErrorType;
      if (rd.detail) return rd.detail;
      return 'Demasiadas peticiones. Intenta más tarde.';
    }

    if (type && type in ERROR_MAP) {
      const base = ERROR_MAP[type];
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

export function getErrorMessage(data: AuthError | RateLimitErrorType, status?: number): { message: string; action: 'verify_email' | 'none' } {
  const type = (data.type || '').toLowerCase();

  if (status === 429) {
    const rd = data as RateLimitErrorType;
    const detail = rd.detail || 'Demasiadas peticiones. Intenta más tarde.';
    return { message: detail, action: 'none' };
  }

  if (type && type in ERROR_MAP) {
    const base = ERROR_MAP[type];
    const message = (data.detail && data.detail !== base) ? data.detail : base;
    return { message, action: type === 'email_not_verified' ? 'verify_email' : 'none' };
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
