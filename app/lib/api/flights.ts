// app/lib/api/flights.ts

import { apiFetch } from './auth';

// Imports absolutos para consistencia
import type {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightDetailsRequest,
  FlightDetailsResponse,
  FlightOffer,
  FlightLeg,
  AirportEndpoint,
  AirportInfo
} from '@/app/lib/types/flight';
import {
  SEARCH_CONFIG,
  FLIGHT_ERROR_MESSAGES,
  MOCK_OUTBOUND_TOKEN,
  MOCK_BOOKING_TOKEN
} from '@/app/lib/constants/flights';
import { getUserPreferences } from '@/app/lib/utils/location';

// Flag para activar/desactivar mocks
const USE_FLIGHT_MOCKS = process.env.NEXT_PUBLIC_USE_FLIGHT_MOCKS === 'true';

// ==========================================
// HELPERS
// ==========================================

function formatDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  // ✅ FIX: Usar formato local sin conversión UTC
  return date.toLocaleDateString('sv-SE');
}

// ==========================================
// FUNCIONES DE VUELOS
// ==========================================

/**
 * ✈️ BUSCAR VUELOS
 */
export async function searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {

  // 1. Validación de negocio
  if (request.include_airlines?.length && request.exclude_airlines?.length) {
    throw new Error(FLIGHT_ERROR_MESSAGES.AIRLINE_FILTER_CONFLICT);
  }

  const user = getUserPreferences();

  // 2. Construcción del cuerpo de la petición
  const apiBody: FlightSearchRequest = {
    ...request,
    outbound_date: formatDate(request.outbound_date),
    return_date: formatDate(request.return_date),
    hl: request.hl || user.hl,
    gl: request.gl || user.gl,
    // Solo incluir filtros de aerolíneas si tienen valores reales.
    // NO forzar a [] — eso enviaba "include_airlines":[] junto a
    // "exclude_airlines":["IB"], lo que confundía al backend, que
    // silenciosamente ignoraba el filtro de exclusión.
    ...(request.include_airlines?.length ? { include_airlines: request.include_airlines } : {}),
    ...(request.exclude_airlines?.length ? { exclude_airlines: request.exclude_airlines } : {}),
    legs: request.legs || [],
    // Paginación: forward cursor/limit to API (undefined si no presente)
    cursor: request.cursor ?? null,
    limit: request.limit ?? undefined,
  };

  // 3. MODO MOCK
  if (USE_FLIGHT_MOCKS) {
    console.log('🚧 [MOCK] Simulando búsqueda de vuelos...');
    return mockSearchFlights(request);
  }

  // 4. MODO REAL
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await apiFetch('/v1/search/flights', {
      method: 'POST',
      body: JSON.stringify(apiBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const detail = errorData?.detail || errorData?.error || errorData?.message;

      if (response.status === 422 && request.outbound_selection_token) {
        throw new Error(FLIGHT_ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      if (response.status === 400) {
        throw new Error(detail || `${FLIGHT_ERROR_MESSAGES.API_ERROR}: Parámetros inválidos`);
      }
      if (response.status === 503) {
        throw new Error('Servicio no disponible. Intenta más tarde.');
      }

      throw new Error(detail || `Error ${response.status}: ${response.statusText}`);
    }

    const data: FlightSearchResponse = await response.json();

    if (data.results_state === 'empty') {
      return {
        ...data,
        best_flights: [],
        other_flights: []
      };
    }

    return data;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }
    throw error;
  }
}

/**
 * ✈️ DETALLES DE VUELO
 */
export async function getFlightDetails(
  bookingToken: string,
  adults?: number,
  currency?: string,
  routeParams?: {
    departure: string;
    arrival: string;
    outboundDate: string;
    returnDate?: string;
  }
): Promise<FlightDetailsResponse> {
  if (!bookingToken) throw new Error('Se requiere booking_token');

  const user = getUserPreferences();

  const apiBody: FlightDetailsRequest = {
    booking_token: bookingToken,
    adults: adults || 1,
    hl: user.hl,
    gl: user.gl,
    currency: currency || 'EUR',
    departure: routeParams?.departure,
    arrival: routeParams?.arrival,
    outbound_date: routeParams?.outboundDate,
    return_date: routeParams?.returnDate,
  };

  if (USE_FLIGHT_MOCKS) {
    console.log('🚧 [MOCK] Simulando detalles de vuelo...');
    return mockFlightDetails();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await apiFetch('/v1/search/flight-details', {
      method: 'POST',
      body: JSON.stringify(apiBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const detail = errorData?.detail || errorData?.error || errorData?.message;
      if (response.status === 404) throw new Error(FLIGHT_ERROR_MESSAGES.TOKEN_EXPIRED);
      throw new Error(detail || FLIGHT_ERROR_MESSAGES.API_ERROR);
    }

    return await response.json();

  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ==========================================
// MOCKS INTELIGENTES (CORREGIDOS)
// ==========================================

function mockSearchFlights(request: FlightSearchRequest): FlightSearchResponse {
  const isRoundTrip = request.trip_type === 'round_trip';
  const isMultiCity = request.trip_type === 'multi_city';
  const hasOutboundToken = !!request.outbound_selection_token;

  if (isMultiCity) {
    return {
      trip_type: 'multi_city',
      phase: 'complete',
      results_state: 'matching',
      best_flights: [],
      other_flights: [
        createMockFlightOffer(MOCK_BOOKING_TOKEN, 'UX 5021', 'MAD', 'MIA', 540),
        createMockFlightOffer(MOCK_BOOKING_TOKEN + '2', 'AA 999', 'MIA', 'MAD', 560)
      ],
      airports: [
        createMockAirport('MAD', 'Madrid', 'departure'),
        createMockAirport('MIA', 'Miami', 'arrival')
      ],
      price_insights: undefined, // ✅ CORREGIDO: null -> undefined
      from_cache: false,
      cached_at: null
    };
  }

  // FASE 1: Búsqueda inicial (Ida)
  if (!hasOutboundToken) {
    return {
      trip_type: request.trip_type,
      phase: isRoundTrip ? 'outbound_selection' : 'complete',
      results_state: 'matching',
      best_flights: [],
      other_flights: [
        createMockFlightOffer(MOCK_OUTBOUND_TOKEN, 'IB 125', 'MAD', 'LIM', 720, 'round_trip', true),
        createMockFlightOffer(MOCK_OUTBOUND_TOKEN + '2', 'UX 5021', 'MAD', 'LIM', 750, 'round_trip', true),
        createMockFlightOffer(MOCK_OUTBOUND_TOKEN + '3', 'LA 2465', 'BCN', 'LIM', 810, 'round_trip', true),
      ],
      airports: [
        createMockAirport('MAD', 'Madrid', 'departure'),
        createMockAirport('LIM', 'Lima', 'arrival'),
        createMockAirport('BCN', 'Barcelona', 'departure')
      ],
      price_insights: {
        lowest_price: { amount: 450, currency: 'EUR' },
        price_level: 'low',
        typical_range: { min: 400, max: 600, currency: 'EUR' },
        price_history: []
      },
      from_cache: false,
      cached_at: null
    };
  }

  // FASE 2: Selección de vuelta (Round Trip)
  if (isRoundTrip && hasOutboundToken) {
    return {
      trip_type: 'round_trip',
      phase: 'return_selection',
      results_state: 'matching',
      best_flights: [],
      other_flights: [
        createMockFlightOffer(MOCK_BOOKING_TOKEN, 'IB 126', 'LIM', 'MAD', 680),
        createMockFlightOffer(MOCK_BOOKING_TOKEN + '2', 'UX 5022', 'LIM', 'MAD', 710),
      ],
      airports: [
        createMockAirport('MAD', 'Madrid', 'arrival'),
        createMockAirport('LIM', 'Lima', 'departure')
      ],
      price_insights: undefined, // ✅ CORREGIDO: null -> undefined
      from_cache: false,
      cached_at: null
    };
  }

  throw new Error('Configuración de mock no reconocida');
}

function mockFlightDetails(): FlightDetailsResponse {
  return {
    itinerary: {
      trip_type: 'round_trip',
      outbound: {
        legs: [
          createMockLeg('IB 125', 'MAD', 'LIM', '2026-03-20 13:10', '2026-03-20 19:10', 720)
        ],
        layovers: [],
        total_duration_minutes: 720,
        carbon_emissions: {
          this_flight_grams: 1146000,
          typical_route_grams: 1242000,
          difference_percent: -8
        }
      },
      return: {
        legs: [
          createMockLeg('IB 126', 'LIM', 'MAD', '2026-03-30 20:00', '2026-03-31 14:20', 680)
        ],
        layovers: [],
        total_duration_minutes: 680,
        carbon_emissions: {
          this_flight_grams: 1147000,
          typical_route_grams: 1276000,
          difference_percent: -10
        }
      }
    },
    booking_options: [{
      trip_type: 'round_trip',
      separate_tickets: false,
      together: {
        book_with: 'Iberia',
        airline: true,
        airline_logos: ['https://www.gstatic.com/flights/airline_logos/70px/IB.png'],
        marketed_as: ['IB 125', 'IB 126'],
        price: 890,
        option_title: 'Turista Basica',
        baggage_prices: ['1 free carry-on'],
        booking_phone: '',
        booking_request: {
          url: 'https://www.iberia.com',
          post_data: ''
        }
      }
    }, {
      trip_type: 'round_trip',
      separate_tickets: true,
      departing: {
        book_with: 'Iberia',
        airline: true,
        airline_logos: ['https://www.gstatic.com/flights/airline_logos/70px/IB.png'],
        marketed_as: ['IB 125'],
        price: 450,
        option_title: 'Turista Basica',
        baggage_prices: ['1 free carry-on'],
        booking_phone: '',
      },
      returning: {
        book_with: 'Iberia',
        airline: true,
        airline_logos: ['https://www.gstatic.com/flights/airline_logos/70px/IB.png'],
        marketed_as: ['IB 126'],
        price: 440,
        option_title: 'Turista Basica',
        baggage_prices: ['1 free carry-on'],
        booking_phone: '',
      },
      together: {
        book_with: '',
        airline: false,
        airline_logos: [],
        marketed_as: [],
        price: 0,
        option_title: '',
        baggage_prices: [],
        booking_phone: '',
      }
    }],
    from_cache: false,
    cached_at: null,
  };
}

// Helper para crear aeropuertos (CORREGIDO: Tipos estrictos)
function createMockAirport(
  code: string,
  city: string,
  role: 'departure' | 'arrival' | 'connection' // ✅ CORREGIDO: Tipado estricto
): AirportInfo {
  return {
    role: role,
    airport_code: code,
    airport_name: `Aeropuerto de ${city}`,
    city: city,
    country: code === 'LIM' ? 'Perú' : 'España',
    country_code: code === 'LIM' ? 'PE' : 'ES',
    image_url: undefined, // ✅ CORREGIDO: null -> undefined (el tipo espera string | undefined)
    thumbnail_url: undefined // ✅ CORREGIDO: null -> undefined
  };
}

// Helper para crear un leg (CORREGIDO: Horarios variables)
function createMockLeg(flightNum: string, origin: string, dest: string, depTime: string, arrTime: string, duration: number): FlightLeg {
  return {
    departure: createMockEndpoint(origin, depTime),
    arrival: createMockEndpoint(dest, arrTime),
    duration_minutes: duration,
    aircraft: 'Airbus A320',
    airline: 'Iberia',
    airline_code: 'IB',
    airline_logo_url: 'https://www.gstatic.com/flights/airline_logos/70px/IB.png',
    flight_number: flightNum,
    travel_class: 'Economy',
    legroom: '79 cm',
    legroom_quality: 'average',
    also_sold_by: ['LATAM'],
    features: {
      wifi: 'paid',
      power_outlets: true,
      usb: true,
      entertainment: 'on_demand',
      raw: ['Average legroom (79 cm)', 'Wi-Fi for a fee']
    },
    overnight: false,
    often_delayed: false,
    operated_by: null
  };
}

// Helper para crear endpoint (origen/destino)
function createMockEndpoint(code: string, datetime: string, terminal?: string): AirportEndpoint {
  return {
    airport_code: code,
    airport_name: `Aeropuerto ${code}`,
    city: code === 'LIM' ? 'Lima' : (code === 'MIA' ? 'Miami' : 'Madrid'),
    country: code === 'LIM' ? 'Perú' : (code === 'MIA' ? 'USA' : 'España'),
    country_code: code === 'LIM' ? 'PE' : (code === 'MIA' ? 'US' : 'ES'),
    datetime: datetime,
    terminal: terminal || (code === 'MAD' ? '4' : code === 'CDG' ? '2' : undefined)
  };
}

// Helper para crear oferta completa
function createMockFlightOffer(token: string, flightNum: string, origin: string,
  dest: string, duration: number, trip_type: 'round_trip' | 'one_way' = 'round_trip',
  isOutboundPhase?: boolean): FlightOffer {
  const leg = createMockLeg(flightNum, origin, dest, '2026-03-20 13:10', '2026-03-20 19:10', duration);

  return {
    ...(isOutboundPhase ? { departure_token: token } : { booking_token: token }),
    legs: [leg],
    layovers: [],
    total_duration_minutes: duration,
    price: { amount: Math.floor(400 + Math.random() * 300), currency: 'EUR' },
    carbon_emissions: {
      this_flight_grams: 1146000,
      typical_route_grams: 1242000,
      difference_percent: -8
    },
    type: trip_type === 'one_way' ? 'One way' : 'Round trip',
    airline_logo_url: leg.airline_logo_url,
    also_sold_by: ['LATAM'],
    operated_by: null
  };
}