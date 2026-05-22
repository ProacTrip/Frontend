'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Timer } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import SearchForm, { SearchParams } from './components/SearchForm';
import HotelFilters, { FilterValues } from './components/HotelFilters';
import HotelsList from './components/HotelsList';
import HotelDetailModal from './components/HotelDetailModal';
import { searchHotels } from '@/app/lib/api/hotels';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAuthContext } from '@/contexts/AuthContext';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { HOTELS_STALE_TIME } from '@/app/lib/queries/staleTimes';

function HotelesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHotelId = searchParams.get('hotel');

  const { context: authContext } = useAuthContext();

  // ---- UI state ----
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const [filters, setFilters] = useState<FilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
  });

  // ---- Rate limit ----
  const {
    info: rateLimitInfo,
    isBlocked: rateLimitBlocked,
    secondsLeft: rateLimitCountdown,
  } = useRateLimit();

  // ---- Infinite Query ----
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: queryKeys.hotels.search({
      query: lastSearchParams?.query,
      checkIn: lastSearchParams?.check_in_date,
      checkOut: lastSearchParams?.check_out_date,
      adults: lastSearchParams?.adults,
      children: lastSearchParams?.children,
    }),
    queryFn: ({ pageParam, signal }) =>
      searchHotels(
        { ...lastSearchParams!, page_token: (pageParam as string | null) ?? null },
        filters,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination?.next_token ?? undefined,
    enabled: !!lastSearchParams,
    staleTime: HOTELS_STALE_TIME,
  });

  const queryErrorMsg = queryError instanceof Error ? queryError.message : null;
  const searchError = queryErrorMsg;

  // ---- Computed: flatten pages ----
  const displayedHotels = useMemo(() => {
    return (pagesData?.pages ?? []).flatMap((p) => p.properties);
  }, [pagesData]);

  const selectedHotel = selectedHotelId
    ? displayedHotels.find((h) => h.id === selectedHotelId)
    : null;

  const handleCloseModal = () => {
    router.push('/hoteles', { scroll: false });
  };

  const handleSearch = (params: SearchParams, customFilters?: FilterValues) => {
    const activeFilters = customFilters || filters;
    setFilters(activeFilters);
    setLastSearchParams(params);
    setHasSearched(true);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);

    if (hasSearched && lastSearchParams) {
      // Re-trigger search by setting params (forces query re-fetch)
      setLastSearchParams({ ...lastSearchParams });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3]">
      <div className="max-w-[1600px] mx-auto p-6">

        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-3 space-y-6">

            <div className="border-4 border-[#FF6B6B] rounded-2xl p-4 bg-white shadow-lg">
              <img
                src="/logoMostrar.png"
                alt="ProacTrip Logo"
                className="w-full h-52 object-contain"
              />
            </div>

            <HotelFilters onFilterChange={handleFilterChange} />
          </div>

          <div className="col-span-9 space-y-2">

            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900">Buscar Hoteles</h2>
              <p className="text-gray-600 mt-2">Encuentra los mejores hoteles al mejor precio</p>
              {authContext?.location && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  {authContext.location.city}
                  {authContext.location.country && `, ${authContext.location.country}`}
                  {authContext.location.currency && ` · Moneda: ${authContext.location.currency}`}
                </p>
              )}
            </div>

            <SearchForm onSearch={handleSearch} isLoading={isLoading && !hasSearched} />

            {/* Error banner */}
            {searchError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Error en la búsqueda</p>
                  <p className="text-sm text-red-600">{searchError}</p>
                </div>
                <button
                  onClick={() => {
                    // Re-trigger search to clear error
                    if (lastSearchParams) setLastSearchParams({ ...lastSearchParams });
                  }}
                  className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Rate limit warning (non-blocking) */}
            {rateLimitInfo && rateLimitInfo.remaining <= 2 && rateLimitInfo.remaining > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">
                    Quedan {rateLimitInfo.remaining} búsqueda{rateLimitInfo.remaining !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-xs text-amber-600">
                    Se reinicia en {Math.max(0, rateLimitInfo.reset)}s.
                  </p>
                </div>
              </div>
            )}

            {/* Rate limit BLOCKED (429) */}
            {rateLimitBlocked && rateLimitCountdown > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <Timer className="w-5 h-5 flex-shrink-0 text-red-500 animate-pulse" />
                <div>
                  <p className="font-medium text-red-800">
                    Límite alcanzado. Reintentá en {Math.floor(rateLimitCountdown / 60)}:{String(rateLimitCountdown % 60).padStart(2, '0')}.
                  </p>
                  <p className="text-xs text-red-600">
                    La búsqueda estará disponible automáticamente.
                  </p>
                </div>
              </div>
            )}

            {hasSearched ? (
              displayedHotels.length > 0 ? (
                <HotelsList
                  hotels={displayedHotels}
                  isLoading={isLoading || isFetchingNextPage}
                  hasMore={hasNextPage}
                  nextToken={null}
                  onLoadMore={() => fetchNextPage()}
                />
              ) : (
                !isLoading && (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No se encontraron hoteles
                    </h3>
                    <p className="text-gray-600">
                      Intenta ajustar tus filtros o cambiar las fechas
                    </p>
                  </div>
                )
              )
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-2 min-h-[320px]">

                  <div className="flex flex-col justify-center px-12 py-10">
                    <p className="text-xs font-semibold text-[#FF6B6B] uppercase tracking-widest mb-3">
                      ProacTrip Hoteles
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
                      Encuentra tu alojamiento perfecto
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      Introduce tu destino, selecciona las fechas y ajusta los huéspedes para ver los mejores hoteles al mejor precio.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        'Miles de alojamientos disponibles',
                        'Cancelación gratuita en la mayoría de reservas',
                        'Precios sin comisiones ocultas',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative bg-gradient-to-br from-[#fff0e6] to-[#ffd4b3] flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Usa el buscador de arriba</p>
                      <p className="text-xs text-gray-500 mt-1">y encuentra tu próxima estancia</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          searchParams={lastSearchParams || undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function HotelesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <HotelesContent />
    </Suspense>
  );
}
