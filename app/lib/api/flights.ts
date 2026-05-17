// app/lib/api/flights.ts
//
// Raw fetch client for flight search and flight-details endpoints.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Multi-phase round-trip flow: departure_token (response) → outbound_selection_token (request) → booking_token.

import type {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightDetailsRequest,
  FlightDetailsResponse,
} from '@/app/lib/types/flight';
import {
  FLIGHT_ERROR_MESSAGES,
} from '@/app/lib/constants/flights';
import { getUserPreferences } from '@/app/lib/utils/location';
import { rateLimitStore } from './rate-limit';

// ==========================================
// SINGLE env var
// ==========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// TYPED ERROR CODES — RFC 9457 mapping
// ==========================================
export type FlightErrorCode =
  | 'VALIDATION_ERROR'        // 400
  | 'INVALID_PARAM_RANGE'     // 422
  | 'RATE_LIMIT_EXCEEDED'     // 429
  | 'BOOKING_TOKEN_EXPIRED'   // 404
  | 'PROVIDER_UNAVAILABLE'    // 503
  | 'INTERNAL_ERROR';         // 500

/**
 * Typed error class for flight API errors.
 * Carries machine-readable `code`, HTTP status, human detail, and trace ID.
 * On 429, `retryAfter` carries the Retry-After seconds value.
 */
export class FlightApiError extends Error {
  constructor(
    public readonly code: FlightErrorCode,
    public readonly status: number,
    public readonly detail: string,
    public readonly traceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(`[${code}] ${detail}`);
    this.name = 'FlightApiError';
  }
}

// ==========================================
// HELPERS
// ==========================================

function formatDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  return date.toLocaleDateString('sv-SE');
}

/**
 * Extract rate limit headers from ANY response (success or error)
 * and update the global rateLimitStore.
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
 * Parse a non-ok Response into a typed FlightApiError.
 * Maps RFC 9457 type URI → FlightErrorCode.
 * On 429, also calls rateLimitStore.block() with Retry-After.
 */
async function parseFlightError(response: Response, endpoint: string): Promise<FlightApiError> {
  const body = await response.json().catch(() => ({}));
  const type: string = body?.type || '';
  const status = response.status;

  let code: FlightErrorCode;
  if (status === 400 || type.includes('validation')) {
    code = 'VALIDATION_ERROR';
  } else if (status === 422 || type.includes('invalid-param')) {
    code = 'INVALID_PARAM_RANGE';
  } else if (status === 429 || type.includes('rate_limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (status === 404 || type.includes('booking-token')) {
    code = 'BOOKING_TOKEN_EXPIRED';
  } else if (status === 503 || type.includes('provider')) {
    code = 'PROVIDER_UNAVAILABLE';
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

  return new FlightApiError(
    code,
    status,
    body?.detail || body?.title || `Error ${status}`,
    body?.trace_id || undefined,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

// ==========================================
// SEARCH FLIGHTS
// ==========================================

/**
 * Search flights — supports one_way, round_trip (multi-phase), and multi_city.
 *
 * Raw fetch with credentials:"include" for cookie-based auth.
 * 30s timeout via AbortController.
 * Rate limit headers extracted from every response.
 * RFC 9457 errors mapped to FlightApiError.
 */
export async function searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {
  // 1. Business validation
  if (request.include_airlines?.length && request.exclude_airlines?.length) {
    throw new Error(FLIGHT_ERROR_MESSAGES.AIRLINE_FILTER_CONFLICT);
  }

  const user = getUserPreferences();

  // 2. Build request body
  const apiBody: FlightSearchRequest = {
    ...request,
    outbound_date: formatDate(request.outbound_date),
    return_date: formatDate(request.return_date),
    hl: request.hl || user.hl,
    gl: request.gl || user.gl,
    ...(request.include_airlines?.length ? { include_airlines: request.include_airlines } : {}),
    ...(request.exclude_airlines?.length ? { exclude_airlines: request.exclude_airlines } : {}),
    legs: request.legs || [],
    cursor: request.cursor ?? null,
    limit: request.limit ?? undefined,
  };

  const endpoint = '/v1/search/flights';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Always extract rate limit headers (success or error)
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      throw await parseFlightError(response, endpoint);
    }

    const data: FlightSearchResponse = await response.json();

    if (data.results_state === 'empty') {
      return {
        ...data,
        best_flights: [],
        other_flights: [],
      };
    }

    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw FlightApiError as-is
    if (error instanceof FlightApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// GET FLIGHT DETAILS
// ==========================================

/**
 * Get flight details for a selected flight using its booking_token.
 *
 * Raw fetch with credentials:"include" for cookie-based auth.
 * 15s timeout via AbortController.
 * Route params (departure, arrival, outbound_date) required by SerpAPI for token validation.
 */
export async function getFlightDetails(
  bookingToken: string,
  adults?: number,
  currency?: string,
  routeParams?: {
    departure: string;
    arrival: string;
    outbound_date: string;
    return_date?: string;
  }
): Promise<FlightDetailsResponse> {
  if (!bookingToken) throw new Error('Se requiere booking_token');

  const user = getUserPreferences();

  const apiBody: FlightDetailsRequest = {
    booking_token: bookingToken,
    adults: adults || 1,
    hl: user.hl,
    gl: user.gl,
    currency: currency || 'EUR',
    departure: routeParams?.departure,
    arrival: routeParams?.arrival,
    outbound_date: routeParams?.outbound_date,
    return_date: routeParams?.return_date,
  };

  const endpoint = '/v1/search/flight-details';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Always extract rate limit headers
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      throw await parseFlightError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw FlightApiError as-is
    if (error instanceof FlightApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}
