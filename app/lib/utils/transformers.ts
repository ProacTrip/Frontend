// app/lib/transformers.ts (VERSIÓN CORREGIDA)

import type {
  BackendSearchHotel,
  BackendHotelDetails,
  BackendRoom,
  BackendNearbyPlace,
  FrontendHotel,
  FrontendRoom,
  FrontendLocation,
  FrontendPrice,
  FrontendRating,
  SearchParams,
} from '@/app/lib/types/hotel';

// ==========================================
// HELPERS
// ==========================================

export function currencyToSymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'CHF',
  };
  return symbols[currency] || currency;
}

export function cleanQueryForCity(query: string): string {
  if (!query) return 'Destino';
  const cleaned = query
    .replace(/^(hoteles?\s+(en|cerca\s+de))\s*/i, '')
    .replace(/^(apartamentos?\s+(en|de))\s*/i, '')
    .replace(/^cerca\s+de\s*/i, '')
    .trim();
  return cleaned.split(',')[0].trim();
}

export function formatDateReadable(isoDate: string | undefined): string {
  if (!isoDate) return 'Fecha desconocida';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}

export function getRatingLabel(score: number | undefined | null): string {
  if (score === undefined || score === null || score === 0) {
    return 'Sin valoraciones';
  }
  if (score >= 4.5) return 'Excelente';
  if (score >= 4.0) return 'Muy bien';
  if (score >= 3.5) return 'Bien';
  if (score >= 3.0) return 'Aceptable';
  return 'Regular';
}

export function calculateNights(params: SearchParams): number {
  if (!params.check_in_date || !params.check_out_date) return 1;
  const checkIn = new Date(params.check_in_date);
  const checkOut = new Date(params.check_out_date);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function extractCityFromQuery(query: string): string {
  return cleanQueryForCity(query);
}

export function extractCityFromAddress(address: string | null | undefined): string {
  if (!address) return 'Destino';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return parts[0] || 'Destino';
}

// ==========================================
// ADAPTADORES (CORREGIDOS)
// ==========================================

function adaptImages(backendImages: { thumbnail: string; original: string }[] | null | undefined): string[] {
  if (!backendImages?.length) {
    return [];
  }
  return backendImages
    .map(img => img.original || img.thumbnail)
    .filter(Boolean);
}

function adaptRating(
  backendRating: { overall?: number | null; location?: number } | null | undefined,
  totalReviews: number | null | undefined
): FrontendRating {
  const score = backendRating?.overall ?? 0;
  return {
    score, 
    label: getRatingLabel(score),
    reviews: totalReviews ?? 0,
  };
}

/**
 * ⚠️ NOTA: Usamos per_night.amount (precio por noche) porque es el estándar de la industria.
 * Si prefieres mostrar el TOTAL de la estancia en el HotelCard, cambia:
 * amount: backendPrice?.total?.amount ?? 0,
 * y quita la línea de abajo que usa per_night.
 */
function adaptPrice(
  backendPrice: { currency: string; per_night: { amount: number }; total: { amount: number } } | null | undefined,
  params: SearchParams
): FrontendPrice {
  return {
    // ✅ CORREGIDO: Usamos per_night para mostrar "€ 205 / noche" en lugar de "€ 820 total"
    // Esto evita que el usuario piense que 820€ es el precio por noche cuando son 4 noches.
    amount: backendPrice?.per_night?.amount ?? 0,
    
    // ✅ CORREGIDO: Convertimos EUR -> €, USD -> $, etc.
    currency: currencyToSymbol(backendPrice?.currency || 'EUR'),
    
    nights: calculateNights(params),
    adults: params.adults || 2,
    includesTaxes: true,
  };
}

function adaptLocation(
  backendHotel: BackendSearchHotel | BackendHotelDetails,
  params: SearchParams,
  isDetail: boolean = false
): FrontendLocation {
  let city: string;
  
  if (isDetail && 'address' in backendHotel && backendHotel.address) {
    city = extractCityFromAddress(backendHotel.address);
  } else {
    city = extractCityFromQuery(params.query);
  }
  
  return {
    city,
    district: undefined,
    distanceFromCenter: undefined,
    coordinates: backendHotel.gps,
  };
}

function adaptType(backendType: string): FrontendHotel['type'] {
  if (backendType === 'hotel') return 'Hotel';
  if (backendType === 'vacation_rental') return 'Apartamento';
  return 'Hotel';
}

function normalizeNearbyPlaces(
  places: BackendNearbyPlace[] | null | undefined
): BackendNearbyPlace[] {
  if (!places?.length) return [];
  
  return places.map(place => ({
    name: place.name || 'Lugar desconocido',
    transport: place.transport || [],
    category: place.category,
    description: place.description,
    rating: place.rating,
    total_reviews: place.total_reviews,
    thumbnail_url: place.thumbnail_url,
    maps_url: place.maps_url,
    gps: place.gps,
  }));
}

// ==========================================
// TRANSFORMADORES PRINCIPALES
// ==========================================

export function adaptSearchHotel(
  backend: BackendSearchHotel,
  params: SearchParams
): FrontendHotel {
  return {
    id: backend.id,
    name: backend.name,
    type: adaptType(backend.type),
    stars: backend.hotel_class,
    location: adaptLocation(backend, params, false),
    images: adaptImages(backend.images),
    price: adaptPrice(backend.price, params),
    rating: adaptRating(backend.rating, backend.total_reviews),
    
    amenities: backend.amenities ?? [],
    checkIn: backend.check_in,
    checkOut: backend.check_out,
    freeCancellation: backend.free_cancellation ?? false,
    specialOffer: backend.special_offer ?? false,
    ecoCertified: backend.eco_certified ?? false,
    bookingUrl: backend.booking_url,
    
    nearbyPlaces: normalizeNearbyPlaces(backend.nearby_places),
    capacity: backend.capacity ?? undefined,
    excludedAmenities: backend.excluded_amenities ?? [],
  };
}

export function adaptHotelDetails(
  backend: BackendHotelDetails,
  params: SearchParams
): FrontendHotel {
  // Nota: El cast es seguro porque BackendHotelDetails extiende BackendSearchHotel
  // excepto por 'price' y 'nearby_places', que manejamos explícitamente abajo.
  const base = adaptSearchHotel(backend as unknown as BackendSearchHotel, params);
  
  return {
    ...base,
    location: adaptLocation(backend, params, true),
    description: backend.description || undefined,
    address: backend.address || undefined,
    
    externalReviews: backend.external_reviews ?? [],
    healthAndSafety: backend.health_and_safety ?? [],
    sustainability: backend.sustainability ?? [],
    nearbyPlaces: normalizeNearbyPlaces(backend.nearby_places),
    
    // Precio: Si es VR usa price exacto, si es Hotel usa promedio de price_range
    price: backend.price 
      ? adaptPrice(backend.price, params)
      : backend.price_range 
        ? {
            ...base.price,
            amount: ((backend.price_range.min || 0) + (backend.price_range.max || 0)) / 2,
            currency: currencyToSymbol(backend.price_range.currency || 'EUR'),
          }
        : base.price,
  };
}

export function adaptRoom(backend: BackendRoom): FrontendRoom {
  return {
    id: backend.id,
    name: backend.name,
    images: adaptImages(backend.images),
    beds: backend.beds || '1 cama',
    capacity: backend.capacity || 2,
    size: backend.size,
    amenities: backend.amenities ?? [],
    price: {
      amount: backend.price.per_night ?? 0,
      total: backend.price.total ?? 0,
      currency: currencyToSymbol(backend.price.currency || 'EUR'),
      nights: backend.price.nights || 1,
    },
    cancellation: {
      free: backend.cancellation?.free ?? false,
      deadline: backend.cancellation?.deadline,
    },
  };
}

export function adaptSearchResults(
  backendHotels: BackendSearchHotel[],
  params: SearchParams
): FrontendHotel[] {
  if (!backendHotels?.length) return [];
  return backendHotels.map(hotel => adaptSearchHotel(hotel, params));
}