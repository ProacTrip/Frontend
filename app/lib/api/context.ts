// app/lib/api/context.ts
//
// GET /v1/environment — GeoIP location + weather.
// Switched from apiFetch to raw fetch (two-tier pattern from anti-fron search.ts).
// localStorage cache with 10min TTL (shared keys with app/lib/utils/location.ts).

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
// localStorage CACHE (shared keys with location.ts)
// ==========================================

const ENV_STORAGE_KEY = 'user_environment';
const ENV_STORED_AT_KEY = 'user_environment_stored_at';
const ENV_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isEnvCacheValid(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storedAt = localStorage.getItem(ENV_STORED_AT_KEY);
    if (!storedAt) return false;
    const age = Date.now() - new Date(storedAt).getTime();
    return age < ENV_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

function getCachedEnvironment(): EnvironmentResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!isEnvCacheValid()) return null;
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as EnvironmentResponse) : null;
  } catch {
    return null;
  }
}

function setCachedEnvironment(data: EnvironmentResponse): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(ENV_STORED_AT_KEY, new Date().toISOString());
  } catch {
    // localStorage may be blocked in private mode
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
 * - Frontend caches 10 minutes in localStorage (shared with fetchAndStoreEnvironment).
 * - weather may be null (graceful degradation — no full failure).
 * - Uses raw fetch with credentials:"include" for cookie-based auth.
 */
export async function getEnvironment(): Promise<EnvironmentResponse> {
  // Check localStorage cache first
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
