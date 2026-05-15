/**
 * Maps common amenity names (Spanish and English) to react-icons (Font Awesome) components.
 *
 * Used by AmenitiesList and HotelDetailClient to display contextual icons next to each amenity.
 * Falls back to FaCircle (generic dot) for unrecognized amenities.
 */
import {
  FaWifi,
  FaSwimmingPool,
  FaParking,
  FaDumbbell,
  FaUtensils,
  FaCoffee,
  FaSpa,
  FaUmbrellaBeach,
  FaChild,
  FaGlassCheers,
  FaPaw,
  FaConciergeBell,
  FaSnowflake,
  FaWheelchair,
  FaChargingStation,
  FaHotTub,
  FaFire,
  FaTree,
  FaBaby,
  FaArrowUp,
  FaSink,
  FaSmokingBan,
  FaTv,
  FaShower,
  FaBicycle,
  FaGamepad,
  FaBusinessTime,
  FaLanguage,
  FaDoorOpen,
  FaBriefcase,
  FaUsers,
  FaFirstAid,
  FaRestroom,
  FaBell,
  FaCircle,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';

/**
 * Lowercase-normalized amenity name → IconType mapping.
 * Order: exact matches first, then partial substring matches (checked at runtime).
 *
 * Spanish terms are mapped to the same icons as their English equivalents.
 */
const AMENITY_ICON_MAP: Record<string, IconType> = {
  // ── Connectivity ──
  wifi: FaWifi,
  'wi-fi': FaWifi,
  'wi-fi gratis': FaWifi,
  'free wi-fi': FaWifi,
  'free wifi': FaWifi,
  'wifi gratis': FaWifi,
  internet: FaWifi,
  'high-speed internet': FaWifi,

  // ── Pool / water ──
  pool: FaSwimmingPool,
  piscina: FaSwimmingPool,
  'outdoor pool': FaSwimmingPool,
  'piscina al aire libre': FaSwimmingPool,
  'indoor pool': FaSwimmingPool,
  'piscina cubierta': FaSwimmingPool,
  'heated pool': FaSwimmingPool,
  'piscina climatizada': FaSwimmingPool,
  'jacuzzi': FaHotTub,
  'hot tub': FaHotTub,
  'hidromasaje': FaHotTub,

  // ── Parking ──
  parking: FaParking,
  estacionamiento: FaParking,
  aparcamiento: FaParking,
  'free parking': FaParking,
  'estacionamiento gratis': FaParking,
  'valet parking': FaParking,

  // ── Fitness / sports ──
  gym: FaDumbbell,
  gimnasio: FaDumbbell,
  'fitness center': FaDumbbell,
  'fitness centre': FaDumbbell,
  'centro de fitness': FaDumbbell,
  'bicycle rental': FaBicycle,
  'alquiler de bicicletas': FaBicycle,

  // ── Food & drink ──
  restaurant: FaUtensils,
  restaurante: FaUtensils,
  'restaurante en el sitio': FaUtensils,
  'on-site restaurant': FaUtensils,
  bar: FaGlassCheers,
  'bar en el sitio': FaGlassCheers,
  'bar/lounge': FaGlassCheers,
  coffee: FaCoffee,
  café: FaCoffee,
  'cafetería': FaCoffee,
  'coffee shop': FaCoffee,
  'coffee maker': FaCoffee,
  'cafetera': FaCoffee,
  breakfast: FaCoffee,
  desayuno: FaCoffee,
  'desayuno incluido': FaCoffee,
  'breakfast included': FaCoffee,
  'free breakfast': FaCoffee,
  kitchen: FaSink,
  cocina: FaSink,
  kitchenette: FaSink,
  'cocina completa': FaSink,
  'full kitchen': FaSink,

  // ── Spa / wellness ──
  spa: FaSpa,
  sauna: FaFire,
  'wellness center': FaSpa,
  'centro de bienestar': FaSpa,
  'massage': FaSpa,
  masaje: FaSpa,
  'masajes': FaSpa,

  // ── Beach ──
  beach: FaUmbrellaBeach,
  playa: FaUmbrellaBeach,
  'beach access': FaUmbrellaBeach,
  'acceso a la playa': FaUmbrellaBeach,
  'beachfront': FaUmbrellaBeach,
  'frente a la playa': FaUmbrellaBeach,

  // ── Kids / family ──
  'kids': FaChild,
  'niños': FaChild,
  'family-friendly': FaChild,
  'familiar': FaChild,
  'childcare': FaChild,
  'guardería': FaChild,
  'baby': FaBaby,
  'bebé': FaBaby,
  'cuna': FaBaby,
  'crib': FaBaby,
  'babysitting': FaBaby,

  // ── Pets ──
  'pet-friendly': FaPaw,
  'pet friendly': FaPaw,
  'admite mascotas': FaPaw,
  'mascotas permitidas': FaPaw,
  'pets allowed': FaPaw,

  // ── Services ──
  'concierge': FaConciergeBell,
  'conserjería': FaConciergeBell,
  'room service': FaConciergeBell,
  'servicio a la habitación': FaConciergeBell,
  'front desk': FaBell,
  'recepción': FaBell,
  '24-hour front desk': FaBell,
  'recepción 24 horas': FaBell,
  'laundry': FaRestroom,
  lavandería: FaRestroom,
  'dry cleaning': FaRestroom,
  'tintorería': FaRestroom,

  // ── Accessibility ──
  'wheelchair accessible': FaWheelchair,
  'accesible para sillas de ruedas': FaWheelchair,
  'accesibilidad': FaWheelchair,
  accessibility: FaWheelchair,

  // ── Climate / comfort ──
  'air conditioning': FaSnowflake,
  'aire acondicionado': FaSnowflake,
  'air-conditioned': FaSnowflake,
  heating: FaFire,
  calefacción: FaFire,
  'fireplace': FaFire,
  chimenea: FaFire,

  // ── Smoking ──
  'non-smoking': FaSmokingBan,
  'no fumador': FaSmokingBan,
  'smoke-free': FaSmokingBan,
  'libre de humo': FaSmokingBan,
  'smoking area': FaSmokingBan,
  'zona de fumadores': FaSmokingBan,

  // ── Entertainment ──
  tv: FaTv,
  televisión: FaTv,
  'flat-screen tv': FaTv,
  'tv de pantalla plana': FaTv,
  'cable tv': FaTv,
  'tv por cable': FaTv,
  'game room': FaGamepad,
  'sala de juegos': FaGamepad,

  // ── Bathroom ──
  shower: FaShower,
  ducha: FaShower,
  'private bathroom': FaShower,
  'baño privado': FaShower,
  'bathtub': FaShower,
  bañera: FaShower,

  // ── Business ──
  'business center': FaBusinessTime,
  'centro de negocios': FaBusinessTime,
  'meeting rooms': FaBriefcase,
  'salas de reuniones': FaBriefcase,
  'salas de reunión': FaBriefcase,

  // ── Language / multicultural ──
  'multilingual staff': FaLanguage,
  'personal multilingüe': FaLanguage,

  // ── Nature ──
  garden: FaTree,
  jardín: FaTree,
  terrace: FaTree,
  terraza: FaTree,
  balcony: FaDoorOpen,
  balcón: FaDoorOpen,

  // ── Other ──
  elevator: FaArrowUp,
  ascensor: FaArrowUp,
  'lift': FaArrowUp,
  'ev charger': FaChargingStation,
  'cargador ev': FaChargingStation,
  'electric vehicle charging': FaChargingStation,
  'carga de vehículos eléctricos': FaChargingStation,
  'family rooms': FaUsers,
  'habitaciones familiares': FaUsers,
  'first aid': FaFirstAid,
  'primeros auxilios': FaFirstAid,
};

/**
 * Resolves an amenity name to its mapped icon.
 * Falls back to FaCircle for unrecognized names.
 */
export function getAmenityIcon(name: string): IconType {
  // Exact match (case-insensitive)
  const key = name.toLowerCase().trim();
  if (AMENITY_ICON_MAP[key]) {
    return AMENITY_ICON_MAP[key];
  }

  // Partial match — check if any key is a substring of the amenity name
  for (const [candidate, icon] of Object.entries(AMENITY_ICON_MAP)) {
    if (key.includes(candidate) || candidate.includes(key)) {
      return icon;
    }
  }

  return FaCircle;
}
