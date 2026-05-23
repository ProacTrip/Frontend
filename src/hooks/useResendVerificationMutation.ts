'use client';

import { useMutation } from '@tanstack/react-query';
import { resendVerification } from '@/app/lib/api/auth';
import type { ResendVerificationResponse } from '@/app/lib/types/auth';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/resend-verification.
 *
 * No cache invalidation on success — the caller handles UI feedback
 * (e.g. showing "Email reenviado" message).
 */
export function useResendVerificationMutation() {
  return useMutation<ResendVerificationResponse, Error, { email: string }>({
    mutationFn: ({ email }) => resendVerification(email),
  });
}
