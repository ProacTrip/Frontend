'use client';

import { useState, useEffect, useRef } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import type { Profile, UpdateProfileBody } from '@/app/lib/types/user';
import { Save, AlertCircle, Globe, Languages, Coins, ChevronDown } from 'lucide-react';
import Button from "@/components/ui/Button";

interface Props {
  profile: Profile;
  onSave: () => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'th', name: 'ไทย' },
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
  const { setActiveCurrency } = useCurrencyContext();

  const hasModified = useRef(false);

  const [form, setForm] = useState({
    language_code: profile.language_code ?? '',
    currency_code: profile.currency_code ?? '',
  });
  const [error, setError] = useState('');

  // Sync form state with fresh profile data from background refetches.
  // Only sync if the user hasn't made any edits.
  useEffect(() => {
    if (!hasModified.current) {
      setForm({
        language_code: profile.language_code ?? '',
        currency_code: profile.currency_code ?? '',
      });
    }
  }, [profile]);

  const setLanguage = (code: string) => { hasModified.current = true; setForm((prev) => ({ ...prev, language_code: code })); };
  const setCurrency = (code: string) => { hasModified.current = true; setForm((prev) => ({ ...prev, currency_code: code })); };

  const selectedLanguage = LANGUAGES.find((l) => l.code === form.language_code) ?? null;
  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency_code) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload: UpdateProfileBody = {};
      if (form.language_code) payload.language = form.language_code;
      if (form.currency_code) payload.currency = form.currency_code;

      await updateProfileMutation.mutateAsync(payload);
      if (payload.currency) {
        setActiveCurrency(payload.currency);
      }
      hasModified.current = false;
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Globe className="w-5 h-5 text-[--color-brand-500]" /> Idioma y moneda
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Languages className="w-4 h-4" /> Idioma
          </label>
          <Listbox value={selectedLanguage} onChange={(opt) => setLanguage(opt?.code ?? '')}>
            <ListboxButton className="w-full p-3 border border-neutral-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white">
              <span className={form.language_code ? 'text-gray-800' : 'text-gray-400'}>
                {selectedLanguage?.name ?? 'Seleccionar...'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className="w-[var(--button-width)] bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-50"
            >
              {LANGUAGES.map((lang) => (
                <ListboxOption
                  key={lang.code}
                  value={lang}
                  className="px-4 py-2.5 cursor-pointer data-[focus]:bg-brand-50 data-[selected]:bg-brand-100"
                >
                  {lang.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Coins className="w-4 h-4" /> Moneda
          </label>
          <Listbox value={selectedCurrency} onChange={(opt) => setCurrency(opt?.code ?? '')}>
            <ListboxButton className="w-full p-3 border border-neutral-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white">
              <span className={form.currency_code ? 'text-gray-800' : 'text-gray-400'}>
                {selectedCurrency?.name ?? 'Seleccionar...'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className="w-[var(--button-width)] bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-50"
            >
              {CURRENCIES.map((curr) => (
                <ListboxOption
                  key={curr.code}
                  value={curr}
                  className="px-4 py-2.5 cursor-pointer data-[focus]:bg-brand-50 data-[selected]:bg-brand-100"
                >
                  {curr.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
        <Button
          type="submit"
          variant="brand"
          isLoading={updateProfileMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="w-5 h-5" /> Guardar cambios
        </Button>
      </div>
    </form>
  );
}
