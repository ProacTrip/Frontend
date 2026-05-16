'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as authApi from '@/lib/api/auth';
import type { UserInfo } from './types';

// ── Context type ──

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Check session on mount ──
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await authApi.getMe();
        if (!cancelled) {
          setUser(response.user);
        }
      } catch {
        // Not authenticated — that's expected, no action needed
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkSession();
    return () => { cancelled = true; };
  }, []);

  // ── Auth actions ──

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const response = await authApi.login(email, password, rememberMe);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register(email, password);
    // Registration doesn't auto-login — user must verify email first
    // We don't set user here; they'll need to login after verification
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, clear local state
    }
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.user);
    } catch {
      setUser(null);
    }
  }, []);

  // ── Context value ──

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
