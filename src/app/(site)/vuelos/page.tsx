import { Suspense } from 'react';
import type { Metadata } from 'next';
import VuelosContent from './VuelosContent';
import FlightSkeleton from './components/FlightSkeleton';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const origin = typeof params.origen === 'string' ? params.origen : '';
  const destination = typeof params.destino === 'string' ? params.destino : '';

  const title = origin && destination
    ? `${origin} to ${destination} Flights — Proactrip`
    : 'Flights — Proactrip';

  const description = origin && destination
    ? `Find the best flights from ${origin} to ${destination}. Compare prices, airlines, and book at the best price with Proactrip.`
    : 'Search and compare flights worldwide. Find the best deals on airline tickets with Proactrip.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: '/vuelos',
    },
  };
}

export default function VuelosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Flight',
            name: 'Flight search results',
            description: 'Flight search results on Proactrip',
            provider: {
              '@type': 'Organization',
              name: 'Proactrip',
            },
          }),
        }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-white pt-[calc(72px+64px+24px)]">
          <div className="max-w-[900px] mx-auto px-4 lg:px-8">
            <FlightSkeleton />
          </div>
        </div>
      }>
        <VuelosContent />
      </Suspense>
    </>
  );
}
