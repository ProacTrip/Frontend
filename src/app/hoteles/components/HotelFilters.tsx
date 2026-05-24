'use client';

import { useState, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import type { FilterValues } from '@/app/lib/types/hotel';

// Re-export for page.tsx
export type { FilterValues } from '@/app/lib/types/hotel';

interface HotelFiltersProps {
  onFilterChange: (filters: FilterValues, sortBy?: string, count?: number) => void;
  sortBy?: string;
  filterCount: number;
  vacationRentals: boolean;
  onVacationRentalsChange: (vr: boolean) => void;
}

const RATING_OPTIONS = [
  { value: '', label: 'Cualquiera' },
  { value: '7', label: '3.5+' },
  { value: '8', label: '4.0+' },
  { value: '9', label: '4.5+' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Relevancia' },
  { value: '3', label: 'Precio más bajo' },
  { value: '8', label: 'Mayor puntuación' },
  { value: '13', label: 'Más reseñas' },
];

const PROPERTY_TYPES = [
  { id: 12, name: 'Hoteles de playa' },
  { id: 13, name: 'Hoteles boutique' },
  { id: 14, name: 'Hostales' },
  { id: 17, name: 'Resorts' },
  { id: 18, name: 'Hoteles spa' },
  { id: 19, name: 'Bed & breakfast' },
  { id: 21, name: 'Aparthoteles' },
];

const HOTEL_CLASSES = [
  { id: 2, name: '2 estrellas' },
  { id: 3, name: '3 estrellas' },
  { id: 4, name: '4 estrellas' },
  { id: 5, name: '5 estrellas' },
];

const AMENITIES = [
  { id: 35, name: 'WiFi gratis' },
  { id: 9, name: 'Desayuno gratis' },
  { id: 6, name: 'Piscina' },
  { id: 10, name: 'Spa' },
  { id: 1, name: 'Parking gratis' },
  { id: 8, name: 'Restaurante' },
  { id: 40, name: 'Aire acondicionado' },
  { id: 15, name: 'Bar' },
  { id: 7, name: 'Gimnasio' },
  { id: 12, name: 'Para niños' },
  { id: 19, name: 'Admite mascotas' },
  { id: 11, name: 'Acceso a la playa' },
  { id: 53, name: 'Accesible' },
];

export default function HotelFilters({
  onFilterChange,
  sortBy: initialSortBy,
  filterCount: externalFilterCount,
  vacationRentals,
  onVacationRentalsChange,
}: HotelFiltersProps) {
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [rating, setRating] = useState<string>('');
  const [currentSortBy, setCurrentSortBy] = useState<string>(initialSortBy || '');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [specialOffers, setSpecialOffers] = useState(false);
  const [ecoCertified, setEcoCertified] = useState(false);
  const [activeCount, setActiveCount] = useState(externalFilterCount || 0);

  const filterBarRef = useRef<HTMLDivElement>(null);

  const computeActiveCount = (
    mp: number, mpx: number, rt: string, pts: number[], cs: number[], ams: number[], fc: boolean, so: boolean, eco: boolean
  ) => {
    let c = 0;
    if (mp > 0) c++;
    if (mpx < 1000) c++;
    if (rt) c++;
    if (pts.length) c++;
    if (cs.length) c++;
    if (ams.length) c++;
    if (fc) c++;
    if (so) c++;
    if (eco) c++;
    return c;
  };

  const apply = (
    mp: number, mpx: number, rt: string, pts: number[], cs: number[], ams: number[], fc: boolean, so: boolean, eco: boolean, sb: string
  ) => {
    const count = computeActiveCount(mp, mpx, rt, pts, cs, ams, fc, so, eco);
    setActiveCount(count);
    setCurrentSortBy(sb);

    const f: FilterValues = {
      min_price: mp > 0 ? mp : null,
      max_price: mpx < 1000 ? mpx : null,
      rating: rt ? parseInt(rt, 10) : null,
      property_types: pts,
      hotel_classes: cs,
      amenities: ams,
      sort_by: sb || undefined,
      free_cancellation: fc || undefined,
      special_offers: so || undefined,
      eco_certified: eco || undefined,
    };
    onFilterChange(f, sb || undefined, count);
  };

  const clearAll = () => {
    setMinPrice(0); setMaxPrice(1000); setRating('');
    setSelectedPropertyTypes([]); setSelectedClasses([]); setSelectedAmenities([]);
    setFreeCancellation(false); setSpecialOffers(false); setEcoCertified(false);
    setCurrentSortBy('');
    setActiveCount(0);
    onFilterChange({
      min_price: null, max_price: null, rating: null,
      property_types: [], hotel_classes: [], amenities: [],
      sort_by: undefined, free_cancellation: undefined, special_offers: undefined, eco_certified: undefined,
    }, undefined, 0);
  };

  const toggleItem = <T extends number | string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  return (
    <>
      {/* Filter bar — fixed below the navbar */}
      <div
        ref={filterBarRef}
        className="fixed top-[72px] left-0 right-0 z-40 h-16 bg-white border-b border-[#E5E7EB] flex items-center gap-2.5 px-4 lg:px-8 overflow-x-auto no-scrollbar"
      >
        {/* Vacation rentals / Hotels toggle */}
        <div className="flex items-center bg-[#F5F5F5] rounded-full p-1 shrink-0">
          <button
            onClick={() => onVacationRentalsChange(false)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              !vacationRentals ? 'bg-[#0A0A0A] text-white' : 'text-[#6A7282] hover:text-[#0A0A0A]'
            }`}
          >
            Hoteles
          </button>
          <button
            onClick={() => onVacationRentalsChange(true)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              vacationRentals ? 'bg-[#0A0A0A] text-white' : 'text-[#6A7282] hover:text-[#0A0A0A]'
            }`}
          >
            Alquileres
          </button>
        </div>

        {/* Sort by */}
        <Popover className="relative shrink-0">
          <PopoverButton className="filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E5E7EB] text-[13px] font-medium text-[#0A0A0A] hover:border-[#aaa] transition-colors whitespace-nowrap">
            <SlidersHorizontal className="w-3 h-3" />
            Ordenar
            <ChevronDown className="w-3 h-3" />
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[200px] z-50">
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, selectedAmenities, freeCancellation, specialOffers, ecoCertified, opt.value);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    (currentSortBy || '') === opt.value ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A] hover:bg-[#FAFAFA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverPanel>
        </Popover>

        {/* Price range */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            minPrice > 0 || maxPrice < 1000 ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            Precio
            <ChevronDown className="w-3 h-3" />
            {((minPrice > 0 || maxPrice < 1000)) && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">!</span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-5 min-w-[220px] z-50">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6A7282] w-10">Min</label>
                <input
                  type="number"
                  value={minPrice}
                  min={0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMinPrice(Math.min(v, maxPrice - 10));
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6A7282] w-10">Max</label>
                <input
                  type="number"
                  value={maxPrice}
                  min={minPrice + 10}
                  max={10000}
                  onChange={(e) => {
                    setMaxPrice(Math.max(Number(e.target.value), minPrice + 10));
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
              <button
                onClick={() => apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, selectedAmenities, freeCancellation, specialOffers, ecoCertified, currentSortBy)}
                className="w-full py-2 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#262626] transition-colors"
              >
                Aplicar
              </button>
            </div>
          </PopoverPanel>
        </Popover>

        {/* Rating */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            rating ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            Valoración
            <ChevronDown className="w-3 h-3" />
            {rating && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">!</span>}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[180px] z-50">
            <div className="space-y-1">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const newRating = opt.value;
                    setRating(newRating);
                    apply(minPrice, maxPrice, newRating, selectedPropertyTypes, selectedClasses, selectedAmenities, freeCancellation, specialOffers, ecoCertified, currentSortBy);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    rating === opt.value ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A] hover:bg-[#FAFAFA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverPanel>
        </Popover>

        {/* Property type */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            selectedPropertyTypes.length ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            Tipo
            <ChevronDown className="w-3 h-3" />
            {selectedPropertyTypes.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                {selectedPropertyTypes.length}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[220px] z-50">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {PROPERTY_TYPES.map((pt) => (
                <label key={pt.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAFAFA] cursor-pointer text-sm text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={selectedPropertyTypes.includes(pt.id)}
                    onChange={() => {
                      const pts = toggleItem(selectedPropertyTypes, pt.id);
                      setSelectedPropertyTypes(pts);
                      apply(minPrice, maxPrice, rating, pts, selectedClasses, selectedAmenities, freeCancellation, specialOffers, ecoCertified, currentSortBy);
                    }}
                    className="w-4 h-4 rounded accent-[#0A0A0A]"
                  />
                  {pt.name}
                </label>
              ))}
            </div>
          </PopoverPanel>
        </Popover>

        {/* Hotel class */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            selectedClasses.length ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            Estrellas
            <ChevronDown className="w-3 h-3" />
            {selectedClasses.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                {selectedClasses.length}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[180px] z-50">
            <div className="space-y-1">
              {HOTEL_CLASSES.map((hc) => (
                <label key={hc.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAFAFA] cursor-pointer text-sm text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(hc.id)}
                    onChange={() => {
                      const cs = toggleItem(selectedClasses, hc.id);
                      setSelectedClasses(cs);
                      apply(minPrice, maxPrice, rating, selectedPropertyTypes, cs, selectedAmenities, freeCancellation, specialOffers, ecoCertified, currentSortBy);
                    }}
                    className="w-4 h-4 rounded accent-[#0A0A0A]"
                  />
                  {hc.name}
                </label>
              ))}
            </div>
          </PopoverPanel>
        </Popover>

        {/* Amenities */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            selectedAmenities.length ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            Servicios
            <ChevronDown className="w-3 h-3" />
            {selectedAmenities.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                {selectedAmenities.length}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 min-w-[220px] z-50">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {AMENITIES.map((am) => (
                <label key={am.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FAFAFA] cursor-pointer text-sm text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(am.id)}
                    onChange={() => {
                      const ams = toggleItem(selectedAmenities, am.id);
                      setSelectedAmenities(ams);
                      apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, ams, freeCancellation, specialOffers, ecoCertified, currentSortBy);
                    }}
                    className="w-4 h-4 rounded accent-[#0A0A0A]"
                  />
                  {am.name}
                </label>
              ))}
            </div>
          </PopoverPanel>
        </Popover>

        {/* More filters */}
        <Popover className="relative shrink-0">
          <PopoverButton className={`filter-chip flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors whitespace-nowrap ${
            freeCancellation || specialOffers || ecoCertified ? 'border-[#0A0A0A] border-2 text-[#0A0A0A]' : 'border-[#E5E7EB] text-[#0A0A0A] hover:border-[#aaa]'
          }`}>
            <SlidersHorizontal className="w-[14px] h-[14px]" />
            Más filtros
            {(freeCancellation || specialOffers || ecoCertified) && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-[#0A0A0A] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                {[freeCancellation, specialOffers, ecoCertified].filter(Boolean).length}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-4 min-w-[220px] z-50">
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-sm text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeCancellation}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setFreeCancellation(v);
                    apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, selectedAmenities, v, specialOffers, ecoCertified, currentSortBy);
                  }}
                  className="w-4 h-4 rounded accent-[#0A0A0A]"
                />
                Cancelación gratuita
              </label>
              <label className="flex items-center gap-2.5 text-sm text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={specialOffers}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setSpecialOffers(v);
                    apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, selectedAmenities, freeCancellation, v, ecoCertified, currentSortBy);
                  }}
                  className="w-4 h-4 rounded accent-[#0A0A0A]"
                />
                Ofertas especiales
              </label>
              <label className="flex items-center gap-2.5 text-sm text-[#0A0A0A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ecoCertified}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setEcoCertified(v);
                    apply(minPrice, maxPrice, rating, selectedPropertyTypes, selectedClasses, selectedAmenities, freeCancellation, specialOffers, v, currentSortBy);
                  }}
                  className="w-4 h-4 rounded accent-[#0A0A0A]"
                />
                Eco certificado
              </label>
            </div>
          </PopoverPanel>
        </Popover>

        {/* Clear all — only show if there are active filters */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-medium text-[#6A7282] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Hide scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
