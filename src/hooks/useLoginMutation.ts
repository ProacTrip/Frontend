'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser } from '@/app/lib/api/auth';
import { getProfile } from '@/app/lib/api/user';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/login.
 *
 * On success (non-MFA): invalidates profile + environment queries so
 * AuthContext reactively picks up the new session on the next route.
 * The caller is responsible for redirecting to the appropriate page.
 *
 * If the backend returns an MFA response (mfa_required: true), the
 * caller must handle the MFA flow — this hook does NOT redirect.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      loginUser(credentials.email, credentials.password),

    onSuccess: async (data) => {
      // MFA responses do NOT set cookies — skip cache invalidation
      if ('mfa_required' in data && data.mfa_required) return;

      // Immediately populate the identity cache so AuthContext + Navbar
      // react to the login without waiting for a full page reload.
      queryClient.setQueryData(queryKeys.user.me(), { user: data.user });

      // Prefetch the real profile (includes avatar_url, language, currency)
      // so the avatar loads immediately after login without visiting /perfil.
      // Run in parallel with invalidations for speed.
      const profilePromise = queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: ({ signal }) => getProfile(signal),
        staleTime: PROFILE_STALE_TIME,
      });

      await Promise.all([
        profilePromise,
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.env.all }),
      ]);

      // Navigation is the caller's responsibility — do NOT redirect here.
      // The page sets its own onSuccess override to router.push(returnUrl).
    },
  });
}
