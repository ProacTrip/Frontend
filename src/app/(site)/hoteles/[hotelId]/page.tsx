import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getHotelDetailsServer, HotelApiError } from '@/app/lib/api/hotels';
import { currencyToSymbol } from '@/app/lib/utils/transformers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { hotelId } = await params;
  const sp = await searchParams;

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join('; ');

    const data = await getHotelDetailsServer(
      hotelId,
      {
        query: typeof sp.query === 'string' ? sp.query : 'ProacTrip',
        check_in_date: typeof sp.check_in_date === 'string' ? sp.check_in_date : new Date().toISOString().split('T')[0],
        check_out_date: typeof sp.check_out_date === 'string' ? sp.check_out_date : new Date(Date.now() + 86400000).toISOString().split('T')[0],
        adults: typeof sp.adults === 'string' ? sp.adults : '2',
        children: typeof sp.children === 'string' ? sp.children : '0',
        gl: typeof sp.gl === 'string' ? sp.gl : undefined,
        hl: typeof sp.hl === 'string' ? sp.hl : undefined,
        currency: typeof sp.currency === 'string' ? sp.currency : undefined,
        vacation_rentals: typeof sp.vacation_rentals === 'string' ? sp.vacation_rentals : undefined,
      },
      cookieHeader || null,
    );

    const hotel = data.property;
    const title = `${hotel.name} — Proactrip`;
    const description = hotel.description || `${hotel.name} en ${hotel.location.city}. Reservá al mejor precio con Proactrip.`;
    const imageUrl = hotel.images?.[0] || undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(imageUrl && { images: [{ url: imageUrl }] }),
      },
      alternates: {
        canonical: `/hoteles/${hotelId}`,
      },
    };
  } catch (error) {
    // On error, return minimal metadata
    return {
      title: 'Hotel — Proactrip',
      description: 'Detalles del hotel en Proactrip.',
    };
  }
}

// ─── Data fetching helper (keeps try/catch away from JSX) ───

type HotelResult =
  | { ok: true; data: Awaited<ReturnType<typeof getHotelDetailsServer>> }
  | { ok: false; error: unknown };

async function fetchHotelDetails(hotelId: string, sp: Awaited<Props['searchParams']>): Promise<HotelResult> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join('; ');

    const data = await getHotelDetailsServer(
      hotelId,
      {
        query: typeof sp.query === 'string' ? sp.query : 'ProacTrip',
        check_in_date: typeof sp.check_in_date === 'string' ? sp.check_in_date : new Date().toISOString().split('T')[0],
        check_out_date: typeof sp.check_out_date === 'string' ? sp.check_out_date : new Date(Date.now() + 86400000).toISOString().split('T')[0],
        adults: typeof sp.adults === 'string' ? sp.adults : '2',
        children: typeof sp.children === 'string' ? sp.children : '0',
        gl: typeof sp.gl === 'string' ? sp.gl : undefined,
        hl: typeof sp.hl === 'string' ? sp.hl : undefined,
        currency: typeof sp.currency === 'string' ? sp.currency : undefined,
        vacation_rentals: typeof sp.vacation_rentals === 'string' ? sp.vacation_rentals : undefined,
      },
      cookieHeader || null,
    );

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

export default async function HotelDetailPage({ params, searchParams }: Props) {
  const { hotelId } = await params;
  const sp = await searchParams;

  const result = await fetchHotelDetails(hotelId, sp);

  // ── Error path — NO JSX inside try/catch ──
  if (!result.ok) {
    const error = result.error;
    let errorMessage: string | null = null;
    let isProviderError = false;

    if (error instanceof HotelApiError) {
      if (error.status === 404 || error.code === 'PROPERTY_NOT_FOUND') {
        notFound();
      }
      if (error.status === 502) {
        isProviderError = true;
        errorMessage = 'Proveedor no disponible. El servicio de búsqueda de hoteles está temporalmente fuera de servicio. Intentá de nuevo más tarde.';
      } else if (error.code === 'INTERNAL_ERROR' || error.status === 500 || error.status === 503) {
        errorMessage = 'Error interno del servidor. Estamos experimentando problemas técnicos. Intentá de nuevo.';
      } else {
        errorMessage = error.detail || 'Error al cargar los detalles del hotel.';
      }
    } else {
      errorMessage = 'Error de conexión. Verificá tu conexión a internet e intentá de nuevo.';
    }

    return (
      <main className="min-h-screen bg-white pt-[72px] px-4 lg:px-8 py-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">
            {isProviderError ? 'Proveedor no disponible' : 'Error al cargar el hotel'}
          </h1>
          <p className="text-[#6A7282]">{errorMessage}</p>
          <Link
            href="/hoteles"
            className="inline-block mt-6 px-6 py-2.5 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#262626] transition-colors"
          >
            Volver a la búsqueda
          </Link>
        </div>
      </main>
    );
  }

  // ── Success path — clean JSX, no try/catch wrapping ──
  const hotel = result.data.property;
  const priceRange = hotel.price?.amount
    ? `${currencyToSymbol(hotel.price.currency || 'EUR')}${hotel.price.amount}`
    : undefined;

  // Build JSON-LD structured data
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    ...(hotel.description && { description: hotel.description }),
    ...(hotel.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: hotel.address,
      },
    }),
    ...(hotel.images?.[0] && { image: hotel.images[0] }),
    ...(priceRange && { priceRange }),
    ...(hotel.stars && { starRating: { '@type': 'Rating', ratingValue: hotel.stars } }),
    ...(hotel.rating?.score && hotel.rating.score > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: hotel.rating.score,
            reviewCount: hotel.rating.reviews || 0,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-white pt-[72px] px-4 lg:px-8 py-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-[#0A0A0A] tracking-tight mb-4">
          {hotel.name}
        </h1>
        {hotel.description && (
          <p className="text-lg text-[#6A7282] max-w-3xl mb-6 leading-relaxed">
            {hotel.description}
          </p>
        )}
        <div className="flex flex-wrap gap-6 text-sm text-[#6A7282]">
          {hotel.location?.city && (
            <span>{hotel.location.city}</span>
          )}
          {hotel.address && (
            <span>{hotel.address}</span>
          )}
          {hotel.rating?.score && hotel.rating.score > 0 && (
            <span className="font-semibold text-[#0A0A0A]">
              {hotel.rating.score.toFixed(1)} ★ ({hotel.rating.reviews} reseñas)
            </span>
          )}
          {hotel.stars && (
            <span className="font-semibold text-[#0A0A0A]">
              {hotel.stars} estrellas
            </span>
          )}
        </div>
        {hotel.bookingUrl && (
          <div className="mt-8">
            <a
              href={hotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-[#0A0A0A] text-white rounded-full font-semibold hover:bg-[#262626] transition-colors"
            >
              Reservar ahora
            </a>
          </div>
        )}
      </main>
    </>
  );
}
