'use client';
/* eslint-disable @next/next/no-img-element */

import { useAuthContext } from '@/contexts/AuthContext';
import type { WeatherData } from '@/app/lib/api/context';

/**
 * Weather display in the navbar — shows current weather (icon, temp, description)
 * when environment context has weather data. Hidden when weather is null or context
 * hasn't loaded yet.
 *
 * Follows the same self-contained pattern as CurrencySelector: reads directly
 * from AuthContext, no props needed from parent.
 */
export default function WeatherDisplay() {
  const { context } = useAuthContext();
  const weather: WeatherData | null = context?.weather ?? null;

  if (!weather) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white"
      aria-label={`Weather: ${weather.temp}°C, ${weather.description}`}
    >
      {weather.icon_url ? (
        <img
          src={weather.icon_url}
          alt={weather.description}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      <span className="tabular-nums">{weather.temp}°C</span>
      <span className="hidden sm:inline text-white/80">{weather.description}</span>
    </div>
  );
}
