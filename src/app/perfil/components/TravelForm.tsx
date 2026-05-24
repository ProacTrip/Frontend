'use client';

import { useState } from 'react';
import { updateTravelPreferences } from '@/app/lib/api';
import { TravelPreferences } from '@/app/lib/types/user';
import { Save, AlertCircle, Plane, UtensilsCrossed, Hotel, Clock, Building2 } from 'lucide-react';

interface Props {
  prefs: TravelPreferences;
  onSave: () => void;
}

export function TravelForm({ prefs, onSave }: Props) {
  const [form, setForm] = useState({
    preferred_class: prefs.preferred_class ?? '',
    seat_preference: prefs.seat_preference ?? '',
    meal_preference: prefs.meal_preference ?? '',
    special_assistance: (prefs.special_assistance ?? []).join(', '),
    preferred_airlines: (prefs.preferred_airlines ?? []).join(', '),  // ← NUEVO
    preferred_hotels: (prefs.preferred_hotels ?? []).join(', '),
    avoid_layovers: prefs.avoid_layovers ?? false,
    max_layover_duration: prefs.max_layover_duration ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {};

      if (form.preferred_class) payload.preferred_class = form.preferred_class;
      if (form.seat_preference) payload.seat_preference = form.seat_preference;
      if (form.meal_preference) payload.meal_preference = form.meal_preference;
      if (form.special_assistance.trim()) {
        payload.special_assistance = form.special_assistance.split(',').map((s) => s.trim()).filter(Boolean);
      }
      // ← NUEVO: Aerolíneas preferidas
      if (form.preferred_airlines.trim()) {
        payload.preferred_airlines = form.preferred_airlines.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (form.preferred_hotels.trim()) {
        payload.preferred_hotels = form.preferred_hotels.split(',').map((s) => s.trim()).filter(Boolean);
      }
      payload.avoid_layovers = form.avoid_layovers;
      if (form.max_layover_duration !== '' && form.max_layover_duration !== null) {
        payload.max_layover_duration = Number(form.max_layover_duration);
      }

      await updateTravelPreferences(payload);
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
    } finally {
      setIsSaving(false);
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
          <select
            name="preferred_class"
            value={form.preferred_class}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Sin preferencia</option>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>

        {/* Asiento preferido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asiento preferido</label>
          <select
            name="seat_preference"
            value={form.seat_preference}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Sin preferencia</option>
            <option value="window">Ventana</option>
            <option value="aisle">Pasillo</option>
            <option value="middle">Medio</option>
            <option value="no_preference">Sin preferencia (explícito)</option>
          </select>
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

        {/* Aerolíneas preferidas ← NUEVO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Building2 className="w-4 h-4" /> Aerolíneas preferidas
          </label>
          <input
            name="preferred_airlines"
            value={form.preferred_airlines}
            onChange={handleChange}
            placeholder="ryanair, iberia, lufthansa..."
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
            placeholder="hilton, marriott, hyatt..."
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
            placeholder="wheelchair, visual, hearing..."
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

      <button
        type="submit"
        disabled={isSaving}
        className="px-6 py-3 bg-[--color-brand-500] text-white rounded-xl font-bold hover:bg-[--color-brand-600] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {isSaving ? (
          'Guardando...'
        ) : (
          <>
            <Save className="w-5 h-5" /> Guardar cambios
          </>
        )}
      </button>
    </form>
  );
}