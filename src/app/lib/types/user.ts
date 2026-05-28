// app/lib/types/user.ts
// Tipos exactos del módulo User Profile según USER_API.md (May 2026)
// Backend corregido en PR #1 / PR #2: paths, métodos, DTOs, medical profile tipado

// ─────────────────────────────────────────────────────────────
// ENUMS (valores exactos que valida el backend)
// ─────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export type PreferredClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type SeatPreference = 'window' | 'aisle' | 'middle' | 'no_preference';

export type Channel = 'email' | 'sms' | 'websocket';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// ─────────────────────────────────────────────────────────────
// MEDICAL — source tracing & field value wrapper
// ─────────────────────────────────────────────────────────────

export interface MedicalSourceDetail {
  type: 'manual' | 'ocr';
  document_id: string | null;
  confidence: number | null;
}

export interface MedicalFieldValue<T> {
  value: T;
  source: MedicalSourceDetail;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// MEDICAL — sub-types for structured values
// ─────────────────────────────────────────────────────────────

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
}

export interface Vaccination {
  name: string;
  doses_received: number;
  status: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string | null;
}

export interface InsuranceInfo {
  company: string;
  policy_number: string;
  plan_type: string | null;
  expiration_date: string | null;
}

// ─────────────────────────────────────────────────────────────
// MEDICAL PROFILE (tipado — backend devuelve rich values, NO stringified JSON)
// ─────────────────────────────────────────────────────────────

export interface MedicalProfile {
  blood_type: MedicalFieldValue<string | null>;
  allergies: MedicalFieldValue<string[]>;
  medications: MedicalFieldValue<Medication[]>;
  conditions: MedicalFieldValue<string[]>;
  vaccinations: MedicalFieldValue<Vaccination[]>;
  emergency_contact: MedicalFieldValue<EmergencyContact | null>;
  insurance_info: MedicalFieldValue<InsuranceInfo | null>;
}

/** API response wrapper: GET /v1/user/profile/medical → { data: MedicalProfile, is_shared, has_pending_conflicts, pending_conflict_count } */
export interface GetMedicalProfileResponse {
  data: MedicalProfile;
  is_shared: boolean;
  has_pending_conflicts: boolean;
  pending_conflict_count: number;
}

export interface UpdateMedicalProfileBody {
  blood_type?: BloodType | null;
  allergies?: string[] | null;
  medications?: Medication[] | null;
  conditions?: string[] | null;
  vaccinations?: Vaccination[] | null;
  emergency_contact?: EmergencyContact | null;
  insurance_info?: InsuranceInfo | null;
}

// ─────────────────────────────────────────────────────────────
// PERFIL PRINCIPAL
// ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string;                           // UUID v7 — profile ID (≠ user_id)
  user_id: string;                      // UUID v7 — auth users FK
  email: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;         // ISO 8601: YYYY-MM-DD
  gender: Gender | null;
  nationality: string | null;           // ISO 3166-1 alpha-2 (ej: "AR") o nombre completo (ej: "Argentina")
  phone: string | null;                 // E.164 (ej: "+5491123456789")
  bio: string | null;
  avatar_url: string | null;
  role_name?: string;
  language_code: string | null;         // adapter-derived from location.language
  currency_code: string | null;         // adapter-derived from location.currency
  timezone_name: string | null;         // adapter-derived from location.timezone (optional)
}

export interface UpdateProfileBody {
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  nationality?: string | null;
  phone?: string | null;
  bio?: string | null;
  language?: string | null;             // ISO 639-1 — merged from old LocaleUpdate
  currency?: string | null;             // ISO 4217 — merged from old LocaleUpdate
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

// NOTE: updateNotificationPreference() removed — endpoint doesn't exist yet.
// Notification preferences are read-only via getProfile().

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
  expires_at: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// CONFLICTOS MÉDICOS
// ─────────────────────────────────────────────────────────────

export type ConflictAction = 'accept' | 'reject' | 'custom';

export interface MedicalConflict {
  id: string;
  field: string;
  current_value: string;
  proposed_value: string;
  source: {
    type: 'ocr';                        // ONLY 'ocr' — NLP deprecated
    document_id: string;
    file_name: string;
  };
  status: string;                       // 'pending' | 'resolved' | 'rejected'
  suggested_at: string;
  expires_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

export interface PendingConflictsResponse {
  conflicts: MedicalConflict[];
}

/** Body for POST /v1/user/profile/medical-conflicts/:conflict_id/resolve */
export interface ResolveConflictBody {
  action: ConflictAction;
  value?: string;                       // required when action='custom'
}

export type PendingConflicts = MedicalConflict[];

// ─────────────────────────────────────────────────────────────
// RESPUESTA PRINCIPAL (GET /v1/user/profile)
// ─────────────────────────────────────────────────────────────

export interface ProfileResponse {
  profile: Profile;
}

// ─────────────────────────────────────────────────────────────
// FAVORITOS
// ─────────────────────────────────────────────────────────────

export type EntityType = 'hotel' | 'flight' | 'destination';

export interface Favorite {
  id: string;
  entity_id: string;
  entity_type: EntityType;
  title: string;
  notes: string | null;
  created_at: string;
}

export interface CreateFavoriteBody {
  entity_id: string;
  entity_type: EntityType;
  title: string;
  notes?: string;
}

export interface FavoritesResponse {
  favorites: Favorite[];
}

export interface AddFavoriteResponse {
  favorite_id: string;
  message: string;
}
