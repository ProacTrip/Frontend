'use client';

import Image from 'next/image';
import { useEnvironment } from '@/hooks/useEnvironment';
import type { WeatherData } from '@/app/lib/api/context';

/**
 * Weather display in the navbar — shows current weather (icon, temp, description)
 * when the environment hook returns weather data. Hidden when weather is null or
 * the hook hasn't resolved yet.
 *
 * Uses `useEnvironment()` TanStack Query hook directly — works for ALL users
 * (auth + unauth). No auth guard. TanStack Query handles dedup and staleTime.
 */
export default function WeatherDisplay({ isLanding = true }: { isLanding?: boolean }) {
  const { environment } = useEnvironment();
  const weather: WeatherData | null = environment?.weather ?? null;

  if (!weather) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${
        isLanding ? "text-white" : "text-neutral-600"
      }`}
      aria-label={`Weather: ${Math.round(weather.temp)}°C, ${weather.description}`}
    >
      {weather.icon_url ? (
        <Image
          src={weather.icon_url}
          alt={weather.description}
          width={100}
          height={100}
          className="w-6 h-6 object-contain"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      <span className="tabular-nums">{Math.round(weather.temp)}°C</span>
      <span className={`hidden sm:inline ${isLanding ? "text-white/80" : "text-neutral-500"}`}>
        {weather.description}
      </span>
    </div>
  );
}
