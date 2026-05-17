import { apiFetch, RateLimitError } from './auth';

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
 * - Usa apiFetch para manejo automático de 429 (RateLimitError) y 401.
 */
export async function getEnvironment(): Promise<EnvironmentResponse> {
  const res = await apiFetch('/v1/environment', { method: 'GET' });
  return res.json();
}
