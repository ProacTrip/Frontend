// app/lib/api/notifications.ts
//
// Raw fetch client for user notifications.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Follows canonical user.ts pattern: typed errors, rate limit extraction,
// AbortController timeouts, direct fetch() instead of apiFetch() wrapper.
// listUserNotifications preserves graceful degradation (empty list on error).

import type {
  UserNotificationListResponse,
  UserNotificationListParams,
  MarkReadRequest,
} from '@/app/lib/types/notification';
import {
  UserApiError,
  API_URL,
  extractRateLimitHeaders,
  parseUserError,
} from '@/app/lib/api/user';

// ==========================================
// NOTIFICACIONES DE USUARIO
// ==========================================

/**
 * Listar notificaciones del usuario autenticado.
 *
 * GET /v1/notifications
 * Graceful degradation: returns empty list on any error instead of throwing.
 * Rate limit headers extracted from every response.
 * 10s timeout via AbortController.
 */
export async function listUserNotifications(
  params: UserNotificationListParams = {},
): Promise<UserNotificationListResponse> {
  const endpoint = '/v1/notifications';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const url = new URL(`${API_URL}${endpoint}`);
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    if (params.offset) url.searchParams.set('offset', String(params.offset));
    if (params.status) url.searchParams.set('status', params.status);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      console.warn('Notifications endpoint returned', response.status);
      return { notifications: [], total: 0 };
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn('Notifications request timed out');
      return { notifications: [], total: 0 };
    }

    console.warn('Notifications endpoint unavailable:', err);
    return { notifications: [], total: 0 };
  }
}

/**
 * Marcar una notificación como leída.
 *
 * PUT /v1/notifications/read
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function markNotificationRead(
  data: MarkReadRequest,
): Promise<{ message: string }> {
  const endpoint = '/v1/notifications/read';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

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

    return response.json();
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
 * Marcar todas las notificaciones como leídas.
 *
 * PUT /v1/notifications/read-all
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const endpoint = '/v1/notifications/read-all';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseUserError(response, endpoint);
    }

    return response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}
