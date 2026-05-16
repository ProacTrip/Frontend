// app/lib/api/index.ts
//Utilidad: Exporta todo para importar fácil desde cualquier página

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
export { apiFetch, getUserProfile, logoutUser, logoutAllSessions, RateLimitError } from './auth';
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
// 4. MANAGEMENT (ADMIN)
// ==========================================
export {
  listUsers,
  getUserDetail,
  listRoles,
  blockUser,
  unblockUser,
  assignRole,
  grantPermission,
  revokePermission,
  listPermissions,
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
// 7. CONTEXTO (ubicación + clima)
// ==========================================
export { getContext } from './context';
export type { ContextResponse, LocationData, WeatherData } from './context';

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