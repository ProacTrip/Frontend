const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// TYPES — alineados con GET /v1/environment
// ==========================================

export interface LocationData {
  country: string;
  country_code: string;
  city: string;
  state: string;
  zipcode: string;
  timezone: string;
  currency: string;
  language: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  icon_url: string;
  humidity: number;
  wind_speed: number;
}

/**
 * Respuesta completa de GET /v1/environment.
 * `weather` puede ser null si el backend no tiene API key de OpenWeather
 * o si el proveedor falla (ver docs: degradación elegante).
 */
export interface EnvironmentResponse {
  location: LocationData;
  weather: WeatherData | null;
}

/**
 * Alias de compatibilidad para código existente que importa ContextResponse.
 * @deprecated Usar EnvironmentResponse directamente.
 */
export type ContextResponse = EnvironmentResponse;

// ==========================================
// API — GET /v1/environment
// ==========================================

/**
 * GET /v1/environment
 *
 * Obtiene la ubicación GeoIP y el clima actual del cliente.
 * - La IP se detecta automáticamente por el backend.
 * - El idioma del clima proviene del header Accept-Language del navegador.
 * - El backend cachea 10 minutos en Redis por IP.
 * - El frontend cachea 10 minutos en localStorage (ver getStoredEnvironment).
 * - NO enviar lang como query param: el backend usa Accept-Language.
 * - `weather` puede ser null (degradación elegante sin fallo total).
 */
export async function getEnvironment(): Promise<EnvironmentResponse> {
  const res = await fetch(`${API_URL}/v1/environment`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Environment fetch failed: ${res.status}`);
  }

  return res.json();
}

/**
 * @deprecated Usar getEnvironment() en su lugar.
 * Alias de compatibilidad para código que todavía llama a getContext().
 */
export async function getContext(): Promise<EnvironmentResponse> {
  return getEnvironment();
}
