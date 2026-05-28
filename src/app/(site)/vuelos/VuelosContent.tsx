'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plane, AlertCircle, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import FlightList from './components/FlightList';
import FilterBar, { type VueloFilterValues } from './components/FilterBar';
import FilterModal from './components/FilterModal';
import Pagination from './components/Pagination';
import FlightSkeleton from './components/FlightSkeleton';
import { searchFlights, FlightApiError } from '@/app/lib/api/flights';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useLocalePreferences } from '@/hooks/useLocalePreferences';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { FLIGHTS_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { FlightSearchRequest, FlightSearchResponse, FlightOffer } from '@/app/lib/types/flight';

// ─── Round-trip phase type ──────────────────────────
type SearchPhase = 'outbound_selection' | 'return_selection' | 'complete' | 'error' | 'idle';

// ─── Component ──────────────────────────────────────
export default function VuelosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { environment } = useEnvironment();
  const { currency: localeCurrency } = useLocalePreferences();

  // ─── Search request state (hydration-safe: starts null, set via useEffect) ──
  const [searchRequest, setSearchRequest] = useState<FlightSearchRequest | null>(null);
  const [outboundToken, setOutboundToken] = useState<string | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<FlightOffer | null>(null);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const paramsInitialized = useRef(false);

  // ─── Initialize from URL params (hydration-safe) ──
  useEffect(() => {
    if (paramsInitialized.current) return;

    const urlOrigin = (searchParams.get('origen') || '').toUpperCase();
    const urlDest = (searchParams.get('destino') || '').toUpperCase();
    const urlFechaIda = searchParams.get('fecha_ida') || '';
    const urlFechaVuelta = searchParams.get('fecha_vuelta') || '';
    const urlGl = searchParams.get('gl') || '';
    const urlHl = searchParams.get('hl') || '';
    const urlCurrency = searchParams.get('currency') || '';

    const hasSearchParams = !!(urlOrigin && urlDest && urlFechaIda);

    if (hasSearchParams) {
      setSearchRequest({
        trip_type: urlFechaVuelta ? 'round_trip' : 'one_way',
        departure: urlOrigin,
        arrival: urlDest,
        outbound_date: urlFechaIda,
        return_date: urlFechaVuelta || undefined,
        adults: parseInt(searchParams.get('adults') || '1', 10),
        children: parseInt(searchParams.get('children') || '0', 10),
        travel_class: 'economy',
        currency: urlCurrency || localeCurrency || 'EUR',
        gl: urlGl || environment?.location?.country_code || 'ES',
        hl: urlHl || environment?.location?.language || 'es',
      });
      setSearchPhase('outbound_selection');
    }

    paramsInitialized.current = true;
  }, [searchParams.toString(), localeCurrency, environment]);

  // ─── Filter state ──────────────────────────────────
  const [filters, setFilters] = useState<VueloFilterValues>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [scrollToSection, setScrollToSection] = useState<string | undefined>(undefined);

  // ─── Rate limit ────────────────────────────────────
  // Subscribes to rate limit store for global rate-limit awareness
  void useRateLimit();

  // ─── CURRENCY SYNC: keep URL in sync with active currency selection ──
  // When the user changes currency in the navbar, update the URL so the
  // search refetches via React Query key change AND the URL is shareable.
  useEffect(() => {
    if (!searchRequest || !localeCurrency) return;
    const currentCurrency = searchParams.get('currency');
    if (currentCurrency === localeCurrency) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', localeCurrency);
    // Use window.location.replace to avoid adding to browser history
    // (same behavior as HotelesContent router.replace)
    router.replace(`/vuelos?${params.toString()}`, { scroll: false });
  }, [localeCurrency, searchRequest, searchParams, router]);

  // ─── Filter version (changes trigger refetch) ──────
  const filterVersion = useMemo(() => JSON.stringify({
    stops: filters.stops || 'any',
    sort_by: filters.sort_by || 'top',
    max_price: filters.max_price ?? null,
    include_airlines: filters.include_airlines || [],
    travel_class: filters.travel_class || 'economy',
    max_duration_minutes: filters.max_duration_minutes ?? null,
  }), [filters]);

  // ─── Infinite Query ────────────────────────────────
  const {
    data: pagesData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.flights.search({
      departure: searchRequest?.departure,
      arrival: searchRequest?.arrival,
      outbound_date: searchRequest?.outbound_date,
      return_date: searchRequest?.return_date,
      adults: searchRequest?.adults,
      children: searchRequest?.children,
      tripType: searchRequest?.trip_type,
      travel_class: searchRequest?.travel_class,
      currency: searchRequest?.currency,
      outbound_selection_token: outboundToken,
      _fv: filterVersion,
      stops: filters.stops,
      sort_by: filters.sort_by,
      max_price: filters.max_price,
      include_airlines: filters.include_airlines,
      travel_class_filter: filters.travel_class,
      _localeCurrency: localeCurrency,
    }),
    queryFn: ({ pageParam, signal }) => {
      if (!searchRequest) throw new Error('No search params');
      return searchFlights(
        {
          ...searchRequest,
          currency: localeCurrency || searchRequest.currency || 'EUR',
          outbound_selection_token: outboundToken,
          stops: (filters.stops || 'any') as FlightSearchRequest['stops'],
          sort_by: filters.sort_by || 'top',
          max_price: filters.max_price ?? null,
          include_airlines: filters.include_airlines,
          travel_class: (filters.travel_class || searchRequest.travel_class) as FlightSearchRequest['travel_class'],
          max_duration_minutes: filters.max_duration_minutes ?? null,
          cursor: (pageParam as string | null) ?? null,
        },
        signal,
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FlightSearchResponse) => lastPage.meta?.next_cursor ?? undefined,
    enabled: !!searchRequest,
    staleTime: FLIGHTS_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const queryErrorMsg = queryError instanceof Error ? queryError.message : null;

  // ─── Derive phase from API response ────────────────
  useEffect(() => {
    const lastPage = pagesData?.pages?.[pagesData.pages.length - 1];
    if (lastPage?.phase && lastPage.phase !== searchPhase) {
      setSearchPhase(lastPage.phase as SearchPhase);
    }
  }, [pagesData, searchPhase]);

  // ─── Flattened flights ─────────────────────────────
  const allFlights = useMemo((): FlightOffer[] => {
    return (pagesData?.pages ?? []).flatMap((p) => [...(p.best_flights || []), ...(p.other_flights || [])]);
  }, [pagesData]);

  // ─── First page flights (for airline filtering) ────
  // Derived from the first page only to avoid showing airlines
  // from stale cached pages while useInfiniteQuery refetches.
  const firstPageFlights = useMemo((): FlightOffer[] => {
    const first = pagesData?.pages?.[0];
    return [...(first?.best_flights || []), ...(first?.other_flights || [])];
  }, [pagesData]);

  // ─── Available airlines from results ───────────────
  const availableAirlines = useMemo(() => {
    const seen = new Set<string>();
    return firstPageFlights
      .map((f) => {
        const leg = f.legs?.[0];
        if (!leg || seen.has(leg.airline_code)) return null;
        seen.add(leg.airline_code);
        return { code: leg.airline_code, name: leg.airline, logoUrl: leg.airline_logo_url };
      })
      .filter(Boolean) as Array<{ code: string; name: string; logoUrl?: string }>;
  }, [firstPageFlights]);

  // ─── Handlers ──────────────────────────────────────
  const handleSelectOutbound = useCallback(
    (offer: FlightOffer) => {
      if (!offer.departure_token || !searchRequest) return;
      setSelectedOutbound(offer);
      setOutboundToken(offer.departure_token);
      setSearchPhase('return_selection');
    },
    [searchRequest],
  );

  const handleFilterChange = useCallback((newFilters: VueloFilterValues) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleChipClick = useCallback((chipId: string) => {
    setScrollToSection(chipId);
    setModalOpen(true);
  }, []);

  const isEmpty = !isLoading && allFlights.length === 0 && searchPhase !== 'idle';
  const isRateLimited = queryError instanceof FlightApiError && queryError.code === 'RATE_LIMIT_EXCEEDED';
  const isProviderDown = queryError instanceof FlightApiError && queryError.code === 'PROVIDER_UNAVAILABLE';
  const isValidationError = queryError instanceof FlightApiError && queryError.code === 'VALIDATION_ERROR';
  const isNetworkError = queryErrorMsg && !(queryError instanceof FlightApiError);

  // ─── Active filter counts for chip badges ──────────
  const activeChipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (filters.include_airlines?.length) counts.airlines = filters.include_airlines.length;
    if (filters.stops && filters.stops !== 'any') counts.stops = 1;
    if (filters.max_price) counts.price = 1;
    if (filters.max_duration_minutes) counts.duration = 1;
    if (filters.travel_class) counts.cabin = 1;
    return counts;
  }, [filters]);

  // ─── Rendering ─────────────────────────────────────
  // Idle state: no search performed yet
  if (searchPhase === 'idle') {
    return (
      <div className="min-h-screen bg-white pt-[72px]">
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center mb-6">
            <Plane className="w-12 h-12 text-neutral-400" />
          </div>
          <h2
            suppressHydrationWarning
            className="text-2xl font-[family-name:var(--font-syne)] font-bold text-neutral-900 mb-2"
          >
            Busca tu vuelo ideal
          </h2>
          <p className="text-neutral-500 max-w-md mb-6">
            Usa la barra de búsqueda en el navbar para encontrar vuelos al mejor precio.
          </p>
          <Link
            href="/?search=vuelos"
            className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Comenzar búsqueda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Filter Bar ── */}
      <FilterBar
        activeChipCounts={activeChipCounts}
        onOpenFilterModal={() => setModalOpen(true)}
        onClearAll={handleClearFilters}
        onChipClick={handleChipClick}
      />

      {/* ── Filter Modal ── */}
      <FilterModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setScrollToSection(undefined);
        }}
        filters={filters}
        onApply={(f) => {
          handleFilterChange(f);
          setModalOpen(false);
          setScrollToSection(undefined);
        }}
        onClear={() => {
          setFilters({});
          setModalOpen(false);
          setScrollToSection(undefined);
        }}
        availableAirlines={availableAirlines}
        scrollToSection={scrollToSection}
      />

      {/* ── Main content ── */}
      <div className="pt-[calc(72px+64px+24px)]">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8">
          {/* Heading */}
          {!isLoading && (
            <div className="mb-4">
              <h1 className="font-[family-name:var(--font-syne)] text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight">
                {(() => {
                  const apiPhase = pagesData?.pages?.[0]?.phase;
                  const isOneWay = searchRequest?.trip_type === 'one_way';
                  // Derive display phase from API data directly to avoid
                  // the render-gap between isLoading→false and the sync useEffect.
                  // For one_way the API returns phase:"complete" or nothing at all.
                  if (isOneWay || apiPhase === 'complete') {
                    return `${allFlights.length} vuelos encontrados`;
                  }
                  if (apiPhase === 'return_selection') {
                    return 'Selecciona tu vuelo de vuelta';
                  }
                  if (apiPhase === 'outbound_selection') {
                    return 'Selecciona tu vuelo de ida';
                  }
                  // API phase not yet available — fall back to synced state
                  return searchPhase === 'return_selection'
                    ? 'Selecciona tu vuelo de vuelta'
                    : searchPhase === 'outbound_selection'
                      ? 'Selecciona tu vuelo de ida'
                      : `${allFlights.length} vuelos encontrados`;
                })()}
              </h1>
              {searchRequest && (
                <p className="text-sm text-neutral-500 mt-1">
                  {searchRequest.departure} &rarr; {searchRequest.arrival}
                  {searchRequest.outbound_date && (
                    <> &middot; {searchRequest.outbound_date}</>
                  )}
                  {searchRequest.trip_type === 'round_trip' && searchRequest.return_date && (
                    <> &mdash; {searchRequest.return_date}</>
                  )}
                  {searchRequest.adults && searchRequest.adults > 1 && (
                    <> &middot; {searchRequest.adults} adultos</>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Selected outbound banner */}
          {searchPhase === 'return_selection' && selectedOutbound && (
            <div className="mb-4 p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Plane className="w-4 h-4 text-neutral-900 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Vuelo de ida seleccionado</p>
                  <p className="font-medium text-neutral-900 text-sm truncate">
                    {selectedOutbound.legs?.[0]?.departure?.airport_code} &rarr;{' '}
                    {selectedOutbound.legs?.[selectedOutbound.legs.length - 1]?.arrival?.airport_code}
                    {' '}&middot;{' '}
                    {selectedOutbound.price.amount}{' '}
                    <span className={selectedOutbound.price.currency !== localeCurrency ? 'text-amber-600' : ''}>
                      {selectedOutbound.price.currency}
                    </span>
                    {selectedOutbound.price.currency !== localeCurrency && (
                      <span className="text-[11px] text-neutral-400 ml-1">
                        (precio original)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOutbound(null);
                  setOutboundToken(null);
                  setSearchPhase('outbound_selection');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline shrink-0"
              >
                Cambiar
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <FlightSkeleton />}

          {/* Error states */}
          {!isLoading && queryErrorMsg && (
            <ErrorState
              isValidationError={!!isValidationError}
              isRateLimited={!!isRateLimited}
              isProviderDown={!!isProviderDown}
              isNetworkError={!!isNetworkError}
              detail={queryError instanceof FlightApiError ? queryError.detail : undefined}
              message={queryErrorMsg}
              onRetry={() => refetch()}
            />
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Plane className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-lg font-semibold text-neutral-900 mb-1">No se encontraron vuelos</p>
              <p className="text-sm text-neutral-500 mb-6">
                Proba ajustando los filtros o cambiando las fechas.
              </p>
              <Link
                href="/?search=vuelos"
                className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Modificar búsqueda
              </Link>
            </div>
          )}

          {/* Flight list */}
          {!isLoading && !queryErrorMsg && allFlights.length > 0 && (
            <>
              <FlightList
                offers={allFlights}
                onSelectOutbound={handleSelectOutbound}
                phase={searchPhase}
                routeParams={
                  searchRequest
                    ? {
                        departure: searchRequest.departure || '',
                        arrival: searchRequest.arrival || '',
                        outbound_date: searchRequest.outbound_date || '',
                        return_date: searchRequest.return_date,
                        hl: searchRequest.hl,
                        gl: searchRequest.gl,
                      }
                    : undefined
                }
                adults={searchRequest?.adults}
                currency={searchRequest?.currency || localeCurrency}
              />

              {/* Pagination */}
              <Pagination
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onNext={fetchNextPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Fetching indicator — only shows during background re-fetch, not initial load */}
      {isFetching && !isLoading && (
        <div className="fixed top-[136px] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-neutral-200 shadow-sm">
            <span className="text-xs text-neutral-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Actualizando resultados...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Error State Component ───────────────────────────
function ErrorState({
  isValidationError,
  isRateLimited,
  isProviderDown,
  isNetworkError,
  detail,
  message,
  onRetry,
}: {
  isValidationError: boolean;
  isRateLimited: boolean;
  isProviderDown: boolean;
  isNetworkError: boolean;
  detail?: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isRateLimited ? 'bg-amber-50' : isProviderDown ? 'bg-blue-50' : 'bg-red-50'
      }`}>
        <AlertCircle className={`w-8 h-8 ${
          isRateLimited ? 'text-amber-500' : isProviderDown ? 'text-blue-500' : 'text-red-500'
        }`} />
      </div>
      <p className="text-lg font-semibold text-neutral-900 mb-1">
        {isValidationError
          ? 'Busqueda invalida'
          : isRateLimited
            ? 'Demasiadas busquedas'
            : isProviderDown
              ? 'Proveedor no disponible'
              : isNetworkError
                ? 'Error de conexion'
                : 'Error en la busqueda'}
      </p>
      <p className="text-sm text-neutral-500 mb-1 max-w-sm">
        {isValidationError
          ? detail || 'Revisa los aeropuertos y fechas.'
          : isRateLimited
            ? 'Espera unos segundos y vuelve a intentarlo.'
            : isProviderDown
              ? 'El servicio de busqueda no esta disponible. Intentalo de nuevo mas tarde.'
              : detail || message}
      </p>
      {!isValidationError && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors mt-4"
        >
          Reintentar
        </button>
      )}
      {isValidationError && (
        <Link
          href="/?search=vuelos"
          className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors mt-4 inline-block"
        >
          Volver al formulario
        </Link>
      )}
    </div>
  );
}
