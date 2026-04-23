// app/lib/api/index.ts
//Utilidad: Exporta todo para importar fácil desde cualquier página

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
export { refreshAccessToken, apiFetch, getUserProfile } from './auth';
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