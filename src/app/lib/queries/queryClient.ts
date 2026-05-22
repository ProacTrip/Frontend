// app/lib/queries/queryClient.ts
//
// SSR-safe QueryClient singleton for TanStack Query v5.
// Follows the canonical Next.js App Router pattern:
// server gets a fresh instance per request,
// browser gets a stable singleton for the lifetime of the page.

import { QueryClient } from '@tanstack/react-query';
import { rateLimitStore } from '@/app/lib/api/rate-limit';
import { AuthApiError } from '@/app/lib/api/auth';

/** Seconds in a minute — avoids magic numbers. */
const MS_PER_MINUTE = 60_000;

/**
 * Create a fresh QueryClient with sensible defaults.
 *
 * Called on the server once per request (via makeQueryClient)
 * and on the client once on initial mount (via getQueryClient singleton).
 *
 * Defaults:
 *  - staleTime: 60s — data considered fresh for 1 minute
 *  - gcTime: 5min — unused cache entries garbage collected after 5 minutes
 *  - retry: 2 — two retries on failure, excludes RATE_LIMIT_EXCEEDED
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * MS_PER_MINUTE,
        retry: (failureCount, error) => {
          // Don't retry if rate limited
          if (!rateLimitStore.canRetry()) return false;
          // Don't retry on 4xx errors (except 429 which is handled above)
          if (error instanceof AuthApiError && error.status >= 400 && error.status < 500 && error.status !== 429) return false;
          // Max 2 retries
          if (failureCount >= 2) return false;
          return true;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Get or create the browser-side QueryClient singleton.
 *
 * SSR-safe: uses typeof window === 'undefined' for server detection
 * (not @tanstack/react-query's isServer — which may not be available
 * in all bundler configurations).
 *
 * On the server this ALWAYS returns a fresh client.
 * In the browser it reuses the same instance for hot module reload stability.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Client: singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
