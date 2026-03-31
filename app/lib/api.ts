import { 
  adaptSearchResults, 
  adaptHotelDetails
  // adaptRoom // Comentado hasta que se use en habitaciones
} from './utils/transformers';
import type { 
  BackendSearchHotel, 
  BackendHotelDetails,
  // BackendRoom, // Comentado hasta que se use
  SearchHotelsResponse,
  SearchParams,
  FilterValues
} from '@/app/lib/types/hotel';


//buscamos el backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

//guarda la renovación en curso para que, si hay 10 peticiones a la vez, todas usen la misma y no se dupliquen
//es como un ticket de sala de espera (para q no se ejecuten todos los refresh a la vez)
let refreshPromise: Promise<boolean> | null = null;


//Comprueba si el access token expira en los próximos 5 minutos.
function isTokenExpiringSoon(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return false;

  const expiration = new Date(expiresAt);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  return expiration < fiveMinutesFromNow;
}


//Limpia todos los datos de sesión del localStorage.
function clearSession(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token_expires_at');
}

/*
Renueva el access token usando el refresh token almacenado.
Lo exportamos para poder usarla también desde useAuth sin duplicar código.
Usa un candado (refreshPromise) para que múltiples llamadas concurrentes
compartan una única petición de renovación.
 */
export async function refreshAccessToken(): Promise<boolean> {
  // Si ya hay una renovación en curso, nos colgamos de esa promesa existente
  // en lugar de lanzar otra petición al backend
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) 
      {
        console.warn('[Auth] No hay refresh token disponible.');
        return false;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) 
      {
        console.error(`[Auth] Error al renovar token: ${response.status}`);
        clearSession();
        return false;
      }

      const data = await response.json();

      if (!data.access_token) 
      {
        console.error('[Auth] La respuesta no contiene access_token.');
        clearSession();
        return false;
      }

      // Guardamos el nuevo access token y su fecha de expiración
      localStorage.setItem('access_token', data.access_token);

      if (data.expires_in) 
      {
        // expires_in viene en segundos desde el backend (ej: 3600 = 1 hora)
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
      }

      if (data.refresh_token) 
      {
        //El backend devuelve un nuevo refresh token con cada renovación.
        //Lo actualizamos para que el siguiente refresh también funcione.
        localStorage.setItem('refreshToken', data.refresh_token);
      }

      console.log('[Auth] Token renovado correctamente.');
      return true;
    } 
    catch (err) 
    {
      console.error('[Auth] Excepción durante la renovación del token:', err);
      return false;
    } 
    finally
    {
      // Liberamos el candado siempre, tanto si tuvo éxito como si falló
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Se encarga automáticamente de meter el token y renovarlo sin que nos preocupemos
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {

    // Renovación proactiva: si el token está a punto de expirar, lo renovamos
    // antes de hacer la petición para evitar un error innecesario.

    if (isTokenExpiringSoon()) {
      const renewed = await refreshAccessToken();

      if (!renewed) {
        clearSession();
        throw new Error('[Auth] Sesión expirada. Redirigiendo al login.');
      }
    }

    //Preparamos las cabeceras pegándole nuestro token actual
    const buildHeaders = (token: string | null): HeadersInit => ({
      'Content-Type': 'application/json',

      //Copiamos cualquier otra cabecera que hayamos pasado manualmente en 'options'
      ...options.headers,

      //Lógica del Token: Si hay token, añade la cabecera 'Authorization' con el formato 'Bearer'.
      // Si no hay token (usuario anónimo), no añade nada y el objeto se queda limpio.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    //Lanzamiento de la peticion
    let response = await fetch(`${API_URL}${endpoint}`, {

      //Copiamos toda la configuración (method, body, etc.) que nos pasaron por 'options'
      ...options,

      //Usamos nuestra fábrica de etiquetas para poner el token actual del localStorage
      headers: buildHeaders(localStorage.getItem('access_token')),
    });


    // Defensa ante 401 inesperado (por ej el servidor revocó el token externamente,
    // o hay desincronización de reloj entre cliente y servidor).
    if (response.status === 401) {
      console.warn('[Auth] Servidor devolvió 401. Intentando renovación de emergencia...');
      const renewed = await refreshAccessToken();

      if (!renewed) {
        clearSession();
        throw new Error('[Auth] No autorizado. El usuario debe volver a iniciar sesión.');
      }

      // 5. Reintento con el nuevo token.
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: buildHeaders(localStorage.getItem('access_token')),
      });
    }

    return response;
}

// Estructura del perfil que devuelve el backend
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  preferred_language: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  avatar_url: string | null;
  travel_preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 *  CORREGIDO: Ahora usa apiFetch en vez de fetch manual
 * Obtiene el perfil del usuario autenticado desde el backend.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiFetch('/api/v1/user/profile', {
      method: 'GET',
    });

    if (response.ok) {
      const profile = await response.json();
      return profile;
    }

    console.error('[API] Error obteniendo perfil:', response.status);
    return null;
  } catch (error) {
    console.error('[API] Error en getUserProfile:', error);
    return null;
  }
}






























///////////////////////////////////////////////////////////////////////////////////////////////////////////////  NUEVO

// ==========================================
// FUNCIONES DE HOTELES (CORREGIDAS)
// ==========================================

/**
 * 🏨 BUSCAR HOTELES
 */
export async function searchHotels(
  params: SearchParams & { page_token?: string | null },
  filters: FilterValues
) {
  // ✅ VERSIÓN REAL - Descomentar cuando Marco active el endpoint
  /*
  try {
    console.log('🔍 Llamando a POST /v1/search/hotels');

    const response = await apiFetch('/v1/search/hotels', {
      method: 'POST',
      body: JSON.stringify({
        query: params.query,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults || 2,
        children: params.children || 0,
        children_ages: params.children_ages || [],
        gl: "ES",
        hl: "es",
        currency: "EUR",
        min_price: filters.min_price,
        max_price: filters.max_price,
        rating: filters.rating,
        property_types: filters.property_types,
        hotel_classes: filters.hotel_classes,
        amenities: filters.amenities,
        vacation_rentals: false,
        page_token: params.page_token || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    const data: SearchHotelsResponse = await response.json();
    const transformedHotels = adaptSearchResults(data.properties, params);
    
    return {
      type: data.type,
      results_state: data.results_state,
      properties: transformedHotels,
      brands: data.brands,
      pagination: data.pagination,
      from_cache: data.from_cache,
      cached_at: data.cached_at
    };
    
  } catch (error) {
    console.error('❌ Error en searchHotels():', error);
    throw error;
  }
  */

  // 🚧 VERSIÓN MOCK
  console.log('🚧 [MOCK] Simulando búsqueda de hoteles...');
  await new Promise(resolve => setTimeout(resolve, 500));

  // ✅ CORREGIDO: hotel_class de 2-5 (no 1-5)
  const MOCK_BACKEND_HOTELS: BackendSearchHotel[] = Array.from({ length: 30 }, (_, i) => ({
    id: `hotel-${i + 1}`,
    type: 'hotel',
    name: `Hotel ${['Boutique', 'Resort', 'Spa'][i % 3]} ${i + 1}`,
    hotel_class: (i % 4) + 2, // ✅ 2, 3, 4, 5 (no incluye 1)
    gps: { 
      lat: 40.4168 + (Math.random() - 0.5) * 0.1, 
      lng: -3.7038 + (Math.random() - 0.5) * 0.1 
    },
    images: [
      { 
        thumbnail: `https://picsum.photos/400/300?random=${i}`, 
        original: `https://picsum.photos/800/600?random=${i}` 
      },
      { 
        thumbnail: `https://picsum.photos/400/300?random=${i+100}`, 
        original: `https://picsum.photos/800/600?random=${i+100}` 
      }
    ],
    price: {
      currency: 'EUR',
      per_night: { amount: 80 + (i * 15) },
      total: { amount: (80 + (i * 15)) * 4 }
    },
    rating: { 
      overall: 3.5 + (i % 20) / 10,
      location: 4.0 + (i % 10) / 10 
    },
    total_reviews: 10 + (i * 3),
    amenities: ['WiFi gratis', 'Piscina', 'Desayuno gratis'].slice(0, (i % 3) + 1),
    booking_url: `/booking/hotel-${i+1}`,
    free_cancellation: i % 2 === 0,
    special_offer: i % 3 === 0,
    eco_certified: i % 5 === 0,
    check_in: '14:00',
    check_out: '12:00',
    nearby_places: [
      { name: 'Centro Comercial', transport: [{ type: 'Walking', duration: '5 min' }] }
    ]
  }));

  // ✅ CORREGIDO: Control de página inválida (evita NaN o valores negativos)
  const itemsPerPage = 10;
  let currentPage = 1;
  
  if (params.page_token) {
    const parsed = parseInt(params.page_token.replace('PAGE_', ''));
    currentPage = !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }
  
  // ✅ CORREGIDO: Math.max para asegurar índices válidos
  const start = Math.max(0, (currentPage - 1) * itemsPerPage);
  const end = Math.min(start + itemsPerPage, MOCK_BACKEND_HOTELS.length);
  const pageItems = MOCK_BACKEND_HOTELS.slice(start, end);

  const mockResponse: SearchHotelsResponse = {
    type: "hotels",
    results_state: "matching",
    properties: pageItems,
    brands: null,
    pagination: {
      next_token: end < MOCK_BACKEND_HOTELS.length ? `PAGE_${currentPage + 1}` : null,
      has_more: end < MOCK_BACKEND_HOTELS.length
    },
    from_cache: false,
    cached_at: null
  };

  const transformedHotels = adaptSearchResults(mockResponse.properties, params);
  
  return {
    ...mockResponse,
    properties: transformedHotels
  };
}

/**
 * 🏨 DETALLES DE HOTEL
 */
export async function getHotelDetails(
  hotelId: string,
  params: SearchParams
) {
  // ✅ VERSIÓN REAL
  /*
  try {
    console.log('🏨 Llamando a POST /v1/search/hotel-details');

    const response = await apiFetch('/v1/search/hotel-details', {
      method: 'POST',
      body: JSON.stringify({
        id: hotelId,                    // ✅ CORREGIDO: era property_id
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults || 2,
        children: params.children || 0,
        children_ages: params.children_ages || [],
        gl: "ES",
        hl: "es",
        currency: "EUR",
        vacation_rentals: false
      })
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('Hotel no encontrado');
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    const transformed = adaptHotelDetails(data.property, params);
    
    return { property: transformed };
    
  } catch (error) {
    console.error('❌ Error en getHotelDetails():', error);
    throw error;
  }
  */

  // 🚧 VERSIÓN MOCK
  console.log('🚧 [MOCK] Simulando detalles del hotel:', hotelId);
  await new Promise(resolve => setTimeout(resolve, 300));

  const mockBackendDetail: BackendHotelDetails = {
    id: hotelId,
    type: 'hotel',
    name: 'Hotel Luxury Madrid Centro',
    description: 'Elegante hotel de 5 estrellas ubicado en el corazón de Madrid con vistas panorámicas, spa completo y restaurante gourmet galardonado.',
    hotel_class: 5,
    address: 'Gran Vía 123, 28013 Madrid, España',
    gps: { lat: 40.4168, lng: -3.7038 },
    images: [
      { thumbnail: 'https://picsum.photos/400/300?random=1', original: 'https://picsum.photos/1200/800?random=1' },
      { thumbnail: 'https://picsum.photos/400/300?random=2', original: 'https://picsum.photos/1200/800?random=2' },
      { thumbnail: 'https://picsum.photos/400/300?random=3', original: 'https://picsum.photos/1200/800?random=3' }
    ],
    price_range: { currency: 'EUR', min: 180, max: 350 },
    rating: { overall: 4.6, location: 4.8 },
    total_reviews: 2847,
    amenities: ['WiFi gratis', 'Piscina', 'Spa', 'Gimnasio', 'Restaurante', 'Bar', 'Parking gratis'],
    check_in: '14:00',
    check_out: '12:00',
    booking_url: `/booking/${hotelId}`,
    free_cancellation: true,
    special_offer: false,
    eco_certified: true,
    external_reviews: [
      {
        source: 'Tripadvisor',
        logo_url: 'https://example.com/trip-logo.png',
        score: 4.5,
        max_score: 5,
        total_reviews: 1520,
        featured_review: {
          author: 'María G.',
          date: '2025-04-15T10:30:00Z',
          score: 5,
          comment: 'Excelente ubicación y servicio impecable.'
        }
      }
    ],
    nearby_places: [
      {
        name: 'Puerta del Sol',
        category: 'Point of interest',
        description: 'Plaza más famosa de Madrid',
        rating: 4.7,
        total_reviews: 45000,
        transport: [{ type: 'Walking', duration: '5 min' }]
      },
      {
        name: 'Museo del Prado',
        category: 'Museum',
        description: 'Museo de arte internacional',
        transport: [{ type: 'Metro', duration: '10 min' }]
      }
    ],
    health_and_safety: [
      {
        category: 'Enhanced cleaning',
        items: [
          { name: 'Disinfectant used', available: true },
          { name: 'High-touch surfaces disinfected', available: true }
        ]
      }
    ],
    sustainability: [
      {
        category: 'Energy efficiency',
        items: [
          { name: 'LED lighting', available: true },
          { name: 'Renewable energy', available: true }
        ]
      }
    ]
  };

  const transformed = adaptHotelDetails(mockBackendDetail, params);
  return { property: transformed };
}

/**
 * 🏨 HABITACIONES (Futuro)
 */
export async function getHotelRooms(
  hotelId: string,
  params: { check_in_date: string; check_out_date: string; adults: number; children: number }
) {
  // Endpoint futuro: GET /v1/hotels/{id}/rooms
  // Por ahora devolvemos array vacío (usamos MOCK en la página de habitaciones)
  
  console.log('🚧 [MOCK] getHotelRooms llamado pero no implementado aún:', hotelId);
  return [];
}