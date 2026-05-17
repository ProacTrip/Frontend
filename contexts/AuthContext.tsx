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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [context, setContext] = useState<EnvironmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Establece el usuario en memoria solamente.
   * Las cookies HttpOnly son gestionadas exclusivamente por el backend.
   * El frontend NO almacena tokens ni datos de sesión en localStorage.
   */
  const setUser = useCallback((user: AuthUser | null) => {
    setUserState(user);
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
      router.push('/auth/login');
    }
  }, [router]);

  /**
   * Al montar, valida la sesión activa usando GET /v1/auth/me.
   * Independientemente del resultado, también carga el environment (cache-first).
   * Auth y environment son módulos independientes — se cargan en paralelo.
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreAuth() {
      try {
        // Auth y environment son independientes: cargar en paralelo
        const [currentUser, env] = await Promise.all([
          getCurrentUser(),
          fetchAndStoreEnvironment(),
        ]);

        if (cancelled) return;

        setUserState(currentUser);
        if (env) setContext(env);
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
  }, []);

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
