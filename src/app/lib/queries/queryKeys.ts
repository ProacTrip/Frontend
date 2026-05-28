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
  departure?: string;
  arrival?: string;
  outbound_date?: string;
  return_date?: string;
  adults?: number;
  children?: number;
  tripType?: string;
  travel_class?: string;
  currency?: string;
  // Round-trip phase 2 token (MUST be in queryKey to trigger refetch)
  outbound_selection_token?: string | null;
  // Filter version (_fv) — change triggers refetch when any filter updates
  _fv?: string;
  // Direct filter params for cache separation
  stops?: string;
  sort_by?: string;
  max_price?: number | null;
  include_airlines?: string[];
  travel_class_filter?: string;
  // Pagination cursor
  cursor?: string | null;
  // Locale currency override (triggers refetch on currency change)
  _localeCurrency?: string;
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
  vacation_rentals?: boolean;
  currency?: string;
  _fv?: number | string; // filter version — changes trigger refetch when filters update
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
// DOMAIN: User
// ==========================================
export const userKeys = {
  /** ['user'] — root */
  all: ['user'] as const,
  /** ['user', 'me'] — identity from /v1/auth/me (all roles) */
  me: () => [...userKeys.all, 'me'] as const,
  /** ['user', 'profile'] — user profile */
  profile: () => [...userKeys.all, 'profile'] as const,
  /** ['user', 'medical'] — medical profile */
  medical: () => [...userKeys.all, 'medical'] as const,
  /** ['user', 'documents', filters?] — document list with optional filters */
  documents: (filters?: { status?: string; document_type?: string }) =>
    filters
      ? ([...userKeys.all, 'documents', filters] as const)
      : ([...userKeys.all, 'documents'] as const),
  /** ['user', 'documents', id] — single document detail */
  document: (id: string) => [...userKeys.all, 'documents', id] as const,
  /** ['user', 'travel-preferences'] — travel preferences */
  travelPreferences: () => [...userKeys.all, 'travel-preferences'] as const,
  /** ['user', 'medical-conflicts', status?] — medical conflicts */
  medicalConflicts: (status?: string) =>
    status
      ? ([...userKeys.all, 'medical-conflicts', status] as const)
      : ([...userKeys.all, 'medical-conflicts'] as const),
};

// ==========================================
// DOMAIN: Admin
// ==========================================
export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  cursor?: string;
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
  user: userKeys,
  favorites: favoritesKeys,
  flights: flightKeys,
  hotels: hotelKeys,
  admin: adminKeys,
};
