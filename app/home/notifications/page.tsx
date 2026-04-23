// app/home/notifications/page.tsx
// Página completa de notificaciones del usuario autenticado

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Mail,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { listUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/lib/api';
import type { UserNotification, NotificationStatus } from '@/app/lib/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset };
      if (statusFilter) params.status = statusFilter;

      const res = await listUserNotifications(params);
      setNotifications(res.notifications || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, statusFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkOne = async (id: string) => {
    try {
      await markNotificationRead({ notification_id: id });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marcando notificación:', e);
    }
  };

  const handleMarkAll = async () => {
    if (!confirm('¿Marcar todas las notificaciones como leídas?')) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications([]);
      setTotal(0);
    } catch (e) {
      console.error('Error marcando todas:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const getIcon = (channel: string) => {
    return channel === 'email' ? (
      <Mail className="w-5 h-5 text-sky-500" />
    ) : (
      <MessageSquare className="w-5 h-5 text-orange-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600 border-gray-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      sent: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      bounced: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${configs[status] || configs.pending}`}>
        {status}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-[#c54141]" />
                Notificaciones
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {total} notificación{total !== 1 ? 'es' : ''} en total
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-[#c54141] hover:text-[#c54141] transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por estado</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['', 'pending', 'processing', 'sent', 'delivered', 'failed', 'bounced'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-[#c54141] text-white border-[#c54141]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s === '' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#c54141]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No hay notificaciones</h3>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter
                ? `No tienes notificaciones con estado "${statusFilter}"`
                : 'Tu bandeja de notificaciones está vacía'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">{getIcon(notif.channel)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{notif.subject}</h3>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(notif.status)}</div>
                    </div>

                    <div
                      className="text-sm text-gray-600 mt-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: notif.content }}
                    />

                    {notif.sent_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Enviado: {formatDate(notif.sent_at)}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 capitalize">
                        {notif.type} · {notif.channel}
                      </span>
                      
                      {notif.status === 'delivered' && (
                        <button
                          onClick={() => handleMarkOne(notif.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#c54141] hover:text-[#a93535] transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación simple */}
        {!loading && total > limit && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              disabled={offset === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Mostrando {offset + 1}-{Math.min(offset + limit, total)} de {total}
            </span>
            <button
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={offset + limit >= total}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}