// ============================================================
// API Types — extracted from Backend docs (USER_API.md, AUTH_API.md, MANAGEMENT_API.md)
// ============================================================

// ============================================================
// Common
// ============================================================

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================
// Auth Types (AUTH_API.md) — Cookie-only, no MFA yet
// ============================================================

// UserInfo — canonical in src/lib/auth/types.ts
/** POST /v1/auth/login — cookie-only, no tokens in response */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    role_name: string;
  };
}

/** POST /v1/auth/register — 201 Created */
export interface RegisterResponse {
  message: string;
}

/** GET /v1/auth/oauth/:provider */
export interface OAuthUrlResponse {
  auth_url: string;
}

/** POST /v1/auth/logout */
export interface LogoutResponse {
  message: string;
}

/** GET /v1/auth/me — session check and OAuth callback user retrieval */
export interface MeResponse {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    role_name: string;
  };
}

// ============================================================
// Environment Types — canonical in src/lib/environment/types.ts
// ============================================================

// ============================================================
// User Types (USER_API.md)
// ============================================================

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null; // ISO 8601 YYYY-MM-DD
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  nationality: string | null; // 2-letter ISO country code
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  current_location: string | null;
  bio: string | null;
  timezone_name: string | null;
  language_code: string | null;
  currency_code: string | null;
  is_public: boolean;
}

export interface TravelPreferences {
  preferred_class: 'economy' | 'premium_economy' | 'business' | 'first' | null;
  seat_preference: 'window' | 'aisle' | 'middle' | 'no_preference' | null;
  meal_preference: string | null;
  special_assistance: string[] | null;
  preferred_airlines: string[] | null; // UUIDs
  preferred_hotels: string[] | null;
  avoid_layovers: boolean | null;
  max_layover_duration: number | null; // minutes
}

/** Channel preferences for a single notification type */
export interface NotificationChannelPrefs {
  email: boolean;
  sms: boolean;
  websocket: boolean;
}

/** Map of notification_type → channel preferences */
export type NotificationPreferences = Record<string, NotificationChannelPrefs>;

/**
 * GET /v1/user/profile — FLAT response (all fields at root level).
 * Mirrors USER_API.md lines 266-306.
 */
export interface GetProfileResponse {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  nationality: string | null;
  phone: string | null;
  bio: string | null;
  is_public: boolean;
  location: {
    country: string;
    country_code: string;
    city: string;
    state: string;
    zipcode: string;
    timezone: string;
    currency: string;
    language: string;
    latitude: number;
    longitude: number;
  };
  travel_preferences: TravelPreferences;
  notification_preferences: NotificationPreferences;
}

/**
 * Traced field — backend returns per-field provenance metadata.
 * Source values: "manual" | "ocr:{document_id}" | "nlp:{conversation_id}"
 */
export interface TracedField<T> {
  value: T;
  source: string;
  updated_at: string;
}

/**
 * GET /v1/user/profile/medical — traced medical profile response.
 * All medical fields wrap values in TracedField for provenance tracking.
 * is_shared is a plain boolean (not traced).
 */
export interface MedicalProfile {
  blood_type: TracedField<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null>;
  allergies: TracedField<string | null>;
  medications: TracedField<string | null>;
  conditions: TracedField<string | null>;
  vaccinations: TracedField<string | null>;
  emergency_contact: TracedField<string | null>;
  insurance_info: TracedField<string | null>;
  is_shared: boolean;
  has_pending_conflicts: boolean;
  pending_conflict_count: number;
}

/**
 * PUT /v1/user/profile/medical — update body (flat string fields, not TracedField).
 */
export interface MedicalProfileUpdate {
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
  allergies?: string | null;
  medications?: string | null;
  conditions?: string | null;
  vaccinations?: string | null;
  emergency_contact?: string | null;
  insurance_info?: string | null;
  is_shared?: boolean;
}

export interface MedicalPendingUpdate {
  id: string;
  /** Field name — NOT field_name (matches backend response) */
  field: string;
  current_value: string | null;
  proposed_value: string;
  source: {
    type: 'ocr' | 'nlp';
    document_id: string;
    file_name: string;
  };
  suggested_at: string;
  expires_at: string;
}

export interface ListMedicalPendingResponse {
  /** conflicts — NOT pending_updates (matches backend response) */
  conflicts: MedicalPendingUpdate[];
}

export interface AvatarUploadResponse {
  upload_url: string;
  storage_key: string;
  expires_at: string;
  message: string;
}

export interface AvatarConfirmResponse {
  avatar_url: string;
  message: string;
}

export interface DefaultAvatar {
  name: string;
  download_url: string;
}

export interface ListDefaultAvatarsResponse {
  avatars: DefaultAvatar[];
}

export interface SelectDefaultAvatarResponse {
  avatar_url: string;
  message: string;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_identity: boolean;
  requires_ocr: boolean;
}

export interface ListDocumentTypesResponse {
  document_types: DocumentType[];
}

export interface Document {
  id: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  ocr_status: 'uploaded' | 'validating' | 'sanitizing' | 'ocr_processing' | 'completed' | 'rejected' | 'failed';
  ocr_confidence: number | null;
  is_verified: boolean;
  document_type: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UploadDocumentResponse {
  document_id: string;
  status: string;
  events_url: string;
  message: string;
}

export interface ListDocumentsResponse {
  documents: Document[];
}

export interface GetDocumentResponse extends Document {
  extracted_data: Record<string, unknown> | null;
  ocr_data: Record<string, unknown> | null;
}

export interface SavedSearch {
  id: string;
  name: string | null;
  parameters: Record<string, unknown>;
  filters: Record<string, unknown> | null;
  alert_enabled: boolean;
  last_executed_at: string | null;
  result_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedSearchResponse {
  search_id: string;
  message: string;
}

export interface ListSavedSearchesResponse {
  searches: SavedSearch[];
}

export interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  entity_id: string;
  entity_type: string;
  price_snapshot: Record<string, unknown> | null;
  currency_code: string | null;
  notes: string | null;
  added_at: string;
}

export interface CreateWishlistResponse {
  wishlist_id: string;
  message: string;
}

export interface GetWishlistResponse extends Wishlist {
  items: WishlistItem[];
}

export interface AddWishlistItemResponse {
  item_id: string;
  message: string;
}

// ============================================================
// Management Types (MANAGEMENT_API.md)
// ============================================================

export interface ManagementUser {
  id: string;
  email: string;
  status: string;
  role: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  failed_login_attempts: number;
  last_login_at: string | null;
  locked_until: string | null;
  blocked_until: string | null;
  block_reason: string | null;
  created_at: string;
  permissions: string[];
}

export interface ManagementUserDetail extends ManagementUser {
  role_id: string;
}

export interface ListUsersResponse {
  users: ManagementUser[];
  total: number;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface ListPermissionsResponse {
  permissions: Permission[];
}

export interface AuditLog {
  id: string;
  event_type: string;
  event_source: string;
  actor_id: string;
  actor_type: string;
  outcome: string;
  severity: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ListAuditLogsResponse {
  audit_logs: AuditLog[];
  total: number;
}

// ============================================================
// Notification Types (NOTIFICATION_API.md)
// ============================================================

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  channel: 'email' | 'sms';
  subject: string | null;
  content_html: string | null;
  content_text: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListTemplatesResponse {
  templates: NotificationTemplate[];
}

export interface Notification {
  id: string;
  type: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  subject: string | null;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface SendNotificationResponse {
  notification_id: string;
  status: string;
  provider_id: string | null;
}
