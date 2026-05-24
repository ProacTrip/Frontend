'use client';

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, X, Calendar, Users, Search } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import HotelCard from './components/HotelCard';
import HotelFilters, { type FilterValues } from './components/HotelFilters';
import HotelDetailModal from './components/HotelDetailModal';
import { searchHotels } from '@/app/lib/api/hotels';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useEnvironment } from '@/hooks/useEnvironment';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { HOTELS_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { FrontendHotel } from '@/app/lib/types/hotel';
import LocationCombobox from '@/components/shared/LocationCombobox';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestCounter, { type GuestType } from '@/components/shared/GuestCounter';

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
}

// ─── HELPERS ──────────────────────────────────
function formatDateFull(d: Date): string {
  return d.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
}

function nightsBetween(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function HotelesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHotelId = searchParams.get('hotel');
  const { environment } = useEnvironment();

  // ─── INITIAL PARAMS FROM URL ──────────────────
  const initialParams = useMemo(() => {
    const q = searchParams.get('query');
    const ci = searchParams.get('check_in_date');
    const co = searchParams.get('check_out_date');
    if (!q || !ci || !co) return null;
    return {
      query: q,
      check_in_date: ci,
      check_out_date: co,
      adults: parseInt(searchParams.get('adults') || '2', 10),
      children: parseInt(searchParams.get('children') || '0', 10),
      children_ages: [],
      rooms: parseInt(searchParams.get('rooms') || '1', 10),
      vacation_rentals: searchParams.get('vacation_rentals') === 'true',
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── STATE ────────────────────────────────────
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(initialParams);
  const [hasSearched, setHasSearched] = useState(!!initialParams);
  const [editingField, setEditingField] = useState<'dest'|'dates'|'guests'|null>(null);

  // ─── SEARCH BAR EDIT STATE ────────────────────
  const [editDest, setEditDest] = useState(lastSearchParams?.query ?? '');
  const [editDateStart, setEditDateStart] = useState<Date | null>(
    lastSearchParams?.check_in_date ? new Date(lastSearchParams.check_in_date) : null,
  );
  const [editDateEnd, setEditDateEnd] = useState<Date | null>(
    lastSearchParams?.check_out_date ? new Date(lastSearchParams.check_out_date) : null,
  );
  const [editAdults, setEditAdults] = useState(lastSearchParams?.adults ?? 2);
  const [editChildren, setEditChildren] = useState(lastSearchParams?.children ?? 0);

  const applySearchBarEdit = useCallback(() => {
    if (!lastSearchParams) return;
    const newParams: SearchParams = {
      ...lastSearchParams,
      query: editDest,
      check_in_date: editDateStart?.toISOString().split('T')[0] ?? lastSearchParams.check_in_date,
      check_out_date: editDateEnd?.toISOString().split('T')[0] ?? lastSearchParams.check_out_date,
      adults: editAdults,
      children: editChildren,
    };
    setLastSearchParams(newParams);
    setEditingField(null);
    router.push(`/hoteles?query=${encodeURIComponent(editDest)}&check_in_date=${newParams.check_in_date}&check_out_date=${newParams.check_out_date}&adults=${editAdults}&children=${editChildren}`, { scroll: false });
  }, [lastSearchParams, editDest, editDateStart, editDateEnd, editAdults, editChildren, router]);

  const searchBarGuests: GuestType[] = [
    { key: 'adults', label: 'Adultos', sublabel: '18 años o más', value: editAdults, min: 1, max: 9, onChange: (_, v) => setEditAdults(v) },
    { key: 'children', label: 'Niños', sublabel: '2–17 años', value: editChildren, min: 0, max: 6, onChange: (_, v) => setEditChildren(v) },
  ];

  const [filters, setFilters] = useState<FilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
  });

  const [filterCount, setFilterCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  // ─── AUTO-SEARCH on URL param arrival ─────────
  const hasAutoSearched = useRef(false);
  useEffect(() => {
    if (initialParams && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
      setLastSearchParams(initialParams);
      setHasSearched(true);
    }
  }, [initialParams?.query, initialParams?.check_in_date, initialParams?.check_out_date]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── RATE LIMIT ──────────────────────────────
  useRateLimit();

  // ─── INFINITE QUERY ──────────────────────────
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
    queryFn: ({ pageParam, signal }) => {
      if (!lastSearchParams) throw new Error('No hay parámetros de búsqueda');
      return searchHotels(
        {
          ...lastSearchParams,
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
  });

  const queryErrorMsg = queryError instanceof Error ? queryError.message : null;

  const displayedHotels = useMemo(() => {
    return (pagesData?.pages ?? []).flatMap((p) => p.properties);
  }, [pagesData]) as FrontendHotel[];

  const totalResults = useMemo(() => {
    const firstPage = pagesData?.pages?.[0];
    if (!firstPage) return undefined;
    return firstPage.properties.length > 0 ? displayedHotels.length : 0;
  }, [pagesData, displayedHotels.length]);

  const nonMatching = pagesData?.pages?.[0]?.results_state === 'non_matching_only';
  const resultsLabel = pagesData?.pages?.[0]?.type === 'vacation_rentals' ? 'alquileres' : 'alojamientos';

  // ─── SELECTED HOTEL ──────────────────────────
  const selectedHotel = selectedHotelId
    ? displayedHotels.find((h) => h.id === selectedHotelId) ?? null
    : null;

  const handleCloseModal = () => {
    router.push('/hoteles', { scroll: false });
  };

  // ─── HANDLERS ────────────────────────────────
  const handleFilterChange = useCallback((newFilters: FilterValues, newSortBy?: string, count = 0) => {
    setFilters(newFilters);
    setSortBy(newSortBy);
    setFilterCount(count);
    if (lastSearchParams) setLastSearchParams({ ...lastSearchParams });
  }, [lastSearchParams]);

  // ─── DERIVED ────────────────────────────────
  const checkInDate = lastSearchParams?.check_in_date ? new Date(lastSearchParams.check_in_date) : null;
  const checkOutDate = lastSearchParams?.check_out_date ? new Date(lastSearchParams.check_out_date) : null;
  const guestTotal = (lastSearchParams?.adults ?? 0) + (lastSearchParams?.children ?? 0);
  const nights = lastSearchParams ? nightsBetween(lastSearchParams.check_in_date, lastSearchParams.check_out_date) : 1;

  return (
    <div className="min-h-screen bg-white">
      {/* ── FILTER BAR ── */}

      {/* ── COMPACT SEARCH SUMMARY ── */}
      {hasSearched && lastSearchParams && (
        <div className="fixed top-[72px] left-0 right-0 z-30 bg-white border-b border-[#E5E7EB]">
          <div className="px-4 lg:px-8 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Destination chip */}
              <button
                onClick={() => setEditingField(editingField === 'dest' ? null : 'dest')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  editingField === 'dest' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-[#0A0A0A] hover:bg-[#E5E7EB]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {lastSearchParams.query}
              </button>

              <span className="text-[#D1D5DB]">·</span>

              {/* Dates chip */}
              <button
                onClick={() => setEditingField(editingField === 'dates' ? null : 'dates')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  editingField === 'dates' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-[#0A0A0A] hover:bg-[#E5E7EB]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {checkInDate && checkOutDate
                  ? `${formatDateFull(checkInDate).split(' ')[1]} ${checkInDate.getDate()} - ${formatDateFull(checkOutDate).split(' ')[1]} ${checkOutDate.getDate()}`
                  : 'Fechas'}
              </button>

              <span className="text-[#D1D5DB]">·</span>

              {/* Guests chip */}
              <button
                onClick={() => setEditingField(editingField === 'guests' ? null : 'guests')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  editingField === 'guests' ? 'bg-[#0A0A0A] text-white' : 'bg-[#F5F5F5] text-[#0A0A0A] hover:bg-[#E5E7EB]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                {guestTotal} {guestTotal === 1 ? 'huésped' : 'huéspedes'}
              </button>

              {/* Search button to apply edits */}
              {editingField && (
                <button
                  onClick={applySearchBarEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#262626] transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Buscar
                </button>
              )}
            </div>

            {/* Inline pickers */}
            {editingField === 'dest' && (
              <div className="mt-2 max-w-md">
                <LocationCombobox
                  value={editDest}
                  onChange={(v) => { setEditDest(v); }}
                  label="Destino"
                  placeholder="¿Adónde vas?"
                />
              </div>
            )}

            {editingField === 'dates' && (
              <div className="mt-2 flex justify-center">
                <DateRangePicker
                  isOpen={true}
                  startDate={editDateStart}
                  endDate={editDateEnd}
                  onChange={(start, end) => { setEditDateStart(start); setEditDateEnd(end); }}
                  onClose={() => {}}
                  startLabel="Check-in"
                  endLabel="Check-out"
                />
              </div>
            )}

            {editingField === 'guests' && (
              <div className="mt-2 flex justify-center">
                <GuestCounter
                  isOpen={true}
                  guests={searchBarGuests}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <HotelFilters
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        filterCount={filterCount}
        vacationRentals={lastSearchParams?.vacation_rentals ?? false}
        onVacationRentalsChange={(vr) => {
          if (lastSearchParams) {
            setLastSearchParams({ ...lastSearchParams, vacation_rentals: vr });
          }
        }}
      />

      {/* ── RESULTS HEADING ── */}
      <div className="pt-[144px] lg:pt-[136px]">
        <div className="px-4 lg:px-8 pb-4">
          {hasSearched && !isLoading && (
            <p className="font-display text-xl lg:text-2xl font-bold text-[#0A0A0A] tracking-tight">
              {nonMatching
                ? 'No encontramos resultados exactos'
                : totalResults
                  ? `Más de ${totalResults} ${resultsLabel}`
                  : 'Sin resultados'}
            </p>
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
        </div>

        {/* ── MAIN SPLIT LAYOUT ── */}
        <div className="lg:grid lg:grid-cols-[minmax(0,740px)_1fr] lg:min-h-[calc(100vh-200px)]">
          {/* LEFT: Results */}
          <div className="px-4 lg:px-8 pb-16">
            {!hasSearched ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-6">
                  <MapPin className="w-12 h-12 text-[#A1A1A1]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#0A0A0A] mb-2">
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
                <p className="text-sm text-[#6A7282] mb-4 max-w-sm">{queryErrorMsg}</p>
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
                  <MapPin className="w-8 h-8 text-[#A1A1A1]" />
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
                      className="px-8 py-3 rounded-full border-2 border-[#0A0A0A] text-[#0A0A0A] text-sm font-semibold hover:bg-[#0A0A0A] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              </>
            )}
          </div>

          {/* RIGHT: Map */}
          <div className="hidden lg:block sticky top-[136px] h-[calc(100vh-136px)]">
            {(hasSearched && displayedHotels.length > 0) || isLoading ? (
              <HotelMap
                hotels={isLoading ? [] : displayedHotels}
                center={
                  displayedHotels.length > 0 && environment?.location
                    ? { lat: environment.location.latitude, lng: environment.location.longitude }
                    : { lat: 43.065, lng: -89.39 }
                }
              />
            ) : (
              <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                <p className="text-[#A1A1A1] text-sm">Mapa disponible al buscar</p>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default function HotelesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6A7282] text-sm">Cargando búsqueda...</p>
        </div>
      </div>
    }>
      <HotelesContent />
    </Suspense>
  );
}
