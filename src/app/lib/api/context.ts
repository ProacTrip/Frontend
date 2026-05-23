// app/lib/api/context.ts
//
// GET /v1/environment — GeoIP location + weather.
// Switched from apiFetch to raw fetch (two-tier pattern from anti-fron search.ts).
// localStorage cache with 10min TTL (shared keys with app/lib/utils/location.ts).

import { parseProblemDetails } from '@/app/lib/utils/problem-details';
import { rateLimitStore } from '@/app/lib/api/rate-limit';
import { EnvironmentResponseSchema } from '@/app/lib/api/environment-schema';

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
export const ENV_TTL_KEY = 'user_environment_ttl';
export const ENV_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (fallback)

/**
 * Parse max-age from Cache-Control header. Capped at ENV_CACHE_TTL_MS.
 * Returns ENV_CACHE_TTL_MS when absent or unparseable.
 *
 * @internal exported for testing
 */
export function parseCacheMaxAge(header: string | null): number {
  if (!header) return ENV_CACHE_TTL_MS;
  const match = header.match(/max-age=(\d+)/);
  if (!match) return ENV_CACHE_TTL_MS;
  const seconds = parseInt(match[1], 10);
  if (Number.isNaN(seconds) || seconds <= 0) return ENV_CACHE_TTL_MS;
  // Trust the backend's Cache-Control header — no artificial cap.
  // The backend controls TTL via ENVIRONMENT_WEATHER_CACHE_TTL and changes
  // propagate through this header automatically.
  return seconds * 1000;
}

/**
 * Returns the dynamic TTL stored in localStorage, or the hardcoded fallback.
 */
function getDynamicTTL(): number {
  if (typeof window === 'undefined') return ENV_CACHE_TTL_MS;
  try {
    const stored = localStorage.getItem(ENV_TTL_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch { /* noop */ }
  return ENV_CACHE_TTL_MS;
}

export function isEnvCacheValid(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storedAt = localStorage.getItem(ENV_STORED_AT_KEY);
    if (!storedAt) return false;
    const age = Date.now() - new Date(storedAt).getTime();
    return age < getDynamicTTL();
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

function setCachedEnvironment(data: EnvironmentResponse, ttlMs?: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(ENV_STORED_AT_KEY, new Date().toISOString());
    if (ttlMs !== undefined) {
      localStorage.setItem(ENV_TTL_KEY, String(ttlMs));
    }
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
 * Returns GeoIP location and current weather for the client, or null on
 * non-critical failures (invalid IP in local dev, network error, etc).
 *
 * - IP detected automatically by the backend.
 * - Backend caches 10 minutes in Redis per IP.
 * - Frontend caches 10 minutes in localStorage (shared with fetchAndStoreEnvironment).
 * - weather may be null (graceful degradation — no full failure).
 * - Uses raw fetch with credentials:"include" for cookie-based auth.
 * - Sends Accept-Language from navigator.language.
 * - Aborts after 15 seconds via AbortController.
 * - Returns null for 400 InvalidIP (private IP in production mode) —
 *   caller falls back to defaults without crashing.
 */
export async function getEnvironment(): Promise<EnvironmentResponse | null> {
  // Check localStorage cache first
  const cached = getCachedEnvironment();
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };

    // Send browser language so the backend can localise error messages (ENVIRONMENT_API.md)
    // Normalize to ISO 639-1: navigator.language may be "en-US", backend expects "en"
    if (typeof navigator !== 'undefined' && navigator.language) {
      headers['Accept-Language'] = navigator.language.split('-')[0] || 'es';
    }

    // X-Real-IP override for development/testing — only sent when env var is set
    if (process.env.NEXT_PUBLIC_SIMULATE_IP) {
      headers['X-Real-IP'] = process.env.NEXT_PUBLIC_SIMULATE_IP;
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

    // Parse Cache-Control max-age for dynamic TTL
    const cacheControl = response.headers.get('Cache-Control');
    const ttlMs = parseCacheMaxAge(cacheControl);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      if (retryAfter > 0) {
        rateLimitStore.block(retryAfter);
      }

      const problem = await parseProblemDetails(response);
      const traceId = problem.traceparent || problem.trace_id;
      const trace = traceId ? ` (trace: ${traceId})` : '';
      throw new Error(`[${problem.type}] ${problem.detail || 'Límite de peticiones excedido'}${trace}`);
    }

    // 400 = Invalid IP (private/loopback in production mode).
    // Graceful degradation — return null so callers use defaults.
    if (response.status === 400) {
      const problem = await parseProblemDetails(response);
      const detail = problem.detail || '';
      if (detail.toLowerCase().includes('ip') || detail.toLowerCase().includes('inválida')) {
        console.warn('[env] Invalid IP (likely local dev without SERVER_ENV=dev) — using defaults');
        return null;
      }
      // Unexpected 400 — still treat as non-critical and return null
      console.warn('[env] Bad request:', detail);
      return null;
    }

    // 502 = Bad gateway (ipquery.io unreachable). Graceful — log, return null.
    if (response.status === 502) {
      const problem = await parseProblemDetails(response);
      const traceId = problem.traceparent || problem.trace_id;
      console.warn('[Environment] Location provider unavailable (502)', { traceId });
      return null;
    }

    // 500 = Internal server error. Graceful — log, return null, don't break UI.
    if (response.status === 500) {
      const problem = await parseProblemDetails(response);
      const traceId = problem.traceparent || problem.trace_id;
      console.error('[Environment] Internal server error (500)', { traceId });
      return null;
    }

    if (!response.ok) {
      const problem = await parseProblemDetails(response);
      const traceId = problem.traceparent || problem.trace_id;
      const trace = traceId ? ` (trace: ${traceId})` : '';
      throw new Error(`[${problem.type}] ${problem.detail || `Error al obtener ubicación: ${response.status}`}${trace}`);
    }

    const rawData: unknown = await response.json();

    // Zod runtime validation — warn-only, never blocks rendering
    const parsed = EnvironmentResponseSchema.safeParse(rawData);
    if (!parsed.success) {
      console.warn('[env] validation:', parsed.error.issues);
    }

    const data: EnvironmentResponse = rawData as EnvironmentResponse;

    // Cache the fresh response with dynamic TTL
    setCachedEnvironment(data, ttlMs);

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
