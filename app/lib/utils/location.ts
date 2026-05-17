import { getEnvironment, type EnvironmentResponse } from '@/app/lib/api/context';
import { RateLimitError } from '@/app/lib/api/auth';

// ==========================================
// localStorage KEYS (alineados con docs)
// ==========================================

const ENV_STORAGE_KEY = 'user_environment';
const ENV_STORED_AT_KEY = 'user_environment_stored_at';
const ENV_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// ==========================================
// CACHE VALIDATION
// ==========================================

/**
 * Verifica si el cache del environment en localStorage sigue siendo válido (< 10 min).
 * Lógica extraída de la documentación de environment API.
 */
function isEnvCacheValid(): boolean {
  try {
    const storedAt = localStorage.getItem(ENV_STORED_AT_KEY);
    if (!storedAt) return false;
    const age = Date.now() - new Date(storedAt).getTime();
    return age < ENV_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

// ==========================================
// STORAGE HELPERS
// ==========================================

/**
 * Guarda el EnvironmentResponse completo en localStorage con timestamp.
 * Keys: user_environment + user_environment_stored_at (alineados con docs).
 */
export function storeEnvironment(env: EnvironmentResponse): void {
  try {
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(env));
    localStorage.setItem(ENV_STORED_AT_KEY, new Date().toISOString());
  } catch {
    // localStorage puede estar bloqueado en modo privado
  }
}

/**
 * Lee el EnvironmentResponse del localStorage sólo si el cache es válido (< 10 min).
 * Retorna null si no existe o si expiró.
 */
export function getStoredEnvironment(): EnvironmentResponse | null {
  try {
    if (!isEnvCacheValid()) return null;
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as EnvironmentResponse) : null;
  } catch {
    return null;
  }
}

// ==========================================
// MAIN FETCH + CACHE FUNCTION
// ==========================================

/**
 * Obtiene el environment con cache frontend de 10 minutos.
 * 1. Si hay cache válido en localStorage → devuelve el cache sin red.
 * 2. Si el cache expiró o no existe → llama GET /v1/environment y guarda en cache.
 *
 * El backend también cachea 10 min en Redis, por lo que el tráfico real
 * a IP-API y OpenWeather se reduce drásticamente.
 */
export async function fetchAndStoreEnvironment(): Promise<EnvironmentResponse | null> {
  try {
    // 1. Cache hit — devolver sin llamada de red
    const cached = getStoredEnvironment();
    if (cached) return cached;

    // 2. Cache miss — llamar al backend
    const env = await getEnvironment();
    storeEnvironment(env);
    return env;
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error; // re-throw for component-level handling (retryAfter)
    }
    console.error('[Environment] Failed to fetch environment:', error);
    return null;
  }
}

// ==========================================
// USER PREFERENCES (currency selector, search forms)
// ==========================================

/**
 * Retorna las preferencias de usuario derivadas del environment almacenado.
 * Fallback a ES/EUR si no hay datos.
 */
export function getUserPreferences(): { currency: string; gl: string; hl: string } {
  if (typeof window === 'undefined') {
    return { currency: 'EUR', gl: 'ES', hl: 'es' };
  }

  try {
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    if (stored) {
      const env = JSON.parse(stored) as EnvironmentResponse;
      return {
        currency: env.location.currency,
        gl: env.location.country_code,
        hl: env.location.language,
      };
    }
  } catch {
    // fallback
  }

  return { currency: 'EUR', gl: 'ES', hl: 'es' };
}
