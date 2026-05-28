'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, X, MapIcon, List } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import HotelCard from './components/HotelCard';
import HotelFilters, { type FilterValues } from './components/HotelFilters';
import FiltersModal from './components/FiltersModal';
import HotelDetailModal from './components/HotelDetailModal';
import { searchHotels } from '@/app/lib/api/hotels';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useLocalePreferences } from '@/hooks/useLocalePreferences';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { HOTELS_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { FrontendHotel } from '@/app/lib/types/hotel';

// ─── DYNAMIC MAP (SSR-safe) ──────────────────
const HotelMap = dynamic(() => import('./components/HotelMap'), { ssr: false });

// ─── TYPES ────────────────────────────────────
interface SearchParams {
  query: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  children_ages: number[];
  rooms: number;
  vacation_rentals?: boolean;
  currency?: string;
  gl?: string;
  hl?: string;
}

// ─── HELPERS ──────────────────────────────────
function formatDateFull(d: Date): string {
  return d.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
}

function nightsBetween(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HotelesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHotelId = searchParams.get('hotel');
  const { environment } = useEnvironment();
  const { currency: localeCurrency } = useLocalePreferences();

  // ─── INITIAL PARAMS FROM URL ──────────────────
  const q = searchParams.get('query');
  const ci = searchParams.get('check_in_date');
  const co = searchParams.get('check_out_date');
  const initialParams = (q && ci && co) ? (() => {
    const childrenCount = parseInt(searchParams.get('children') || '0', 10);
    // Read children_ages from URL if present (comma-separated), otherwise empty.
    const childrenAgesRaw = searchParams.get('children_ages');
    const childrenAges: number[] = childrenAgesRaw
      ? childrenAgesRaw.split(',').map(Number).filter(n => n > 0)
      : [];
    // Only send children if ages array matches the count — SerpAPI requires them to match.
    const effectiveChildren = childrenCount > 0 && childrenAges.length === childrenCount
      ? childrenCount
      : 0;
    return {
      query: q,
      check_in_date: ci,
      check_out_date: co,
      adults: parseInt(searchParams.get('adults') || '2', 10),
      children: effectiveChildren,
      children_ages: effectiveChildren > 0 ? childrenAges : [],
      rooms: 1,
      vacation_rentals: searchParams.get('vacation_rentals') === 'true',
      currency: searchParams.get('currency') || undefined,
      gl: searchParams.get('gl') || undefined,
      hl: searchParams.get('hl') || undefined,
    };
  })() : null;

  // ─── STATE ────────────────────────────────────
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ─── FILTER STATE ────────────────────────────
  const [filters, setFilters] = useState<FilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
    sort_by: undefined,
    brands: undefined,
    free_cancellation: undefined,
    special_offers: undefined,
    eco_certified: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
  });

  const [filterCount, setFilterCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  // ─── MOBILE MAP VIEW ─────────────────────────
  const [mapView, setMapView] = useState(false);

  // Reset map view when switching to desktop — avoids CSS conflicts
  // between the mobile overlay (fixed inset-0) and desktop sticky layout.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setMapView(false);
    };
    // Check initial state
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ─── AUTO-SEARCH on URL param arrival ─────────
  useEffect(() => {
    if (initialParams) {
      setLastSearchParams(initialParams);
      setHasSearched(true);
    } else {
      // URL changed but params are incomplete — clear stale state
      setLastSearchParams(null);
      setHasSearched(false);
    }
    // initialParams is derived from searchParams which IS in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // ─── RATE LIMIT ──────────────────────────────
  useRateLimit();

  // ─── CURRENCY SYNC: keep URL in sync with active currency selection ──
  // When the user changes currency in the navbar, update the URL so that
  // the query refetches via React Query key change AND the URL is shareable.
  useEffect(() => {
    if (!lastSearchParams || !localeCurrency) return;
    const currentCurrency = searchParams.get('currency');
    if (currentCurrency === localeCurrency) return; // already in sync

    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', localeCurrency);
    router.replace(`/hoteles?${params.toString()}`, { scroll: false });
  }, [localeCurrency, lastSearchParams, searchParams, router]);

  // ─── FILTER VERSION (changes query key when ANY filter value changes) ──
  const filterVersion = useMemo(() => {
    const f = filters;
    return JSON.stringify({
      sort_by: f.sort_by,
      rating: f.rating,
      min_price: f.min_price,
      max_price: f.max_price,
      property_types: f.property_types,
      hotel_classes: f.hotel_classes,
      amenities: f.amenities,
      brands: f.brands,
      free_cancellation: f.free_cancellation,
      special_offers: f.special_offers,
      eco_certified: f.eco_certified,
      bedrooms: f.bedrooms,
      bathrooms: f.bathrooms,
    });
  }, [filters]);

  // ─── INFINITE QUERY ──────────────────────────
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: queryKeys.hotels.search({
      query: lastSearchParams?.query,
      checkIn: lastSearchParams?.check_in_date,
      checkOut: lastSearchParams?.check_out_date,
      adults: lastSearchParams?.adults,
      children: lastSearchParams?.children,
      vacation_rentals: lastSearchParams?.vacation_rentals ?? false,
      currency: localeCurrency,
      _fv: filterVersion,
    }),
    queryFn: ({ pageParam, signal }) => {
      if (!lastSearchParams) throw new Error('No hay parámetros de búsqueda');
      return searchHotels(
        {
          ...lastSearchParams,
          currency: localeCurrency || lastSearchParams.currency,
          page_token: (pageParam as string | null) ?? null,
        },
        filters,
        signal,
      );
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination?.next_token ?? undefined,
    enabled: !!lastSearchParams,
    staleTime: HOTELS_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Keep refetchOnMount true (default) — needed for navigation back to this page
  });

  const queryErrorMsg = queryError instanceof Error ? queryError.message : null;

  const displayedHotels = useMemo(() => {
    const all = (pagesData?.pages ?? []).flatMap((p) => p.properties);
    const seen = new Set<string>();
    return all.filter((h) => seen.has(h.id) ? false : !!seen.add(h.id));
  }, [pagesData]) as FrontendHotel[];

  // Debug: log API response state
  useEffect(() => {
    const firstPage = pagesData?.pages?.[0];
    if (firstPage) {
      console.log('🔍 [Hoteles] API response:', {
        type: firstPage.type,
        results_state: firstPage.results_state,
        propertyCount: displayedHotels.length,
        hasMore: firstPage.pagination?.has_more,
        fromCache: firstPage.from_cache,
        error: queryErrorMsg,
        isLoading,
        isFetching,
        hasSearched,
        lastParams: lastSearchParams ? {
          query: lastSearchParams.query,
          vacation_rentals: lastSearchParams.vacation_rentals,
          dates: `${lastSearchParams.check_in_date} → ${lastSearchParams.check_out_date}`,
        } : null,
      });
    }
  }, [pagesData, queryErrorMsg, isLoading, isFetching, hasSearched, lastSearchParams, displayedHotels.length]);

  const totalResults = useMemo(() => {
    const firstPage = pagesData?.pages?.[0];
    if (!firstPage) return undefined;
    return firstPage.properties.length > 0 ? displayedHotels.length : 0;
  }, [pagesData, displayedHotels.length]);

  const nonMatching = pagesData?.pages?.[0]?.results_state === 'non_matching_only';
  const resultsLabel = pagesData?.pages?.[0]?.type === 'vacation_rentals' ? 'alquileres' : 'alojamientos';

  // ─── MAP CENTER ─────────────────────────────────
  const mapCenter = useMemo(() => {
    if (displayedHotels.length > 0) {
      const coords = displayedHotels
        .filter(h => h.location?.coordinates)
        .map(h => h.location!.coordinates) as { lat: number; lng: number }[];
      if (coords.length > 0) {
        const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
        return { lat: avgLat, lng: avgLng };
      }
    }
    return environment?.location
      ? { lat: environment.location.latitude, lng: environment.location.longitude }
      : { lat: 40.4168, lng: -3.7038 }; // Madrid as fallback
  }, [displayedHotels, environment?.location]);

  // ─── SELECTED HOTEL ──────────────────────────
  const selectedHotel = selectedHotelId
    ? displayedHotels.find((h) => h.id === selectedHotelId) ?? null
    : null;

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('hotel');
    const queryString = params.toString();
    router.push(`/hoteles${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // ─── HANDLERS ────────────────────────────────
  const handleFilterChange = useCallback((newFilters: FilterValues, newSortBy?: string, count = 0) => {
    setFilters(newFilters);
    setSortBy(newSortBy);
    setFilterCount(count);
  }, []);

  const handleModalApply = useCallback((draft: FilterValues) => {
    setFilters(draft);
    let c = 0;
    if (draft.min_price != null) c++;
    if (draft.max_price != null) c++;
    if (draft.rating != null) c++;
    if (draft.property_types?.length) c++;
    if (draft.hotel_classes?.length) c++;
    if (draft.amenities?.length) c++;
    if (draft.free_cancellation) c++;
    if (draft.special_offers) c++;
    if (draft.eco_certified) c++;
    if ((draft.bedrooms ?? 0) > 0) c++;
    if ((draft.bathrooms ?? 0) > 0) c++;
    setFilterCount(c);
  }, []);

  const handleModalClear = useCallback(() => {
    setFilterCount(0);
  }, []);

  // ─── DERIVED ────────────────────────────────
  const checkInDate = lastSearchParams?.check_in_date ? new Date(lastSearchParams.check_in_date) : null;
  const checkOutDate = lastSearchParams?.check_out_date ? new Date(lastSearchParams.check_out_date) : null;
  const guestTotal = (lastSearchParams?.adults ?? 0) + (lastSearchParams?.children ?? 0);
  const nights = lastSearchParams ? nightsBetween(lastSearchParams.check_in_date, lastSearchParams.check_out_date) : 1;

  return (
    <div className="min-h-screen bg-white">
      {/* ── FILTER BAR ── */}
      <HotelFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenModal={() => setModalOpen(true)}
        sortBy={sortBy}
        filterCount={filterCount}
        vacationRentals={lastSearchParams?.vacation_rentals ?? false}
        onVacationRentalsChange={(vr) => {
          // Reset all filters when switching between Hotels and Vacation Rentals —
          // amenity IDs, property types, and brands differ per mode and sending
          // Hotels-era filter values to the VR endpoint causes 502 errors.
          setFilters({
            min_price: null,
            max_price: null,
            rating: null,
            property_types: [],
            hotel_classes: [],
            amenities: [],
            sort_by: undefined,
            brands: undefined,
            free_cancellation: undefined,
            special_offers: undefined,
            eco_certified: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
          });
          setFilterCount(0);
          setSortBy(undefined);
          if (lastSearchParams) {
            setLastSearchParams({ ...lastSearchParams, vacation_rentals: vr });
          }
          // Sync vacation_rentals to URL so card clicks preserve the mode.
          // (Bug fix: previously it was only in local state, so clicking a result
          // card re-derived initialParams from the URL — which lacked the param —
          // causing the mode to silently switch back to Hotels.)
          const params = new URLSearchParams(searchParams.toString());
          if (vr) {
            params.set('vacation_rentals', 'true');
          } else {
            params.delete('vacation_rentals');
          }
          router.replace(`/hoteles?${params.toString()}`, { scroll: false });
        }}
      />

      {/* ── FILTERS MODAL ── */}
      <FiltersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        filters={filters}
        onApply={handleModalApply}
        onClear={handleModalClear}
        vacationRentals={lastSearchParams?.vacation_rentals ?? false}
      />

      {/* ── RESULTS HEADING ── */}
      <div className="pt-[128px] lg:pt-[136px]">
        <div className="px-4 lg:px-8 pb-4">
          {hasSearched && !isLoading && (
            <h1 className="font-display text-xl lg:text-2xl font-bold text-[#0A0A0A] tracking-tight">
              {nonMatching
                ? 'No encontramos resultados exactos'
                : totalResults
                  ? `Más de ${totalResults} ${resultsLabel}`
                  : 'Sin resultados'}
            </h1>
          )}
          {hasSearched && lastSearchParams && (
            <p className="text-sm text-[#6A7282] mt-1">
              {lastSearchParams.query}
              {checkInDate && checkOutDate && (
                <> · {formatDateFull(checkInDate)} — {formatDateFull(checkOutDate)}</>
              )}
              {guestTotal > 0 && <> · {guestTotal} {guestTotal === 1 ? 'huésped' : 'huéspedes'}</>}
            </p>
          )}
          {isFetching && hasSearched && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#6A7282] mt-2">
              <span className="w-3.5 h-3.5 border-2 border-[#6A7282] border-t-transparent rounded-full animate-spin" />
              Buscando{lastSearchParams?.vacation_rentals ? ' alquileres' : ' hoteles'}...
            </div>
          )}
        </div>

        {/* ── MAIN SPLIT LAYOUT ── */}
        <div className="lg:grid lg:grid-cols-[minmax(0,740px)_1fr] lg:min-h-[calc(100vh-200px)]">
          {/* LEFT: Results — hidden on mobile when showing map */}
          <div className={`px-4 lg:px-8 pb-16 ${mapView ? 'hidden lg:block' : ''}`}>
            {!hasSearched ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-6">
                  <MapPin className="w-12 h-12 text-[#767676]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#0A0A0A] mb-2" suppressHydrationWarning>
                  Buscá tu alojamiento ideal
                </h2>
                <p className="text-[#6A7282] max-w-md">
                  Usá la barra de búsqueda para encontrar hoteles, resorts y alquileres vacacionales al mejor precio.
                </p>
              </div>
            ) : isLoading ? (
              /* Loading skeletons */
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
            ) : queryErrorMsg ? (
              /* Error state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-[#0A0A0A] mb-1">Error en la búsqueda</p>
                <p className="text-sm text-[#6A7282] mb-1 max-w-sm">{queryErrorMsg}</p>
                {queryError instanceof Error && (
                  <details className="text-xs text-[#767676] mb-4 max-w-sm text-left">
                    <summary className="cursor-pointer hover:text-[#6A7282]">Detalles técnicos</summary>
                    <pre className="mt-2 p-2 bg-[#F5F5F5] rounded-lg overflow-auto text-[11px]">
                      {(queryError as Error).stack || (queryError as Error).message}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => lastSearchParams && setLastSearchParams({ ...lastSearchParams })}
                  className="px-6 py-2.5 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#262626] transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : displayedHotels.length === 0 ? (
              /* No results */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-[#767676]" />
                </div>
                <p className="text-lg font-semibold text-[#0A0A0A] mb-1">No se encontraron resultados</p>
                <p className="text-sm text-[#6A7282]">Probá ajustando los filtros o cambiando el destino.</p>
              </div>
            ) : (
              <>
                {/* Non-matching banner */}
                {nonMatching && (
                  <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    No encontramos resultados exactos con tus filtros. Mostrando los alojamientos más cercanos.
                  </div>
                )}

                {/* Results grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedHotels.map((hotel: FrontendHotel, idx: number) => (
                    <div
                      key={hotel.id}
                      className="animate-card-enter"
                      style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
                    >
                      <HotelCard
                        hotel={hotel}
                        nights={nights}
                        currency={lastSearchParams?.currency}
                      />
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasNextPage && (
                  <div className="flex justify-center py-10">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 rounded-full border-2 border-[#0A0A0A] text-[#0A0A0A] text-sm font-semibold hover:bg-[#0A0A0A] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isFetchingNextPage ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Cargando...
                        </span>
                      ) : (
                        'Cargar más resultados'
                      )}
                    </button>
                  </div>
                )}

                {/* No more results indicator */}
                {!hasNextPage && displayedHotels.length > 0 && (
                  <div className="flex justify-center py-6">
                    <p className="text-sm text-[#6A7282]">No hay más resultados</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Map — desktop inline (sticky), mobile overlay (fullscreen) */}
          <div
            className={`${
              mapView
                ? 'fixed inset-0 top-[128px] z-30 lg:hidden'
                : 'hidden lg:block'
            } lg:sticky lg:top-[136px] h-[calc(100vh-128px)] lg:h-[calc(100vh-136px)]`}
          >
            {/* Close overlay button (mobile only) */}
            {mapView && (
              <button
                onClick={() => setMapView(false)}
                className="lg:hidden absolute top-3 right-3 z-[31] w-9 h-9 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar mapa"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
            {(hasSearched && displayedHotels.length > 0) || isLoading ? (
              <HotelMap
                key={mapView ? 'overlay' : 'inline'}
                hotels={isLoading ? [] : displayedHotels}
                center={mapCenter}
              />
            ) : (
              <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                <p className="text-[#767676] text-sm">Mapa disponible al buscar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE MAP/LIST TOGGLE ── */}
      {(hasSearched && displayedHotels.length > 0) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[35] lg:hidden">
          <button
            onClick={() => setMapView(!mapView)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#111] text-white text-[14px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.22)] hover:bg-[#262626] transition-all cursor-pointer active:scale-95"
          >
            {mapView ? (
              <>
                <List className="w-[17px] h-[17px]" />
                Mostrar lista
              </>
            ) : (
              <>
                <MapIcon className="w-[17px] h-[17px]" />
                Mostrar mapa
              </>
            )}
          </button>
        </div>
      )}

      {/* ── FETCHING INDICATOR ── */}
      {isFetching && hasSearched && !isLoading && (
        <div className="fixed top-[128px] lg:top-[136px] left-0 right-0 z-30 flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-[#e8e8e8] shadow-sm">
            <span className="text-xs text-[#6A7282] flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-[#6A7282] border-t-transparent rounded-full animate-spin" />
              Actualizando resultados...
            </span>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
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
