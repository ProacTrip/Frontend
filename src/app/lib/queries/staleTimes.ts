// app/lib/queries/staleTimes.ts
//
// Stale time constants per data domain — spec REQ-DX04.
// All values in milliseconds.
//
// These are the authoritative tunables for cache freshness.
// Use them with the `staleTime` option on individual useQuery /
// useInfiniteQuery calls to override the 60s default from makeQueryClient().

// ==========================================
// DOMAIN: Environment (env)
// ==========================================

/** Environment config — rarely changes. Value: 5 minutes */
export const ENV_STALE_TIME = 5 * 60_000;

// ==========================================
// DOMAIN: Profile
// ==========================================

/** User profile — personal data, changes infrequently. Value: 5 minutes */
export const PROFILE_STALE_TIME = 5 * 60_000;

// ==========================================
// DOMAIN: Flights
// ==========================================

/** Flight search — prices fluctuate rapidly. Value: 0 (always fresh) */
export const FLIGHTS_STALE_TIME = 0;

// ==========================================
// DOMAIN: Hotels
// ==========================================

/** Hotel search — availability changes. Value: 0 (always fresh) */
export const HOTELS_STALE_TIME = 0;

// ==========================================
// DOMAIN: Favorites
// ==========================================

/** User favorites — toggled frequently, needs reasonable freshness. Value: 30 seconds */
export const FAVORITES_STALE_TIME = 30_000;

// ==========================================
// DOMAIN: Saved Searches
// ==========================================

/** Saved searches — user-managed, moderate churn. Value: 30 seconds */
export const SAVED_SEARCHES_STALE_TIME = 30_000;

// ==========================================
// DOMAIN: Admin
// ==========================================

/** Admin data — needs near-real-time for monitoring. Value: 60 seconds */
export const ADMIN_STALE_TIME = 60_000;

// ==========================================
// DOMAIN: Notifications
// ==========================================

/** Notifications — should reflect recent activity. Value: 15 seconds */
export const NOTIFICATIONS_STALE_TIME = 15_000;

// ==========================================
// DEFAULT
// ==========================================

/** Catch-all for any data not explicitly tuned. Value: 60 seconds */
export const DEFAULT_STALE_TIME = 60_000;
