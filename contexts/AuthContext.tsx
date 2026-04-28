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
import { logoutUser, logoutAllSessions } from '@/app/lib/api/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/v1/auth/current-user`, {
        credentials: 'include',
      });

      console.log('[Auth] fetchCurrentUser status:', response.status);

      if (!response.ok) {
        console.log('[Auth] fetchCurrentUser FAILED, status:', response.status);
        setUser(null);
        return;
      }

      const data = await response.json();
      console.log('[Auth] fetchCurrentUser data:', data);
      setUser(data.user);
    } catch (err) {
      console.log('[Auth] fetchCurrentUser network error:', err);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Ignorar errores de red, el backend limpia las cookies igual con Clear-Site-Data
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllSessions();
    } catch {
      // Ignorar errores de red, el backend limpia las cookies igual con Clear-Site-Data
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/v1/auth/current-user`, {
          credentials: 'include',
        });

        if (cancelled) return;

        console.log('[Auth] checkAuth status:', response.status);

        if (!response.ok) {
          setUser(null);
          setError(null);
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setUser(data.user);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          console.log('[Auth] checkAuth network error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

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
        logout,
        logoutAll,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
