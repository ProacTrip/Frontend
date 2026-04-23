// app/lib/api/notifications.ts
//Utilidad: Funciones para notificaciones del usuario autenticado

import { apiFetch } from './auth';
import type {
  UserNotificationListResponse,
  UserNotificationListParams,
  MarkReadRequest,
} from '@/app/lib/types/notification';

// ==========================================
// NOTIFICACIONES DE USUARIO
// ==========================================

/**
 * 📥 Listar notificaciones del usuario autenticado
 */
export async function listUserNotifications(params: UserNotificationListParams = {}): Promise<UserNotificationListResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.status) query.set('status', params.status);

  const queryString = query.toString();
  const url = queryString ? `/api/v1/notifications?${queryString}` : '/api/v1/notifications'; 

  const response = await apiFetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * 👁️ Marcar una notificación como leída
 */
export async function markNotificationRead(data: MarkReadRequest): Promise<{ message: string }> {
  const response = await apiFetch('/api/v1/notifications/read', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * 👁️ Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const response = await apiFetch('/api/v1/notifications/read-all', {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}