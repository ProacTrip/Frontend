// app/types/hotel.ts

// ==========================================
// TIPOS DEL BACKEND (Corregidos)
// ==========================================

export interface BackendImage {
  thumbnail: string;
  original: string;
}

export interface BackendPrice {
  currency: string;
  per_night: {
    amount: number;
    before_taxes?: number;
  };
  total: {
    amount: number;
    before_taxes?: number;
  };
}

export interface BackendRating {
  overall: number;
  location?: number;
}

export interface BackendGPS {
  lat: number;
  lng: number;
}

/**
 * Lugar cercano: En búsqueda es simple, en detalle es complejo.
 * Unificamos con campos opcionales.
 */
export interface BackendNearbyPlace {
  name: string;
  // Simple (búsqueda):
  transport?: Array<{
    type: string;
    duration: string;
  }>;
  // Complejo (detalle):
  category?: string;
  description?: string;
  rating?: number;
  total_reviews?: number;
  thumbnail_url?: string;
  maps_url?: string;
  gps?: BackendGPS;
}

/**
 * Capacidad - Solo Vacation Rentals
 */
export interface BackendCapacity {
  unit_type: string; // "Entire house", "Villa completa"
  guests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  beds: number | null;
  area: string | null; // "45 ft²" o "120 m²"
}

// ==========================================
// REQUEST PARAMS (Corregido - faltaban campos)
// ==========================================

export interface SearchParams {
  query: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  children_ages: number[];
  rooms: number;
  // Campos que faltaban y necesita el backend:
  gl?: string; // "ES", "PE" - país
  hl?: string; // "es", "en" - idioma
  currency?: string; // "EUR", "USD"
  vacation_rentals?: boolean; // false = hoteles, true = VR
  page_token?: string | null;
  // Filtros opcionales:
  min_price?: number | null;
  max_price?: number | null;
  rating?: number | null;
  property_types?: number[];
  hotel_classes?: number[];
  amenities?: number[];
}

export interface FilterValues {
  min_price: number | null;
  max_price: number | null;
  rating: number | null;
  property_types: number[];
  hotel_classes: number[];
  amenities: number[];
}

// ==========================================
// RESPONSES - BÚSQUEDA
// ==========================================

export interface BackendSearchHotel {
  id: string;
  type: "hotel" | "vacation_rental";
  name: string;
  description?: string | null;
  booking_url: string | null; // ✅ AÑADIDO
  hotel_class: number | null; // ✅ Puede ser null en VR
  gps: BackendGPS;
  images: BackendImage[];
  price: BackendPrice; // ✅ Siempre presente en búsqueda
  rating: BackendRating;
  total_reviews: number;
  amenities?: string[];
  check_in?: string;
  check_out?: string;
  free_cancellation?: boolean;
  special_offer?: boolean;
  eco_certified?: boolean;
  // Campos VR específicos (null en hoteles):
  capacity?: BackendCapacity | null;
  excluded_amenities?: string[]; // ✅ AÑADIDO: Lo que NO tiene el alojamiento
  // Simple en búsqueda:
  nearby_places?: Array<{
    name: string;
    transport?: Array<{ type: string; duration: string }>;
  }>;
}

// ==========================================
// RESPONSES - DETALLES (Corregido: price vs price_range)
// ==========================================

export interface BackendHotelDetails extends Omit<BackendSearchHotel, 'price' | 'nearby_places'> {
  address: string | null; // null en algunos VR
  directions_url?: string;
  
  // ✅ CORRECCIÓN CRÍTICA: Hotels tienen price_range, VR tienen price
  // NUNCA ambos a la vez según la doc
  price_range?: {
    currency: string;
    min: number;
    max: number;
  } | null; // Solo para Hotels
  
  // VR tienen price exacto, Hotels no lo tienen aquí (ya lo tienen en búsqueda)
  // Pero lo ponemos opcional por si acaso
  price?: BackendPrice | null;
  
  external_reviews?: Array<{
    source: string;
    logo_url: string;
    score: number;
    max_score: number;
    total_reviews: number;
    featured_review?: {
      author: string;
      date: string;
      score: number;
      comment: string;
      url?: string | null;
    };
  }>;
  
  health_and_safety?: Array<{
    category: string;
    items: Array<{
      name: string;
      available: boolean;
    }>;
  }>;
  
  sustainability?: Array<{
    category: string;
    items: Array<{
      name: string;
      available: boolean;
    }>;
  }>;
  
  // En detalle es complejo (con category, description, etc.)
  nearby_places: BackendNearbyPlace[];
  
  policies?: {
    check_in?: string;
    check_out?: string;
    cancellation?: string;
  };
}

// ==========================================
// HABITACIONES (Futuro)
// ==========================================

export interface BackendRoom {
  id: string;
  name: string;
  images: BackendImage[];
  beds: string;
  capacity: number;
  size?: number;
  amenities: string[];
  price: {
    currency: string;
    per_night: number;
    total: number;
    nights: number;
  };
  cancellation: {
    free: boolean;
    deadline?: string;
  };
}

// ==========================================
// TIPOS DEL FRONTEND (Adaptados a los cambios)
// ==========================================

export interface FrontendLocation {
  district?: string;
  city: string;
  distanceFromCenter?: number;
  coordinates?: BackendGPS;
}

export interface FrontendPrice {
  amount: number; // Usaremos price.total.amount o price_range.avg según disponibilidad
  currency: string;
  nights: number;
  adults: number;
  includesTaxes: boolean;
}

export interface FrontendRating {
  score: number; // 0-5
  label: string;
  reviews: number;
}

export interface FrontendHotel {
  id: string;
  name: string;
  type: "Hotel" | "Apartamento" | "Casa Rural" | "Vacation Rental";
  stars: number | null; // ✅ Ahora puede ser null para VR
  location: FrontendLocation;
  images: string[];
  price: FrontendPrice;
  rating: FrontendRating;
  bookingUrl?: string | null; // ✅ Añadido para el botón de reserva
  
  // Campos detalle:
  description?: string;
  address?: string | null;
  amenities?: string[];
  excludedAmenities?: string[]; // ✅ Para VR (lo que no incluye)
  capacity?: BackendCapacity; // ✅ Para VR
  specifications?: string[];
  beds?: string;
  checkIn?: string;
  checkOut?: string;
  nearbyPlaces?: BackendNearbyPlace[];
  externalReviews?: BackendHotelDetails['external_reviews'];
  healthAndSafety?: BackendHotelDetails['health_and_safety'];
  sustainability?: BackendHotelDetails['sustainability'];
  freeCancellation?: boolean;
  specialOffer?: boolean;
  ecoCertified?: boolean;
}

export interface FrontendRoom {
  id: string;
  name: string;
  images: string[];
  beds: string;
  capacity: number;
  size?: number;
  amenities: string[];
  price: {
    amount: number;
    total: number;
    currency: string;
    nights: number;
  };
  cancellation: {
    free: boolean;
    deadline?: string;
  };
}

// ==========================================
// RESPUESTAS API
// ==========================================

export interface SearchHotelsResponse {
  type: "hotels" | "vacation_rentals";
  results_state: "matching" | "non_matching_only";
  properties: BackendSearchHotel[];
  brands: any[] | null;
  pagination: {
    next_token: string | null;
    has_more: boolean;
  };
  from_cache: boolean;
  cached_at: string | null;
}

export interface HotelDetailsResponse {
  property: BackendHotelDetails;
  from_cache: boolean;
  cached_at: string | null;
}

export interface HotelRoomsResponse {
  rooms: BackendRoom[];
}