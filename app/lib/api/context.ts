// app/lib/api/context.ts
//
// GET /v1/environment — GeoIP location + weather.
// Switched from apiFetch to raw fetch (two-tier pattern from anti-fron search.ts).
// SessionStorage cache with 10min TTL.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// TYPES — aligned with GET /v1/environment
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
 * Full response from GET /v1/environment.
 * `weather` can be null if the backend has no OpenWeather API key
 * or if the provider fails (graceful degradation per docs).
 */
export interface EnvironmentResponse {
  location: LocationData;
  weather: WeatherData | null;
}

// ==========================================
// SESSION STORAGE CACHE
// ==========================================

const CACHE_KEY = 'environment-v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CachedEnvironment {
  data: EnvironmentResponse;
  cachedAt: number;
}

function getCachedEnvironment(): EnvironmentResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached: CachedEnvironment = JSON.parse(raw);
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.data;
  } catch {
    // Corrupted cache — clear it
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedEnvironment(data: EnvironmentResponse): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedEnvironment = { data, cachedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Quota exceeded or private browsing — silently skip caching
  }
}

// ==========================================
// API — GET /v1/environment
// ==========================================

/**
 * GET /v1/environment
 *
 * Returns GeoIP location and current weather for the client.
 * - IP detected automatically by the backend.
 * - Backend caches 10 minutes in Redis per IP.
 * - Frontend caches 10 minutes in sessionStorage.
 * - weather may be null (graceful degradation — no full failure).
 * - Uses raw fetch with credentials:"include" for cookie-based auth.
 */
export async function getEnvironment(): Promise<EnvironmentResponse> {
  // Check sessionStorage cache first
  const cached = getCachedEnvironment();
  if (cached) return cached;

  const response = await fetch(`${API_URL}/v1/environment`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Error al obtener ubicación: ${response.status}`);
  }

  const data: EnvironmentResponse = await response.json();

  // Cache the fresh response
  setCachedEnvironment(data);

  return data;
}
