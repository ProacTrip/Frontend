/**
 * Auth API — typed functions for auth endpoints.
 *
 * All operations use cookie-based session (no tokens in response).
 * Errors are RFC 9457 Problem Details.
 */

import { api } from './client';
import type {
  LoginResponse,
  RegisterResponse,
  OAuthUrlResponse,
  LogoutResponse,
  MeResponse,
} from './types';

// ── Authentication ──

/**
 * POST /v1/auth/login
 * Sets HttpOnly session cookie on success.
 */
export async function login(email: string, password: string, rememberMe?: boolean): Promise<LoginResponse> {
  return api.post<LoginResponse>('/v1/auth/login', { email, password, remember_me: rememberMe });
}

/**
 * POST /v1/auth/register
 * Creates a new user account. 201 Created.
 */
export async function register(email: string, password: string, firstName?: string): Promise<RegisterResponse> {
  return api.post<RegisterResponse>('/v1/auth/register', {
    email,
    password,
    ...(firstName ? { first_name: firstName } : {}),
  });
}

/**
 * POST /v1/auth/logout
 * Clears the session cookie server-side.
 */
export async function logout(): Promise<LogoutResponse> {
  return api.post<LogoutResponse>('/v1/auth/logout');
}

/**
 * GET /v1/auth/me
 * Returns the current authenticated user from the session cookie.
 * Also used after OAuth callback to retrieve the linked user.
 */
export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>('/v1/auth/me');
}

// ── OAuth ──

/**
 * GET /v1/auth/oauth/:provider
 * Returns the OAuth authorization URL to redirect the user to.
 */
export async function getOAuthUrl(provider: 'google' | 'github'): Promise<OAuthUrlResponse> {
  return api.get<OAuthUrlResponse>(`/v1/auth/oauth/${provider}`);
}

// ── Email Verification ──

/**
 * POST /v1/auth/verify/resend
 * Resends the verification email for unverified accounts.
 */
export async function resendVerification(email: string): Promise<{ message: string }> {
  return api.post('/v1/auth/verify/resend', { email });
}

/**
 * POST /v1/auth/verify
 * Verifies the email using a token from the verification link.
 */
export async function verifyEmail(token: string): Promise<MeResponse> {
  return api.post<MeResponse>('/v1/auth/verify', { token });
}
