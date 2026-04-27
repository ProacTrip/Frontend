// ==========================================
// 1. CONFIGURACIÓN
// ==========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// 2. API FETCH (cookie-based auth v2)
// ==========================================

/**
 * Wrapper de fetch que envía cookies automáticamente.
 * El backend maneja el refresco de tokens transparentemente.
 * Si el backend responde 401, tiramos el error y la app redirige al login.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new Error('[Auth] No autorizado. El usuario debe volver a iniciar sesión.');
  }

  return response;
}

// ==========================================
// 3. USUARIO (User Profile)
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
