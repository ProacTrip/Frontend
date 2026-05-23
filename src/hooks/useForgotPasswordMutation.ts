'use client';

import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/app/lib/api/auth';
import type { ForgotPasswordResponse } from '@/app/lib/types/auth';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/forgot-password.
 *
 * 🚧 Backend endpoint not yet live — gated by FEATURE_PASSWORD_RESET flag.
 * No cache invalidation on success — caller handles UI feedback
 * (e.g. showing "Revisá tu email" message).
 */
export function useForgotPasswordMutation() {
  return useMutation<ForgotPasswordResponse, Error, { email: string }>({
    mutationFn: ({ email }) => forgotPassword(email),
  });
}
