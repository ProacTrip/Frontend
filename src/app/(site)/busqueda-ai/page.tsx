import type { Metadata } from 'next';
import BusquedaAIClientWrapper from './BusquedaAIClientWrapper';

export const metadata: Metadata = {
  title: 'Buscar con IA — Proactrip',
  description:
    'Buscá vuelos y hoteles usando lenguaje natural. Nuestra IA conversacional entiende lo que necesitás y te da los mejores resultados en tiempo real.',
  openGraph: {
    title: 'Buscar con IA — Proactrip',
    description:
      'Buscá vuelos y hoteles usando lenguaje natural. Nuestra IA conversacional entiende lo que necesitás y te da los mejores resultados en tiempo real.',
    type: 'website',
  },
  alternates: {
    canonical: '/busqueda-ai',
  },
};

export default function BusquedaAIPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Proactrip AI Search',
            url: 'https://proactrip.com/busqueda-ai',
            description:
              'Buscá vuelos y hoteles usando lenguaje natural. Nuestra IA entiende lo que necesitás.',
            applicationCategory: 'TravelApplication',
            operatingSystem: 'All',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate:
                  'https://proactrip.com/busqueda-ai?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <BusquedaAIClientWrapper />
    </>
  );
}
