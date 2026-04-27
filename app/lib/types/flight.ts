// app/lib/types/flight.ts
// Estructura basada estrictamente en la documentación de Marco Aurelio (V5 Final)

// ==========================================
// 1. API REQUEST (Exacto a lo que envías a Marco)
// ==========================================

// Interfaz auxiliar para el filtro de duración de escalas
export interface LayoverDurationFilter {
  min_minutes: number;
  max_minutes: number;
}

export interface FlightSearchRequest {
  trip_type: 'round_trip' | 'one_way' | 'multi_city';
  
  // Para round_trip y one_way (campos sueltos, NO en array)
  departure?: string;           // IATA o kgmid (ej: "MAD" o "/m/04jpl")
  arrival?: string;             // IATA o kgmid
  outbound_date?: string;       // YYYY-MM-DD
  return_date?: string;         // Solo round_trip
  
  // Para multi_city (array de tramos)
  legs?: Array<{
    departure: string;
    arrival: string;
    date: string;              // YYYY-MM-DD
    times?: {
      departure_from?: number;
      departure_to?: number;
      arrival_from?: number;
      arrival_to?: number;
    };
  }>;
  
  // Pasajeros
  adults?: number;
  children?: number;
  infants_in_seat?: number;
  infants_on_lap?: number;
  
  // Config
  travel_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  currency?: string;            // EUR, USD...
  gl?: string;                  // Código país (ES)
  hl?: string;                  // Idioma (es)
  
  // FILTROS COMPLETADOS (Basado en documentación)
  bags?: number;                // Número de bolsos de mano
  max_price?: number | null;
  sort_by?: string;             // "price", "duration", "top"...
  stops?: 'any' | 'nonstop' | 'max_1' | 'max_2';
  
  // Filtros de Aerolíneas
  include_airlines?: string[];
  exclude_airlines?: string[];
  
  // Filtros de Horario
  outbound_times?: {
    departure_from?: number;
    departure_to?: number;
    arrival_from?: number;
    arrival_to?: number;
  };
  return_times?: {
    departure_from?: number;
    departure_to?: number;
    arrival_from?: number;
    arrival_to?: number;
  };
  
  // Filtros de Escalas y Duración
  emissions_filter?: boolean;
  layover_duration?: LayoverDurationFilter;
  exclude_connections?: string[];
  max_duration_minutes?: number | null;
  
  // Token crítico para fase 2 de round_trip
  outbound_selection_token?: string | null;
}

// ==========================================
// 2. API RESPONSE - Vuelos (Search)
// ==========================================

export interface FlightSearchResponse {
  trip_type: 'round_trip' | 'one_way' | 'multi_city';
  phase: 'outbound_selection' | 'return_selection' | 'complete';
  results_state: 'matching' | 'empty';
  
  // Listas de vuelos (¡snake_case!)
  best_flights: FlightOffer[];
  other_flights: FlightOffer[];
  
  // Metadatos
  airports: AirportInfo[];
  price_insights?: {
    lowest_price: {
      amount: number;
      currency: string;
    };
    price_level: 'low' | 'typical' | 'high';
    typical_range?: {
      min: number;
      max: number;
      currency: string;
    };
    price_history?: Array<{
      timestamp: number;        // Unix epoch
      price: number;
    }>;
  };
  
  from_cache: boolean;
  cached_at: string | null;
}

export interface FlightOffer {
  // Tokens (¡uno u otro según la fase!)
  departure_token?: string;             // Fase outbound_selection
  booking_token?: string;               // Fase return_selection o complete
  
  // Estructura real: legs (vuelos) + layovers (escalas)
  legs: FlightLeg[];
  layovers: Layover[];
  
  total_duration_minutes: number;
  
  price: {
    amount: number;
    currency: string;
  };
  
  carbon_emissions?: {
    this_flight_grams: number;
    typical_route_grams: number;
    difference_percent: number;
  };
  
  type: 'Round trip' | 'One way';
  airline_logo_url?: string;

  also_sold_by?: string[];
  operated_by?: string | null;
}

export interface FlightLeg {
  departure: AirportEndpoint;
  arrival: AirportEndpoint;
  duration_minutes: number;
  aircraft?: string;
  airline: string;              // Nombre (Iberia)
  airline_code: string;         // Código (IB)
  airline_logo_url: string;
  flight_number: string;        // "IB 125"
  travel_class: string;         // "Economy"
  legroom?: string;             // "79 cm"
  legroom_quality?: 'average' | 'above_average' | 'below_average';
  also_sold_by: string[];       // ["LATAM"]
  features: {
    wifi: 'free' | 'paid' | null;
    power_outlets: boolean;
    usb: boolean;
    entertainment: 'on_demand' | 'stream' | 'live_tv' | null;
    raw: string[];              // Textos descriptivos
  };
  overnight: boolean;
  often_delayed: boolean;       // ⚠️ Alerta proactiva
  operated_by: string | null;   // "Iberia for Latam Airlines Group"
}

export interface AirportEndpoint {
  airport_code: string;
  airport_name: string;
  city: string;
  country: string;
  country_code: string;
  datetime: string;             // "YYYY-MM-DD HH:MM"
  terminal?: string;
}

export interface Layover {
  airport_code: string;
  airport_name: string;
  duration_minutes: number;
  overnight: boolean;
  change_terminal?: boolean;
}

export interface AirportInfo {
  role: 'departure' | 'arrival' | 'connection';
  airport_code: string;
  airport_name: string;
  city: string;
  country: string;
  country_code: string;
  image_url?: string;
  thumbnail_url?: string;
}

// ==========================================
// 3. API RESPONSE - Detalles (flight-details)
// ==========================================

export interface FlightDetailsRequest {
  booking_token: string;
  adults?: number;
  departure?: string;
  arrival?: string;
  outbound_date?: string;
  return_date?: string;
  gl?: string;
  hl?: string;
  currency?: string;
}

export interface FlightDetailsResponse {
  itinerary: FlightItinerary;
  booking_options: BookingOption[];
  from_cache: boolean;
  cached_at: string | null;
}

export interface FlightItinerary {
  trip_type: string;
  outbound: ItinerarySegment;
  return?: ItinerarySegment;
}

export interface BookingOption {
  trip_type: string;
  separate_tickets: boolean;
  together: BookingDetail;
  departing?: BookingDetail;
  returning?: BookingDetail;
}

export interface BookingDetail {
  book_with: string;
  airline: boolean;
  airline_logos: string[];
  marketed_as: string[];
  price: number;
  local_prices?: LocalPrice[];
  option_title: string;
  baggage_prices: string[];
  booking_request?: BookingRequest;
  booking_phone: string;
  estimated_service_fee?: number;
}

export interface LocalPrice {
  currency: string;
  price: number;
}

export interface BookingRequest {
  url: string;
  post_data: string;
}

export interface ItinerarySegment {
  legs: FlightLeg[];
  layovers: Layover[];
  total_duration_minutes: number;
  carbon_emissions?: {
    this_flight_grams: number;
    typical_route_grams: number;
    difference_percent: number;
  };
}

// ==========================================
// 4. DOMINIO FRONTEND (CamelCase - Post Transformer)
// ==========================================

export interface FlightOfferUI {
  id: string;                   // Generado o booking_token
  offerId: string;              // booking_token o departure_token
  isOutboundPhase: boolean;     // true si tiene departure_token
  
  // Segmentos normalizados
  segments: SegmentUI[];
  
  price: {
    total: number;
    currency: string;
  };
  
  airline: {
    name: string;
    code: string;
    logoUrl: string;
  };
  
  alsoSoldBy: string[];
  operatedBy: string | null;
  oftenDelayed: boolean;
  baggage: {
    carryOnIncluded: boolean;
    checkedIncluded: boolean;
  } | null;

  // ✅ CAMBIOS AÑADIDOS
  isRecommended: boolean;
  carbonEmissions?: {
    thisFlight: number;
    typicalRoute: number;
    differencePercent: number;
  } | null;
}

export interface SegmentUI {
  type: 'outbound' | 'return';
  legs: LegUI[];
  layovers: LayoverUI[];
  totalDuration: number;        // minutos
}

export interface LegUI {
  flightNumber: string;
  airline: {
    name: string;
    code: string;
    logoUrl: string;
  };
  operatingCarrier?: string;    // Si es codeshare
  origin: {
    code: string;
    name: string;
    city: string;
    datetime: string;
    terminal?: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    datetime: string;
    terminal?: string;
  };
  duration: number;             // minutos
  aircraft?: string;
  features: {
    wifi?: boolean | 'paid';
    power?: boolean;
    entertainment?: boolean;
  };
  oftenDelayed: boolean;
  overnight?: boolean;
  legroom?: string;
}

export interface LayoverUI {
  airportCode: string;
  airportName: string;
  duration: number;             // minutos
  overnight: boolean;
  changeTerminal?: boolean;
}

// ==========================================
// EXPORTS PARA USO COMPARTIDO (Constants y API)
// ==========================================
// Extraemos los tipos de las interfaces para poder usarlos sueltos
export type TripType = 'round_trip' | 'one_way' | 'multi_city';
export type TravelClass = 'economy' | 'premium_economy' | 'business' | 'first';