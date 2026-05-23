'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/app/lib/api/auth';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/logout.
 *
 * On success:
 *   1. Clears ALL TanStack Query caches (queryClient.clear())
 *   2. Redirects to '/' (landing page)
 *
 * The backend emits Clear-Site-Data: "cookies" which the browser
 * handles automatically. The full-page redirect to '/' triggers a
 * fresh server render — AuthProvider receives serverAuthenticated=false
 * and the profile query returns 401 (clean anonymous state).
 *
 * This is an alternative to AuthContext.logout() for components that
 * need mutation-state tracking (isPending, error, etc.).
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutUser(),

    onSuccess: () => {
      queryClient.clear();
      router.push('/');
    },
  });
}
