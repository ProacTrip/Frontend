/**
 * Hotel Search API module.
 *
 * Uses raw fetch (NOT apiFetch wrapper) because we need access to
 * response headers for rate-limit extraction (Retry-After, RateLimit-*).
 *
 * Phase 1: hotels only (vacation_rentals: false always hardcoded).
 */

import type {
  HotelSearchRequest,
  HotelSearchResponse,
  ProblemDetails,
  ApiError,
} from '@/lib/types/search';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Error mapping (RFC 9457 → user message) ──

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    'Revisá los datos ingresados. Fechas, destino y huéspedes son obligatorios.',
  INVALID_PARAM_RANGE:
    'Algunos valores están fuera de rango. Ajustalos y probá de nuevo.',
  PROVIDER_UNAVAILABLE:
    'El servicio de búsqueda no está disponible ahora. Reintentá en unos minutos.',
  TOKEN_INVALID: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  RATE_LIMIT_EXCEEDED:
    'Demasiadas búsquedas. Esperá unos segundos y reintentá.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado. Ya lo estamos revisando.',
};

function mapError(status: number, body: ProblemDetails | null): ApiError {
  const code = body?.type?.split('/').pop()?.toUpperCase() || 'INTERNAL_ERROR';
  const message =
    ERROR_MESSAGES[code] || body?.detail || 'Error inesperado.';

  const error: ApiError = {
    code,
    message,
    status,
    traceId: body?.trace_id,
  };
  return error;
}

// ── Rate limit header extraction ──

interface RateLimitHeaders {
  limit: string | null;
  remaining: string | null;
  reset: string | null;
  retryAfter: string | null;
}

function extractRateLimitHeaders(response: Response): RateLimitHeaders {
  return {
    limit: response.headers.get('RateLimit-Limit'),
    remaining: response.headers.get('RateLimit-Remaining'),
    reset: response.headers.get('RateLimit-Reset'),
    retryAfter: response.headers.get('Retry-After'),
  };
}

// ── Public API ──

export async function searchHotels(
  params: HotelSearchRequest
): Promise<HotelSearchResponse> {
  const response = await fetch(`${API_URL}/v1/search/hotels`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vacation_rentals: false,
      adults: params.adults ?? 2,
      children: params.children ?? 0,
      children_ages: params.children_ages ?? [],
      ...params,
    }),
  });

  // Extract rate limit headers for potential UI feedback
  const rateLimit = extractRateLimitHeaders(response);

  if (!response.ok) {
    let body: ProblemDetails | null = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON error response — use status-based fallback
    }

    const error = mapError(response.status, body);
    if (rateLimit.retryAfter) {
      error.retryAfter = parseInt(rateLimit.retryAfter, 10);
    }

    // Log trace_id for support reference
    if (error.traceId) {
      console.error(
        `[searchHotels] Error ${error.code} (${error.status}) — trace: ${error.traceId}`
      );
    }

    throw error;
  }

  return response.json() as Promise<HotelSearchResponse>;
}

/**
 * Fetches environment data (location, weather) for the current user.
 * Called once on first page load, cached in React context.
 *
 * GET /v1/environment
 */
export interface EnvironmentResponse {
  location: {
    country: string;
    country_code: string;
    city: string;
    state: string;
    timezone: string;
    currency: string;
    language: string;
  };
  weather: {
    temp_c: number;
    description: string;
    icon: string;
    local_time: string;
  } | null;
}

export async function getEnvironment(): Promise<EnvironmentResponse> {
  const response = await fetch(`${API_URL}/v1/environment`, {
    credentials: 'include',
  });

  if (!response.ok) {
    let body: ProblemDetails | null = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON error response
    }
    throw mapError(response.status, body);
  }

  return response.json() as Promise<EnvironmentResponse>;
}
