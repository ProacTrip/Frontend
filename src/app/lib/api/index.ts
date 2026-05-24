// app/lib/api/index.ts
//Utilidad: Exporta todo para importar fácil desde cualquier página

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
export {
  apiFetch,
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getOAuthUrl,
  logoutUser,
  FEATURE_PASSWORD_RESET,
  RateLimitError,
  AuthApiError,
} from './auth';

// ==========================================
// 2. HOTELES
// ==========================================
export { searchHotels, getHotelDetails, getHotelRooms, HotelApiError } from './hotels';
export type { HotelErrorCode } from './hotels';

// ==========================================
// 3. VUELOS
// ==========================================
export { searchFlights, getFlightDetails, FlightApiError } from './flights';
export type { FlightErrorCode } from './flights';

// ==========================================
// 4. DASHBOARD (ADMIN)
// ==========================================
export {
  // Users
  listUsers,
  getUserDetail,
  updateAccountStatus,
  // Feature limits — user
  getUserFeatureLimits,
  setUserFeatureLimit,
  deleteUserFeatureLimit,
  // Feature limits — role
  getRoleFeatureLimits,
  setRoleFeatureLimit,
  deleteRoleFeatureLimit,
} from './management';

// ==========================================
// 5. ENVIRONMENT (ubicación GeoIP + clima)
// ==========================================
export { getEnvironment } from './context';
export type { EnvironmentResponse, LocationData, WeatherData } from './context';

// ==========================================
// 6. USER PROFILE (NUEVO)
// ==========================================
export {
  getProfile,
  updateProfile,
  getTravelPreferences,
  updateTravelPreferences,
  getMedicalProfile,
  adaptMedicalProfile,
  updateMedicalProfile,
  listMedicalConflicts,
  resolveMedicalConflict,
  getUploadAvatarUrl,
  uploadAvatarToR2,
  confirmAvatarUpload,
  UserApiError,
  parseUserError,
} from './user';
export type { UserErrorCode } from './user';

export type {
  ProfileResponse,
  Profile,
  UpdateProfileBody,
  TravelPreferences,
  UpdateTravelPreferencesBody,
  MedicalProfile,
  GetMedicalProfileResponse,
  UpdateMedicalProfileBody,
  MedicalFieldValue,
  MedicalSourceDetail,
  Medication,
  Vaccination,
  EmergencyContact,
  InsuranceInfo,
  MedicalConflict,
  PendingConflictsResponse,
  ResolveConflictBody,
  ConflictAction,
  PendingConflicts,
  AvatarUploadUrl,
  Gender,
  PreferredClass,
  SeatPreference,
  Channel,
  BloodType,
  EntityType,
  Favorite,
  CreateFavoriteBody,
  FavoritesResponse,
  AddFavoriteResponse,
} from '@/app/lib/types/user';

// ==========================================
// 7. DOCUMENTOS — ADMIN (VERIFICACIÓN)
// ==========================================
export {
  getDocumentVerification,
  updateDocumentVerification,
  reprocessDocument,
  DashboardApiError as DocumentsAdminApiError,
} from './documents-admin';

// ==========================================
// 8. DOCUMENTOS (USUARIO)
// ==========================================
export {
  listDocumentTypes,
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentDownloadUrl,
  downloadDocument,
  deleteDocument,
  subscribeToDocumentEvents,
} from './documents';

export type {
  DocumentType,
  DocumentListItem,
  DocumentDetail,
  DocumentUploadResponse,
  DocumentDownloadUrlResponse,
  DocumentEvent,
  DocumentListResponse,
  OcrStatus,
  VerificationStatus,
} from '@/app/lib/types/document';

// ==========================================
// 9. AI SEARCH
// ==========================================
export { searchAI } from './search-ai';
export { SearchAIError } from '@/app/lib/types/search-ai';
export type { AIErrorCode } from '@/app/lib/types/search-ai';
export type {
  AIResponse,
  AIIntent,
  AIIncompleteResponse,
  AIAmbiguousResponse,
  AIFlightsResponse,
  AIHotelsResponse,
  AIBothResponse,
  AIDiscoveryResponse,
  SearchAIRequest,
  ChatMessage,
} from '@/app/lib/types/search-ai';
