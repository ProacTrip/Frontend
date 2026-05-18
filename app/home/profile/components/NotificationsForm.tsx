'use client';

import { useState, useCallback } from 'react';
import { updateNotificationPreference } from '@/app/lib/api';
import { NotificationPreference, Channel } from '@/app/lib/types/user';
import { Bell, Mail, MessageSquare, Wifi, AlertCircle } from 'lucide-react';

interface Props {
  prefs: NotificationPreference[];
  onSave: () => void;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: typeof Mail; color: string }> = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600' },
  websocket: { label: 'Push', icon: Wifi, color: 'text-purple-600' },
};

const NOTIFICATION_TYPES: Record<string, { label: string; description: string }> = {
  booking_confirmation: {
    label: 'Confirmación de reserva',
    description: 'Recibe una confirmación cuando completes una reserva',
  },
  flight_reminder: {
    label: 'Recordatorio de vuelo',
    description: 'Te avisamos antes de tu vuelo para que no se te olvide',
  },
  promotional: {
    label: 'Promociones y ofertas',
    description: 'Ofertas exclusivas y descuentos en vuelos y hoteles',
  },
};

export function NotificationsForm({ prefs, onSave }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(prefs);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const getKey = (type: string, channel: Channel) => `${type}:${channel}`;

  const isEnabled = useCallback(
    (type: string, channel: Channel) => {
      return Array.isArray(preferences) && preferences.some((p) => p.notification_type === type && p.channel === channel && p.enabled);
    },
    [preferences]
  );

  const handleToggle = async (notification_type: string, channel: Channel) => {
    const key = getKey(notification_type, channel);
    const newEnabled = !isEnabled(notification_type, channel);

    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    setErrorMap((prev) => ({ ...prev, [key]: '' }));

    try {
      await updateNotificationPreference({
        channel,
        notification_type,
        enabled: newEnabled,
      });

      // Actualizar estado local
      setPreferences((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.notification_type === notification_type && p.channel === channel
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], enabled: newEnabled };
          return next;
        }

        return [...prev, { channel, notification_type, enabled: newEnabled }];
      });

      onSave();
    } catch (err: any) {
      setErrorMap((prev) => ({ ...prev, [key]: err.message }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const types = Object.keys(NOTIFICATION_TYPES);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#FF6B6B]" />
        <h2 className="text-xl font-bold text-gray-800">Preferencias de notificaciones</h2>
      </div>

      <p className="text-sm text-gray-500 -mt-4">
        Activa o desactiva los canales por los que quieres recibir cada tipo de notificación.
      </p>

      <div className="space-y-4">
        {types.map((type) => {
          const config = NOTIFICATION_TYPES[type];
          return (
            <div
              key={type}
              className="bg-gray-50 rounded-xl p-5 border border-gray-100"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">{config.label}</h3>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(CHANNEL_CONFIG) as Channel[]).map((channel) => {
                  const chConfig = CHANNEL_CONFIG[channel];
                  const Icon = chConfig.icon;
                  const key = getKey(type, channel);
                  const enabled = isEnabled(type, channel);
                  const isLoading = loadingMap[key];
                  const error = errorMap[key];

                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => handleToggle(type, channel)}
                      disabled={isLoading}
                      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        enabled
                          ? 'border-[#FF6B6B] bg-white shadow-sm'
                          : 'border-transparent bg-white/60 hover:bg-white'
                      } ${isLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          enabled ? 'bg-[#FF6B6B]/10' : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${enabled ? 'text-[#FF6B6B]' : 'text-gray-400'}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm ${
                            enabled ? 'text-gray-800' : 'text-gray-500'
                          }`}
                        >
                          {chConfig.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {enabled ? 'Activado' : 'Desactivado'}
                        </p>
                      </div>

                      {/* Toggle visual */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                          enabled ? 'bg-[#FF6B6B]' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>

                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                          <div className="w-4 h-4 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {Object.values(errorMap).some(Boolean) && (
                <div className="mt-3 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {Object.values(errorMap).filter(Boolean)[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}