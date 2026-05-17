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
import { getContext, type ContextResponse } from '@/app/lib/api/context';
import { getStoredContext } from '@/app/lib/utils/location';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  context: ContextResponse | null;
  setUser: (user: AuthUser | null) => void;
  setContext: (context: ContextResponse | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [context, setContext] = useState<ContextResponse | null>(null);
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
   * Refresca el usuario llamando a GET /v1/auth/me.
   * El backend valida la cookie __Secure-access_token automáticamente.
   * También recarga el contexto de ubicación/clima si hay sesión activa.
   */
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);

      if (currentUser) {
        try {
          const ctx = await getContext();
          if (ctx) {
            setContext(ctx);
          }
        } catch {
          // Context no crítico — no bloqueamos la sesión si falla
        }
      } else {
        setContext(null);
      }
    } catch {
      setUserState(null);
      setContext(null);
    }
  }, []);

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
   * Si el backend devuelve 401, no hay sesión y el usuario no está autenticado.
   * No se lee ningún dato de localStorage para determinar autenticación.
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreAuth() {
      try {
        const currentUser = await getCurrentUser();

        if (cancelled) return;

        if (currentUser) {
          setUserState(currentUser);

          // Cargar contexto si hay sesión activa
          const storedContext = getStoredContext();
          if (storedContext) {
            try {
              const ctx = await getContext();
              if (!cancelled && ctx) {
                setContext(ctx);
              }
            } catch {
              // Context no crítico
            }
          }
        }
      } catch {
        if (!cancelled) {
          setUserState(null);
          setContext(null);
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
