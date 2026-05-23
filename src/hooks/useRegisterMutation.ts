'use client';

import { useMutation } from '@tanstack/react-query';
import { registerUser } from '@/app/lib/api/auth';
import type { RegisterResponse } from '@/app/lib/types/auth';

/**
 * TanStack Query mutation hook wrapping POST /v1/auth/register.
 *
 * The backend sets the Idempotency-Key header internally (via registerUser).
 * On 201 success the backend returns { message } — NO session cookies are
 * set (email verification is required first). This hook does NOT:
 *   - Call setUser() (no session created)
 *   - Invalidate any query caches
 *   - Redirect
 *
 * The caller handles showing the success message and linking to /auth/login.
 */
export function useRegisterMutation() {
  return useMutation<RegisterResponse, Error, RegisterInput>({
    mutationFn: (data: RegisterInput) =>
      registerUser(data.email, data.password, data.first_name),
  });
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
}
