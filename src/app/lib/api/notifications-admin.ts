// app/lib/api/notifications-admin.ts
//
// Raw fetch client for admin notification templates and manual sending.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Follows canonical user.ts pattern: typed errors, rate limit extraction,
// AbortController timeouts, direct fetch() instead of apiFetch() wrapper.

import type {
  NotificationTemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ToggleTemplateRequest,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@/app/lib/types/notification-admin';
import {
  UserApiError,
  API_URL,
  extractRateLimitHeaders,
  parseUserError,
} from '@/app/lib/api/user';

// ==========================================
// TEMPLATES (Admin)
// ==========================================

/**
 * Listar plantillas de notificación.
 *
 * GET /v1/notifications/templates
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function listTemplates(
  activeOnly: boolean = true,
): Promise<NotificationTemplateListResponse> {
  const endpoint = '/v1/notifications/templates';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const url = new URL(`${API_URL}${endpoint}`);
    url.searchParams.set('active_only', String(activeOnly));

    const response = await fetch(url.toString(), {
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
 * Crear nueva plantilla de notificación.
 *
 * POST /v1/notifications/templates
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function createTemplate(
  data: CreateTemplateRequest,
): Promise<{ message: string }> {
  const endpoint = '/v1/notifications/templates';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
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
 * Actualizar plantilla existente.
 *
 * PUT /v1/notifications/templates
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function updateTemplate(
  data: UpdateTemplateRequest,
): Promise<{ message: string }> {
  const endpoint = '/v1/notifications/templates';
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
 * Activar / Desactivar plantilla.
 *
 * PUT /v1/notifications/templates/toggle
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function toggleTemplate(
  data: ToggleTemplateRequest,
): Promise<{ message: string }> {
  const endpoint = '/v1/notifications/templates/toggle';
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

// ==========================================
// ENVÍO MANUAL (Admin)
// ==========================================

/**
 * Enviar notificación a un usuario específico.
 *
 * POST /v1/notifications/send
 * 10s timeout via AbortController.
 * Throws UserApiError on failure.
 */
export async function sendNotification(
  data: SendNotificationRequest,
): Promise<SendNotificationResponse> {
  const endpoint = '/v1/notifications/send';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
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
