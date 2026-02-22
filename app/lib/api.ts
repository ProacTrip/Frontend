//buscamos el backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

//guarda la renovación en curso para que, si hay 10 peticiones a la vez, todas usen la misma y no se dupliquen
//es como un ticket de sala de espera (para q no se ejecuten todos los refresh a la vez)
let refreshPromise: Promise<boolean> | null = null;


//Comprueba si el access token expira en los próximos 5 minutos.
function isTokenExpiringSoon(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return false;

  const expiration = new Date(expiresAt);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  return expiration < fiveMinutesFromNow;
}


//Limpia todos los datos de sesión del localStorage.
function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token_expires_at');
}

/*
Renueva el access token usando el refresh token almacenado.
Lo exportamos para poder usarla también desde useAuth sin duplicar código.
Usa un candado (refreshPromise) para que múltiples llamadas concurrentes
compartan una única petición de renovación.
 */
export async function refreshAccessToken(): Promise<boolean> {
  // Si ya hay una renovación en curso, nos colgamos de esa promesa existente
  // en lugar de lanzar otra petición al backend
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

      console.log('[Auth] Token renovado correctamente.');
      return true;
    } 
    catch (err) 
    {
      console.error('[Auth] Excepción durante la renovación del token:', err);
      return false;
    } 
    finally
    {
      // Liberamos el candado siempre, tanto si tuvo éxito como si falló
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}


//Redirige al usuario a la página de login indicando que la sesión expiró.
function redirectToLogin(): void {
  window.location.href = '/auth/login?expired=true';
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////MIRAR Y ENTENDER











/**
 * Wrapper sobre fetch que gestiona automáticamente:
 * - Renovación proactiva del token cuando está por expirar.
 * - Reintento transparente si el servidor devuelve 401.
 * - Redirección al login si la sesión no se puede recuperar.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // 1. Renovación proactiva: si el token está a punto de expirar, lo renovamos
  //    antes de hacer la petición para evitar un 401 innecesario.
  if (isTokenExpiringSoon()) {
    const renewed = await refreshAccessToken();

    if (!renewed) {
      redirectToLogin();
      throw new Error('[Auth] Sesión expirada. Redirigiendo al login.');
    }
  }

  // 2. Construimos las cabeceras con el token actual.
  const buildHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  // 3. Primera petición.
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(localStorage.getItem('access_token')),
  });

  // 4. Defensa ante 401 inesperado (p.ej. el servidor revocó el token externamente,
  //    o hay desincronización de reloj entre cliente y servidor).
  if (response.status === 401) {
    console.warn('[Auth] Servidor devolvió 401. Intentando renovación de emergencia...');
    const renewed = await refreshAccessToken();

    if (!renewed) {
      redirectToLogin();
      throw new Error('[Auth] No autorizado. Redirigiendo al login.');
    }

    // 5. Reintento con el nuevo token.
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: buildHeaders(localStorage.getItem('access_token')),
    });
  }

  return response;
}