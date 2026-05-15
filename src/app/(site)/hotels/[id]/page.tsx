import { Suspense } from 'react';
import type { Metadata } from 'next';
import HotelDetailClient from '@/components/hotels/HotelDetailClient';

export const metadata: Metadata = {
  title: { default: 'Detalle del hotel', template: '%s | ProacTrip' },
};

export default function HotelDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse space-y-6">
            <div className="h-5 w-40 rounded bg-paper-container" />
            <div className="aspect-[16/9] w-full rounded-xl bg-paper-container" />
            <div className="h-7 w-1/2 rounded bg-paper-container" />
            <div className="h-5 w-1/3 rounded bg-paper-container" />
          </div>
        </div>
      }
    >
      <HotelDetailClient />
    </Suspense>
  );
}
