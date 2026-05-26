import { Suspense } from 'react';
import type { Metadata } from 'next';
import HotelesContent from './HotelesContent';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.query === 'string' ? params.query : '';

  const title = query ? `Hoteles en ${query} — Proactrip` : 'Hoteles — Proactrip';
  const description = query
    ? `Encontrá los mejores hoteles en ${query}. Compará precios y reservá al mejor precio con Proactrip.`
    : 'Buscá y compará hoteles, resorts y alquileres vacacionales al mejor precio con Proactrip.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: '/hoteles',
    },
  };
}

export default function HotelesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: [],
            name: 'Resultados de búsqueda de hoteles',
            description: 'Resultados de búsqueda de hoteles en Proactrip',
          }),
        }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-white pt-[72px]">
            <div className="px-4 lg:px-8 pb-4">
              <div className="h-8 w-64 bg-[#F5F5F5] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[#F5F5F5] rounded mt-2 animate-pulse" />
            </div>
            <div className="px-4 lg:px-8 pb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-[#F5F5F5]" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-[#F5F5F5] rounded w-3/4" />
                      <div className="h-3 bg-[#F5F5F5] rounded w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-[#F5F5F5] rounded-lg" />
                        <div className="h-5 w-20 bg-[#F5F5F5] rounded-lg" />
                      </div>
                      <div className="h-5 bg-[#F5F5F5] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <HotelesContent />
      </Suspense>
    </>
  );
}
