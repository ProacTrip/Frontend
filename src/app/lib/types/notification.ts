// app/lib/types/notification.ts
//Utilidad: Tipos para notificaciones del usuario autenticado (NO admin)
// FIEL a la API de Marco Aurelio (Notification Module)

// ==========================================
// 1. ESTADOS Y CANALES
// ==========================================

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'bounced';
export type NotificationType = 'transactional' | 'marketing' | 'system';
export type NotificationChannel = 'email' | 'sms';

// ==========================================
// 2. NOTIFICACIÓN DE USUARIO
// ==========================================

export interface UserNotification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  content: string;
  status: NotificationStatus;
  sent_at?: string;
  created_at: string;
}

export interface UserNotificationListResponse {
  notifications: UserNotification[];
  total: number;
}

// ==========================================
// 3. PARÁMETROS Y REQUESTS
// ==========================================

export interface UserNotificationListParams {
  limit?: number;
  offset?: number;
  status?: NotificationStatus;
}

export interface MarkReadRequest {
  notification_id: string;
}