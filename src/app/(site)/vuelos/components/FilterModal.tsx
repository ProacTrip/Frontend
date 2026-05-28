'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Plane, Building2, Clock, CreditCard, SlidersHorizontal } from 'lucide-react';
import type { VueloFilterValues } from './FilterBar';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: VueloFilterValues;
  onApply: (filters: VueloFilterValues) => void;
  onClear: () => void;
  availableAirlines?: Array<{ code: string; name: string; logoUrl?: string }>;
  scrollToSection?: string;
}

const STOPS_OPTIONS = [
  { value: 'any' as const, label: 'Cualquiera' },
  { value: 'nonstop' as const, label: 'Directo' },
  { value: 'max_1' as const, label: '1 escala max.' },
  { value: 'max_2' as const, label: '2 escalas max.' },
];

const CABIN_OPTIONS = [
  { value: 'economy', label: 'Turista' },
  { value: 'premium_economy', label: 'Turista Premium' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'Primera' },
];

const SORT_OPTIONS = [
  { value: 'top', label: 'Mejores vuelos' },
  { value: 'price', label: 'Precio mas bajo' },
  { value: 'departure_time', label: 'Hora de salida' },
  { value: 'arrival_time', label: 'Hora de llegada' },
  { value: 'duration', label: 'Duracion' },
  { value: 'emissions', label: 'Menos emisiones' },
];

export default function FilterModal({
  open,
  onClose,
  filters,
  onApply,
  onClear,
  availableAirlines = [],
  scrollToSection,
}: FilterModalProps) {
  const [draft, setDraft] = useState<VueloFilterValues>(filters);
  const [priceText, setPriceText] = useState(filters.max_price?.toString() || '');
  const [durationLocal, setDurationLocal] = useState(filters.max_duration_minutes || 1440);

  // Scroll to section when modal opens with a chip target
  useEffect(() => {
    if (!open || !scrollToSection) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`filter-section-${scrollToSection}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [open, scrollToSection]);

  const toggleAirline = (code: string) => {
    const current = draft.include_airlines || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    setDraft({ ...draft, include_airlines: updated.length > 0 ? updated : undefined });
  };

  const commitPrice = () => {
    const num = parseInt(priceText);
    if (!isNaN(num) && num > 0) {
      setDraft({ ...draft, max_price: num });
    } else {
      setDraft({ ...draft, max_price: null });
    }
  };

  const handleApply = () => onApply(draft);
  const handleClear = () => {
    const cleared: VueloFilterValues = {};
    setDraft(cleared);
    setPriceText('');
    setDurationLocal(1440);
    onClear();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-black/30 z-[1000]" />
      <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel className="w-full sm:max-w-lg max-h-[85dvh] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-neutral-900" />
              <DialogTitle className="font-[family-name:var(--font-syne)] text-lg font-bold text-neutral-900">
                Filtros
              </DialogTitle>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors" aria-label="Cerrar">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Sort */}
            <div id="filter-section-sort" className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                Ordenar por
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      draft.sort_by === opt.value
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sort_by"
                      checked={draft.sort_by === opt.value || (!draft.sort_by && opt.value === 'top')}
                      onChange={() => setDraft({ ...draft, sort_by: opt.value })}
                      className="w-4 h-4 accent-neutral-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Airlines */}
            {availableAirlines.length > 0 && (
              <div id="filter-section-airlines" className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Building2 className="w-4 h-4 text-neutral-500" />
                  Aerolineas
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableAirlines.map((al) => (
                    <label
                      key={al.code}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(draft.include_airlines || []).includes(al.code)}
                        onChange={() => toggleAirline(al.code)}
                        className="w-4 h-4 rounded accent-neutral-900"
                      />
                      {al.name}
                      <span className="text-neutral-400 text-xs ml-auto">{al.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Stops */}
            <div id="filter-section-stops" className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <Plane className="w-4 h-4 text-neutral-500" />
                Escalas
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STOPS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      draft.stops === opt.value || (!draft.stops && opt.value === 'any')
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stops_modal"
                      checked={draft.stops === opt.value || (!draft.stops && opt.value === 'any')}
                      onChange={() => setDraft({ ...draft, stops: opt.value })}
                      className="w-4 h-4 accent-neutral-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div id="filter-section-price" className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <CreditCard className="w-4 h-4 text-neutral-500" />
                Precio maximo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  onBlur={commitPrice}
                  onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
                  placeholder="Ej: 500"
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
                />
                <span className="text-sm text-neutral-500">EUR</span>
              </div>
            </div>

            {/* Duration */}
            <div id="filter-section-duration" className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <Clock className="w-4 h-4 text-neutral-500" />
                Duracion maxima: {formatDurationText(durationLocal)}
              </label>
              <input
                type="range"
                min="60"
                max="1440"
                step="30"
                value={durationLocal}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDurationLocal(val);
                  setDraft({ ...draft, max_duration_minutes: val < 1440 ? val : null });
                }}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>1h</span>
                <span>24h</span>
              </div>
            </div>

            {/* Cabin class */}
            <div id="filter-section-cabin" className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                Clase
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CABIN_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      draft.travel_class === opt.value
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cabin_modal"
                      checked={draft.travel_class === opt.value}
                      onChange={() => setDraft({ ...draft, travel_class: opt.value })}
                      className="w-4 h-4 accent-neutral-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-200 shrink-0">
            <button
              onClick={handleClear}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function formatDurationText(minutes: number): string {
  if (minutes >= 1440) return 'Sin limite';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
