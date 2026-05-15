'use client';

import { SORT_OPTIONS } from '@/lib/constants/filters';

interface ToggleFiltersProps {
  /** Whether free cancellation filter is active */
  freeCancellation: boolean;
  /** Sort by value (3|8|13 or null) */
  sortBy?: number | null;
  /** Called when free cancellation toggle changes */
  onFreeCancellationChange: (value: boolean) => void;
  /** Called when sort by changes */
  onSortByChange: (value: number | null) => void;
}

export default function ToggleFilters({
  freeCancellation,
  sortBy,
  onFreeCancellationChange,
  onSortByChange,
}: ToggleFiltersProps) {
  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-geist-sans)]">
      {/* Free cancellation toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Cancelación gratis</span>
        <button
          type="button"
          role="switch"
          aria-checked={freeCancellation}
          onClick={() => onFreeCancellationChange(!freeCancellation)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            freeCancellation ? 'bg-coral' : 'bg-paper-outline'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              freeCancellation ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>

      {/* Sort by dropdown */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Ordenar por</span>
        <select
          value={sortBy ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onSortByChange(val === '' ? null : parseInt(val, 10));
          }}
          className="rounded-lg border border-paper-outline bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-coral focus:ring-1 focus:ring-coral/30"
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={option.value === null ? 'default' : option.value}
              value={option.value ?? ''}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
