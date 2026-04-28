// app/lib/constants/flights.ts

// ✅ Importamos los tipos del contrato de API
import { TripType, TravelClass } from '../types/flight';

// ==========================================
// 1. LÍMITES DE PASAJEROS (Según documentación Marco)
// ==========================================
export const PASSENGER_LIMITS = {
  MAX_ADULTS: 9,
  MAX_CHILDREN: 8,
  MAX_INFANTS_PER_ADULT: 2,
  MIN_ADULTS: 1,
  DEFAULT_ADULTS: 1,
  DEFAULT_CHILDREN: 0,
  DEFAULT_INFANTS_IN_SEAT: 0,
  DEFAULT_INFANTS_ON_LAP: 0,
} as const;

// ==========================================
// 2. CLASES DE VIAJE (travel_class)
// ==========================================
export const TRAVEL_CLASSES = [
  { value: 'economy', label: 'Turista', icon: '💺' },
  { value: 'premium_economy', label: 'Turista Premium', icon: '⭐' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'first', label: 'Primera', icon: '👑' },
] as const;

// ==========================================
// 3. TIPOS DE VIAJE (trip_type)
// ==========================================
export const TRIP_TYPES = [
  { value: 'one_way', label: 'Solo ida', icon: '➡️', description: 'Vuelo sin regreso' },
  { value: 'round_trip', label: 'Ida y vuelta', icon: '↔️', description: 'Vuelo de ida y regreso' },
  { value: 'multi_city', label: 'Multidestino', icon: '🌐', description: 'Varias ciudades' },
] as const;

// ==========================================
// 4. OPCIONES DE ESCALAS (stops)
// ==========================================
// ✅ MANTENEMOS STRINGS según documentación de Marco ("any", "nonstop", etc)
export const STOP_OPTIONS = [
  { value: 'any', label: 'Cualquier escala', description: 'Todos los vuelos disponibles' },
  { value: 'nonstop', label: 'Directo', description: 'Sin escalas' },
  { value: 'max_1', label: '1 escala máx.', description: 'Hasta una parada' },
  { value: 'max_2', label: '2 escalas máx.', description: 'Hasta dos paradas' },
] as const;

export type StopOption = typeof STOP_OPTIONS[number]['value'];

// ==========================================
// 5. OPCIONES DE ORDENAMIENTO (sort_by)
// ==========================================
export const SORT_OPTIONS = [
  { value: 'top', label: 'Mejores vuelos', icon: '🏆' },
  { value: 'price', label: 'Precio más bajo', icon: '💰' },
  { value: 'departure_time', label: 'Hora de salida', icon: '🛫' },
  { value: 'arrival_time', label: 'Hora de llegada', icon: '🛬' },
  { value: 'duration', label: 'Duración', icon: '⏱️' },
  { value: 'emissions', label: 'Menos emisiones', icon: '🌱' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

// ==========================================
// 6. AEROPUERTOS COMUNES
// ==========================================
export const COMMON_AIRPORTS = [
  { code: 'MAD', city: 'Madrid', country: 'España', name: 'Adolfo Suárez Madrid-Barajas' },
  { code: 'BCN', city: 'Barcelona', country: 'España', name: 'Josep Tarradellas Barcelona-El Prat' },
  { code: 'SVQ', city: 'Sevilla', country: 'España', name: 'Sevilla-San Pablo' },
  { code: 'VLC', city: 'Valencia', country: 'España', name: 'Valencia-Manises' },
  { code: 'AGP', city: 'Málaga', country: 'España', name: 'Málaga-Costa del Sol' },
  { code: 'BIO', city: 'Bilbao', country: 'España', name: 'Bilbao' },
  { code: 'LPA', city: 'Las Palmas', country: 'España', name: 'Gran Canaria' },
  { code: 'TFN', city: 'Tenerife', country: 'España', name: 'Tenerife Norte' },
  { code: 'LHR', city: 'Londres', country: 'Reino Unido', name: 'Heathrow' },
  { code: 'CDG', city: 'París', country: 'Francia', name: 'Charles de Gaulle' },
  { code: 'FCO', city: 'Roma', country: 'Italia', name: 'Fiumicino' },
  { code: 'AMS', city: 'Ámsterdam', country: 'Países Bajos', name: 'Schiphol' },
  { code: 'FRA', city: 'Frankfurt', country: 'Alemania', name: 'Frankfurt Airport' },
  { code: 'LIS', city: 'Lisboa', country: 'Portugal', name: 'Humberto Delgado' },
  { code: 'JFK', city: 'Nueva York', country: 'USA', name: 'John F. Kennedy' },
  { code: 'MIA', city: 'Miami', country: 'USA', name: 'Miami International' },
  { code: 'LIM', city: 'Lima', country: 'Perú', name: 'Jorge Chávez' },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', name: 'Ezeiza' },
  { code: 'BOG', city: 'Bogotá', country: 'Colombia', name: 'El Dorado' },
  { code: 'SCL', city: 'Santiago', country: 'Chile', name: 'Arturo Merino Benítez' },
] as const;

// ==========================================
// 7. AEROLÍNEAS COMUNES
// ==========================================
export const COMMON_AIRLINES = [
  { code: 'IB', name: 'Iberia', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/IB.png' },
  { code: 'FR', name: 'Ryanair', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/FR.png' },
  { code: 'UX', name: 'Air Europa', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/UX.png' },
  { code: 'VY', name: 'Vueling', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/VY.png' },
  { code: 'BA', name: 'British Airways', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/BA.png' },
  { code: 'AF', name: 'Air France', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AF.png' },
  { code: 'LH', name: 'Lufthansa', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/LH.png' },
  { code: 'KL', name: 'KLM', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/KL.png' },
  { code: 'TP', name: 'TAP Portugal', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/TP.png' },
  { code: 'AZ', name: 'ITA Airways', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AZ.png' },
  { code: 'UA', name: 'United Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/UA.png' },
  { code: 'AA', name: 'American Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AA.png' },
  { code: 'LA', name: 'LATAM', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/LA.png' },
  { code: 'AV', name: 'Avianca', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AV.png' },
] as const;

// ==========================================
// 8. CONFIGURACIÓN DE BÚSQUEDA
// ==========================================
export const SEARCH_CONFIG = {
  DEFAULT_CURRENCY: 'EUR', // Doc dice USD, pero para TFG en España usamos EUR
  DEFAULT_LOCALE: 'es',    // Mapearemos a 'hl' en api.ts
  DEFAULT_MARKET: 'ES',    // Mapearemos a 'gl' en api.ts
  DEFAULT_BAGS: 0,         // ✅ Default según docs
  MIN_DAYS_ADVANCE: 0,
  MAX_DAYS_ADVANCE: 330,
  DEFAULT_TRIP_TYPE: 'round_trip' as TripType,
  DEFAULT_TRAVEL_CLASS: 'economy' as TravelClass,
  DEFAULT_SORT_BY: 'top' as SortOption,
  DEFAULT_STOPS: 'any' as StopOption,
  RESULTS_PER_PAGE: 10,
  MAX_RESULTS_PER_PAGE: 100,
} as const;

// ==========================================
// 9. MENSAJES DE ERROR / ESTADOS
// ==========================================
export const FLIGHT_ERROR_MESSAGES = {
  INVALID_DATES: 'Las fechas seleccionadas no son válidas',
  PAST_DATE: 'La fecha no puede ser anterior a hoy',
  RETURN_BEFORE_OUTBOUND: 'La fecha de vuelta debe ser posterior a la de ida',
  MAX_PASSENGERS_EXCEEDED: 'Has superado el límite de pasajeros permitido',
  INFANTS_WITHOUT_ADULTS: 'Debe haber al menos un adulto por cada bebé',
  NO_RESULTS: 'No encontramos vuelos para esta ruta y fechas',
  TOKEN_EXPIRED: 'La sesión ha expirado. Por favor, busca de nuevo.',
  API_ERROR: 'Error al buscar vuelos. Inténtalo de nuevo.',
  INVALID_AIRPORT: 'Selecciona un aeropuerto válido',
  SAME_AIRPORT: 'El origen y destino no pueden ser el mismo',
  // ✅ Regla de negocio de Marco
  AIRLINE_FILTER_CONFLICT: 'No puedes incluir y excluir aerolíneas al mismo tiempo',
} as const;

// ==========================================
// 10. MOCK DATA
// ==========================================
export const MOCK_OUTBOUND_TOKEN = 'WyJDalJJTVVKWE5VOTVkeTFQZFVsQlRHRldWbmRDUnkwdExTMHRMUzB0TFhaMFltWnFPVUZCUVVGQlIyMHpTVTl6UzI1cWJ6SkJFZ1ZKUWpFeU5Sb0xDTkxLRGhBQ0dnTkZWVkk0SEhEdTFCQT0iLFtbIk1BRCIsIjIwMjYtMDMtMjAiLCJMSU0iLG51bGwsIklCIiwiMTI1Il1dXQ==';
export const MOCK_BOOKING_TOKEN = 'WyJDalJJT1ZSSmJGQnFRMVpwUVZWQlQwcFFYMmRDUnkwdExTMHRMUzB0YjNsaWFIazBORUZCUVVGQlIyMHpTV1ZyUlhGMmMwdEJFZ1ZKUWpFeU5ob0xDTkxLRGhBQ0dnTkZWVkk0SEhDUzFCQT0=';

export const MOCK_PRICE_RANGES = {
  SHORT_HAUL: { min: 50, max: 300 },
  MEDIUM_HAUL: { min: 200, max: 800 },
  LONG_HAUL: { min: 600, max: 2000 },
} as const;