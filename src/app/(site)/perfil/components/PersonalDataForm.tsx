'use client';

import { useState, useEffect, useRef } from 'react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { Profile, UpdateProfileBody } from '@/app/lib/types/user';
import { Save, AlertCircle, User, Calendar, Globe, Phone, FileText, CheckCircle } from 'lucide-react';
import Button from "@/components/ui/Button";

interface Props {
  profile: Profile;
}

export function PersonalDataForm({ profile }: Props) {
  const updateProfileMutation = useUpdateProfile();

  const hasModified = useRef(false);
  const justSavedRef = useRef(false);

  const buildInitialForm = (p: Profile): UpdateProfileBody => ({
    first_name: p.first_name ?? '',
    last_name: p.last_name ?? '',
    date_of_birth: p.date_of_birth ?? '',
    gender: p.gender ?? null,
    nationality: p.nationality ?? '',
    phone: p.phone ?? '',
    bio: p.bio ?? '',
  });

  const [form, setForm] = useState<UpdateProfileBody>(() => buildInitialForm(profile));
  const [initialValues, setInitialValues] = useState<UpdateProfileBody>(() => buildInitialForm(profile));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialValues);

  // Sync form state with profile data from background refetches (e.g., TanStack
  // Query staleTime expires and refetch returns fresh data). Only sync if the
  // user hasn't made any edits — we don't want to overwrite unsaved changes.
  useEffect(() => {
    if (justSavedRef.current) { justSavedRef.current = false; return; }
    if (!hasModified.current) {
      const newForm = buildInitialForm(profile);
      setForm(newForm);
      setInitialValues(newForm);
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    hasModified.current = true;
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación E.164
    if (form.phone && !form.phone.match(/^\+\d{6,15}$/)) {
      setError('El teléfono debe usar formato internacional: +34600123456');
      return;
    }

    // Validación fecha no futura
    if (form.date_of_birth) {
      const birthDate = new Date(form.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        setError('La fecha de nacimiento no puede ser futura');
        return;
      }
    }

    // Validación nacionalidad: código ISO 3166-1 alpha-2 (2 letras) o nombre completo (2-100 caracteres)
    if (form.nationality && !form.nationality.match(/^[A-Za-z]{2}$/) && !form.nationality.match(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s\-\.]{2,100}$/)) {
      setError('La nacionalidad debe ser un código ISO de 2 letras (ej: AR, ES) o el nombre completo del país (ej: Argentina)');
      return;
    }

    try {
      const payload: UpdateProfileBody = {};
      Object.entries(form).forEach(([key, value]) => {
        let finalValue: unknown = value;

        // Validated fields (date_of_birth, nationality, phone, gender):
        // empty → null because backend rejects "" for these formats.
        // Text fields (first_name, last_name, bio, language_code, currency_code):
        // empty → "" to explicitly clear the field.
        const validatedFields = ['date_of_birth', 'nationality', 'phone', 'gender'];
        if (finalValue === '' && validatedFields.includes(key)) {
          finalValue = null;
        }

        if (finalValue !== undefined) {
          (payload as Record<string, unknown>)[key] = finalValue;
        }
      });

      await updateProfileMutation.mutateAsync(payload);
      justSavedRef.current = true;
      hasModified.current = false;
      setInitialValues({ ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <User className="w-5 h-5 text-[--color-brand-500]" /> Datos personales
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Guardado ✓
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            name="first_name"
            value={form.first_name ?? ''}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            name="last_name"
            value={form.last_name ?? ''}
            onChange={handleChange}
            placeholder="Tu apellido"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> Fecha de nacimiento
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth ?? ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
          <select
            name="gender"
            value={form.gender ?? ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Seleccionar...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="non_binary">No binario</option>
            <option value="prefer_not_to_say">Prefiero no decirlo</option>
          </select>
        </div>

        {/* Nacionalidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Globe className="w-4 h-4" /> Nacionalidad
          </label>
          <input
            name="nationality"
            value={form.nationality ?? ''}
            onChange={handleChange}
            placeholder="ES, FR, US..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Phone className="w-4 h-4" /> Teléfono (E.164)
          </label>
          <input
            name="phone"
            value={form.phone ?? ''}
            onChange={handleChange}
            placeholder="+34600123456"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4" /> Bio
          </label>
          <textarea
            name="bio"
            value={form.bio ?? ''}
            onChange={handleChange}
            rows={3}
            placeholder="Cuéntanos algo sobre ti..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
        <Button
          type="submit"
          variant="brand"
          disabled={!isDirty || updateProfileMutation.isPending}
          isLoading={updateProfileMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="w-5 h-5" /> Guardar cambios
        </Button>
      </div>
    </form>
  );
}