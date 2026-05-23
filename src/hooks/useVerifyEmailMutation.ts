'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { verifyEmail } from '@/app/lib/api/auth';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import type { VerifyEmailResponse } from '@/app/lib/types/auth';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/verify-email.
 *
 * On success: invalidates the profile query (so AuthContext picks up
 * the verified user on next page load) and auto-redirects to '/'.
 *
 * Per spec (auth-ui-components): auto-redirect via router.push('/')
 * without user interaction.
 */
export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<VerifyEmailResponse, Error, { token: string }>({
    mutationFn: ({ token }) => verifyEmail(token),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      router.push('/');
    },
  });
}
