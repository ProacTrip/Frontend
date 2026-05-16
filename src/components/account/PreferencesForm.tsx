'use client';

import { useState } from 'react';
import type { TravelPreferences } from '@/lib/api/types';
import { updateTravelPreferences } from '@/lib/api/user';
import { FormField } from './FormField';

const CLASS_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'economy', label: 'Económica' },
  { value: 'premium_economy', label: 'Económica Premium' },
  { value: 'business', label: 'Ejecutiva' },
  { value: 'first', label: 'Primera clase' },
] as const;

const SEAT_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'window', label: 'Ventanilla' },
  { value: 'aisle', label: 'Pasillo' },
  { value: 'middle', label: 'Medio' },
  { value: 'no_preference', label: 'Sin preferencia' },
] as const;

interface PreferencesFormProps {
  initial: TravelPreferences;
}

function toForm(prefs: TravelPreferences) {
  return {
    preferred_class: prefs.preferred_class ?? '',
    seat_preference: prefs.seat_preference ?? '',
    meal_preference: prefs.meal_preference ?? '',
    special_assistance: (prefs.special_assistance ?? []).join(', '),
    preferred_airlines: (prefs.preferred_airlines ?? []).join(', '),
    preferred_hotels: (prefs.preferred_hotels ?? []).join(', '),
    avoid_layovers: prefs.avoid_layovers ?? false,
    max_layover_duration: prefs.max_layover_duration?.toString() ?? '',
  };
}

export function PreferencesForm({ initial }: PreferencesFormProps) {
  const defaults = toForm(initial);
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const body: Record<string, unknown> = {};

    // Only include fields that differ from initial
    if (form.preferred_class !== defaults.preferred_class) {
      body.preferred_class = form.preferred_class || null;
    }
    if (form.seat_preference !== defaults.seat_preference) {
      body.seat_preference = form.seat_preference || null;
    }
    if (form.meal_preference !== defaults.meal_preference) {
      body.meal_preference = form.meal_preference || null;
    }

    // Parse comma-separated tags into arrays
    const newAssistance = form.special_assistance
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const oldAssistance = initial.special_assistance ?? [];
    if (JSON.stringify(newAssistance) !== JSON.stringify(oldAssistance)) {
      body.special_assistance = newAssistance;
    }

    const newAirlines = form.preferred_airlines
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const oldAirlines = initial.preferred_airlines ?? [];
    if (JSON.stringify(newAirlines) !== JSON.stringify(oldAirlines)) {
      body.preferred_airlines = newAirlines;
    }

    const newHotels = form.preferred_hotels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const oldHotels = initial.preferred_hotels ?? [];
    if (JSON.stringify(newHotels) !== JSON.stringify(oldHotels)) {
      body.preferred_hotels = newHotels;
    }

    if (form.avoid_layovers !== defaults.avoid_layovers) {
      body.avoid_layovers = form.avoid_layovers;
    }
    const dur = form.max_layover_duration ? parseInt(form.max_layover_duration, 10) : null;
    if (dur !== (initial.max_layover_duration ?? null) && !isNaN(dur as number)) {
      body.max_layover_duration = dur;
    }

    if (Object.keys(body).length === 0) {
      setMessage({ type: 'success', text: 'No hay cambios para guardar.' });
      setSaving(false);
      return;
    }

    try {
      await updateTravelPreferences(body as Parameters<typeof updateTravelPreferences>[0]);
      setMessage({ type: 'success', text: 'Preferencias de viaje actualizadas.' });
    } catch (err: unknown) {
      const detail = (err as { detail?: string; message?: string })?.detail
        || (err as { message?: string })?.message
        || 'Error al guardar las preferencias.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
      <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
        Preferencias de Viaje
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Clase preferida" htmlFor="preferred_class">
          <select
            id="preferred_class"
            value={form.preferred_class}
            onChange={set('preferred_class')}
            className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
          >
            {CLASS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Asiento preferido" htmlFor="seat_preference">
          <select
            id="seat_preference"
            value={form.seat_preference}
            onChange={set('seat_preference')}
            className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
          >
            {SEAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Preferencia de comida" htmlFor="meal_preference">
        <input
          id="meal_preference"
          type="text"
          value={form.meal_preference}
          onChange={set('meal_preference')}
          placeholder="Ej: vegetariana, sin gluten..."
          className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
        />
      </FormField>

      <FormField label="Asistencia especial" htmlFor="special_assistance" hint="Separar con comas (ej: silla de ruedas, asistencia visual)">
        <input
          id="special_assistance"
          type="text"
          value={form.special_assistance}
          onChange={set('special_assistance')}
          placeholder="Ej: silla de ruedas"
          className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
        />
      </FormField>

      <FormField label="Aerolíneas preferidas" htmlFor="preferred_airlines" hint="Separar con comas">
        <input
          id="preferred_airlines"
          type="text"
          value={form.preferred_airlines}
          onChange={set('preferred_airlines')}
          placeholder="Ej: Aerolíneas Argentinas, LATAM"
          className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
        />
      </FormField>

      <FormField label="Hoteles preferidos" htmlFor="preferred_hotels" hint="Separar con comas">
        <input
          id="preferred_hotels"
          type="text"
          value={form.preferred_hotels}
          onChange={set('preferred_hotels')}
          placeholder="Ej: Marriott, Hilton"
          className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
        />
      </FormField>

      {/* ── Layover preferences ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          <p className="text-sm font-medium text-ink">Evitar escalas</p>
          <p className="text-xs text-ink-muted mt-0.5">Solo mostrar vuelos directos</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.avoid_layovers}
            onChange={set('avoid_layovers')}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-paper-container peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral" />
        </label>
      </div>

      {form.avoid_layovers && (
        <FormField label="Duración máxima de escala (minutos)" htmlFor="max_layover_duration">
          <input
            id="max_layover_duration"
            type="number"
            min="0"
            value={form.max_layover_duration}
            onChange={set('max_layover_duration')}
            placeholder="120"
            className="w-full max-w-[12rem] px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
          />
        </FormField>
      )}

      {/* ── Feedback ── */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-success-container text-success'
              : 'bg-error-container text-error'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-coral text-white text-sm font-semibold hover:bg-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </div>
    </form>
  );
}
