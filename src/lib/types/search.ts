// ── Search Request ──

export interface HotelSearchRequest {
  // Required
  query: string;
  check_in_date: string;        // YYYY-MM-DD
  check_out_date: string;       // YYYY-MM-DD

  // Optional (with defaults)
  adults?: number;              // default 2
  children?: number;            // default 0
  children_ages?: number[];     // default []
  gl?: string;                  // ISO 3166-1 alpha-2
  hl?: string;                  // ISO 639-1
  currency?: string;            // ISO 4217
  min_price?: number;
  max_price?: number;
  sort_by?: number;             // 3|8|13
  rating?: number;              // 7|8|9
  property_types?: number[];    // Hotels: 12-24, VR: 1-11
  amenities?: number[];         // coded values
  vacation_rentals?: boolean;   // default false
  hotel_classes?: number[];     // 2|3|4|5
  brands?: number[];
  free_cancellation?: boolean;
  special_offers?: boolean;
  eco_certified?: boolean;
  bedrooms?: number;            // VR only
  bathrooms?: number;           // VR only
  page_token?: string;          // pagination
}

// ── Response ──

export type ResultsState = 'matching' | 'non_matching_only';
export type PropertyType = 'hotel' | 'vacation_rental';

export interface HotelSearchResponse {
  type: 'hotels' | 'vacation_rentals';
  results_state: ResultsState;
  properties: HotelSearchResult[];
  brands: Brand[] | null;
  pagination: PaginationInfo;
  from_cache: boolean;
  cached_at: string | null;
}

// ── Property ──

export interface HotelSearchResult {
  id: string;                   // property_token — opaque
  type: PropertyType;
  name: string;
  description: string | null;
  booking_url: string | null;
  gps: GpsCoordinates;
  hotel_class: number | null;   // 2-5, null for VR
  check_in: string | null;      // "HH:MM"
  check_out: string | null;     // "HH:MM"
  rating: HotelRating;
  total_reviews: number | null;
  price: HotelPrice;
  images: HotelImage[] | null;
  amenities: string[] | null;
  nearby_places: NearbyPlace[] | null;
  free_cancellation: boolean;
  special_offer: boolean;
  eco_certified: boolean;
  ratings: RatingsDistribution[];
  reviews_breakdown: ReviewBreakdown[];
}

export interface VacationRentalProperty extends HotelSearchResult {
  type: 'vacation_rental';
  hotel_class: null;
  excluded_amenities: string[];
  capacity: CapacityInfo;
  prices: OtaPrice[];
}

// ── Sub-types ──

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface HotelRating {
  overall: number | null;
  location: number | null;
}

export interface HotelPrice {
  currency: string;
  per_night: {
    amount: number;
    before_taxes: number | null;
  };
  total: {
    amount: number;
    before_taxes: number | null;
  };
}

export interface HotelImage {
  thumbnail: string;
  original: string;
}

export interface NearbyPlace {
  name: string;
  transport: TransportOption[];
}

export interface TransportOption {
  type: string;               // "Walking" | "Taxi" | "Public transport"
  duration: string;           // "1 min" | "20 min"
}

export interface RatingsDistribution {
  stars: number;              // 1-5
  count: number;
}

export interface ReviewBreakdown {
  name: string;               // "Service", "Cleanliness", "Location"
  description: string;
  total_mentioned: number;
  positive: number;
  negative: number;
  neutral: number;
}

// ── Vacation Rental specific ──

export interface CapacityInfo {
  unit_type: string;          // "Villa completa", "Entire house"
  guests: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  beds: number | null;
  area: string | null;        // "45 ft²"
}

export interface OtaPrice {
  source: string;             // "Booking.com", "Agoda"
  logo: string | null;
  num_guests: number | null;
  rate_per_night: {
    amount: number;
    before_taxes: number | null;
  };
}

// ── Brands ──

export interface Brand {
  id: number;
  name: string;
  chains: HotelChain[];
}

export interface HotelChain {
  id: number;
  name: string;
}

// ── Pagination ──

export interface PaginationInfo {
  next_token: string | null;
  has_more: boolean;
}

// ── Client-side state ──

export interface PaginationState {
  tokens: string[];            // history of page_tokens visited
  nextToken: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export interface FilterState {
  vacation_rentals: boolean;   // false = hotels (default), true = vacation rentals
  min_price?: number;
  max_price?: number;
  rating?: number;             // 7|8|9 or null
  hotel_classes: number[];     // 2|3|4|5
  property_types: number[];    // Hotels: 12-24, VR: 1-11
  amenities: number[];         // coded values
  bedrooms?: number;           // VR only
  bathrooms?: number;          // VR only
  sort_by?: number;            // 3|8|13
  free_cancellation: boolean;
  special_offers: boolean;
  eco_certified: boolean;
  brands: number[];
  applied: boolean;            // dirty vs applied tracking
}

export type FilterAction =
  | { type: 'SET_PRICE_RANGE'; min?: number; max?: number }
  | { type: 'SET_RATING'; value: number | null }
  | { type: 'TOGGLE_VACATION_RENTALS' }
  | { type: 'TOGGLE_HOTEL_CLASS'; value: number }
  | { type: 'TOGGLE_PROPERTY_TYPE'; value: number }
  | { type: 'TOGGLE_AMENITY'; value: number }
  | { type: 'SET_BEDROOMS'; value: number | undefined }
  | { type: 'SET_BATHROOMS'; value: number | undefined }
  | { type: 'SET_SORT'; value: number | null }
  | { type: 'TOGGLE_FREE_CANCEL' }
  | { type: 'TOGGLE_SPECIAL_OFFERS' }
  | { type: 'TOGGLE_ECO_CERTIFIED' }
  | { type: 'SET_BRANDS'; value: number[] }
  | { type: 'RESET_FILTERS' }
  | { type: 'APPLY_FILTERS' };

export interface SearchState {
  query: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: number[];
  gl: string;
  hl: string;
  currency: string;
}

// ── API Error (RFC 9457 Problem Details) ──

export interface ApiError {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
  traceId?: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  trace_id: string;
}
