// app/vuelos/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, MapPin, SlidersHorizontal, AlertCircle, Shield, Sparkles, Clock, Filter, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInfiniteQuery } from '@tanstack/react-query';

import FlightSearchForm from './components/FlightSearchForm';
import FlightList from './components/FlightList';
import FlightFilters, { FlightFiltersState } from './components/FlightFilters';
import FlightDetailModal from './components/FlightDetailModal';
import { goToCheckout } from '@/app/lib/utils/checkoutUtils';

import { searchFlights, getFlightDetails } from '@/app/lib/api/flights';
import type {
  FlightSearchResponse,
  FlightSearchRequest,
  FlightOfferUI,
  FlightDetailsResponse
} from '@/app/lib/types/flight';
import { transformFlightSearchResponse } from '@/app/lib/utils/flightTransformers';
import { useRateLimit } from '@/hooks/useRateLimit';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { FLIGHTS_STALE_TIME } from '@/app/lib/queries/staleTimes';

type SearchPhase = 'initial' | 'outbound_selection' | 'return_selection' | 'complete';

interface SearchState {
  phase: SearchPhase;
  results: FlightOfferUI[];
  isLoading: boolean;
  error: string | null;
  request: FlightSearchRequest | null;
}

type SortCriteria = 'none' | 'price_asc' | 'duration_asc' | 'departure_asc';

export default function FlightsPage(): React.ReactElement {
  const router = useRouter();
  const { isAuthenticated, context } = useAuth();

  const [searchRequest, setSearchRequest] = useState<FlightSearchRequest | null>(null);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('initial');

  const [selectedOutbound, setSelectedOutbound] = useState<FlightOfferUI | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightOfferUI | null>(null);

  const [tempFilters, setTempFilters] = useState<FlightFiltersState>({
    stops: 'any',
    sort_by: 'top',
    emissions_filter: false,
    bags: 0,
  });

  const [appliedFilters, setAppliedFilters] = useState<FlightFiltersState>({
    stops: 'any',
    sort_by: 'top',
    emissions_filter: false,
    bags: 0,
  });

  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('none');
  const [appliedSort, setAppliedSort] = useState<SortCriteria>('none');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedOfferForModal, setSelectedOfferForModal] = useState<FlightOfferUI | null>(null);
  const [flightDetails, setFlightDetails] = useState<FlightDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [showAuthError, setShowAuthError] = useState<boolean>(false);

  // ---- Rate limit (useRateLimit hook) ----
  const { info: rateLimitInfo, isBlocked: rateLimitBlocked, secondsLeft: rateLimitCountdown } = useRateLimit();

  // ---- Infinite Query for flight search ----
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error: queryError,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.flights.search({
      origin: searchRequest?.departure || undefined,
      destination: searchRequest?.arrival || undefined,
      departureDate: searchRequest?.outbound_date || undefined,
      returnDate: searchRequest?.return_date || undefined,
      adults: searchRequest?.adults,
      tripType: searchRequest?.trip_type,
    }),
    queryFn: ({ pageParam, signal }) =>
      searchFlights(
        { ...searchRequest!, cursor: pageParam || undefined },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FlightSearchResponse) =>
      lastPage.meta?.next_cursor ?? undefined,
    enabled: !!searchRequest,
    staleTime: FLIGHTS_STALE_TIME,
  });

  const queryErrorMsg = queryError instanceof Error ? queryError.message : null;

  // ---- Computed: flatten all pages into flat offer list ----
  const allOffers = useMemo((): FlightOfferUI[] => {
    return (pagesData?.pages ?? []).flatMap((p: FlightSearchResponse) =>
      transformFlightSearchResponse(p),
    );
  }, [pagesData]);

  // If the form's onSearch provided a phase, use it; otherwise derive from first page
  useEffect(() => {
    if (searchPhase === 'initial' && pagesData?.pages[0]?.phase) {
      setSearchPhase(pagesData.pages[0].phase);
    }
  }, [pagesData, searchPhase]);

  const effectiveSearchState: SearchState = useMemo(
    () => ({
      phase: searchPhase,
      results: [],
      isLoading,
      error: queryErrorMsg,
      request: searchRequest,
    }),
    [searchPhase, isLoading, queryErrorMsg, searchRequest],
  );

  const filteredResults = useMemo((): FlightOfferUI[] => {
    if (!allOffers.length) return [];
    return allOffers.filter((offer: FlightOfferUI) => {
      if (appliedFilters.max_price && offer.price.total > appliedFilters.max_price) return false;
      return true;
    });
  }, [allOffers, appliedFilters]);

  const sortedResults = useMemo((): FlightOfferUI[] => {
    if (!filteredResults.length || appliedSort === 'none') return filteredResults;

    const sorted = [...filteredResults];

    switch (appliedSort) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price.total - b.price.total);

      case 'duration_asc':
        return sorted.sort((a, b) => {
          const durationA = a.segments[0]?.totalDuration || 0;
          const durationB = b.segments[0]?.totalDuration || 0;
          return durationA - durationB;
        });

      case 'departure_asc':
        return sorted.sort((a, b) => {
          const timeA = a.segments[0]?.legs[0]?.origin.datetime || '';
          const timeB = b.segments[0]?.legs[0]?.origin.datetime || '';
          return timeA.localeCompare(timeB);
        });

      default:
        return sorted;
    }
  }, [filteredResults, appliedSort]);

  const availableAirlines = useMemo((): Array<{code: string; name: string; logoUrl?: string}> => {
    if (!allOffers.length) return [];
    const uniqueCodes = Array.from(new Set(allOffers.map((r: FlightOfferUI) => r.airline.code)));
    return uniqueCodes.map((code: string) => ({
      code,
      name: allOffers.find((r: FlightOfferUI) => r.airline.code === code)?.airline.name || code,
      logoUrl: allOffers.find((r: FlightOfferUI) => r.airline.code === code)?.airline.logoUrl
    }));
  }, [allOffers]);

  const handleApplySort = useCallback((): void => {
    setAppliedSort(sortCriteria);
  }, [sortCriteria]);

  const handleApplyFilters = useCallback((): void => {
    setAppliedFilters(tempFilters);

    if (searchRequest) {
      const filteredRequest: FlightSearchRequest = {
        ...searchRequest,
        stops: tempFilters.stops,
        sort_by: tempFilters.sort_by,
        emissions_filter: tempFilters.emissions_filter,
        bags: tempFilters.bags,
        max_price: tempFilters.max_price,
        max_duration_minutes: tempFilters.max_duration_minutes,
        include_airlines: tempFilters.include_airlines,
        exclude_airlines: tempFilters.exclude_airlines,
        exclude_connections: tempFilters.exclude_connections,
        layover_duration: tempFilters.layover_duration,
      };
      setSearchRequest(filteredRequest);
    }
  }, [tempFilters, searchRequest]);

  const handleSelectOutbound = useCallback((offer: FlightOfferUI): void => {
    if (!searchRequest) return;
    setSelectedOutbound(offer);

    const returnRequest: FlightSearchRequest = {
      ...searchRequest,
      outbound_selection_token: offer.offerId,
    };

    setSearchRequest(returnRequest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchRequest]);

  const handleSelectFlight = useCallback(async (offer: FlightOfferUI): Promise<void> => {
    if (effectiveSearchState.phase === 'return_selection') {
      setSelectedReturn(offer);
    } else {
      setSelectedOutbound(offer);
    }

    setSelectedOfferForModal(offer);
    setIsModalOpen(true);

    if (offer.offerId && !offer.isOutboundPhase) {
      setIsLoadingDetails(true);
      try {
        const details: FlightDetailsResponse = await getFlightDetails(
          offer.offerId,
          searchRequest?.adults || 1,
          context?.location?.currency || 'EUR',
          searchRequest ? {
            departure: searchRequest.departure || '',
            arrival: searchRequest.arrival || '',
            outbound_date: searchRequest.outbound_date || '',
            return_date: searchRequest.return_date,
          } : undefined
        );
        setFlightDetails(details);
      } catch (e: unknown) {
        console.error('Error al cargar detalles del vuelo:', e);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  }, [effectiveSearchState.phase, searchRequest]);

  const handleShowDetails = useCallback((offer: FlightOfferUI): void => {
    setSelectedOfferForModal(offer);
    setIsModalOpen(true);
  }, []);

  const handleConfirmSelection = useCallback((offer: FlightOfferUI): void => {
    if (!isAuthenticated) {
      setShowAuthError(true);
      setTimeout(() => {
        setShowAuthError(false);
        router.push('/auth/login');
      }, 2000);
      return;
    }

    if (effectiveSearchState.phase === 'outbound_selection') {
      setSelectedOutbound(offer);

      if (!searchRequest) return;

      const returnRequest: FlightSearchRequest = {
        ...searchRequest,
        outbound_selection_token: offer.offerId,
      };

      setSearchRequest(returnRequest);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsModalOpen(false);
      return;
    }

    const isReturnPhase = effectiveSearchState.phase === 'return_selection';

    const outboundDate: string = isReturnPhase && selectedOutbound
    ? selectedOutbound.segments[0]?.legs[0]?.origin.datetime?.split(' ')[0] || ''
    : offer.segments[0]?.legs[0]?.origin.datetime?.split(' ')[0] || '';

    const returnDate: string | undefined = isReturnPhase && selectedReturn
    ? selectedReturn.segments[0]?.legs[0]?.origin.datetime?.split(' ')[0]
    : (searchRequest?.return_date || undefined);

    const adults = searchRequest?.adults || 1;
    const children = searchRequest?.children || 0;

    const totalPrice = isReturnPhase && selectedOutbound
    ? selectedOutbound.price.total + offer.price.total
    : offer.price.total;

    const checkoutData = {
      type: 'vuelo' as const,
      item_id: isReturnPhase && selectedOutbound ? `${selectedOutbound.id}_${offer.id}` : offer.id,
      item_name: isReturnPhase && selectedOutbound
        ? `${selectedOutbound.airline.name} + ${offer.airline.name} - Ida y vuelta`
        : `${offer.airline.name} - Vuelo ${offer.segments[0]?.legs[0]?.flightNumber || ''}`,
      price_per_unit: offer.price.total,
      total_price: totalPrice,
      currency: offer.price.currency,
      adults: adults,
      children: children,
      infants: (searchRequest?.infants_in_seat || 0) + (searchRequest?.infants_on_lap || 0),
      check_in: outboundDate,
      check_out: returnDate || outboundDate,
      departure: isReturnPhase && selectedOutbound
        ? selectedOutbound.segments[0]?.legs[0]?.origin.code
        : offer.segments[0]?.legs[0]?.origin.code,
      arrival: isReturnPhase && selectedOutbound
        ? selectedOutbound.segments[0]?.legs[0]?.destination.code
        : offer.segments[0]?.legs[0]?.destination.code,
      outbound_date: outboundDate,
      return_date: returnDate,
      airline: isReturnPhase && selectedOutbound
        ? `${selectedOutbound.airline.name} / ${offer.airline.name}`
        : offer.airline.name,
      image: selectedOutbound?.airline.logoUrl || offer.airline.logoUrl,
      cancellation_policy: 'Consulta condiciones de cancelación con la aerolínea',
    };

    goToCheckout(router, checkoutData);
  }, [isAuthenticated, router, selectedReturn, searchRequest, effectiveSearchState.phase, selectedOutbound]);

  const handleReset = useCallback((): void => {
    setSearchRequest(null);
    setSearchPhase('initial');
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setFlightDetails(null);
    setSortCriteria('none');
    setAppliedSort('none');

    const resetFilters: FlightFiltersState = {
      stops: 'any',
      sort_by: 'top',
      emissions_filter: false,
      bags: 0,
      max_price: null,
      max_duration_minutes: null,
      include_airlines: undefined,
      exclude_airlines: undefined,
      exclude_connections: undefined,
      layover_duration: undefined,
    };

    setTempFilters(resetFilters);
    setAppliedFilters(resetFilters);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto p-3 md:p-4 lg:p-6">

        {showAuthError && (
          <div className="fixed top-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-right">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Inicia sesión para continuar</p>
              <p className="text-sm opacity-90">Redirigiendo...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-6">

          {/* COLUMNA IZQUIERDA - Más compacta */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            {/* Logo más pequeño */}
            <div className="border-4 border-[#c54141] rounded-2xl p-3 bg-white shadow-lg">
              <img
                src="/logoMostrar.png"
                alt="ProacTrip Logo"
                className="w-full h-28 md:h-32 lg:h-40 object-contain"
              />
            </div>

            {/* BLOQUE DE CONFIANZA - Compacto */}
            {effectiveSearchState.phase === 'initial' && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">¿Por qué volar con ProacTrip?</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">Precios finales</p>
                      <p className="text-[10px] text-gray-500 leading-tight">Sin cargos ocultos.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">Smart Search</p>
                      <p className="text-[10px] text-gray-500 leading-tight">Mejores combinaciones.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">24/7 Soporte</p>
                      <p className="text-[10px] text-gray-500 leading-tight">Siempre contigo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            {effectiveSearchState.phase !== 'initial' && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <SlidersHorizontal className="w-4 h-4 text-[#c54141]" />
                    Filtrar por
                  </h3>
                  <button
                    onClick={() => {
                      const reset: FlightFiltersState = {
                        stops: 'any',
                        sort_by: 'top',
                        emissions_filter: false,
                        bags: 0,
                        max_price: null,
                        max_duration_minutes: null,
                        include_airlines: undefined,
                        exclude_airlines: undefined,
                        exclude_connections: undefined,
                        layover_duration: undefined,
                      };
                      setTempFilters(reset);
                      setAppliedFilters(reset);
                    }}
                    className="text-xs text-[#c54141] hover:text-[#a03535] font-medium"
                  >
                    Limpiar
                  </button>
                </div>

                <FlightFilters
                  filters={tempFilters}
                  onChange={setTempFilters}
                  availableAirlines={availableAirlines}
                  totalResults={sortedResults.length}
                  currency={context?.location?.currency || 'EUR'}
                />

                <button
                  onClick={handleApplyFilters}
                  className="w-full mt-4 py-2 bg-[#c54141] text-white font-medium rounded-lg hover:bg-[#a03535] transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
                >
                  <Filter className="w-4 h-4" />
                  Aplicar filtros
                </button>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div className="col-span-12 lg:col-span-9 space-y-4">

            <div className="mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Buscar Vuelos</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Encuentra los mejores vuelos al mejor precio</p>
            </div>

            <FlightSearchForm
              onSearch={(response: FlightSearchResponse, request: FlightSearchRequest): void => {
                // The form already did the search internally — use results to set
                // the phase immediately while useInfiniteQuery catches up.
                setSearchRequest(request);
                setSearchPhase(response.phase);
                setSortCriteria('none');
                setAppliedSort('none');
              }}
              searchBlocked={rateLimitBlocked}
              initialValues={context?.location ? {
                gl: context.location.country_code || 'ES',
                hl: context.location.language || 'es',
                currency: context.location.currency || 'EUR',
              } : undefined}
            />

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
                    El botón de búsqueda se habilitará automáticamente.
                  </p>
                </div>
              </div>
            )}

            {effectiveSearchState.phase === 'return_selection' && selectedOutbound && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Plane className="w-5 h-5 text-[#c54141] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Vuelo de ida seleccionado</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {selectedOutbound.segments[0]?.legs[0]?.origin.code} → {selectedOutbound.segments[0]?.legs[0]?.destination.code} · {selectedOutbound.price.total}€
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs md:text-sm text-gray-500 hover:text-[#c54141] underline shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {effectiveSearchState.phase !== 'initial' ? (
              <>
                {/* Header responsive */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                      {effectiveSearchState.phase === 'outbound_selection'
                        ? 'Selecciona tu vuelo de ida'
                        : effectiveSearchState.phase === 'return_selection'
                          ? 'Selecciona tu vuelo de vuelta'
                          : `${sortedResults.length} vuelos encontrados`
                      }
                    </h3>
                    {searchRequest && (
                      <p className="text-gray-500 text-xs md:text-sm flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {searchRequest.departure} → {searchRequest.arrival}
                      </p>
                    )}
                  </div>

                </div>

                {/* Empty results: explicit page-level feedback */}
                {sortedResults.length === 0 && !isLoading && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-orange-900 mb-2">Sin resultados</h3>
                    <p className="text-sm text-orange-700">
                      No encontramos vuelos con esos criterios. Probá cambiando las fechas, los filtros o los aeropuertos.
                    </p>
                  </div>
                )}

                <FlightList
                  offers={sortedResults}
                  isLoading={isLoading}
                  error={queryErrorMsg}
                  onRetry={(): void => {
                    refetch();
                  }}
                  onSelect={effectiveSearchState.phase === 'outbound_selection' ? handleSelectOutbound : handleSelectFlight}
                  onShowDetails={handleShowDetails}
                  hasNext={hasNextPage}
                  onLoadMore={() => fetchNextPage()}
                  isLoadingMore={isFetchingNextPage}
                />
              </>
            ) : null}
          </div>

        </div>
      </div>

      <FlightDetailModal
        offer={selectedOfferForModal}
        flightDetails={flightDetails}
        isOpen={isModalOpen}
        onClose={(): void => {
          setIsModalOpen(false);
          setFlightDetails(null);
        }}
        onSelect={handleConfirmSelection}
      />

      {isLoadingDetails && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c54141]"></div>
            <span className="text-gray-700 font-medium">Cargando detalles...</span>
          </div>
        </div>
      )}
    </div>
  );
}
