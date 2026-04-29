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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const ctx = await getContext();
      if (ctx) {
        setContext(ctx);
      }
    } catch {
      setUser(null);
      setContext(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
    } finally {
      setUser(null);
      setContext(null);
      localStorage.removeItem('user_context');
      localStorage.removeItem('user_location');
      router.push('/auth/login');
    }
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllSessions();
    } catch {
    } finally {
      setUser(null);
      setContext(null);
      localStorage.removeItem('user_context');
      localStorage.removeItem('user_location');
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function restoreAuth() {
      try {
        const storedContext = getStoredContext();
        if (storedContext) {
          const ctx = await getContext();
          if (!cancelled && ctx) {
            setContext(ctx);
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
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
