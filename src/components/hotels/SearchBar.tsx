'use client';

import { type FC } from 'react';
import { Search, Loader2 } from 'lucide-react';
import DestinationInput from './DestinationInput';
import DateRangePicker from './DateRangePicker';
import GuestSelector from './GuestSelector';

export interface SearchBarState {
  query: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: number[];
}

interface SearchBarProps {
  /** Current search state */
  searchState: SearchBarState;
  /** Called when search state field changes */
  onStateChange: (partial: Partial<SearchBarState>) => void;
  /** Called when user clicks "Buscar" */
  onSearch: () => void;
  /** Whether a search is in progress */
  isLoading?: boolean;
  /** Validation errors keyed by field */
  errors?: Partial<Record<keyof SearchBarState, string>>;
}

const SearchBar: FC<SearchBarProps> = ({
  searchState,
  onStateChange,
  onSearch,
  isLoading = false,
  errors,
}) => {
  // GuestSelector expects a combined onChange
  function handleGuestChange(state: { adults: number; children: number; childrenAges: number[] }) {
    onStateChange({
      adults: state.adults,
      children: state.children,
      childrenAges: state.childrenAges,
    });
  }

  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      {/* Desktop: horizontal bar. Mobile: stacked */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-0 rounded-2xl bg-paper-dim border border-paper-outline shadow-sm p-3 md:p-2">
        {/* Destination — takes more space */}
        <div className="flex-1 md:px-3 md:min-w-0">
          <DestinationInput
            value={searchState.query}
            onChange={(v) => onStateChange({ query: v })}
            error={errors?.query}
          />
        </div>

        {/* Dates */}
        <div className="md:w-auto md:px-3 border-t md:border-t-0 md:border-l border-paper-outline pt-3 md:pt-0">
          <DateRangePicker
            checkIn={searchState.checkIn}
            checkOut={searchState.checkOut}
            onCheckInChange={(v) => onStateChange({ checkIn: v })}
            onCheckOutChange={(v) => onStateChange({ checkOut: v })}
            error={errors?.checkIn || errors?.checkOut}
          />
        </div>

        {/* Guests */}
        <div className="md:px-3 border-t md:border-t-0 md:border-l border-paper-outline pt-3 md:pt-0">
          <GuestSelector
            adults={searchState.adults}
            children={searchState.children}
            childrenAges={searchState.childrenAges}
            onChange={handleGuestChange}
          />
        </div>

        {/* Search button */}
        <div className="md:pl-3 pt-2 md:pt-0">
          <button
            type="button"
            onClick={onSearch}
            disabled={isLoading}
            className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-coral-hover disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
