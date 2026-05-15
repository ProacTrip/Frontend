'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, Map } from 'lucide-react';

import SearchBar, { type SearchBarState } from './SearchBar';
import WeatherWidget from './WeatherWidget';
import FilterSidebar from './FilterSidebar';
import MobileFilterSheet from './MobileFilterSheet';
import ResultsHeader from './ResultsHeader';
import HotelCardList from './HotelCardList';
import HotelCardSkeleton from './HotelCardSkeleton';
import PaginationControls from './PaginationControls';
import { EmptyState, NonMatchingWarning, ErrorBanner } from './StateBanners';
import { useHotelSearch } from '@/lib/hooks/useHotelSearch';

/**
 * Main orchestrator for the hotel search page.
 *
 * Composes SearchBar + FilterSidebar (desktop) / MobileFilterSheet (mobile) +
 * ResultsHeader + StateBanners + HotelCardList + PaginationControls.
 *
 * All state lives in the useHotelSearch hook. This component is a thin
 * wiring layer that passes hook values down to child components.
 */
export default function HotelsSearchClient() {
  const hook = useHotelSearch();
  const router = useRouter();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // ── Search bar state bridge ──
  const searchBarState: SearchBarState = {
    query: hook.query,
    checkIn: hook.checkIn,
    checkOut: hook.checkOut,
    adults: hook.adults,
    children: hook.children,
    childrenAges: hook.childrenAges,
  };

  function handleSearchBarChange(partial: Partial<SearchBarState>) {
    if (partial.query !== undefined) hook.setQuery(partial.query);
    if (partial.checkIn !== undefined) hook.setCheckIn(partial.checkIn);
    if (partial.checkOut !== undefined) hook.setCheckOut(partial.checkOut);
    if (partial.adults !== undefined) hook.setAdults(partial.adults);
    if (partial.children !== undefined) hook.setChildren(partial.children);
    if (partial.childrenAges !== undefined)
      hook.setChildrenAges(partial.childrenAges);
  }

  function handlePropertyClick(id: string) {
    // Navigate to internal hotel detail page with search params for hotel-details API
    const params = new URLSearchParams();
    if (hook.checkIn) params.set('check_in', hook.checkIn);
    if (hook.checkOut) params.set('check_out', hook.checkOut);
    if (hook.adults !== 2) params.set('adults', String(hook.adults));
    if (hook.children > 0) {
      params.set('children', String(hook.children));
      if (hook.childrenAges.length > 0) {
        params.set('children_ages', hook.childrenAges.join(','));
      }
    }
    const qs = params.toString();
    router.push(`/hotels/${id}${qs ? `?${qs}` : ''}`);
  }

  // ── Derived display states ──
  const showSkeletons = hook.searchStatus === 'loading';
  const showResults =
    hook.searchStatus === 'success' || hook.searchStatus === 'error';
  const showEmpty = hook.searchStatus === 'success' && hook.results.length === 0;
  const showNonMatching =
    hook.resultsState === 'non_matching_only' && !showEmpty && hook.results.length > 0;
  const showError = hook.searchStatus === 'error' && hook.error !== null;

  const isRateLimited =
    hook.error?.code === 'RATE_LIMIT_EXCEEDED' && (hook.error?.retryAfter ?? 0) > 0;

  return (
    <div className="font-[family-name:var(--font-geist-sans)] min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Search Bar ── */}
        <div className="mb-6">
            <SearchBar
              searchState={searchBarState}
              onStateChange={handleSearchBarChange}
              onSearch={hook.search}
              isLoading={hook.searchStatus === 'loading'}
              isRateLimited={isRateLimited}
            />
        </div>

        {/* ── Hero / Weather section ── */}
        <div className="mb-6">
          {hook.searchStatus === 'idle' ? (
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-ink font-[family-name:var(--font-geist-sans)]" suppressHydrationWarning>
                  Buscar Hoteles
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  {hook.environment?.city
                    ? `Encontrá alojamientos en ${hook.environment.city}`
                    : 'Encontrá el alojamiento ideal para tu viaje'}
                </p>
              </div>
              <div className="w-full md:w-auto md:min-w-[200px]">
                <WeatherWidget
                  location={hook.environment?.city ?? ''}
                  weather={
                    hook.environment
                      ? {
                          temp: hook.environment.temp,
                          description: hook.environment.description,
                          iconUrl: hook.environment.iconUrl,
                        }
                      : null
                  }
                  variant="idle"
                />
              </div>
            </div>
          ) : (
            <WeatherWidget
              location={hook.query}
              weather={null}
              variant="search"
            />
          )}
        </div>

        {/* ── Main content grid: sidebar (desktop) + results ── */}
        <div className="flex gap-6">
          {/* Sidebar — desktop only (≥1024px). Always visible. */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <FilterSidebar
              filterState={hook.filters}
              onFilterChange={hook.filterDispatch}
              onApply={hook.applyFilters}
              onReset={hook.resetFilters}
            />
          </div>

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Results header — visible after search */}
            <AnimatePresence>
              {hook.searchStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ResultsHeader
                    totalCount={hook.totalCount}
                    destination={hook.query}
                    sortBy={hook.filters.sort_by ?? null}
                    onSortChange={(value) =>
                      hook.filterDispatch({ type: 'SET_SORT', value })
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── State banners ── */}
            <AnimatePresence mode="wait">
              {showNonMatching && (
                <motion.div
                  key="non-matching"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <NonMatchingWarning visible={true} />
                </motion.div>
              )}

              {showError && hook.error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <ErrorBanner
                    errorCode={hook.error.code}
                    message={hook.error.message}
                    retryAfter={hook.error.retryAfter}
                  />
                </motion.div>
              )}

              {showEmpty && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState query={hook.query} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Loading skeletons ── */}
            {showSkeletons && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <HotelCardSkeleton count={6} />
              </div>
            )}

            {/* ── Results grid + pagination ── */}
            {showResults && hook.results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <HotelCardList
                  properties={hook.results}
                  onPropertyClick={handlePropertyClick}
                />
                <PaginationControls
                  hasMore={hook.hasMore}
                  onLoadMore={hook.loadMore}
                  isLoading={hook.isLoadingMore}
                />

                {/* ── Map CTA ── */}
                <div className="mt-8 p-6 bg-paper-dim rounded-xl border border-paper-outline text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Map size={20} className="text-coral" />
                    <h3 className="text-base font-semibold text-ink" suppressHydrationWarning>
                      Explorá en el mapa
                    </h3>
                  </div>
                  <p className="text-sm text-ink-muted mb-4">
                    Descubrí la ubicación exacta de cada alojamiento
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-paper-container px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper-outline transition-colors"
                    onClick={() => {
                      // TODO: Open interactive map showing hotel locations for query={hook.query}.
                      // Will integrate with a map component (Google Maps / Mapbox) in Phase 2.
                      console.debug('[MapCTA] Map not yet implemented');
                    }}
                  >
                    <Map size={16} />
                    Ver mapa
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Idle state (before first search) ── */}
            {hook.searchStatus === 'idle' && (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                suppressHydrationWarning
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper-container mb-4">
                  <Search size={24} className="text-ink-faint" />
                </div>
                <p className="text-sm text-ink-muted max-w-sm">
                  Ingresá un destino, fechas y cantidad de huéspedes para
                  encontrar el alojamiento ideal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile/tablet filter FAB + bottom sheet — always visible ── */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 min-h-[44px]"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {hook.activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold min-w-[20px]">
              {hook.activeFilterCount}
            </span>
          )}
        </button>

        <MobileFilterSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          filterState={hook.filters}
          onFilterChange={hook.filterDispatch}
          onApply={hook.applyFilters}
          onReset={hook.resetFilters}
        />
      </div>
    </div>
  );
}
