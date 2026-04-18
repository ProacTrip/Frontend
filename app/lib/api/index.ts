// app/lib/api/index.ts

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