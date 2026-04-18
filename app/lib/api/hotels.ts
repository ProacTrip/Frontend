// app/lib/api/hotels.ts

import { apiFetch } from './auth';
import { 
  adaptSearchResults, 
  adaptHotelDetails 
} from '@/app/lib/utils/transformers';
import type { 
  BackendSearchHotel, 
  BackendHotelDetails,
  SearchHotelsResponse,
  SearchParams,
  FilterValues
} from '@/app/lib/types/hotel';

// ==========================================
// CONFIGURACIÓN
// ==========================================
const USE_HOTEL_MOCKS = process.env.NEXT_PUBLIC_USE_HOTEL_MOCKS === 'true';

// ==========================================
// FUNCIONES DE HOTELES
// ==========================================

/**
 * 🏨 BUSCAR HOTELES
 */
export async function searchHotels(
  params: SearchParams & { page_token?: string | null },
  filters: FilterValues
) {
  // 🚧 Si está activado, usa mocks (útil para demos sin backend)
  if (USE_HOTEL_MOCKS) {
    return searchHotelsMock(params, filters);
  }

  // ✅ VERSIÓN REAL - Backend Marco Aurelio
  try {
    console.log('🔍 Llamando a POST /api/v1/search/hotels');

    const response = await apiFetch('/api/v1/search/hotels', {
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
}

/**
 * 🏨 DETALLES DE HOTEL
 */
export async function getHotelDetails(
  hotelId: string,
  params: SearchParams
) {
  if (USE_HOTEL_MOCKS) {
    return getHotelDetailsMock(hotelId, params);
  }

  try {
    console.log('🏨 Llamando a POST /api/v1/search/hotel-details');

    const response = await apiFetch('/api/v1/search/hotel-details', {
      method: 'POST',
      body: JSON.stringify({
        id: hotelId,
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
}

/**
 * 🏨 HABITACIONES (Futuro - Apartado 13)
 */
export async function getHotelRooms(
  hotelId: string,
  params: { check_in_date: string; check_out_date: string; adults: number; children: number; children_ages?: number[];}
) {
  if (USE_HOTEL_MOCKS) {
    return getHotelRoomsMock(hotelId);
  }

  try {
    console.log('🏨 Llamando a POST /api/v1/search/hotel-rooms');

    const response = await apiFetch('/api/v1/search/hotel-rooms', {
      method: 'POST',
      body: JSON.stringify({
        id: hotelId,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults || 2,
        children: params.children || 0,
        children_ages: params.children_ages || [],
        gl: "ES",
        hl: "es",
        currency: "EUR"
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error en getHotelRooms():', error);
    throw error;
  }
}

// ==========================================
// 🚧 MOCKS (Solo se usan si USE_HOTEL_MOCKS = true)
// ==========================================

async function searchHotelsMock(
  params: SearchParams & { page_token?: string | null },
  filters: FilterValues
) {
  console.log('🚧 [MOCK] Simulando búsqueda de hoteles...');
  await new Promise(resolve => setTimeout(resolve, 500));

  const MOCK_BACKEND_HOTELS: BackendSearchHotel[] = Array.from({ length: 30 }, (_, i) => ({
    id: `hotel-${i + 1}`,
    type: 'hotel',
    name: `Hotel ${['Boutique', 'Resort', 'Spa'][i % 3]} ${i + 1}`,
    hotel_class: (i % 4) + 2, 
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

  const itemsPerPage = 10;
  let currentPage = 1;
  
  if (params.page_token) {
    const parsed = parseInt(params.page_token.replace('PAGE_', ''));
    currentPage = !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }
  
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

async function getHotelDetailsMock(
  hotelId: string,
  params: SearchParams
) {
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
async function getHotelRoomsMock(hotelId: string) {
  const basePrice = 80 + (hotelId.length * 15);
  
  return [
    {
      id: `room-1-${hotelId}`,
      name: `Habitación Doble Estándar`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0)}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 1}`,
      ],
      beds: '1 cama doble',
      capacity: 2,
      size: 20,
      amenities: ['WiFi gratis', 'TV', 'Baño privado', 'Aire acondicionado'],
      price: { amount: basePrice, currency: '€', total: basePrice * 4, nights: 4 },
      cancellation: { free: true, deadline: '48h antes' },
    },
    {
      id: `room-2-${hotelId}`,
      name: `Habitación Doble Superior`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 10}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 11}`,
      ],
      beds: '1 cama king size',
      capacity: 2,
      size: 30,
      amenities: ['WiFi gratis', 'TV', 'Minibar', 'Balcón', 'Baño privado'],
      price: { amount: basePrice + 50, currency: '€', total: (basePrice + 50) * 4, nights: 4 },
      cancellation: { free: true, deadline: '24h antes' },
    },
    {
      id: `room-3-${hotelId}`,
      name: `Suite Junior`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 20}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 21}`,
      ],
      beds: '1 cama king + sofá cama',
      capacity: 4,
      size: 45,
      amenities: ['WiFi gratis', 'TV', 'Minibar', 'Jacuzzi', 'Terraza'],
      price: { amount: basePrice + 150, currency: '€', total: (basePrice + 150) * 4, nights: 4 },
      cancellation: { free: false },
    },
  ];
}