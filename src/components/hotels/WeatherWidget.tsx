'use client';

interface WeatherData {
  temp: number;
  description: string;
  iconUrl: string;
}

/**
 * Stub WeatherWidget — reemplazar con datos reales de /v1/environment
 */
export default function WeatherWidget({
  location,
  weather,
  variant,
}: {
  location: string;
  weather: WeatherData | null;
  variant?: string;
}) {
  return null;
}
