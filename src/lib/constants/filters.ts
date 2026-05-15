/**
 * Search filter constants — encoded integer values from the API.
 * @see Backend/docs/search_hotels_api.md § Valores Codificados
 */

export const PROPERTY_TYPES_VR = [
  { value: 1, label: 'Casas' },
  { value: 2, label: 'Apartamentos' },
  { value: 3, label: 'Condominios' },
  { value: 4, label: 'Casas rurales' },
  { value: 5, label: 'Villas' },
  { value: 6, label: 'Cabañas' },
  { value: 7, label: 'Casa cueva' },
  { value: 8, label: 'Habitaciones privadas' },
  { value: 9, label: 'Barcos' },
  { value: 10, label: 'Domo' },
  { value: 11, label: 'Otros' },
] as const;

export const AMENITIES_VR = [
  { value: 1, label: 'Parking gratis' },
  { value: 5, label: 'Piscina al aire libre' },
  { value: 7, label: 'Gimnasio' },
  { value: 10, label: 'Spa' },
  { value: 11, label: 'Acceso a la playa' },
  { value: 12, label: 'Apto para niños' },
  { value: 19, label: 'Admite mascotas' },
  { value: 35, label: 'Wi-Fi gratis' },
  { value: 40, label: 'Aire acondicionado' },
  { value: 53, label: 'Acceso para silla de ruedas' },
  { value: 61, label: 'Cargador para VE' },
] as const;

export const HOTEL_CLASSES = [
  { value: 2, label: '2 estrellas' },
  { value: 3, label: '3 estrellas' },
  { value: 4, label: '4 estrellas' },
  { value: 5, label: '5 estrellas' },
] as const;

export const PROPERTY_TYPES_HOTELS = [
  { value: 12, label: 'Hoteles de playa' },
  { value: 13, label: 'Hoteles boutique' },
  { value: 14, label: 'Hostels' },
  { value: 15, label: 'Posadas' },
  { value: 16, label: 'Moteles' },
  { value: 17, label: 'Resorts' },
  { value: 18, label: 'Hoteles con spa' },
  { value: 19, label: 'Bed & breakfasts' },
  { value: 20, label: 'Otros' },
  { value: 21, label: 'Apartahoteles' },
  { value: 22, label: 'Minshuku' },
  { value: 23, label: 'Hoteles de negocios japoneses' },
  { value: 24, label: 'Ryokan' },
] as const;

export const AMENITIES_HOTELS = [
  { value: 1, label: 'Parking gratis' },
  { value: 3, label: 'Parking' },
  { value: 4, label: 'Piscina interior' },
  { value: 5, label: 'Piscina al aire libre' },
  { value: 6, label: 'Piscina' },
  { value: 7, label: 'Gimnasio' },
  { value: 8, label: 'Restaurante' },
  { value: 9, label: 'Desayuno gratis' },
  { value: 10, label: 'Spa' },
  { value: 11, label: 'Acceso a la playa' },
  { value: 12, label: 'Apto para niños' },
  { value: 15, label: 'Bar' },
  { value: 19, label: 'Admite mascotas' },
  { value: 22, label: 'Servicio de habitaciones' },
  { value: 35, label: 'Wi-Fi gratis' },
  { value: 40, label: 'Aire acondicionado' },
  { value: 52, label: 'Todo incluido' },
  { value: 53, label: 'Acceso para silla de ruedas' },
  { value: 61, label: 'Cargador para VE' },
] as const;

export const RATING_OPTIONS = [
  { value: null, label: 'Cualquiera' },
  { value: 7, label: '3.5+' },
  { value: 8, label: '4.0+' },
  { value: 9, label: '4.5+' },
] as const;

export const SORT_OPTIONS = [
  { value: null, label: 'Recomendados' },
  { value: 3, label: 'Precio más bajo' },
  { value: 8, label: 'Mayor valoración' },
  { value: 13, label: 'Más reseñas' },
] as const;
