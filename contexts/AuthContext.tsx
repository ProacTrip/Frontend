'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/app/lib/types/auth';
import { logoutUser, logoutAllSessions, getCurrentUser } from '@/app/lib/api/auth';
import { type EnvironmentResponse } from '@/app/lib/api/context';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      } else {
        sessionStorage.removeItem(SESSION_KEY);
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
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);

      if (currentUser) {
        await loadEnvironment();
      } else {
        setContext(null);
      }
    } catch {
      setUserState(null);
      setContext(null);
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
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
      router.push('/auth/login');
    }
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllSessions();
    } catch {
      // El backend limpia las cookies con Clear-Site-Data aunque falle el fetch
    } finally {
      setUserState(null);
      setContext(null);
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
      router.push('/auth/login');
    }
  }, [router]);

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
        // Señal cross-tab: el usuario acaba de verificar su email.
        // Forzamos /v1/auth/me aunque serverAuthenticated sea false
        // (las cookies pueden no ser visibles para el server en localhost).
        const justVerified = localStorage.getItem('proactrip_email_verified');
        const effectiveAuth = serverAuthenticated || !!justVerified;

        if (justVerified) {
          localStorage.removeItem('proactrip_email_verified');
        }

        if (!effectiveAuth) {
          // Sin cookies de auth → anónimo. Solo cargar environment (público, cache-first).
          const env = await fetchAndStoreEnvironment();
          if (cancelled) return;
          setUserState(null);
          if (env) setContext(env);
        } else {
          // Hay cookies de auth (o señal de verificación) → ¿tenemos datos en sessionStorage?
          const stored = getStoredSession();
          if (stored) {
            // Restaurar desde sessionStorage — sin llamada HTTP
            setUserState(stored);
            const env = await fetchAndStoreEnvironment();
            if (cancelled) return;
            if (env) setContext(env);
          } else {
            // sessionStorage vacío → OAuth callback, primera visita, o post-verificación.
            const [currentUser, env] = await Promise.all([
              getCurrentUser(),
              fetchAndStoreEnvironment(),
            ]);

            if (cancelled) return;

            setUserState(currentUser);
            if (currentUser) {
              try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch { /* noop */ }
            }
            if (env) setContext(env);
          }
        }
      } catch {
        if (!cancelled) {
          setUserState(null);
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
