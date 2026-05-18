'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthUser } from '@/app/lib/types/auth';
import { logoutUser, logoutAllSessions, getCurrentUser, AuthApiError } from '@/app/lib/api/auth';
import { type EnvironmentResponse } from '@/app/lib/api/context';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';
import { USER_AVATAR_CACHE_KEY } from '@/app/lib/constants/avatars';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAccountDisabled: boolean;
  error: string | null;
  context: EnvironmentResponse | null;
  setUser: (user: AuthUser | null) => void;
  setContext: (context: EnvironmentResponse | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'user_session';

/**
 * Recupera la sesión del usuario desde sessionStorage.
 * Retorna null si no existe o si el JSON está corrupto.
 */
function getStoredSession(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
  serverAuthenticated,
}: {
  children: ReactNode;
  /** Indica si el server detectó cookies de auth. Evita llamadas innecesarias a /v1/auth/me. */
  serverAuthenticated: boolean;
}) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [context, setContext] = useState<EnvironmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Establece el usuario en memoria y en sessionStorage.
   * sessionStorage permite restaurar la sesión sin llamar a /v1/auth/me en page refresh.
   * Las cookies HttpOnly son gestionadas exclusivamente por el backend.
   * El frontend NO almacena tokens ni datos sensibles.
   */
  const setUser = useCallback((user: AuthUser | null) => {
    setUserState(user);
    try {
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        sessionStorage.setItem('session_saved_at', Date.now().toString());
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('session_saved_at');
      }
    } catch {
      // sessionStorage puede fallar en modo privado
    }
  }, []);

  /**
   * Carga el environment usando cache-first (10 min localStorage).
   * Si el cache es válido no hace ninguna llamada de red.
   * Si expiró o no existe llama GET /v1/environment y cachea la respuesta.
   */
  const loadEnvironment = useCallback(async () => {
    try {
      const env = await fetchAndStoreEnvironment();
      if (env) setContext(env);
    } catch {
      // Environment no es crítico — no bloqueamos la sesión si falla
    }
  }, []);

  /**
   * Refresca el usuario llamando a GET /v1/auth/me.
   * El backend valida la cookie __Secure-access_token automáticamente.
   * Si hay sesión activa también recarga el environment con cache-first.
   *
   * getCurrentUser ahora lanza AuthApiError en vez de retornar null:
   * - AuthApiError con status 401 → no hay sesión (setUserState(null), sin error)
   * - Otros errores → setError con el mensaje
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);
      setError(null);

      if (currentUser) {
        await loadEnvironment();
      } else {
        setContext(null);
      }
    } catch (err) {
      const isDisabled =
        (err instanceof AuthApiError && err.code === 'ACCOUNT_DISABLED') ||
        (err instanceof AuthApiError && err.code === 'FORBIDDEN' &&
         err.message?.toLowerCase().includes('deshabilitada'));
      if (isDisabled) {
        setUserState(null);
        setContext(null);
        setIsAccountDisabled(true);
        window.location.href = '/auth/account-disabled';
        return;
      }
      if (err instanceof AuthApiError && err.status === 401) {
        // No hay sesión activa — no es un error, es estado normal
        setUserState(null);
        setContext(null);
      } else {
        setUserState(null);
        setContext(null);
        setError(err instanceof AuthApiError ? err.message : 'Error al refrescar el usuario');
      }
    }
  }, [loadEnvironment]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // El backend limpia las cookies con Clear-Site-Data aunque falle el fetch
    } finally {
      setUserState(null);
      setContext(null);
      // Flag para que restoreAuth NO re-popule environment en el refresh
      try { sessionStorage.setItem('just_logged_out', '1'); } catch { /* noop */ }
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
      try { localStorage.removeItem('user_environment'); } catch { /* noop */ }
      try { localStorage.removeItem('user_environment_stored_at'); } catch { /* noop */ }
      try { localStorage.removeItem('user_currency_preference'); } catch { /* noop */ }
      try { localStorage.removeItem(USER_AVATAR_CACHE_KEY); } catch { /* noop */ }
      // Full page reload para que el server re-evalúe serverAuthenticated
      window.location.href = '/home';
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllSessions();
    } catch {
      // El backend limpia las cookies con Clear-Site-Data aunque falle el fetch
    } finally {
      setUserState(null);
      setContext(null);
      try { sessionStorage.setItem('just_logged_out', '1'); } catch { /* noop */ }
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
      try { localStorage.removeItem('user_environment'); } catch { /* noop */ }
      try { localStorage.removeItem('user_environment_stored_at'); } catch { /* noop */ }
      try { localStorage.removeItem('user_currency_preference'); } catch { /* noop */ }
      try { localStorage.removeItem(USER_AVATAR_CACHE_KEY); } catch { /* noop */ }
      window.location.href = '/home';
    }
  }, []);

  /**
   * Al montar, restaura la sesión y carga el environment.
   *
   * Según AUTH_API.md, /v1/auth/me solo se necesita después de OAuth callback.
   * Login, register y verify-email ya devuelven los datos del usuario.
   *
   * Estrategia:
   * 1. Sin cookies de auth → anónimo: solo cargar environment (público)
   * 2. Con cookies + sessionStorage → restaurar de sessionStorage (0 HTTP)
   * 3. Con cookies + sin sessionStorage → GET /v1/auth/me (OAuth callback)
   *
   * EXCEPCIÓN — Verificación de email cross-tab:
   * En desarrollo, las cookies pueden tener Domain=.proactrip.com y no ser
   * visibles para el server de Next.js en localhost. La página register
   * escribe una señal en localStorage que forzamos a leer acá.
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreAuth() {
      try {
        // After logout we set this flag so we don't immediately re-fetch and re-cache
        // environment on the post-redirect page load.
        const justLoggedOut = sessionStorage.getItem('just_logged_out');
        if (justLoggedOut) {
          sessionStorage.removeItem('just_logged_out');
        }

        // Señal cross-tab: el usuario acaba de verificar su email.
        // Forzamos /v1/auth/me aunque serverAuthenticated sea false
        // (las cookies pueden no ser visibles para el server en localhost).
        const justVerified = localStorage.getItem('proactrip_email_verified');
        const effectiveAuth = serverAuthenticated || !!justVerified;

        if (justVerified) {
          localStorage.removeItem('proactrip_email_verified');
        }

        if (!effectiveAuth) {
          // Sin cookies de auth → anónimo.
          // Si acabamos de hacer logout, NO fetchear environment — se limpiaron las keys.
          if (!justLoggedOut) {
            const env = await fetchAndStoreEnvironment();
            if (cancelled) return;
            if (env) setContext(env);
          }
          setUserState(null);
        } else {
          // Hay cookies de auth (o señal de verificación) → ¿tenemos datos en sessionStorage?
          const stored = getStoredSession();
          if (stored) {
            // Verificar frescura de la sesión en sessionStorage
            const savedAt = sessionStorage.getItem('session_saved_at');
            const isSessionFresh = savedAt && (Date.now() - parseInt(savedAt, 10)) < 60_000; // 1 min (antes 5 min)

            if (isSessionFresh) {
              // Sesión reciente (< 5 min) → restaurar sin llamada HTTP
              setUserState(stored);
              if (!justLoggedOut) {
                const env = await fetchAndStoreEnvironment();
                if (cancelled) return;
                if (env) setContext(env);
              }
            } else {
              // Sesión stale (> 5 min) → validar contra el backend
              try {
                const currentUser = await getCurrentUser();
                if (cancelled) return;

                if (currentUser) {
                  setUserState(currentUser);
                  try {
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                    sessionStorage.setItem('session_saved_at', Date.now().toString());
                  } catch { /* noop */ }
                } else {
                  // El servidor rechazó la sesión → redirigir
                  setUserState(null);
                  window.location.href = '/auth/login?reason=session_expired';
                  return;
                }
              } catch (validationErr) {
                if (!cancelled) {
                  setUserState(null);
                  // El backend devuelve type=".../errors/forbidden" con detail="Cuenta deshabilitada"
                  // parseAuthError lo mapea a FORBIDDEN (no a ACCOUNT_DISABLED).
                  const isDisabled =
                    (validationErr instanceof AuthApiError && validationErr.code === 'ACCOUNT_DISABLED') ||
                    (validationErr instanceof AuthApiError && validationErr.code === 'FORBIDDEN' &&
                     validationErr.message?.toLowerCase().includes('deshabilitada'));
                  if (isDisabled) {
                    window.location.href = '/auth/account-disabled';
                  } else {
                    window.location.href = '/auth/login?reason=session_expired';
                  }
                  return;
                }
              }

              if (!justLoggedOut) {
                const env = await fetchAndStoreEnvironment();
                if (cancelled) return;
                if (env) setContext(env);
              }
            }
          } else {
            // sessionStorage vacío → OAuth callback, primera visita, o post-verificación.
            const [currentUser, env] = await Promise.all([
              getCurrentUser(),
              justLoggedOut ? Promise.resolve(null) : fetchAndStoreEnvironment(),
            ]);

            if (cancelled) return;

            setUserState(currentUser);
            if (currentUser) {
              try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
                sessionStorage.setItem('session_saved_at', Date.now().toString());
              } catch { /* noop */ }
            }
            if (env) setContext(env);
          }
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          const isDisabled =
            (err instanceof AuthApiError && err.code === 'ACCOUNT_DISABLED') ||
            (err instanceof AuthApiError && err.code === 'FORBIDDEN' &&
             err.message?.toLowerCase().includes('deshabilitada'));
          if (isDisabled) {
            setUserState(null);
            setIsAccountDisabled(true);
            window.location.href = '/auth/account-disabled';
            return;
          }
          if (err instanceof AuthApiError && err.status === 401) {
            // No hay sesión activa — no es un error, es estado normal
            setUserState(null);
          } else {
            setUserState(null);
            setError(err instanceof AuthApiError ? err.message : 'Error al restaurar la sesión');
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreAuth();

    return () => {
      cancelled = true;
    };
  }, [serverAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAccountDisabled,
        error,
        context,
        setUser,
        setContext,
        logout,
        logoutAll,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
