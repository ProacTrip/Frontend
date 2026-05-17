// app/lib/api/index.ts
//Utilidad: Exporta todo para importar fácil desde cualquier página

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
export {
  apiFetch,
  getCurrentUser,
  getUserProfile,
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getOAuthUrl,
  logoutUser,
  logoutAllSessions,
  FEATURE_PASSWORD_RESET,
  RateLimitError,
  AuthApiError,
} from './auth';
export type { UserProfile } from './auth';

// ==========================================
// 2. HOTELES
// ==========================================
export { searchHotels, getHotelDetails, getHotelRooms } from './hotels';

// ==========================================
// 3. VUELOS
// ==========================================
export { searchFlights, getFlightDetails } from './flights';

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
  // Permission overrides
  getPermissionOverrides,
  createPermissionOverride,
  deletePermissionOverride,
  // Roles & permissions catalog (management)
  listRoles,
  assignRole,
  listPermissions,
  // Avatars & audit (management)
  listAvatars,
  uploadAvatar,
  queryAuditLogs,
} from './management';

// ==========================================
// 5. NOTIFICACIONES (ADMIN)
// ==========================================
export {
  listTemplates,
  createTemplate,
  updateTemplate,
  toggleTemplate,
  sendNotification,
} from './notifications-admin';

// ==========================================
// 6. NOTIFICACIONES (USUARIO)
// ==========================================
export {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications';

// ==========================================
// 7. ENVIRONMENT (ubicación GeoIP + clima)
// ==========================================
export { getEnvironment } from './context';
export type { EnvironmentResponse, LocationData, WeatherData } from './context';

// ==========================================
// 8. USER PROFILE (NUEVO)
// ==========================================
export {
  getProfile,
  updateProfile,
  updateLocale,
  updateTravelPreferences,
  getMedicalProfile,
  updateMedicalProfile,
  updateNotificationPreference,
  getUploadAvatarUrl,
  uploadAvatarToR2,
  confirmAvatarUpload,
  listDefaultAvatars,
  selectDefaultAvatar,
  listFavorites,
  addFavorite,
  deleteFavorite,
} from './user';

export type {
  ProfileResponse,
  Profile,
  UpdateProfileBody,
  TravelPreferences,
  UpdateTravelPreferencesBody,
  MedicalProfile,
  UpdateMedicalProfileBody,
  NotificationPreference,
  UpdateNotificationPreferenceBody,
  LocaleUpdate,
  DefaultAvatar,
  AvatarUploadUrl,
  Gender,
  PreferredClass,
  SeatPreference,
  Channel,
  EntityType,
  Favorite,
  CreateFavoriteBody,
  FavoritesResponse,
  AddFavoriteResponse,
} from '@/app/lib/types/user';
