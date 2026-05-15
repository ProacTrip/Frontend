import { Suspense } from 'react';
import type { Metadata } from 'next';
import HotelsSearchClient from '@/components/hotels/HotelsSearchClient';

export const metadata: Metadata = {
  title: 'Hoteles — ProacTrip',
  description:
    'Buscá y compará miles de hoteles. Encontrá el alojamiento perfecto para tu viaje.',
};

/**
 * Hotel search page — server shell with Suspense boundary for
 * the client-side search client (which uses useSearchParams).
 *
 * Phase 1: hotels only (vacation_rentals: false hardcoded in API layer).
 */
export default function HotelsPage() {
  return (
    <Suspense fallback={<HotelsLoadingFallback />}>
      <HotelsSearchClient />
    </Suspense>
  );
}

function HotelsLoadingFallback() {
  return (
    <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Skeleton search bar */}
        <div className="mb-6">
          <div className="animate-pulse rounded-2xl bg-paper-dim border border-paper-outline h-16" />
        </div>

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-paper-outline bg-paper-dim"
            >
              <div className="aspect-[4/3] bg-paper-container" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-paper-container" />
                <div className="h-4 w-1/2 rounded bg-paper-container" />
                <div className="h-3 w-2/3 rounded bg-paper-container" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
