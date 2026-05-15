import { Suspense } from 'react';
import type { Metadata } from 'next';
import BookingClient from '@/components/hotels/BookingClient';

export const metadata: Metadata = {
  title: 'Reserva confirmada — ProacTrip',
  description: 'Reserva ficticia de demostración.',
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse space-y-6">
            <div className="h-5 w-40 rounded bg-paper-container" />
            <div className="h-8 w-1/3 rounded bg-paper-container" />
            <div className="aspect-[16/9] w-full rounded-xl bg-paper-container" />
            <div className="h-5 w-2/3 rounded bg-paper-container" />
            <div className="h-4 w-1/2 rounded bg-paper-container" />
          </div>
        </div>
      }
    >
      <BookingClient />
    </Suspense>
  );
}
