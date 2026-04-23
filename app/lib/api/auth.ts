// ==========================================
// 1. CONFIGURACIÓN & ESTADO
// ==========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Candado para evitar múltiples renovaciones simultáneas del token
let refreshPromise: Promise<boolean> | null = null;

// ==========================================
// 2. HELPERS PRIVADOS (Auth)
// ==========================================

// Comprueba si el access token expira en los próximos 5 minutos.
function isTokenExpiringSoon(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return false;

  const expiration = new Date(expiresAt);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  return expiration < fiveMinutesFromNow;
}

// Limpia todos los datos de sesión del localStorage.
function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('user_role');
}

// ==========================================
// 3. FUNCIONES PÚBLICAS (Auth)
// ==========================================

/**
 * Renueva el access token usando el refresh token almacenado.
 * Lo exportamos para poder usarla también desde useAuth sin duplicar código.
 * Usa un candado (refreshPromise) para que múltiples llamadas concurrentes
 * compartan una única petición de renovación.
 */
export async function refreshAccessToken(): Promise<boolean> {
  // Si ya hay una renovación en curso, nos colgamos de esa promesa existente
  if (refreshPromise) {
    return refreshPromise;
  }
  

  refreshPromise = (async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.warn('[Auth] No hay refresh token disponible.');
        return false;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error(`[Auth] Error al renovar token: ${response.status}`);
        clearSession();
        return false;
      }

      const data = await response.json();

      if (!data.access_token) {
        console.error('[Auth] La respuesta no contiene access_token.');
        clearSession();
        return false;
      }

      // Guardamos el nuevo access token y su fecha de expiración
      localStorage.setItem('access_token', data.access_token);

      if (data.expires_in) {
        // expires_in viene en segundos desde el backend (ej: 3600 = 1 hora)
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
      }

      if (data.refresh_token) {
        //El backend devuelve un nuevo refresh token con cada renovación.
        //Lo actualizamos para que el siguiente refresh también funcione.
        localStorage.setItem('refreshToken', data.refresh_token);
      }

      if (data.role) {
        localStorage.setItem('user_role', data.role);
      }

      console.log('[Auth] Token renovado correctamente.');
      return true;
    } catch (err) {
      console.error('[Auth] Excepción durante la renovación del token:', err);
      return false;
    } finally {
      // Liberamos el candado siempre, tanto si tuvo éxito como si falló
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Wrapper de fetch que maneja autenticación y renovación automática de tokens.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

  // Renovación proactiva: si el token está a punto de expirar, lo renovamos
  // antes de hacer la petición para evitar un error innecesario.
  if (isTokenExpiringSoon()) {
    const renewed = await refreshAccessToken();

    if (!renewed) {
      clearSession();
      throw new Error('[Auth] Sesión expirada. Redirigiendo al login.');
    }
  }

  //Preparamos las cabeceras pegándole nuestro token actual
  const buildHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    //Copiamos cualquier otra cabecera que hayamos pasado manualmente en 'options'
    ...options.headers,
    //Lógica del Token: Si hay token, añade la cabecera 'Authorization' con el formato 'Bearer'.
    // Si no hay token (usuario anónimo), no añade nada y el objeto se queda limpio.
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  //Lanzamiento de la peticion
  let response = await fetch(`${API_URL}${endpoint}`, {
    //Copiamos toda la configuración (method, body, etc.) que nos pasaron por 'options'
    ...options,
    //Usamos nuestra fábrica de etiquetas para poner el token actual del localStorage
    headers: buildHeaders(localStorage.getItem('access_token')),
  });

  // Defensa ante 401 inesperado (por ej el servidor revocó el token externamente,
  // o hay desincronización de reloj entre cliente y servidor).
  if (response.status === 401) {
    console.warn('[Auth] Servidor devolvió 401. Intentando renovación de emergencia...');
    const renewed = await refreshAccessToken();

    if (!renewed) {
      clearSession();
      throw new Error('[Auth] No autorizado. El usuario debe volver a iniciar sesión.');
    }

    // Reintento con el nuevo token.
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: buildHeaders(localStorage.getItem('access_token')),
    });
  }

  return response;
}

// ==========================================
// 4. USUARIO (User Profile)
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  preferred_language: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  avatar_url: string | null;
  travel_preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  role?: string;
}

/**
 * Obtiene el perfil del usuario autenticado desde el backend.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiFetch('/api/v1/user/profile', {
      method: 'GET',
    });

    if (response.ok) {
      const profile = await response.json();
      return profile;
    }

    console.error('[API] Error obteniendo perfil:', response.status);
    return null;
  } catch (error) {
    console.error('[API] Error en getUserProfile:', error);
    return null;
  }
}