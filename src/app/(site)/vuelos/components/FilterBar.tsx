'use client';

import { SlidersHorizontal, X } from 'lucide-react';

export interface VueloFilterValues {
  stops?: 'any' | 'nonstop' | 'max_1' | 'max_2';
  sort_by?: string;
  max_price?: number | null;
  include_airlines?: string[];
  travel_class?: string;
  max_duration_minutes?: number | null;
}

interface FilterBarProps {
  activeChipCounts: Record<string, number>;
  onOpenFilterModal: () => void;
  onClearAll: () => void;
  onChipClick: (chipId: string) => void;
}

type ChipKey = 'airlines' | 'stops' | 'price' | 'duration' | 'cabin';

const CHIP_DEFS: { id: ChipKey; label: string }[] = [
  { id: 'airlines', label: 'Aerolineas' },
  { id: 'stops', label: 'Escalas' },
  { id: 'price', label: 'Precio' },
  { id: 'duration', label: 'Duracion' },
  { id: 'cabin', label: 'Cabina' },
];

export default function FilterBar({
  activeChipCounts,
  onOpenFilterModal,
  onClearAll,
  onChipClick,
}: FilterBarProps) {
  const totalActive = Object.values(activeChipCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed top-[72px] left-0 right-0 z-[900] h-16 bg-white/90 backdrop-blur-sm border-b border-neutral-200 flex items-center justify-center gap-2.5 px-4 lg:px-8 overflow-x-auto hide-scrollbar">
      {CHIP_DEFS.map((chip) => {
        const count = activeChipCounts[chip.id] || 0;
        const isActive = count > 0;

        return (
          <button
            key={chip.id}
            onClick={() => onChipClick(chip.id)}
        className={`relative flex items-center gap-[6px] px-4 py-2 rounded-full border text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          isActive
            ? 'border-neutral-900! ring-1 ring-neutral-900 ring-inset text-neutral-900 bg-neutral-50'
            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900'
        }`}
          >
            {chip.label}
            {isActive && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* All Filters — CEEPII-style outlined button */}
      <button
        onClick={onOpenFilterModal}
        className={`relative flex items-center gap-[6px] px-4 py-2 rounded-full border text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
          totalActive > 0
            ? 'border-neutral-900! ring-1 ring-neutral-900 ring-inset text-neutral-900 bg-neutral-50'
            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900'
        }`}
      >
        <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={1.5} />
        Todos los filtros
        {totalActive > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center px-1">
            {totalActive}
          </span>
        )}
      </button>

      {/* Clear all */}
      {totalActive > 0 && (
        <button
          onClick={onClearAll}
          className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
