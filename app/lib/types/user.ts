// app/lib/types/user.ts
// Tipos exactos del módulo User Profile según la guía de Marco Aurelio

// ─────────────────────────────────────────────────────────────
// ENUMS (valores exactos que valida el backend)
// ─────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export type PreferredClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type SeatPreference = 'window' | 'aisle' | 'middle' | 'no_preference';

export type Channel = 'email' | 'sms' | 'websocket';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// ─────────────────────────────────────────────────────────────
// ERRORES (formato: { error: { code, message } })
// ─────────────────────────────────────────────────────────────

export interface UserError {
  error: {
    code: string;
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────
// PERFIL PRINCIPAL
// ─────────────────────────────────────────────────────────────

export interface Profile {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;        // ISO 8601: YYYY-MM-DD
  gender: Gender | null;
  nationality: string | null;          // ISO 3166-1 alpha-2 (ej: "ES")
  phone: string | null;                // E.164 (ej: "+34600123456")
  phone_verified: boolean;
  current_location: string | null;
  bio: string | null;
  is_public: boolean;
  avatar_url: string | null;
  language_code: string | null;        // ISO 639-1 (ej: "es")
  currency_code: string | null;        // ISO 4217 (ej: "EUR")
  timezone_name: string | null;        // IANA (ej: "Europe/Madrid")
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601
}

export interface UpdateProfileBody {
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  nationality?: string | null;
  phone?: string | null;
  current_location?: string | null;
  bio?: string | null;
  is_public?: boolean;
}

// ─────────────────────────────────────────────────────────────
// PREFERENCIAS DE VIAJE
// ─────────────────────────────────────────────────────────────

export interface TravelPreferences {
  preferred_class: PreferredClass | null;
  seat_preference: SeatPreference | null;
  meal_preference: string | null;
  special_assistance: string[] | null;
  preferred_airlines: string[] | null;
  preferred_hotels: string[] | null;
  avoid_layovers: boolean;
  max_layover_duration: number | null;
}

export interface UpdateTravelPreferencesBody {
  preferred_class?: PreferredClass | null;
  seat_preference?: SeatPreference | null;
  meal_preference?: string | null;
  special_assistance?: string[] | null;
  preferred_airlines?: string[] | null;
  preferred_hotels?: string[] | null;
  avoid_layovers?: boolean;
  max_layover_duration?: number | null;
}

// ─────────────────────────────────────────────────────────────
// PERFIL MÉDICO
// ─────────────────────────────────────────────────────────────

export interface MedicalProfile {
  blood_type: BloodType | null;
  allergies: string | null;           // ← FIX: string, no string[]
  medications: string | null;         // ← FIX: string, no string[]
  conditions: string | null;          // ← FIX: string, no string[]
  vaccinations: string | null;        // ← FIX: string, no string[]
  emergency_contact: string | null;
  insurance_info: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateMedicalProfileBody {
  blood_type?: BloodType | null;
  allergies?: string | null;          // ← FIX: string, no string[]
  medications?: string | null;        // ← FIX: string, no string[]
  conditions?: string | null;         // ← FIX: string, no string[]
  vaccinations?: string | null;       // ← FIX: string, no string[]
  emergency_contact?: string | null;
  insurance_info?: string | null;
  is_shared?: boolean;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICACIONES
// ─────────────────────────────────────────────────────────────

export interface NotificationPreference {
  channel: Channel;
  notification_type: string;
  enabled: boolean;
}

export interface UpdateNotificationPreferenceBody {
  channel: Channel;
  notification_type: string;
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────
// LOCALIZACIÓN
// ─────────────────────────────────────────────────────────────

export interface LocaleUpdate {
  timezone_name?: string | null;
  language_code?: string | null;
  currency_code?: string | null;
}

// ─────────────────────────────────────────────────────────────
// AVATARES
// ─────────────────────────────────────────────────────────────

export interface DefaultAvatar {
  name: string;
  url: string;
  label: string;
}

export interface AvatarUploadUrl {
  upload_url: string;
  storage_key: string;
}

// ─────────────────────────────────────────────────────────────
// RESPUESTA PRINCIPAL
// ─────────────────────────────────────────────────────────────

export interface ProfileResponse {
  profile: Profile;
  travel_preferences: TravelPreferences | null;
  notification_preferences: NotificationPreference[];
}