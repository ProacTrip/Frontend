// app/lib/api/user.ts
//
// Raw fetch client for user profile, preferences, medical, avatars, and favorites.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Follows canonical flights.ts/hotels.ts pattern: typed errors, rate limit extraction,
// AbortController timeouts, direct fetch() instead of apiFetch() wrapper.

import type {
  ProfileResponse,
  UpdateProfileBody,
  LocaleUpdate,
  UpdateTravelPreferencesBody,
  MedicalProfile,
  UpdateMedicalProfileBody,
  UpdateNotificationPreferenceBody,
  AvatarUploadUrl,
  EntityType,
  CreateFavoriteBody,
  FavoritesResponse,
  AddFavoriteResponse,
  PendingConflictsResponse,
  ResolveConflictBody,
  Channel,
  NotificationPreference,
  TravelPreferences,
} from '@/app/lib/types/user';
import { rateLimitStore } from './rate-limit';

// ==========================================
// SINGLE env var
// ==========================================
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// TYPED ERROR CODES — RFC 9457 mapping
// ==========================================
export type UserErrorCode =
  // Profile (6)
  | 'PROFILE_NOT_FOUND'
  | 'INVALID_ENUM'
  | 'INVALID_COUNTRY_CODE'
  | 'INVALID_TIMEZONE'
  | 'INVALID_LANGUAGE_CODE'
  | 'INVALID_CURRENCY_CODE'
  // Medical (4)
  | 'MEDICAL_PROFILE_NOT_FOUND'
  | 'DECRYPTION_ERROR'
  | 'INVALID_BLOOD_TYPE'
  | 'ENCRYPTION_ERROR'
  // Medical Conflicts (3)
  | 'PENDING_UPDATE_NOT_FOUND'
  | 'PENDING_UPDATE_EXPIRED'
  | 'INVALID_PENDING_ACTION'
  // Avatars (3)
  | 'INVALID_MIME_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_NOT_FOUND'
  // Favorites (3)
  | 'DUPLICATE_FAVORITE'
  | 'INVALID_ENTITY_TYPE'
  | 'FAVORITE_NOT_FOUND'
  // Documents (3)
  | 'INVALID_FILE_TYPE'
  | 'DOCUMENT_NOT_FOUND'
  | 'DOCUMENT_NOT_READY'
  // Saved Searches (2)
  | 'DUPLICATE_SEARCH'
  | 'SEARCH_NOT_FOUND'
  // Common (3)
  | 'TOKEN_INVALID'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  // Rate limiting (1)
  | 'RATE_LIMIT_EXCEEDED'
  // Admin / Management (1)
  | 'PERMISSION_DENIED';

/**
 * Typed error class for user API errors.
 * Carries machine-readable `code`, HTTP status, human detail, and trace ID.
 * On 429, `retryAfter` carries the Retry-After seconds value.
 */
export class UserApiError extends Error {
  constructor(
    public readonly code: UserErrorCode,
    public readonly status: number,
    public readonly detail: string,
    public readonly traceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(`[${code}] ${detail}`);
    this.name = 'UserApiError';
  }
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Extract rate limit headers from ANY response (success or error)
 * and update the global rateLimitStore.
 */
export function extractRateLimitHeaders(response: Response, endpoint: string): void {
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
export async function parseUserError(response: Response, endpoint: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  const type: string = body?.type || '';
  const status = response.status;

  let code: UserErrorCode;

  // 1. Rate limit — highest priority
  if (status === 429 || type.includes('rate_limit') || type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // 1b. PERMISSION_DENIED — admin/management endpoints
  else if (status === 403 || type.includes('permission-denied') || type.includes('missing-permission') || type.includes('forbidden')) {
    code = 'PERMISSION_DENIED';
  }
  // 2. Type URI-based mapping (specific error codes)
  else if (type.includes('invalid-enum')) {
    code = 'INVALID_ENUM';
  } else if (type.includes('invalid-country-code')) {
    code = 'INVALID_COUNTRY_CODE';
  } else if (type.includes('invalid-timezone')) {
    code = 'INVALID_TIMEZONE';
  } else if (type.includes('invalid-language-code')) {
    code = 'INVALID_LANGUAGE_CODE';
  } else if (type.includes('invalid-currency-code')) {
    code = 'INVALID_CURRENCY_CODE';
  } else if (type.includes('invalid-blood-type')) {
    code = 'INVALID_BLOOD_TYPE';
  } else if (type.includes('invalid-mime-type')) {
    code = 'INVALID_MIME_TYPE';
  } else if (type.includes('file-too-large')) {
    code = 'FILE_TOO_LARGE';
  } else if (type.includes('invalid-entity-type')) {
    code = 'INVALID_ENTITY_TYPE';
  } else if (type.includes('duplicate-search')) {
    code = 'DUPLICATE_SEARCH';
  } else if (type.includes('duplicate-favorite')) {
    code = 'DUPLICATE_FAVORITE';
  } else if (type.includes('medical-profile-not-found')) {
    code = 'MEDICAL_PROFILE_NOT_FOUND';
  } else if (type.includes('favorite-not-found')) {
    code = 'FAVORITE_NOT_FOUND';
  } else if (type.includes('file-not-found')) {
    code = 'FILE_NOT_FOUND';
  } else if (type.includes('invalid-file-type')) {
    code = 'INVALID_FILE_TYPE';
  } else if (type.includes('document-not-found')) {
    code = 'DOCUMENT_NOT_FOUND';
  } else if (type.includes('document-not-ready')) {
    code = 'DOCUMENT_NOT_READY';
  } else if (type.includes('search-not-found')) {
    code = 'SEARCH_NOT_FOUND';
  } else if (type.includes('profile-not-found')) {
    code = 'PROFILE_NOT_FOUND';
  } else if (type.includes('decryption')) {
    code = 'DECRYPTION_ERROR';
  } else if (type.includes('encryption')) {
    code = 'ENCRYPTION_ERROR';
  } else if (type.includes('pending-update-not-found')) {
    code = 'PENDING_UPDATE_NOT_FOUND';
  } else if (type.includes('pending-update-expired')) {
    code = 'PENDING_UPDATE_EXPIRED';
  } else if (type.includes('invalid-pending-action')) {
    code = 'INVALID_PENDING_ACTION';
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
    code = 'PROFILE_NOT_FOUND';
  } else if (status === 409) {
    code = 'DUPLICATE_FAVORITE';
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
// PERFIL PRINCIPAL
// ==========================================

/**
 * Get user profile, travel preferences, and notification preferences.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * Rate limit headers extracted from every response.
 */
export async function getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
  const endpoint = '/v1/user/profile';
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: effectiveSignal,
    });

    clearTimeout(timeoutId);

    // Always extract rate limit headers
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }

    return adaptProfileResponse(await response.json());
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw UserApiError as-is
    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/** Adapta la respuesta plana del backend al formato ProfileResponse del frontend. */
// deno-lint-ignore no-explicit-any
function adaptProfileResponse(raw: Record<string, unknown>): ProfileResponse {
  const loc = (raw.location as Record<string, unknown>) || {};
  // Mapear location.timezone → timezone_name, etc.
  const adapted = {
    ...raw,
    timezone_name: (loc.timezone as string) || (raw.timezone_name as string | null) || null,
    language_code: (loc.language as string) || (raw.language_code as string | null) || null,
    currency_code: (loc.currency as string) || (raw.currency_code as string | null) || null,
  };

  // Convertir notification_preferences de objeto {type: {channel: bool}} a array NotificationPreference[]
  const notification_preferences: NotificationPreference[] = Object.entries(
    (raw.notification_preferences as Record<string, Record<string, boolean>>) || {}
  ).flatMap(([type, channels]) =>
    Object.entries(channels).map(([channel, enabled]) => ({
      notification_type: type,
      channel: channel as Channel,
      enabled,
    }))
  );

  return {
    profile: adapted as ProfileResponse['profile'],
    travel_preferences: raw.travel_preferences as TravelPreferences | null,
    notification_preferences,
  };
}

/**
 * Update user profile fields (name, gender, nationality, etc.).
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function updateProfile(data: UpdateProfileBody, signal?: AbortSignal): Promise<void> {
  const endpoint = '/v1/user/profile';
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: effectiveSignal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }
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
// LOCALIZACIÓN
// ==========================================

/**
 * Update user locale settings (timezone, language, currency).
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function updateLocale(data: LocaleUpdate): Promise<void> {
  const endpoint = '/v1/user/profile/locale';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }
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
// PREFERENCIAS DE VIAJE
// ==========================================

/**
 * Update travel preferences (class, seat, meals, airlines, etc.).
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function updateTravelPreferences(
  data: UpdateTravelPreferencesBody
): Promise<void> {
  const endpoint = '/v1/user/profile/travel-preferences';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }
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
// PERFIL MÉDICO
// ==========================================

/**
 * Unwrap MedicalField<T> fields from the raw backend response.
 * Backend returns {value, source, updated_at} for each traceable field.
 * This adapter extracts just the .value for presentation to MedicalForm.
 */
export function adaptMedicalProfile(raw: Record<string, unknown>): Record<string, unknown> {
  const unwrap = (field: unknown): string | null => {
    if (field && typeof field === 'object' && 'value' in field) {
      return (field as { value: unknown }).value as string | null;
    }
    return field as string | null;
  };

  return {
    blood_type: unwrap(raw.blood_type),
    allergies: unwrap(raw.allergies),
    medications: unwrap(raw.medications),
    conditions: unwrap(raw.conditions),
    vaccinations: unwrap(raw.vaccinations),
    emergency_contact: unwrap(raw.emergency_contact),
    insurance_info: unwrap(raw.insurance_info),
    is_shared: raw.is_shared,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

/**
 * Get medical profile. Returns null when the user has no medical profile (404).
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * Preserves caller contract: null for missing profile, throws for other errors.
 */
export async function getMedicalProfile(): Promise<MedicalProfile | null> {
  const endpoint = '/v1/user/profile/medical';
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
      await parseUserError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError && error.code === 'MEDICAL_PROFILE_NOT_FOUND') {
      return null;
    }

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * Create or update medical profile.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function updateMedicalProfile(
  data: UpdateMedicalProfileBody
): Promise<void> {
  const endpoint = '/v1/user/profile/medical';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }
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
// NOTIFICACIONES
// ==========================================

/**
 * Update a notification preference (channel + type + enabled).
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function updateNotificationPreference(
  data: UpdateNotificationPreferenceBody
): Promise<void> {
  const endpoint = '/v1/user/profile/notifications';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }
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
// AVATARES
// ==========================================

/**
 * Request a presigned R2 upload URL for a new avatar.
 *
 * Direct fetch with credentials:"include".
 * 15s timeout — involves backend→R2 IAM call.
 */
export async function getUploadAvatarUrl(file: File): Promise<AvatarUploadUrl> {
  const endpoint = '/v1/user/profile/avatar';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      }),
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

/**
 * Upload file directly to R2 presigned URL (cross-origin, no credentials).
 * Unchanged from original — already direct fetch to external storage.
 */
export async function uploadAvatarToR2(upload_url: string, file: File): Promise<void> {
  const res = await fetch(upload_url, {
    method: 'PUT',
    body: file,
  });
  if (!res.ok) throw new Error(`Error al subir imagen: ${res.status}`);
}

/**
 * Confirm avatar upload after R2 PUT completes.
 * Triggers async image processing on the backend.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function confirmAvatarUpload(storage_key: string): Promise<string> {
  const endpoint = '/v1/user/profile/avatar/confirm';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_key }),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }

    const data = await response.json();
    return data.avatar_url || data.message;
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
// CONFLICTOS MÉDICOS
// ==========================================

/**
 * List pending medical field conflicts from OCR/NLP document processing.
 *
 * GET /v1/user/profile/medical/pending
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * Returns empty array on 404 (no pending conflicts is not an error).
 */
export async function listMedicalConflicts(): Promise<PendingConflictsResponse> {
  const endpoint = '/v1/user/profile/medical/pending';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
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

    // No pending conflicts = empty array, not an error
    if (error instanceof UserApiError && error.code === 'PENDING_UPDATE_NOT_FOUND') {
      return { conflicts: [] };
    }

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * Resolve a pending medical conflict by accepting, rejecting, or providing a custom value.
 *
 * POST /v1/user/profile/medical/pending/resolve
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * Body: { pending_update_id, action, custom_value? }
 * Returns { message: string } on success.
 * Throws UserApiError on PENDING_UPDATE_NOT_FOUND, PENDING_UPDATE_EXPIRED, INVALID_PENDING_ACTION.
 */
export async function resolveMedicalConflict(
  body: ResolveConflictBody
): Promise<{ message: string }> {
  const endpoint = '/v1/user/profile/medical/pending/resolve';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
// FAVORITOS
// ==========================================

/**
 * List user favorites, optionally filtered by entity type.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * No Content-Type header (GET request).
 */
export async function listFavorites(entityType?: EntityType, signal?: AbortSignal): Promise<FavoritesResponse> {
  let url = '/v1/user/favorites';
  if (entityType) {
    url += `?entity_type=${encodeURIComponent(entityType)}`;
  }

  const endpoint = url;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: effectiveSignal,
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

/**
 * Add a favorite. Returns the created favorite info, or { conflict: true }
 * when the favorite already exists (409 DUPLICATE_FAVORITE).
 * Duplicate favorite is a recoverable business state — not an error.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 */
export async function addFavorite(
  body: CreateFavoriteBody,
  signal?: AbortSignal
): Promise<AddFavoriteResponse | { conflict: true }> {
  const endpoint = '/v1/user/favorites';
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: effectiveSignal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Duplicate favorite is a recoverable business state, not an error
    if (error instanceof UserApiError && error.code === 'DUPLICATE_FAVORITE') {
      return { conflict: true };
    }

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

/**
 * Delete a favorite by ID.
 *
 * Direct fetch with credentials:"include".
 * 10s timeout via AbortController.
 * No Content-Type header (DELETE request).
 */
export async function deleteFavorite(favoriteId: string, signal?: AbortSignal): Promise<{ message: string }> {
  const endpoint = `/v1/user/favorites/${favoriteId}`;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: effectiveSignal,
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
