// app/lib/api/notifications-admin.ts
//Utilidad: Funciones CRUD de plantillas y envío manual de notificaciones (ADMIN)

import { apiFetch } from './auth';
import type {
  NotificationTemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ToggleTemplateRequest,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@/app/lib/types/notification-admin';

// ==========================================
// TEMPLATES (Admin)
// ==========================================

/**
 * 📋 Listar plantillas de notificación
 */
export async function listTemplates(activeOnly: boolean = true): Promise<NotificationTemplateListResponse> {
  const query = new URLSearchParams();
  query.set('active_only', String(activeOnly));

  const response = await apiFetch(`/api/v1/notifications/templates?${query.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ➕ Crear nueva plantilla
 */
export async function createTemplate(data: CreateTemplateRequest): Promise<{ message: string }> {
  const response = await apiFetch('/api/v1/notifications/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

/**
 * ✏️ Actualizar plantilla existente
 */
export async function updateTemplate(data: UpdateTemplateRequest): Promise<{ message: string }> {
  const response = await apiFetch('/api/v1/notifications/templates', {
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
 * 🔄 Activar / Desactivar plantilla
 */
export async function toggleTemplate(data: ToggleTemplateRequest): Promise<{ message: string }> {
  const response = await apiFetch('/api/v1/notifications/templates/toggle', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// ENVÍO MANUAL (Admin)
// ==========================================

/**
 * 📨 Enviar notificación a un usuario específico
 */
export async function sendNotification(data: SendNotificationRequest): Promise<SendNotificationResponse> {
  const response = await apiFetch('/api/v1/notifications/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}