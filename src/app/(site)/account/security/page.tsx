'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getProfile, updateLocale } from '@/lib/api/user';
import { FormField } from '@/components/account/FormField';
import { Shield, Globe, Mail, UserCog, Search } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const TIMEZONE_OPTIONS = [
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Mendoza',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Pacific/Auckland',
];

const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
];

const CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'USD', label: 'USD — Dólar estadounidense' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'UYU', label: 'UYU — Peso uruguayo' },
  { code: 'GBP', label: 'GBP — Libra esterlina' },
];

interface LocaleForm {
  timezone_name: string;
  language_code: string;
  currency_code: string;
  current_location: string;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [locale, setLocale] = useState<LocaleForm>({
    timezone_name: '',
    language_code: '',
    currency_code: '',
    current_location: '',
  });
  const [originalLocale, setOriginalLocale] = useState<LocaleForm | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await getProfile();
        if (cancelled) return;

        const form: LocaleForm = {
          timezone_name: profile.location?.timezone ?? '',
          language_code: profile.location?.language ?? '',
          currency_code: profile.location?.currency ?? '',
          current_location: profile.location?.city ?? '',
        };
        setLocale(form);
        setOriginalLocale(form);
      } catch (err: unknown) {
        if (!cancelled) {
          const detail =
            (err as { detail?: string })?.detail ||
            (err as { message?: string })?.message ||
            'Error al cargar la configuración.';
          setError(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const hasChanges = originalLocale
    ? locale.timezone_name !== originalLocale.timezone_name ||
      locale.language_code !== originalLocale.language_code ||
      locale.currency_code !== originalLocale.currency_code ||
      locale.current_location !== originalLocale.current_location
    : false;

  const handleSaveLocale = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      await updateLocale({
        timezone_name: locale.timezone_name || undefined,
        language_code: locale.language_code || undefined,
        currency_code: locale.currency_code || undefined,
        current_location: locale.current_location || undefined,
      });
      setOriginalLocale({ ...locale });
      setSaveMessage({ type: 'success', text: 'Configuración regional actualizada.' });
    } catch (err: unknown) {
      const detail =
        (err as { detail?: string })?.detail ||
        (err as { message?: string })?.message ||
        'Error al guardar la configuración.';
      setSaveMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback(
    (field: keyof LocaleForm, value: string) => {
      setLocale((prev) => ({ ...prev, [field]: value }));
      setSaveMessage(null);
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-paper-container animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-paper-container animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6">
          <div className="h-20 w-full rounded-lg bg-paper-container animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.h1
          suppressHydrationWarning
          variants={itemVariants}
          className="text-2xl font-bold text-ink"
        >
          Seguridad y Región
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-error-container p-6"
        >
          <p className="text-error text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.h1
        suppressHydrationWarning
        variants={itemVariants}
        className="text-2xl font-bold text-ink"
      >
        Seguridad y Región
      </motion.h1>

      {/* ── Locale Settings ── */}
      <motion.section
        variants={itemVariants}
        className="rounded-xl border border-paper-outline bg-paper-dim p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Globe size={20} className="text-ink-muted" />
          <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
            Configuración Regional
          </h2>
        </div>

        <div className="space-y-4">
          <FormField label="Zona horaria" htmlFor="timezone" hint="Define los horarios de tus búsquedas y alertas.">
            <select
              id="timezone"
              value={locale.timezone_name}
              onChange={(e) => updateField('timezone_name', e.target.value)}
              className="w-full rounded-lg border border-paper-outline bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/40 transition-colors appearance-none"
            >
              <option value="">Seleccionar zona horaria</option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Idioma" htmlFor="language" hint="Idioma de la interfaz y notificaciones.">
            <select
              id="language"
              value={locale.language_code}
              onChange={(e) => updateField('language_code', e.target.value)}
              className="w-full rounded-lg border border-paper-outline bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/40 transition-colors appearance-none"
            >
              <option value="">Seleccionar idioma</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Moneda" htmlFor="currency" hint="Moneda para mostrar precios en búsquedas.">
            <select
              id="currency"
              value={locale.currency_code}
              onChange={(e) => updateField('currency_code', e.target.value)}
              className="w-full rounded-lg border border-paper-outline bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/40 transition-colors appearance-none"
            >
              <option value="">Seleccionar moneda</option>
              {CURRENCY_OPTIONS.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Ubicación actual" htmlFor="location" hint="Ciudad donde te encontrás actualmente.">
            <input
              id="location"
              type="text"
              value={locale.current_location}
              onChange={(e) => updateField('current_location', e.target.value)}
              placeholder="Ej: Buenos Aires"
              className="w-full rounded-lg border border-paper-outline bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/40 transition-colors"
            />
          </FormField>
        </div>

        {/* ── Save message ── */}
        {saveMessage && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
              saveMessage.type === 'success'
                ? 'bg-success-container text-success'
                : 'bg-error-container text-error'
            }`}
            role="alert"
          >
            {saveMessage.text}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-paper-outline">
          <button
            type="button"
            onClick={handleSaveLocale}
            disabled={saving || !hasChanges}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-coral text-white hover:bg-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </motion.section>

      {/* ── Account Info ── */}
      <motion.section
        variants={itemVariants}
        className="rounded-xl border border-paper-outline bg-paper-dim p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Shield size={20} className="text-ink-muted" />
          <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
            Información de la Cuenta
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-faint uppercase tracking-wider">
              Email
            </label>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-ink-faint" />
              <p className="text-sm text-ink font-mono">{user?.email ?? '—'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-faint uppercase tracking-wider">
              Rol
            </label>
            <div className="flex items-center gap-2">
              <UserCog size={16} className="text-ink-faint" />
              <p className="text-sm text-ink capitalize">
                {user?.role_name === 'client'
                  ? 'Usuario'
                  : user?.role_name === 'admin'
                  ? 'Administrador'
                  : user?.role_name ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Saved Searches ── */}
      <motion.section
        variants={itemVariants}
        className="rounded-xl border border-paper-outline bg-paper-dim p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Search size={20} className="text-ink-muted" />
          <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
            Búsquedas Guardadas
          </h2>
        </div>

        <div className="rounded-lg border border-paper-outline bg-paper p-6 text-center space-y-2">
          <Search size={32} className="mx-auto text-ink-faint" />
          <p className="text-ink-muted text-sm font-medium">Próximamente</p>
          <p className="text-ink-faint text-xs">
            Podrás guardar tus búsquedas frecuentes y recibir alertas de precio.
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}
