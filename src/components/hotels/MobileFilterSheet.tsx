'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import type { FilterState } from '@/lib/types/search';
import { HOTEL_CLASSES, PROPERTY_TYPES_HOTELS, AMENITIES_HOTELS } from '@/lib/constants/filters';
import PriceRangeFilter from './PriceRangeFilter';
import RatingFilter from './RatingFilter';
import CheckboxFilterGroup from './CheckboxFilterGroup';
import ToggleFilters from './ToggleFilters';

interface MobileFilterSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Called to close the sheet */
  onClose: () => void;
  /** Current filter state */
  filterState: FilterState;
  /** Dispatch-like handler for filter changes */
  onFilterChange: (
    action:
      | { type: 'SET_PRICE_RANGE'; min?: number; max?: number }
      | { type: 'SET_RATING'; value: number | null }
      | { type: 'TOGGLE_HOTEL_CLASS'; value: number }
      | { type: 'TOGGLE_PROPERTY_TYPE'; value: number }
      | { type: 'TOGGLE_AMENITY'; value: number }
      | { type: 'SET_SORT'; value: number | null }
      | { type: 'TOGGLE_FREE_CANCEL' }
  ) => void;
  /** Called when "Aplicar filtros" is clicked */
  onApply: () => void;
  /** Called when "Limpiar filtros" is clicked */
  onReset: () => void;
}

/** Count active filter values */
function countActiveFilters(fs: FilterState): number {
  let count = 0;
  if (fs.min_price !== undefined) count++;
  if (fs.max_price !== undefined) count++;
  if (fs.rating !== undefined) count++;
  count += fs.hotel_classes.length;
  count += fs.property_types.length;
  count += fs.amenities.length;
  if (fs.sort_by !== undefined) count++;
  if (fs.free_cancellation) count++;
  return count;
}

export default function MobileFilterSheet({
  isOpen,
  onClose,
  filterState,
  onFilterChange,
  onApply,
  onReset,
}: MobileFilterSheetProps) {
  const activeCount = countActiveFilters(filterState);

  function handleApply() {
    onApply();
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-paper shadow-xl font-[family-name:var(--font-geist-sans)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-paper-outline" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper-outline">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-ink" />
                <h2 className="text-base font-bold text-ink">Filtros</h2>
                {activeCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="text-xs font-medium text-ink-muted transition-colors hover:text-coral"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-dim"
                  aria-label="Cerrar filtros"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-4 py-4 space-y-5 max-h-[calc(85vh-12rem)]">
              <PriceRangeFilter
                minPrice={filterState.min_price}
                maxPrice={filterState.max_price}
                onMinChange={(min) =>
                  onFilterChange({ type: 'SET_PRICE_RANGE', min, max: filterState.max_price })
                }
                onMaxChange={(max) =>
                  onFilterChange({ type: 'SET_PRICE_RANGE', min: filterState.min_price, max })
                }
              />

              <div className="border-t border-paper-outline" />

              <RatingFilter
                rating={filterState.rating ?? null}
                onChange={(value) => onFilterChange({ type: 'SET_RATING', value })}
              />

              <div className="border-t border-paper-outline" />

              <CheckboxFilterGroup
                title="Categoría"
                options={HOTEL_CLASSES}
                selected={filterState.hotel_classes}
                onChange={(value) => onFilterChange({ type: 'TOGGLE_HOTEL_CLASS', value })}
              />

              <div className="border-t border-paper-outline" />

              <CheckboxFilterGroup
                title="Tipo de alojamiento"
                options={PROPERTY_TYPES_HOTELS}
                selected={filterState.property_types}
                onChange={(value) => onFilterChange({ type: 'TOGGLE_PROPERTY_TYPE', value })}
              />

              <div className="border-t border-paper-outline" />

              <CheckboxFilterGroup
                title="Servicios"
                options={AMENITIES_HOTELS}
                selected={filterState.amenities}
                onChange={(value) => onFilterChange({ type: 'TOGGLE_AMENITY', value })}
              />

              <div className="border-t border-paper-outline" />

              <ToggleFilters
                freeCancellation={filterState.free_cancellation}
                sortBy={filterState.sort_by ?? null}
                onFreeCancellationChange={() =>
                  onFilterChange({ type: 'TOGGLE_FREE_CANCEL' })
                }
                onSortByChange={(value) => onFilterChange({ type: 'SET_SORT', value })}
              />
            </div>

            {/* Bottom fixed action */}
            <div className="border-t border-paper-outline px-4 py-3">
              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-coral-hover min-h-[44px]"
              >
                Aplicar filtros
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
