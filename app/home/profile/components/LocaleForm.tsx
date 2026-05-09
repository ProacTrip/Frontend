'use client';

import { useState } from 'react';
import { updateLocale } from '@/app/lib/api';
import { Profile } from '@/app/lib/types/user';
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
  const [form, setForm] = useState({
    timezone_name: profile.timezone_name ?? '',
    language_code: profile.language_code ?? '',
    currency_code: profile.currency_code ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Solo enviar campos que tengan valor
      const payload: Record<string, string> = {};
      if (form.timezone_name) payload.timezone_name = form.timezone_name;
      if (form.language_code) payload.language_code = form.language_code;
      if (form.currency_code) payload.currency_code = form.currency_code;

      await updateLocale(payload);
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Globe className="w-5 h-5 text-[#FF6B6B]" /> Localización
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all bg-white"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all bg-white"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all bg-white"
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
        disabled={isSaving}
        className="px-6 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold hover:bg-[#ff5252] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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