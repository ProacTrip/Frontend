'use client';

import { useState, useCallback } from 'react';
import type { NotificationPreferences, NotificationChannelPrefs } from '@/lib/api/types';
import { updateNotificationPreference } from '@/lib/api/user';

interface NotificationTogglesProps {
  preferences: NotificationPreferences;
}

const NOTIFICATION_TYPES = [
  { key: 'booking_confirmation', label: 'Confirmación de reserva' },
  { key: 'flight_reminder', label: 'Recordatorio de vuelo' },
  { key: 'promotional', label: 'Promociones' },
] as const;

const CHANNELS = [
  { key: 'email' as const, label: 'Email' },
  { key: 'websocket' as const, label: 'En vivo' },
  { key: 'sms' as const, label: 'SMS' },
] as const;

export function NotificationToggles({ preferences }: NotificationTogglesProps) {
  const [state, setState] = useState<NotificationPreferences>(preferences);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    async (notificationType: string, channel: 'email' | 'websocket') => {
      // Optimistic update
      setError(null);
      const prevEnabled = state[notificationType]?.[channel] ?? false;
      setState((prev) => {
        const current = prev[notificationType] ?? { email: false, sms: false, websocket: false };
        return {
          ...prev,
          [notificationType]: { ...current, [channel]: !prevEnabled },
        };
      });

      try {
        await updateNotificationPreference({
          notification_type: notificationType,
          channel,
          enabled: !prevEnabled,
        });
      } catch (err: unknown) {
        // Rollback on error
        setState((prev) => {
          const current = prev[notificationType] ?? { email: false, sms: false, websocket: false };
          return {
            ...prev,
            [notificationType]: { ...current, [channel]: prevEnabled },
          };
        });
        const detail = (err as { detail?: string; message?: string })?.detail
          || (err as { message?: string })?.message
          || 'Error al actualizar la preferencia.';
        setError(detail);
      }
    },
    [state]
  );

  return (
    <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
      <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
        Notificaciones
      </h2>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-error-container text-error" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-outline">
              <th className="text-left py-2 pr-4 font-medium text-ink-muted">Tipo</th>
              <th className="text-center py-2 px-3 font-medium text-ink-muted">Email</th>
              <th className="text-center py-2 px-3 font-medium text-ink-muted">En vivo</th>
              <th className="text-center py-2 pl-3 font-medium text-ink-muted">SMS</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((nt) => {
              const channels: NotificationChannelPrefs = state[nt.key] ?? {
                email: false,
                sms: false,
                websocket: false,
              };
              return (
                <tr key={nt.key} className="border-b border-paper-outline/50">
                  <td className="py-3 pr-4 text-ink font-medium">{nt.label}</td>
                  {CHANNELS.map((ch) => {
                    const isSms = ch.key === 'sms';
                    const enabled = channels[ch.key];
                    return (
                      <td key={ch.key} className="text-center py-3 px-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={isSms}
                            onChange={() => {
                              if (!isSms) toggle(nt.key, ch.key as 'email' | 'websocket');
                            }}
                            className="sr-only peer"
                          />
                          <div
                            className={`w-10 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral/30 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                              isSms
                                ? 'bg-paper-outline cursor-not-allowed opacity-50'
                                : enabled
                                  ? 'bg-coral peer-checked:after:translate-x-full'
                                  : 'bg-paper-container'
                            }`}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-faint">
        * SMS no disponible aún. Las notificaciones en vivo requieren tener la aplicación abierta.
      </p>
    </div>
  );
}
