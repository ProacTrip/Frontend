import type { ContextResponse } from '@/app/lib/api/context';

export type { ContextResponse, LocationData, WeatherData } from '@/app/lib/api/context';

export interface AuthUser {
  email: string;
  email_verified: boolean;
  role_name: string;
}

export interface LoginSuccessResponse {
  user: AuthUser;
  context: ContextResponse;
}

export interface LoginMfaResponse {
  user: { email: string };
  mfa_required: true;
  mfa_methods: string[];
  session_id: string;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailResponse {
  user: AuthUser;
  context: ContextResponse;
}

export interface LogoutResponse {
  message: string;
}

export interface LogoutAllResponse {
  message: string;
}

export interface RateLimitError {
  type: string;
  title: string;
  status: 429;
  detail: string;
  instance: string;
  trace_id: string;
  /** Seconds until the rate limit resets (from Retry-After header) */
  retry_after?: number;
}

export interface AuthError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  trace_id: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}
