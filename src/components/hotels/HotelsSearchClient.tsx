'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search } from 'lucide-react';

import SearchBar, { type SearchBarState } from './SearchBar';
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
    // Phase 2: navigate to hotel detail page
    console.debug('[HotelsSearchClient] Property clicked:', id);
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

        {/* ── Main content grid: sidebar (desktop) + results ── */}
        <div className="flex gap-6">
          {/* Sidebar — desktop only (≥1024px) */}
          <div className="hidden lg:block w-[280px] shrink-0">
            {hook.searchStatus !== 'idle' && (
              <FilterSidebar
                filterState={hook.filters}
                onFilterChange={hook.filterDispatch}
                onApply={hook.applyFilters}
                onReset={hook.resetFilters}
              />
            )}
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
              </motion.div>
            )}

            {/* ── Idle state (before first search) ── */}
            {hook.searchStatus === 'idle' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-container mb-4">
                  <Search size={28} className="text-ink-faint" />
                </div>
                <h2 className="text-lg font-bold text-ink mb-1">
                  Buscá alojamientos
                </h2>
                <p className="text-sm text-ink-muted max-w-sm">
                  Ingresá un destino, fechas y cantidad de huéspedes para
                  encontrar el alojamiento ideal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile/tablet filter FAB + bottom sheet ── */}
      <div className="lg:hidden">
        {hook.searchStatus !== 'idle' && (
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
        )}

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
