'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { FilterState } from '@/lib/types/search';
import { HOTEL_CLASSES, PROPERTY_TYPES_HOTELS, AMENITIES_HOTELS } from '@/lib/constants/filters';
import PriceRangeFilter from './PriceRangeFilter';
import RatingFilter from './RatingFilter';
import CheckboxFilterGroup from './CheckboxFilterGroup';
import ToggleFilters from './ToggleFilters';

interface FilterSidebarProps {
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
  /** Called when "Limpiar" is clicked */
  onReset: () => void;
}

/** Count how many filter values are currently active */
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

export default function FilterSidebar({
  filterState,
  onFilterChange,
  onApply,
  onReset,
}: FilterSidebarProps) {
  const activeCount = countActiveFilters(filterState);

  return (
    <aside className="flex flex-col gap-5 font-[family-name:var(--font-geist-sans)] sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-ink" />
          <h2 className="text-base font-bold text-ink">Filtros</h2>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
              {activeCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-ink-muted transition-colors hover:text-coral"
        >
          Limpiar
        </button>
      </div>

      <div className="space-y-5">
        {/* Price range */}
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

        {/* Rating */}
        <RatingFilter
          rating={filterState.rating ?? null}
          onChange={(value) => onFilterChange({ type: 'SET_RATING', value })}
        />

        <div className="border-t border-paper-outline" />

        {/* Hotel class */}
        <CheckboxFilterGroup
          title="Categoría"
          options={HOTEL_CLASSES}
          selected={filterState.hotel_classes}
          onChange={(value) => onFilterChange({ type: 'TOGGLE_HOTEL_CLASS', value })}
        />

        <div className="border-t border-paper-outline" />

        {/* Property types */}
        <CheckboxFilterGroup
          title="Tipo de alojamiento"
          options={PROPERTY_TYPES_HOTELS}
          selected={filterState.property_types}
          onChange={(value) => onFilterChange({ type: 'TOGGLE_PROPERTY_TYPE', value })}
        />

        <div className="border-t border-paper-outline" />

        {/* Amenities */}
        <CheckboxFilterGroup
          title="Servicios"
          options={AMENITIES_HOTELS}
          selected={filterState.amenities}
          onChange={(value) => onFilterChange({ type: 'TOGGLE_AMENITY', value })}
        />

        <div className="border-t border-paper-outline" />

        {/* Toggles + sort */}
        <ToggleFilters
          freeCancellation={filterState.free_cancellation}
          sortBy={filterState.sort_by ?? null}
          onFreeCancellationChange={() =>
            onFilterChange({ type: 'TOGGLE_FREE_CANCEL' })
          }
          onSortByChange={(value) => onFilterChange({ type: 'SET_SORT', value })}
        />
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={onApply}
        className="mt-2 w-full rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-hover"
      >
        Aplicar filtros
      </button>
    </aside>
  );
}
