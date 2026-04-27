// ==========================================
// Auth response types (RFC 7807 + Cookie-based auth v2)
// ==========================================

export interface LocationData {
  country: string;
  country_code?: string;
  country_name?: string;
  city: string;
  state?: string;
  timezone: string;
  currency: string;
  language: string;
  latitude?: string;
  longitude?: string;
}

export interface WeatherData {
  temp?: number;
  temperature_c?: number;
  feels_like?: number;
  description?: string;
  condition?: string;
  icon?: string;
  icon_url?: string;
  humidity?: number;
  humidity_percent?: number;
  wind_speed?: number;
}

export interface AuthUser {
  email: string;
  email_verified: boolean;
  role_name: string;
}

export interface LoginSuccessResponse {
  user: AuthUser;
  context: {
    location: LocationData;
    weather: WeatherData;
  };
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
  context: {
    location: LocationData;
    weather: WeatherData;
  };
}

export interface LogoutResponse {
  message: string;
}

export interface AuthError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  trace_id: string;
}

export interface CurrentUserResponse {
  user: AuthUser;
  context?: {
    location: LocationData;
    weather: WeatherData;
  };
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
