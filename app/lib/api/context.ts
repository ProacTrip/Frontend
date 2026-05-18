// app/lib/api/context.ts
//
// GET /v1/environment — GeoIP location + weather.
// Switched from apiFetch to raw fetch (two-tier pattern from anti-fron search.ts).
// localStorage cache with 10min TTL (shared keys with app/lib/utils/location.ts).

import { parseProblemDetails } from '@/app/lib/utils/problem-details';
import { rateLimitStore } from '@/app/lib/api/rate-limit';

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
// TYPE GUARDS
// ==========================================

/**
 * Narrows `EnvironmentResponse` to confirm weather is present.
 * Backend returns `weather: null` on graceful degradation —
 * callers MUST use this guard before accessing weather fields.
 */
export function hasWeather(env: EnvironmentResponse): env is EnvironmentResponse & { weather: WeatherData } {
  return env.weather !== null;
}

// ==========================================
// localStorage CACHE (shared keys with location.ts)
// ==========================================

export const ENV_STORAGE_KEY = 'user_environment';
export const ENV_STORED_AT_KEY = 'user_environment_stored_at';
export const ENV_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function isEnvCacheValid(): boolean {
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
// HELPERS — Rate limit extraction
// ==========================================

function extractRateLimitHeaders(response: Response): void {
  const limit = response.headers.get('RateLimit-Limit');
  const remaining = response.headers.get('RateLimit-Remaining');
  const reset = response.headers.get('RateLimit-Reset');

  if (limit !== null && remaining !== null && reset !== null) {
    rateLimitStore.update({
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      endpoint: '/v1/environment',
      timestamp: Date.now(),
    });
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
 * - Sends Accept-Language from navigator.language.
 * - Aborts after 15 seconds via AbortController.
 */
export async function getEnvironment(): Promise<EnvironmentResponse> {
  // Check localStorage cache first
  const cached = getCachedEnvironment();
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };

    // Send browser language so the backend can localise error messages (ENVIRONMENT_API.md)
    if (typeof navigator !== 'undefined' && navigator.language) {
      headers['Accept-Language'] = navigator.language;
    }

    const response = await fetch(`${API_URL}/v1/environment`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Extract rate limit headers from ALL responses
    extractRateLimitHeaders(response);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      if (retryAfter > 0) {
        rateLimitStore.block(retryAfter);
      }

      const problem = await parseProblemDetails(response);
      const trace = problem.trace_id ? ` (trace: ${problem.trace_id})` : '';
      throw new Error(`[${problem.type}] ${problem.detail || 'Límite de peticiones excedido'}${trace}`);
    }

    if (!response.ok) {
      const problem = await parseProblemDetails(response);
      const trace = problem.trace_id ? ` (trace: ${problem.trace_id})` : '';
      throw new Error(`[${problem.type}] ${problem.detail || `Error al obtener ubicación: ${response.status}`}${trace}`);
    }

    const data: EnvironmentResponse = await response.json();

    // Cache the fresh response
    setCachedEnvironment(data);

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
