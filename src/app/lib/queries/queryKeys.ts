// app/lib/queries/queryKeys.ts
//
// Query key factories for TanStack Query v5.
// Hierarchical structure: ['domain', 'resource', ...identifiers]
//
// Benefits:
//  - Structural sharing: all keys under ['flights'] can be invalidated at once
//  - Type-safe: consumers reference keys by factory, not magic strings
//  - Composable: extend with filters, IDs, or object params
//
// Pattern:
//   queryKeys.flights.search({ origin: 'EZE', destination: 'MIA', ... })
//   → ['flights', 'search', { origin: 'EZE', destination: 'MIA', ... }]

// ==========================================
// DOMAIN: Environment
// ==========================================
const envKeys = {
  /** ['environment'] — single query for app environment config */
  all: ['environment'] as const,
};

// ==========================================
// DOMAIN: Profile
// ==========================================
const profileKeys = {
  /** ['profile'] — single query for user profile */
  all: ['profile'] as const,
};

// ==========================================
// DOMAIN: Favorites
// ==========================================
const favoritesKeys = {
  /** ['favorites'] — all favorites (no filter) */
  all: ['favorites'] as const,
  /** ['favorites', entityType] — filtered by entity type */
  byType: (entityType?: string) =>
    entityType
      ? (['favorites', entityType] as const)
      : (['favorites'] as const),
};

// ==========================================
// DOMAIN: Flights
// ==========================================
export interface FlightSearchFilters {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  tripType?: string;
}

const flightKeys = {
  /** ['flights'] — root */
  all: ['flights'] as const,
  /** ['flights', 'search', filters] — flight search results */
  search: (filters: FlightSearchFilters = {}) =>
    ['flights', 'search', filters] as const,
  /** ['flights', 'detail', id] — single flight details */
  detail: (id: string) => ['flights', 'detail', id] as const,
};

// ==========================================
// DOMAIN: Hotels
// ==========================================
export interface HotelSearchParams {
  query?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
}

const hotelKeys = {
  /** ['hotels'] — root */
  all: ['hotels'] as const,
  /** ['hotels', 'search', params] — hotel search results */
  search: (params: HotelSearchParams = {}) =>
    ['hotels', 'search', params] as const,
  /** ['hotels', 'detail', id] — single hotel details */
  detail: (id: string) => ['hotels', 'detail', id] as const,
  /** ['hotels', 'rooms', hotelId] — hotel rooms */
  rooms: (hotelId: string) => ['hotels', 'rooms', hotelId] as const,
};

// ==========================================
// DOMAIN: Saved Searches
// ==========================================
const savedSearchesKeys = {
  /** ['saved-searches'] — user's saved flight/hotel searches */
  all: ['saved-searches'] as const,
};

// ==========================================
// DOMAIN: Notifications
// ==========================================
export interface NotificationQueryParams {
  status?: string;
  limit?: number;
  offset?: number;
}

const notificationKeys = {
  /** ['notifications'] — root */
  all: ['notifications'] as const,
  /** ['notifications', { status?, limit?, offset? }] — filtered */
  list: (params: NotificationQueryParams = {}) =>
    ['notifications', params] as const,
};

// ==========================================
// DOMAIN: Admin
// ==========================================
export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

const adminKeys = {
  /** ['admin'] — root */
  all: ['admin'] as const,
  /** ['admin', 'users', params?] — paginated/list user list */
  users: (params?: AdminUsersParams) =>
    params ? (['admin', 'users', params] as const) : (['admin', 'users'] as const),
  /** ['admin', 'users', id] — single user detail */
  userById: (id: string) => ['admin', 'users', id] as const,
  /** ['admin', 'documents', docId?] — admin documents */
  documents: (docId?: string) =>
    docId
      ? (['admin', 'documents', docId] as const)
      : (['admin', 'documents'] as const),
  /** ['admin', 'stats'] — dashboard statistics */
  stats: ['admin', 'stats'] as const,
};

// ==========================================
// EXPORT
// ==========================================

export const queryKeys = {
  env: envKeys,
  profile: profileKeys,
  favorites: favoritesKeys,
  flights: flightKeys,
  hotels: hotelKeys,
  savedSearches: savedSearchesKeys,
  notifications: notificationKeys,
  admin: adminKeys,
};
