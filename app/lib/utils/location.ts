import { getEnvironment, type EnvironmentResponse, ENV_STORAGE_KEY, ENV_STORED_AT_KEY, isEnvCacheValid } from '@/app/lib/api/context';

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

  // Use getStoredEnvironment() for TTL validation (cache < 10 min)
  const env = getStoredEnvironment();

  // User's explicit currency choice (set via CurrencySelector) takes priority
  let currency = 'EUR';
  try {
    const savedPref = localStorage.getItem('user_currency_preference');
    if (savedPref) currency = savedPref;
  } catch { /* noop */ }
  // Fallback to environment currency if no explicit preference
  if (currency === 'EUR' && env?.location?.currency) {
    currency = env.location.currency;
  }

  if (env) {
    return {
      currency,
      gl: env.location.country_code,
      hl: env.location.language,
    };
  }

  return { currency, gl: 'ES', hl: 'es' };
}
