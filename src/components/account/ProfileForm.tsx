'use client';

import { useState } from 'react';
import type { GetProfileResponse } from '@/lib/api/types';
import { updateProfile } from '@/lib/api/user';
import { FormField } from './FormField';

const GENDER_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'non_binary', label: 'No binario' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
] as const;

interface ProfileFormProps {
  profile: GetProfileResponse;
  email: string;
}

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  bio: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  is_public: boolean;
}

function toFormState(profile: GetProfileResponse): ProfileFormState {
  return {
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    gender: profile.gender ?? '',
    nationality: profile.nationality ?? '',
    is_public: profile.is_public,
  };
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const initial = toFormState(profile);
  const [form, setForm] = useState<ProfileFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = (field: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Build partial update: only send changed fields
    const changes: Record<string, unknown> = {};
    for (const key of Object.keys(initial) as (keyof ProfileFormState)[]) {
      if (form[key] !== initial[key]) {
        changes[key] = form[key] === '' ? null : form[key];
      }
    }

    // Always include is_public if it changed (boolean)
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'success', text: 'No hay cambios para guardar.' });
      setSaving(false);
      return;
    }

    try {
      await updateProfile(changes as Partial<typeof profile>);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err: unknown) {
      const detail = (err as { detail?: string; message?: string })?.detail
        || (err as { message?: string })?.message
        || 'Error al guardar los cambios.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Personal Info ── */}
      <section className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
        <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
          Información Personal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombre" htmlFor="first_name">
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={set('first_name')}
              placeholder="Tu nombre"
              className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
            />
          </FormField>

          <FormField label="Apellido" htmlFor="last_name">
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={set('last_name')}
              placeholder="Tu apellido"
              className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
            />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper-container/50 text-ink-muted text-sm cursor-not-allowed"
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="phone" hint="Formato internacional: +54 9 11 2345-6789">
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+5491123456789"
            className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
          />
        </FormField>

        <FormField label="Bio" htmlFor="bio">
          <textarea
            id="bio"
            value={form.bio}
            onChange={set('bio') as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
            placeholder="Contanos un poco sobre vos..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm resize-none"
          />
        </FormField>
      </section>

      {/* ── Identity ── */}
      <section className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
        <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
          Identidad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Fecha de nacimiento" htmlFor="date_of_birth">
            <input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={set('date_of_birth')}
              className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
            />
          </FormField>

          <FormField label="Género" htmlFor="gender">
            <select
              id="gender"
              value={form.gender}
              onChange={set('gender')}
              className="w-full px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Nacionalidad" htmlFor="nationality" hint="Código ISO de 2 letras (ej: AR, ES, US)">
          <input
            id="nationality"
            type="text"
            value={form.nationality}
            onChange={set('nationality')}
            placeholder="AR"
            maxLength={2}
            className="w-full max-w-[8rem] px-3 py-2.5 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm uppercase"
          />
        </FormField>
      </section>

      {/* ── Visibility ── */}
      <section className="rounded-xl border border-paper-outline bg-paper-dim p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 suppressHydrationWarning className="text-sm font-medium text-ink">
              Perfil público
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Permitir que otros usuarios vean tu perfil
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((prev) => ({ ...prev, is_public: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-paper-container peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral" />
          </label>
        </div>
      </section>

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

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-coral text-white text-sm font-semibold hover:bg-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
