// components/notifications/NotificationBell.tsx
// Campana de notificaciones con badge, dropdown y polling cada 60s

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Mail,
  MessageSquare
} from 'lucide-react';
import { listUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/lib/api';
import type { UserNotification } from '@/app/lib/types/notification';

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CORREGIDO: Contador derivado del array, nunca desincronizado
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === 'delivered').length,
    [notifications]
  );

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const res = await listUserNotifications({ limit: 5 });
      setNotifications(res.notifications || []);
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    }
  }, []);

  // Polling cada 60s + carga inicial
  useEffect(() => {
    loadNotifications();
    intervalRef.current = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadNotifications]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ✅ CORREGIDO: Solo eliminar de la UI si la API responde OK
  const handleMarkOne = async (id: string) => {
    try {
      await markNotificationRead({ notification_id: id });
      // Solo ahora, que sabemos que el backend lo procesó, quitamos de la lista
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error('Error marcando notificación:', e);
      // La notificación sigue visible → el usuario puede reintentar
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications([]);
    } catch (e) {
      console.error('Error marcando todas:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const getIcon = (channel: string) => {
    return channel === 'email' ? (
      <Mail className="w-4 h-4 text-sky-500" />
    ) : (
      <MessageSquare className="w-4 h-4 text-orange-500" />
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campana */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#c54141] text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex items-center gap-1 text-xs text-[#c54141] hover:text-[#a93535] font-medium disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                Todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
                >
                  <div className="mt-0.5 shrink-0">{getIcon(notif.channel)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{notif.subject}</p>
                    <p
                      className="text-xs text-gray-500 mt-0.5 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: notif.content }}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{formatDate(notif.created_at)}</span>
                      {notif.status === 'delivered' && (
                        <button
                          onClick={() => handleMarkOne(notif.id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-[#c54141] hover:underline transition-opacity"
                        >
                          <Check className="w-3 h-3" />
                          Leído
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                setOpen(false);
                router.push('/home/notifications');
              }}
              className="w-full text-center text-xs font-medium text-gray-600 hover:text-[#c54141] transition-colors"
            >
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}