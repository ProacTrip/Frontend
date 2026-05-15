'use client';

import { SlidersHorizontal, Bed, Bath } from 'lucide-react';
import type { FilterState } from '@/lib/types/search';
import { HOTEL_CLASSES, PROPERTY_TYPES_HOTELS, PROPERTY_TYPES_VR, AMENITIES_HOTELS, AMENITIES_VR } from '@/lib/constants/filters';
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
      | { type: 'TOGGLE_VACATION_RENTALS' }
      | { type: 'TOGGLE_HOTEL_CLASS'; value: number }
      | { type: 'TOGGLE_PROPERTY_TYPE'; value: number }
      | { type: 'TOGGLE_AMENITY'; value: number }
      | { type: 'SET_BEDROOMS'; value: number | undefined }
      | { type: 'SET_BATHROOMS'; value: number | undefined }
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
  if (fs.bedrooms !== undefined) count++;
  if (fs.bathrooms !== undefined) count++;
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
          <h2 className="text-base font-bold text-ink" suppressHydrationWarning>Filtros</h2>
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
        {/* ── Vacation Rentals Toggle ── */}
        <div className="flex rounded-lg border border-paper-outline bg-paper p-0.5">
          <button
            type="button"
            onClick={() => {
              if (filterState.vacation_rentals) {
                onFilterChange({ type: 'TOGGLE_VACATION_RENTALS' });
              }
            }}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              !filterState.vacation_rentals
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Hoteles
          </button>
          <button
            type="button"
            onClick={() => {
              if (!filterState.vacation_rentals) {
                onFilterChange({ type: 'TOGGLE_VACATION_RENTALS' });
              }
            }}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              filterState.vacation_rentals
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Alquileres
          </button>
        </div>

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

        {/* Hotel class — only for hotels */}
        {!filterState.vacation_rentals && (
          <>
            <CheckboxFilterGroup
              title="Categoría"
              options={HOTEL_CLASSES}
              selected={filterState.hotel_classes}
              onChange={(value) => onFilterChange({ type: 'TOGGLE_HOTEL_CLASS', value })}
            />
            <div className="border-t border-paper-outline" />
          </>
        )}

        {/* Property types — mode-aware */}
        <CheckboxFilterGroup
          title="Tipo de alojamiento"
          options={filterState.vacation_rentals ? PROPERTY_TYPES_VR : PROPERTY_TYPES_HOTELS}
          selected={filterState.property_types}
          onChange={(value) => onFilterChange({ type: 'TOGGLE_PROPERTY_TYPE', value })}
        />

        <div className="border-t border-paper-outline" />

        {/* Amenities — mode-aware */}
        <CheckboxFilterGroup
          title="Servicios"
          options={filterState.vacation_rentals ? AMENITIES_VR : AMENITIES_HOTELS}
          selected={filterState.amenities}
          onChange={(value) => onFilterChange({ type: 'TOGGLE_AMENITY', value })}
        />

        {/* Bedrooms / Bathrooms — VR only */}
        {filterState.vacation_rentals && (
          <>
            <div className="border-t border-paper-outline" />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Habitaciones y baños</span>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-ink-muted flex items-center gap-1">
                    <Bed size={12} />
                    Dormitorios
                  </label>
                  <select
                    value={filterState.bedrooms ?? ''}
                    onChange={(e) =>
                      onFilterChange({
                        type: 'SET_BEDROOMS',
                        value: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="rounded-lg border border-paper-outline bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-coral focus:ring-1 focus:ring-coral/30"
                  >
                    <option value="">Cualquiera</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-ink-muted flex items-center gap-1">
                    <Bath size={12} />
                    Baños
                  </label>
                  <select
                    value={filterState.bathrooms ?? ''}
                    onChange={(e) =>
                      onFilterChange({
                        type: 'SET_BATHROOMS',
                        value: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="rounded-lg border border-paper-outline bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-coral focus:ring-1 focus:ring-coral/30"
                  >
                    <option value="">Cualquiera</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

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
