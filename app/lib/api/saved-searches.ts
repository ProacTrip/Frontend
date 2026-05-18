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
  CreateSavedSearchResponse,
  UpdateSavedSearchResponse,
} from '@/app/lib/types/saved-search';
import { rateLimitStore } from './rate-limit';
import { UserApiError, parseUserError } from './user';

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
): Promise<CreateSavedSearchResponse | { conflict: true }> {
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
      await parseUserError(response, endpoint);
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
      await parseUserError(response, endpoint);
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
): Promise<UpdateSavedSearchResponse> {
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
      await parseUserError(response, endpoint);
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
      await parseUserError(response, endpoint);
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
      await parseUserError(response, endpoint);
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
