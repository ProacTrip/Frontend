'use client';

import { useState, useCallback, useRef } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  Minus,
  Plus,
} from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import type { FilterValues } from '@/app/lib/types/hotel';
import {
  PROPERTY_TYPES,
  HOTEL_CLASSES,
} from './FiltersModal';

// Re-export for page.tsx
export type { FilterValues } from '@/app/lib/types/hotel';

interface HotelFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues, sortBy?: string, count?: number) => void;
  onOpenModal: () => void;
  sortBy?: string;
  filterCount: number;
  vacationRentals: boolean;
  onVacationRentalsChange: (vr: boolean) => void;
}

function computeActiveCount(f: FilterValues): number {
  let c = 0;
  if (f.min_price != null) c++;
  if (f.max_price != null) c++;
  if (f.rating != null) c++;
  if (f.property_types?.length) c++;
  if (f.hotel_classes?.length) c++;
  if (f.amenities?.length) c++;
  if (f.free_cancellation) c++;
  if (f.special_offers) c++;
  if (f.eco_certified) c++;
  if ((f.bedrooms ?? 0) > 0) c++;
  if ((f.bathrooms ?? 0) > 0) c++;
  return c;
}

export default function HotelFilters({
  filters,
  onFilterChange,
  onOpenModal,
  sortBy: initialSortBy,
  filterCount,
  vacationRentals,
  onVacationRentalsChange,
}: HotelFiltersProps) {
  const filterBarRef = useRef<HTMLDivElement>(null);

  // ─── APPLY (unified callback) ───
  const apply = useCallback(
    (partial: Partial<FilterValues>) => {
      const merged: FilterValues = {
        ...filters,
        ...partial,
      };
      const count = computeActiveCount(merged);
      onFilterChange(merged, initialSortBy || undefined, count);
    },
    [filters, initialSortBy, onFilterChange],
  );

  // ─── TOGGLE HELPER ───
  const toggleItem = <T extends number>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  // ─── LOCAL STATE FOR PRICE POPOVER ───
  const [priceMinLocal, setPriceMinLocal] = useState(filters.min_price ?? 0);
  const [priceMaxLocal, setPriceMaxLocal] = useState(filters.max_price ?? 1000);

  // ─── ACTIVE CHECKS ───
  const hasPropertyType = (filters.property_types?.length ?? 0) > 0;
  const hasPriceRange = filters.min_price != null || filters.max_price != null;
  const hasRoomsBeds =
    (filters.bedrooms ?? 0) > 0 || (filters.bathrooms ?? 0) > 0;
  const totalActive = computeActiveCount(filters);

  // ─── CHIP CLASSNAME ───
  const chipClass = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13.5px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
      active
        ? 'border-[#111] border-2 text-[#111]'
        : 'border-[#e8e8e8] text-[#111] hover:border-[#aaa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
    }`;

  return (
    <>
      {/* Filter bar — fixed below the navbar */}
      <div
        ref={filterBarRef}
        className="fixed top-[72px] left-0 right-0 z-40 h-16 bg-white border-b border-[#e8e8e8] flex items-stretch px-4 lg:px-8"
      >
        <div className="flex items-center gap-2.5 w-full">
        {/* ── Hotels / Alquiler toggle ── */}
        <div className="flex items-center bg-[#f5f5f5] rounded-full p-1 shrink-0">
          <button
            onClick={() => onVacationRentalsChange(false)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              !vacationRentals
                ? 'bg-[#111] text-white'
                : 'text-[#6A7282] hover:text-[#111]'
            }`}
          >
            Hoteles
          </button>
          <button
            onClick={() => onVacationRentalsChange(true)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              vacationRentals
                ? 'bg-[#111] text-white'
                : 'text-[#6A7282] hover:text-[#111]'
            }`}
          >
            Alquileres
          </button>
        </div>

        {/* ── CHIP 1: PROPERTY TYPE ── */}
        <Popover className="relative shrink-0">
          <PopoverButton className={chipClass(hasPropertyType)}>
            Tipo de propiedad
            <ChevronDown className="w-3 h-3" />
            {hasPropertyType && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#111] text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
                {filters.property_types!.length}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[220px] z-30">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {PROPERTY_TYPES.map((pt) => (
                <label
                  key={pt.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#fafafa] cursor-pointer text-sm text-[#111]"
                >
                  <input
                    type="checkbox"
                    checked={(filters.property_types ?? []).includes(pt.id)}
                    onChange={() => {
                      const pts = toggleItem(filters.property_types ?? [], pt.id);
                      apply({ property_types: pts });
                    }}
                    className="w-4 h-4 rounded accent-[#111]"
                  />
                  {pt.name}
                </label>
              ))}
            </div>

            {/* Hotel class sub-group */}
            <div className="border-t border-[#e8e8e8] mt-2 pt-2">
              <p className="text-xs text-[#6A7282] font-medium mb-1.5 px-3">
                Categoría
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {HOTEL_CLASSES.map((hc) => (
                  <label
                    key={hc.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#fafafa] cursor-pointer text-sm text-[#111]"
                  >
                    <input
                      type="checkbox"
                      checked={(filters.hotel_classes ?? []).includes(hc.id)}
                      onChange={() => {
                        const cs = toggleItem(filters.hotel_classes ?? [], hc.id);
                        apply({ hotel_classes: cs });
                      }}
                      className="w-4 h-4 rounded accent-[#111]"
                    />
                    {hc.name}
                  </label>
                ))}
              </div>
            </div>
          </PopoverPanel>
        </Popover>

        {/* ── CHIP 2: PRICE RANGE ── */}
        <Popover className="relative shrink-0">
          <PopoverButton
            className={chipClass(hasPriceRange)}
            onClick={() => {
              // Sync local state when opening
              setPriceMinLocal(filters.min_price ?? 0);
              setPriceMaxLocal(filters.max_price ?? 1000);
            }}
          >
            Rango de precio
            <ChevronDown className="w-3 h-3" />
            {hasPriceRange && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#111] text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
                !
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-5 min-w-[220px] z-30">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6A7282] w-10">Min</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceMinLocal === 0 && filters.min_price == null ? '' : String(priceMinLocal)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setPriceMinLocal(0);
                      return;
                    }
                    const v = parseInt(raw, 10);
                    if (!isNaN(v) && v >= 0) {
                      setPriceMinLocal(v);
                    }
                  }}
                  onBlur={() => {
                    if (priceMinLocal > priceMaxLocal - 10) {
                      setPriceMinLocal(Math.max(0, priceMaxLocal - 10));
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#111]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6A7282] w-10">Max</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceMaxLocal === 1000 && filters.max_price == null ? '' : String(priceMaxLocal)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setPriceMaxLocal(1000);
                      return;
                    }
                    const v = parseInt(raw, 10);
                    if (!isNaN(v) && v >= 0) {
                      setPriceMaxLocal(v);
                    }
                  }}
                  onBlur={() => {
                    if (priceMaxLocal < priceMinLocal + 10) {
                      setPriceMaxLocal(priceMinLocal + 10);
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#111]"
                />
              </div>
              <button
                onClick={() =>
                  apply({
                    min_price: priceMinLocal > 0 ? priceMinLocal : null,
                    max_price: priceMaxLocal < 1000 ? priceMaxLocal : null,
                  })
                }
                className="w-full py-2 rounded-full bg-[#111] text-white text-sm font-medium hover:bg-[#262626] transition-colors"
              >
                Aplicar
              </button>
            </div>
          </PopoverPanel>
        </Popover>

        {/* ── CHIP 3: ROOMS & BEDS ── */}
        <Popover className="relative shrink-0">
          <PopoverButton className={chipClass(hasRoomsBeds)}>
            Habitaciones y camas
            <ChevronDown className="w-3 h-3" />
            {hasRoomsBeds && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#111] text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
                !
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-5 min-w-[220px] z-30">
            <div className="space-y-1">
              {/* Bedrooms */}
              <div className="flex items-center justify-between py-3 border-b border-[#e8e8e8]">
                <span className="text-sm font-medium text-[#111]">Dormitorios</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      apply({ bedrooms: Math.max(0, (filters.bedrooms ?? 0) - 1) })
                    }
                    disabled={(filters.bedrooms ?? 0) <= 0}
                    className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] disabled:text-[#ccc] disabled:border-[#eee] disabled:cursor-default transition-colors"
                    aria-label="Reducir dormitorios"
                  >
                    <Minus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>
                  <span className="text-sm font-medium min-w-[20px] text-center">
                    {filters.bedrooms ?? 0}
                  </span>
                  <button
                    onClick={() =>
                      apply({ bedrooms: (filters.bedrooms ?? 0) + 1 })
                    }
                    className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] transition-colors"
                    aria-label="Aumentar dormitorios"
                  >
                    <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Bathrooms */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-[#111]">Baños</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      apply({ bathrooms: Math.max(0, (filters.bathrooms ?? 0) - 1) })
                    }
                    disabled={(filters.bathrooms ?? 0) <= 0}
                    className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] disabled:text-[#ccc] disabled:border-[#eee] disabled:cursor-default transition-colors"
                    aria-label="Reducir baños"
                  >
                    <Minus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>
                  <span className="text-sm font-medium min-w-[20px] text-center">
                    {filters.bathrooms ?? 0}
                  </span>
                  <button
                    onClick={() =>
                      apply({ bathrooms: (filters.bathrooms ?? 0) + 1 })
                    }
                    className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] transition-colors"
                    aria-label="Aumentar baños"
                  >
                    <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </PopoverPanel>
        </Popover>

        {/* ── CHIP 4: ALL FILTERS ── */}
        <button
          onClick={onOpenModal}
          className={chipClass(totalActive > 0) + ' gap-[6px]'}
        >
          <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={2} />
          Todos los filtros
          {totalActive > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#111] text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
              {totalActive}
            </span>
          )}
        </button>

        {/* ── CLEAR ALL ── */}
        {totalActive > 0 && (
          <button
            onClick={() =>
              onFilterChange(
                {
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
                  vacation_rentals: filters.vacation_rentals,
                },
                initialSortBy || undefined,
                0,
              )
            }
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-medium text-[#6A7282] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
        </div>
      </div>
    </>
  );
}
