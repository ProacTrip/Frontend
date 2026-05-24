'use client';

import { useState } from 'react';
import { useUpdateTravelPreferences } from '@/hooks/useUpdateTravelPreferences';
import { TravelPreferences } from '@/app/lib/types/user';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Save, AlertCircle, Plane, UtensilsCrossed, Hotel, Clock, Building2, ChevronDown } from 'lucide-react';
import Button from "@/components/ui/Button";

interface Props {
  prefs: TravelPreferences;
  onSave: () => void;
}

/**
 * Separator used for joining/splitting array fields in text inputs.
 * Using semicolon instead of comma to avoid splitting hotel/airline names
 * that contain commas (e.g., "JW Marriott, Dubai").
 */
const ARRAY_SEPARATOR = '; ';

const CLASS_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

const SEAT_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'window', label: 'Ventana' },
  { value: 'aisle', label: 'Pasillo' },
  { value: 'middle', label: 'Medio' },
  { value: 'no_preference', label: 'Sin preferencia (explícito)' },
];

export function TravelForm({ prefs, onSave }: Props) {
  const updatePrefsMutation = useUpdateTravelPreferences();

  const [form, setForm] = useState({
    preferred_class: prefs.preferred_class ?? '',
    seat_preference: prefs.seat_preference ?? '',
    meal_preference: prefs.meal_preference ?? '',
    special_assistance: (prefs.special_assistance ?? []).join(ARRAY_SEPARATOR),
    preferred_airlines: (prefs.preferred_airlines ?? []).join(ARRAY_SEPARATOR),
    preferred_hotels: (prefs.preferred_hotels ?? []).join(ARRAY_SEPARATOR),
    avoid_layovers: prefs.avoid_layovers ?? false,
    max_layover_duration: prefs.max_layover_duration ?? '',
  });
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const setPreferredClass = (value: string) => setForm((prev) => ({ ...prev, preferred_class: value }));
  const setSeatPreference = (value: string) => setForm((prev) => ({ ...prev, seat_preference: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload: Record<string, unknown> = {};

      if (form.preferred_class) payload.preferred_class = form.preferred_class;
      if (form.seat_preference) payload.seat_preference = form.seat_preference;
      if (form.meal_preference) payload.meal_preference = form.meal_preference;

      // Array fields: split by semicolon (not comma) to avoid splitting
      // hotel names like "JW Marriott, Dubai" into separate entries.
      if (form.special_assistance.trim()) {
        payload.special_assistance = form.special_assistance
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (form.preferred_airlines.trim()) {
        payload.preferred_airlines = form.preferred_airlines
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (form.preferred_hotels.trim()) {
        payload.preferred_hotels = form.preferred_hotels
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      payload.avoid_layovers = form.avoid_layovers;
      if (form.max_layover_duration !== '' && form.max_layover_duration !== null) {
        payload.max_layover_duration = Number(form.max_layover_duration);
      }

      await updatePrefsMutation.mutateAsync(payload);
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Plane className="w-5 h-5 text-[--color-brand-500]" /> Preferencias de viaje
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clase preferida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clase preferida</label>
          <Listbox value={form.preferred_class} onChange={setPreferredClass}>
            <ListboxButton className="w-full p-3 border border-neutral-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white">
              <span className={form.preferred_class ? 'text-gray-800' : 'text-gray-400'}>
                {CLASS_OPTIONS.find((c) => c.value === form.preferred_class)?.label ?? 'Sin preferencia'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className="w-[var(--button-width)] bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-50"
            >
              {CLASS_OPTIONS.map((opt) => (
                <ListboxOption
                  key={opt.value}
                  value={opt.value}
                  className="px-4 py-2.5 cursor-pointer data-[focus]:bg-brand-50 data-[selected]:bg-brand-100"
                >
                  {opt.label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>

        {/* Asiento preferido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asiento preferido</label>
          <Listbox value={form.seat_preference} onChange={setSeatPreference}>
            <ListboxButton className="w-full p-3 border border-neutral-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white">
              <span className={form.seat_preference ? 'text-gray-800' : 'text-gray-400'}>
                {SEAT_OPTIONS.find((s) => s.value === form.seat_preference)?.label ?? 'Sin preferencia'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className="w-[var(--button-width)] bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-50"
            >
              {SEAT_OPTIONS.map((opt) => (
                <ListboxOption
                  key={opt.value}
                  value={opt.value}
                  className="px-4 py-2.5 cursor-pointer data-[focus]:bg-brand-50 data-[selected]:bg-brand-100"
                >
                  {opt.label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>

        {/* Comida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <UtensilsCrossed className="w-4 h-4" /> Comida preferida
          </label>
          <input
            name="meal_preference"
            value={form.meal_preference}
            onChange={handleChange}
            placeholder="Vegetariana, kosher, halal..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Aerolíneas preferidas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Building2 className="w-4 h-4" /> Aerolíneas preferidas
          </label>
          <input
            name="preferred_airlines"
            value={form.preferred_airlines}
            onChange={handleChange}
            placeholder="ryanair; iberia; lufthansa..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Hoteles preferidos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Hotel className="w-4 h-4" /> Hoteles preferidos
          </label>
          <input
            name="preferred_hotels"
            value={form.preferred_hotels}
            onChange={handleChange}
            placeholder="hilton; marriott; hyatt..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Máx. escala */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Máx. escala (min)
          </label>
          <input
            type="number"
            name="max_layover_duration"
            value={form.max_layover_duration}
            onChange={handleChange}
            min="0"
            placeholder="120"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Asistencia especial */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Asistencia especial</label>
          <input
            name="special_assistance"
            value={form.special_assistance}
            onChange={handleChange}
            placeholder="wheelchair; visual; hearing..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Evitar escalas */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          name="avoid_layovers"
          checked={form.avoid_layovers}
          onChange={handleChange}
          className="w-5 h-5 text-[--color-brand-500] rounded focus:ring-[--color-brand-500]"
        />
        <label className="text-sm text-gray-700">Evitar escalas</label>
      </div>

      <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
        <Button
          type="submit"
          variant="brand"
          isLoading={updatePrefsMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="w-5 h-5" /> Guardar cambios
        </Button>
      </div>
    </form>
  );
}
