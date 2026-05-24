'use client';

import { useEnvironment } from '@/hooks/useEnvironment';

/**
 * Triggers the declarative `useEnvironment()` TanStack Query hook at the
 * provider level so that `/v1/environment` data is fetched on app mount
 * for ALL users (auth + unauth).
 *
 * Replaces the imperative `ContextInitializer.fetchAndStoreEnvironment()`
 * with no auth guard. TanStack Query handles cache deduplication and
 * staleTime (10 min) — even if 10 components call `useEnvironment()`,
 * only 1 network request fires.
 *
 * Renders nothing — side-effect only.
 */
export default function EnvironmentInitializer() {
  useEnvironment();
  return null;
}
