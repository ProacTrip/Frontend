'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from '@/app/lib/types/auth';
import { logoutUser } from '@/app/lib/api/auth';
import { getProfile, UserApiError } from '@/app/lib/api/user';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { EnvironmentResponse } from '@/app/lib/api/context';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAccountDisabled: boolean;
  error: string | null;
  context: EnvironmentResponse | null;
  /** @deprecated Will be removed in PR 3 — use profile query invalidation instead. */
  setUser: (user: AuthUser | null) => void;
  /** @deprecated Will be replaced by useEnvironment() hook in PR 3. */
  setContext: (context: EnvironmentResponse | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Extract identity fields ({id, email, role_name}) from the profile response.
 *
 * The Profile type in types/user.ts does not declare id/email/role_name,
 * but the backend returns them at the top level of the profile object
 * (verified against AUTH_API.md §172).
 *
 * Falls back to role_name='client' when the backend omits it.
 */
// deno-lint-ignore no-explicit-any
function extractAuthUser(profile: Record<string, unknown>): AuthUser | null {
  const id = profile.id;
  const email = profile.email;
  if (typeof id !== 'string' || typeof email !== 'string') return null;
  return {
    id,
    email,
    role_name: typeof profile.role_name === 'string' ? profile.role_name : 'client',
  };
}

export function AuthProvider({
  children,
  serverAuthenticated,
}: {
  children: ReactNode;
  /** Indica si el server detectó cookies de auth. Evita llamadas innecesarias a la API. */
  serverAuthenticated: boolean;
}) {
  const queryClient = useQueryClient();

  // ── Manual overrides — backward compat for pages that call setUser/setContext ──
  //     These will be removed in PR 3 when pages switch to useMutation hooks.
  const [manualUser, setManualUser] = useState<AuthUser | null>(null);
  const [context, setContextState] = useState<EnvironmentResponse | null>(null);

  // ── Profile query — declarative session bootstrap ────────────────────────────
  //     Replaces all imperative getCurrentUser() → /v1/auth/me calls.
  //     TanStack Query handles cache, refetch on window focus, and staleTime.
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: ({ signal }) => getProfile(signal),
    enabled: serverAuthenticated,
    retry: false,
    staleTime: PROFILE_STALE_TIME,
  });

  // ── Derived state ────────────────────────────────────────────────────────────

  // Extract identity from the profile query data (raw fields not in Profile type)
  const profileUser = useMemo(() => {
    if (!profileQuery.data) return null;
    return extractAuthUser(profileQuery.data.profile as unknown as Record<string, unknown>);
  }, [profileQuery.data]);

  // Effective user: profile query wins; manualUser is a bridge for pre-PR3 pages
  const user = profileUser ?? manualUser;

  // Loading: true while profile query is pending AND we expected auth cookies
  const isLoading = serverAuthenticated && profileQuery.isPending;

  // Account-disabled detection: derived from error, no separate useState
  const isAccountDisabled = useMemo(() => {
    if (!profileQuery.error) return false;
    const err = profileQuery.error;
    return (
      err instanceof UserApiError &&
      err.code === 'PERMISSION_DENIED' &&
      err.detail?.toLowerCase().includes('deshabilitada')
    );
  }, [profileQuery.error]);

  // Error: 401 = normal (no session), account-disabled = redirect, other = surface
  const error = useMemo(() => {
    if (!profileQuery.error) return null;
    const err = profileQuery.error;

    // 401 / TOKEN_INVALID → no valid session — normal state, not an error
    if (err instanceof UserApiError && err.code === 'TOKEN_INVALID') {
      return null;
    }

    // Account disabled — handled by useEffect redirect below
    if (isAccountDisabled) {
      return null;
    }

    if (err instanceof Error) return err.message;
    return 'Error al cargar el perfil';
  }, [profileQuery.error, isAccountDisabled]);

  // ── Effect: redirect on account-disabled ────────────────────────────────
  useEffect(() => {
    if (isAccountDisabled) {
      window.location.href = '/auth/account-disabled';
    }
  }, [isAccountDisabled]);

  // ── Public API (backward-compat bridge) ──────────────────────────────────────

  const setUser = useCallback((u: AuthUser | null) => {
    setManualUser(u);
  }, []);

  const setContext = useCallback((c: EnvironmentResponse | null) => {
    setContextState(c);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Best effort — backend still emits Clear-Site-Data
    }
    queryClient.clear();
    setManualUser(null);
    setContextState(null);
    window.location.href = '/';
  }, [queryClient]);

  // ── Memoized context value ───────────────────────────────────────────────────

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAccountDisabled,
      error,
      context,
      setUser,
      setContext,
      logout,
    }),
    [user, isLoading, isAccountDisabled, error, context, setUser, setContext, logout],
  );

  return (
    <AuthContext.Provider value={value}>
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
