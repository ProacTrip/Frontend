'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react';
import { X, Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FilterValues } from '@/app/lib/types/hotel';

// ─── CONSTANTS (shared with HotelFilters) ───

export const PROPERTY_TYPES = [
  { id: 12, name: 'Hoteles de playa' },
  { id: 13, name: 'Hoteles boutique' },
  { id: 14, name: 'Hostales' },
  { id: 17, name: 'Resorts' },
  { id: 18, name: 'Hoteles spa' },
  { id: 19, name: 'Bed & breakfast' },
  { id: 21, name: 'Aparthoteles' },
];

export const PROPERTY_TYPES_VR = [
  { id: 1, name: 'Apartamentos' },
  { id: 2, name: 'Bungalows' },
  { id: 3, name: 'Villas' },
  { id: 4, name: 'Casas rurales' },
  { id: 5, name: 'Cabañas' },
  { id: 6, name: 'Casas adosadas' },
  { id: 7, name: 'Lofts' },
  { id: 8, name: 'Estudios' },
  { id: 9, name: 'Chalets' },
  { id: 10, name: 'Fincas' },
  { id: 11, name: 'Haciendas' },
  { id: 21, name: 'Aparthoteles' },
];

export const HOTEL_CLASSES = [
  { id: 2, name: '2 estrellas' },
  { id: 3, name: '3 estrellas' },
  { id: 4, name: '4 estrellas' },
  { id: 5, name: '5 estrellas' },
];

export const AMENITIES = [
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

// ─── PRICE RANGE CONSTANTS ───
const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const PRICE_STEP = 10;

// ─── PROPS ───

const SORT_OPTIONS = [
  { value: undefined, label: 'Relevancia' },
  { value: 3, label: 'Precio más bajo' },
  { value: 8, label: 'Mayor puntuación' },
  { value: 13, label: 'Más reseñas' },
];

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (draft: FilterValues) => void;
  onClear: () => void;
  vacationRentals: boolean;
}

// ─── HELPERS ───

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function toggleItem<T extends number>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

// ─── COMPONENT ───

export default function FiltersModal({
  open,
  onClose,
  filters,
  onApply,
  onClear,
  vacationRentals,
}: FiltersModalProps) {
  // Local draft state — initialized from parent filters each time modal opens
  const [draft, setDraft] = useState<FilterValues>(() => ({ ...filters }));

  // Sync draft when modal opens (resets unsaved changes)
  useEffect(() => {
    if (open) {
      setDraft((prev) => {
        const base: FilterValues = {
          ...filters,
          min_price: filters.min_price ?? PRICE_MIN,
          max_price: filters.max_price ?? PRICE_MAX,
          property_types: filters.property_types ?? [],
          hotel_classes: filters.hotel_classes ?? [],
          amenities: filters.amenities ?? [],
          bedrooms: filters.bedrooms ?? 0,
          bathrooms: filters.bathrooms ?? 0,
          free_cancellation: filters.free_cancellation ?? false,
          special_offers: filters.special_offers ?? false,
          eco_certified: filters.eco_certified ?? false,
        };

        if (vacationRentals) {
          // VR mode: clear hotel-only filters
          base.hotel_classes = [];
          base.free_cancellation = undefined;
          base.special_offers = undefined;
          base.eco_certified = undefined;
        } else {
          // Hotels mode: clear VR-only filters
          base.bedrooms = 0;
          base.bathrooms = 0;
        }

        return base;
      });
    }
  }, [open, vacationRentals]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = useCallback(() => {
    // Normalize: convert zeros back to null for price and steppers
    const applied: FilterValues = {
      ...draft,
      min_price: draft.min_price !== PRICE_MIN ? draft.min_price : null,
      max_price: draft.max_price !== PRICE_MAX ? draft.max_price : null,
      bedrooms: (draft.bedrooms ?? 0) > 0 ? draft.bedrooms : undefined,
      bathrooms: (draft.bathrooms ?? 0) > 0 ? draft.bathrooms : undefined,
    };
    onApply(applied);
    onClose();
  }, [draft, onApply, onClose]);

  const handleClear = useCallback(() => {
    const cleared: FilterValues = {
      min_price: null,
      max_price: null,
      rating: null,
      property_types: [],
      hotel_classes: [],
      amenities: [],
      sort_by: draft.sort_by,
      brands: draft.brands,
      free_cancellation: undefined,
      special_offers: undefined,
      eco_certified: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      vacation_rentals: draft.vacation_rentals,
    };
    setDraft(cleared);
    onClear();
    onClose();
  }, [draft, onClear, onClose]);

  // Safe getters for draft values
  const dMin = draft.min_price ?? PRICE_MIN;
  const dMax = draft.max_price ?? PRICE_MAX;
  const dBedrooms = draft.bedrooms ?? 0;
  const dBathrooms = draft.bathrooms ?? 0;

  // ── RENDER ──

  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={onClose}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="fixed inset-0 z-[1100] bg-black/45"
            aria-hidden="true"
          />

          {/* Panel container — fixed, centered */}
          <div className="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto px-4 py-10 max-sm:px-0 max-sm:py-0">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[510px] my-auto max-sm:max-w-none max-sm:h-full max-sm:my-0"
            >
              <DialogPanel className="bg-white rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.22)] flex flex-col max-h-[calc(100vh-80px)] overflow-hidden max-sm:rounded-none max-sm:max-h-none max-sm:h-full">
                {/* ── STICKY HEADER ── */}
                <div className="flex items-center justify-center relative px-6 py-5 border-b border-[#e8e8e8] shrink-0">
                  <DialogTitle className="text-base font-semibold text-[#111]">
                    Filtros
                  </DialogTitle>
                  <CloseButton className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:bg-[#f7f7f7] hover:border-[#bbb] transition-colors">
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </CloseButton>
                </div>

                {/* ── SCROLLABLE BODY ── */}
                <div className="overflow-y-auto flex-1 px-6 py-7 space-y-7 scrollbar-thin">
                  {/* ── SECTION: SORT ── */}
                  <div className="pb-7 border-b border-[#e8e8e8]">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Ordenar
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((opt) => {
                        const selected = (draft.sort_by ?? undefined) === opt.value;
                        return (
                          <button
                            key={opt.value ?? 'relevancia'}
                            onClick={() => {
                              setDraft((prev) => ({
                                ...prev,
                                sort_by: opt.value,
                              }));
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-[#111] text-white'
                                : 'bg-[#f7f7f7] text-[#111] hover:bg-[#e5e5e5]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── SECTION 1: PROPERTY TYPE ── */}
                  <div className="pb-7 border-b border-[#e8e8e8]">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Tipo de propiedad
                    </h3>
                    <div className="divide-y divide-[#e8e8e8]">
                      {(vacationRentals ? PROPERTY_TYPES_VR : PROPERTY_TYPES).map((pt) => {
                        const checked = (draft.property_types ?? []).includes(pt.id);
                        return (
                          <label
                            key={pt.id}
                            className={`flex items-start gap-[14px] py-[14px] cursor-pointer first:pt-0 last:pb-0 ${
                              checked ? 'is-checked' : ''
                            }`}
                          >
                            {/* Custom checkbox */}
                            <div
                              className={`w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center shrink-0 mt-px transition-colors ${
                                checked
                                  ? 'bg-[#111] border-[#111]'
                                  : 'bg-white border-[#e8e8e8]'
                              }`}
                            >
                              {checked && (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-[13px] h-[13px] stroke-white fill-none"
                                  strokeWidth={2.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setDraft((prev) => ({
                                  ...prev,
                                  property_types: toggleItem(
                                    prev.property_types ?? [],
                                    pt.id,
                                  ),
                                }));
                              }}
                              className="sr-only"
                            />
                            <span className="text-[15px] font-medium text-[#111]">
                              {pt.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hotel class subsection — hotels only */}
                  {!vacationRentals && (
                  <div className="pb-7 border-b border-[#e8e8e8]">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Categoría
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {HOTEL_CLASSES.map((hc) => {
                        const checked = (draft.hotel_classes ?? []).includes(hc.id);
                        return (
                          <label
                            key={hc.id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                              checked
                                ? 'bg-[#111] text-white'
                                : 'bg-[#f7f7f7] text-[#111] hover:bg-[#e5e5e5]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setDraft((prev) => ({
                                  ...prev,
                                  hotel_classes: toggleItem(
                                    prev.hotel_classes ?? [],
                                    hc.id,
                                  ),
                                }));
                              }}
                              className="sr-only"
                            />
                            {hc.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  {/* ── SECTION 2: PRICE RANGE ── */}
                  <div className="pb-7 border-b border-[#e8e8e8]">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Rango de precio
                    </h3>
                    <span className="block text-sm font-medium text-[#111] mb-[14px]">
                      Rango de precio
                    </span>

                    {/* Dual range slider */}
                    <div className="relative h-1 bg-[#e0e0e0] rounded my-[6px] mb-5">
                      {/* Colored fill */}
                      <div
                        className="absolute top-0 h-full bg-[#b3d4f5] rounded pointer-events-none"
                        style={{
                          left: `${((dMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                          right: `${100 - ((dMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                        }}
                      />

                      {/* Min range input */}
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={PRICE_STEP}
                        value={dMin}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((prev) => ({
                            ...prev,
                            min_price: clamp(v, PRICE_MIN, Math.max(v, dMax - PRICE_STEP)),
                          }));
                        }}
                        className="absolute inset-0 w-full h-1 opacity-0 pointer-events-auto cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#b3d4f5] 
                        [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.18)]
                        [&::-webkit-slider-thumb]:transition-colors
                        [&::-webkit-slider-thumb]:hover:border-[#7db8e8]"
                        aria-label="Precio mínimo"
                      />

                      {/* Max range input */}
                      <input
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={PRICE_STEP}
                        value={dMax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((prev) => ({
                            ...prev,
                            max_price: clamp(v, Math.min(v, dMin + PRICE_STEP), PRICE_MAX),
                          }));
                        }}
                        className="absolute inset-0 w-full h-1 opacity-0 pointer-events-auto cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#b3d4f5] 
                        [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.18)]
                        [&::-webkit-slider-thumb]:transition-colors
                        [&::-webkit-slider-thumb]:hover:border-[#7db8e8]"
                        aria-label="Precio máximo"
                      />
                    </div>

                    {/* Min/Max number inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#6A7282] font-medium">
                          Precio min
                        </label>
                        <input
                          type="number"
                          value={dMin}
                          min={PRICE_MIN}
                          max={dMax - PRICE_STEP}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isNaN(v)) {
                              setDraft((prev) => ({
                                ...prev,
                                min_price: clamp(v, PRICE_MIN, dMax - PRICE_STEP),
                              }));
                            }
                          }}
                          className="border-[1.5px] border-[#e8e8e8] rounded-[10px] px-[14px] py-3 text-[15px] text-[#111] outline-none focus:border-[#aaa] transition-colors w-full"
                          aria-label="Precio mínimo"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#6A7282] font-medium">
                          Precio max
                        </label>
                        <input
                          type="number"
                          value={dMax}
                          min={dMin + PRICE_STEP}
                          max={PRICE_MAX}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isNaN(v)) {
                              setDraft((prev) => ({
                                ...prev,
                                max_price: clamp(v, dMin + PRICE_STEP, PRICE_MAX),
                              }));
                            }
                          }}
                          className="border-[1.5px] border-[#e8e8e8] rounded-[10px] px-[14px] py-3 text-[15px] text-[#111] outline-none focus:border-[#aaa] transition-colors w-full"
                          aria-label="Precio máximo"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 3: ROOMS & BEDS — VR only ── */}
                  {vacationRentals && (
                  <div className="pb-7 border-b border-[#e8e8e8]">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Habitaciones y camas
                    </h3>

                    {/* Bedrooms stepper */}
                    <div className="flex items-center justify-between py-4 border-b border-[#e8e8e8]">
                      <span className="text-[15px] font-medium text-[#111]">
                        Dormitorios
                      </span>
                      <div className="flex items-center gap-[18px]">
                        <button
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              bedrooms: Math.max(0, (prev.bedrooms ?? 0) - 1),
                            }))
                          }
                          disabled={(draft.bedrooms ?? 0) <= 0}
                          className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] disabled:text-[#ccc] disabled:border-[#eee] disabled:cursor-default transition-colors shrink-0"
                          aria-label="Reducir dormitorios"
                        >
                          <Minus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                        </button>
                        <span
                          className="text-[15px] font-medium min-w-[20px] text-center"
                          aria-live="polite"
                        >
                          {draft.bedrooms ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              bedrooms: (prev.bedrooms ?? 0) + 1,
                            }))
                          }
                          className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] transition-colors shrink-0"
                          aria-label="Aumentar dormitorios"
                        >
                          <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Bathrooms stepper */}
                    <div className="flex items-center justify-between py-4 last:pb-0 border-b border-[#e8e8e8] last:border-b-0">
                      <span className="text-[15px] font-medium text-[#111]">Baños</span>
                      <div className="flex items-center gap-[18px]">
                        <button
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              bathrooms: Math.max(0, (prev.bathrooms ?? 0) - 1),
                            }))
                          }
                          disabled={(draft.bathrooms ?? 0) <= 0}
                          className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] disabled:text-[#ccc] disabled:border-[#eee] disabled:cursor-default transition-colors shrink-0"
                          aria-label="Reducir baños"
                        >
                          <Minus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                        </button>
                        <span
                          className="text-[15px] font-medium min-w-[20px] text-center"
                          aria-live="polite"
                        >
                          {draft.bathrooms ?? 0}
                        </span>
                        <button
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              bathrooms: (prev.bathrooms ?? 0) + 1,
                            }))
                          }
                          className="w-11 h-11 rounded-full border-[1.5px] border-[#e8e8e8] bg-white flex items-center justify-center text-[#111] hover:border-[#888] transition-colors shrink-0"
                          aria-label="Aumentar baños"
                        >
                          <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* ── SECTION 4: AMENITIES ── */}
                  <div className="pb-7 border-b border-[#e8e8e8] last:border-b-0">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Servicios
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {AMENITIES.map((am) => {
                        const checked = (draft.amenities ?? []).includes(am.id);
                        return (
                          <label
                            key={am.id}
                            className={`flex items-center gap-2.5 px-3.5 py-3 border-[1.5px] rounded-xl cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#111] bg-[#f7f7f7]'
                                : 'border-[#e8e8e8] hover:border-[#aaa] hover:bg-[#f7f7f7]'
                            }`}
                          >
                            {/* Custom checkbox */}
                            <div
                              className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                                checked
                                  ? 'bg-[#111] border-[#111]'
                                  : 'bg-white border-[#e8e8e8]'
                              }`}
                            >
                              {checked && (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-[11px] h-[11px] stroke-white fill-none"
                                  strokeWidth={2.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setDraft((prev) => ({
                                  ...prev,
                                  amenities: toggleItem(
                                    prev.amenities ?? [],
                                    am.id,
                                  ),
                                }));
                              }}
                              className="sr-only"
                            />
                            <span className="text-[13.5px] font-medium text-[#111]">
                              {am.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Additional toggles — hotels only ── */}
                  {!vacationRentals && (
                  <div className="pb-7 border-b border-[#e8e8e8] last:border-b-0">
                    <h3 className="font-display text-[17px] font-bold text-[#111] tracking-[-0.01em] mb-[18px]">
                      Más filtros
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 text-[15px] font-medium text-[#111] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.free_cancellation ?? false}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              free_cancellation: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 rounded accent-[#111]"
                        />
                        Cancelación gratuita
                      </label>
                      <label className="flex items-center gap-3 text-[15px] font-medium text-[#111] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.special_offers ?? false}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              special_offers: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 rounded accent-[#111]"
                        />
                        Ofertas especiales
                      </label>
                      <label className="flex items-center gap-3 text-[15px] font-medium text-[#111] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.eco_certified ?? false}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              eco_certified: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 rounded accent-[#111]"
                        />
                        Eco certificado
                      </label>
                    </div>
                  </div>
                  )}
                </div>

                {/* ── STICKY FOOTER ── */}
                <div className="flex items-center justify-between px-6 py-[18px] border-t border-[#e8e8e8] bg-white shrink-0">
                  <button
                    onClick={handleClear}
                    className="text-sm font-medium text-[#111] underline underline-offset-[3px] hover:text-[#555] transition-colors py-2"
                  >
                    Limpiar todo
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-7 py-3.5 rounded-full bg-[#111] text-white text-[15px] font-semibold hover:bg-[#333] hover:scale-[1.02] transition-all"
                  >
                    Mostrar resultados
                  </button>
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
