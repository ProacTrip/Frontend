// app/lib/api/saved-searches.ts
//
// Raw fetch client for saved searches management.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Follows canonical user.ts pattern: typed errors, rate limit extraction,
// AbortController timeouts, direct fetch().
//
// 5 endpoints:
//   POST   /v1/user/saved-searches           — create
//   GET    /v1/user/saved-searches           — list
//   PUT    /v1/user/saved-searches/:id       — update
//   DELETE /v1/user/saved-searches/:id       — delete
//   PUT    /v1/user/saved-searches/:id/alert — toggle price alert

import type {
  SavedSearch,
  CreateSavedSearchBody,
  UpdateSavedSearchBody,
  SavedSearchListResponse,
  ToggleAlertResponse,
} from '@/app/lib/types/saved-search';
import { rateLimitStore } from './rate-limit';
import { UserApiError } from './user';
import type { UserErrorCode } from './user';

// ==========================================
// SINGLE env var
// ==========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// HELPERS (mirrored from user.ts — private helpers)
// ==========================================

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
 * Parse a non-ok Response into a typed UserApiError.
 * Maps RFC 9457 type URI → UserErrorCode.
 * On 429, also calls rateLimitStore.block() with Retry-After.
 * Always calls extractRateLimitHeaders before throwing.
 */
async function raiseForStatus(response: Response, endpoint: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  const type: string = body?.type || '';
  const status = response.status;

  let code: UserErrorCode;

  // 1. Rate limit — highest priority
  if (status === 429 || type.includes('rate_limit') || type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // 2. Type URI-based mapping (specific error codes — saved-searches first, then shared)
  else if (type.includes('duplicate-search')) {
    code = 'DUPLICATE_SEARCH';
  } else if (type.includes('search-not-found')) {
    code = 'SEARCH_NOT_FOUND';
  } else if (type.includes('invalid-enum')) {
    code = 'INVALID_ENUM';
  } else if (type.includes('invalid-mime-type')) {
    code = 'INVALID_MIME_TYPE';
  } else if (type.includes('file-too-large')) {
    code = 'FILE_TOO_LARGE';
  } else if (type.includes('file-not-found')) {
    code = 'FILE_NOT_FOUND';
  } else if (type.includes('token-invalid')) {
    code = 'TOKEN_INVALID';
  } else if (type.includes('validation')) {
    code = 'VALIDATION_ERROR';
  }
  // 3. Status-based fallback
  else if (status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (status === 401) {
    code = 'TOKEN_INVALID';
  } else if (status === 404) {
    code = 'SEARCH_NOT_FOUND';
  } else if (status === 409) {
    code = 'DUPLICATE_SEARCH';
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

  throw new UserApiError(
    code,
    status,
    body?.detail || body?.title || `Error ${status}`,
    body?.trace_id || undefined,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

// ==========================================
// 2.2 createSavedSearch()
// ==========================================

/**
 * Create a new saved search.
 *
 * On 409 DUPLICATE_SEARCH, returns { conflict: true } instead of throwing
 * (same pattern as addFavorite — duplicate is a recoverable business state).
 *
 * Timeout: 10s.
 */
export async function createSavedSearch(
  body: CreateSavedSearchBody,
): Promise<SavedSearch | { conflict: true }> {
  const endpoint = '/v1/user/saved-searches';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await raiseForStatus(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Duplicate search is a recoverable business state, not an error
    if (error instanceof UserApiError && error.code === 'DUPLICATE_SEARCH') {
      return { conflict: true };
    }

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.3 listSavedSearches()
// ==========================================

/**
 * List all saved searches for the authenticated user.
 *
 * Timeout: 10s.
 * Returns: SavedSearchListResponse (wraps SavedSearch[]).
 */
export async function listSavedSearches(): Promise<SavedSearchListResponse> {
  const endpoint = '/v1/user/saved-searches';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await raiseForStatus(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.4 updateSavedSearch()
// ==========================================

/**
 * Update a saved search (partial update — only sent fields are changed).
 *
 * Timeout: 10s.
 * Throws UserApiError(SEARCH_NOT_FOUND) on 404.
 * Throws UserApiError(DUPLICATE_SEARCH) on 409.
 */
export async function updateSavedSearch(
  id: string,
  body: UpdateSavedSearchBody,
): Promise<SavedSearch> {
  const endpoint = `/v1/user/saved-searches/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await raiseForStatus(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.5 deleteSavedSearch()
// ==========================================

/**
 * Delete a saved search by ID.
 *
 * Timeout: 10s.
 * Throws UserApiError(SEARCH_NOT_FOUND) on 404.
 */
export async function deleteSavedSearch(id: string): Promise<{ message: string }> {
  const endpoint = `/v1/user/saved-searches/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await raiseForStatus(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.6 togglePriceAlert()
// ==========================================

/**
 * Toggle the price alert for a saved search.
 *
 * Timeout: 10s.
 * Body: { enabled: boolean }
 * Returns: { search_id, alert_enabled, message }
 * Throws UserApiError(SEARCH_NOT_FOUND) on 404.
 */
export async function togglePriceAlert(
  id: string,
  enabled: boolean,
): Promise<ToggleAlertResponse> {
  const endpoint = `/v1/user/saved-searches/${encodeURIComponent(id)}/alert`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enabled }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await raiseForStatus(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}
