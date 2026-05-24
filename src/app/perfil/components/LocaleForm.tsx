'use client';

import { useState } from 'react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import type { Profile, UpdateProfileBody } from '@/app/lib/types/user';
import { Save, AlertCircle, Globe, Clock, Languages, Coins } from 'lucide-react';

interface Props {
  profile: Profile;
  onSave: () => void;
}

// Listas predefinidas (puedes expandirlas o cargarlas de una API)
const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];

const CURRENCIES = [
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'USD', name: 'Dólar estadounidense ($)' },
  { code: 'GBP', name: 'Libra esterlina (£)' },
  { code: 'JPY', name: 'Yen japonés (¥)' },
  { code: 'CHF', name: 'Franco suizo (Fr)' },
  { code: 'CAD', name: 'Dólar canadiense (C$)' },
  { code: 'AUD', name: 'Dólar australiano (A$)' },
  { code: 'MXN', name: 'Peso mexicano ($)' },
  { code: 'BRL', name: 'Real brasileño (R$)' },
  { code: 'ARS', name: 'Peso argentino ($)' },
];

export function LocaleForm({ profile, onSave }: Props) {
  const updateProfileMutation = useUpdateProfile();

  const [form, setForm] = useState({
    timezone_name: profile.timezone_name ?? '',
    language_code: profile.language_code ?? '',
    currency_code: profile.currency_code ?? '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // locale update merged into updateProfile (PATCH /v1/user/profile)
      const payload: UpdateProfileBody = {};
      if (form.language_code) payload.language = form.language_code;
      if (form.currency_code) payload.currency = form.currency_code;

      await updateProfileMutation.mutateAsync(payload);
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar localización');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Globe className="w-5 h-5 text-[--color-brand-500]" /> Localización
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Zona horaria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Zona horaria
          </label>
          <select
            name="timezone_name"
            value={form.timezone_name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Seleccionar...</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Languages className="w-4 h-4" /> Idioma
          </label>
          <select
            name="language_code"
            value={form.language_code}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Seleccionar...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Coins className="w-4 h-4" /> Moneda
          </label>
          <select
            name="currency_code"
            value={form.currency_code}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Seleccionar...</option>
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={updateProfileMutation.isPending}
        className="px-6 py-3 bg-[--color-brand-500] text-white rounded-xl font-bold hover:bg-[--color-brand-600] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {updateProfileMutation.isPending ? (
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