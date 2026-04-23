// app/lib/types/notification-admin.ts
//Utilidad: Tipos para gestión de plantillas y envío manual (solo ADMIN)
// FIEL a la API de Marco Aurelio (Notification Module)

// ==========================================
// 1. PLANTILLAS (Templates)
// ==========================================

export type NotificationType = 'transactional' | 'marketing' | 'system';
export type NotificationChannel = 'email' | 'sms';

/**
 * Plantilla tal cual devuelve el listado (GET /templates).
 * NOTA: El backend NO incluye 'body' en la lista para ser ligero.
 */
export interface NotificationTemplate {
  id: string;
  code: string;           // Clave única ej: "welcome_email"
  name: string;           // Nombre humano ej: "Welcome Email"
  subject: string;
  type: NotificationType;
  channel: NotificationChannel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateListResponse {
  templates: NotificationTemplate[];
}

// ==========================================
// 2. CREAR / ACTUALIZAR / TOGGLE
// ==========================================

export interface CreateTemplateRequest {
  code: string;
  name: string;
  subject: string;
  body: string;           // HTML o texto con sintaxis Go template
  type: NotificationType;
  channel: NotificationChannel;
  is_active?: boolean;    // Default: true en backend
}

export interface UpdateTemplateRequest {
  id: string;             // Requerido para identificar cuál actualizar
  code?: string;
  name?: string;
  subject?: string;
  body?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  is_active?: boolean;
}

export interface ToggleTemplateRequest {
  id: string;
  active: boolean;        // true = activar, false = desactivar
}

// ==========================================
// 3. ENVÍO MANUAL (Admin)
// ==========================================

/**
 * POST /v1/notifications/send
 * Solo permite enviar a UN usuario específico por UUID.
 * No hay broadcast ni envío por rol.
 */
export interface SendNotificationRequest {
  user_id: string;        // UUID del destinatario
  template_code: string;  // ej: "welcome_email"
  channel: NotificationChannel;
  data?: Record<string, string>;  // Variables del template ej: { "name": "John" }
  recipient?: string;     // Override de email/teléfono (opcional)
}

export interface SendNotificationResponse {
  message: string;
}