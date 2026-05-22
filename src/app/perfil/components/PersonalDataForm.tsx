'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/lib/api';
import { Profile, UpdateProfileBody } from '@/app/lib/types/user';
import { Save, AlertCircle, User, Calendar, Globe, Phone, FileText, Eye } from 'lucide-react';

interface Props {
  profile: Profile;
  onSave: () => void;
}

export function PersonalDataForm({ profile, onSave }: Props) {
  const [form, setForm] = useState<UpdateProfileBody>({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    gender: profile.gender ?? null,
    nationality: profile.nationality ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
    is_public: profile.is_public ?? false,
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

    // Validación E.164
    if (form.phone && !form.phone.match(/^\+\d{6,15}$/)) {
      setError('El teléfono debe usar formato internacional: +34600123456');
      setIsSaving(false);
      return;
    }

    // Validación fecha no futura
    if (form.date_of_birth) {
      const birthDate = new Date(form.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        setError('La fecha de nacimiento no puede ser futura');
        setIsSaving(false);
        return;
      }
    }

    try {
        const payload: UpdateProfileBody = {};
        Object.entries(form).forEach(([key, value]) => {
        let finalValue = value;

        // 🔥 FIX ESPECÍFICO PARA ENUMS
        // Si el select HTML está vacío (""), el backend necesita null, no ""
        if (key === 'gender' && finalValue === '') {
            finalValue = null;
        }

        // El resto de campos (strings) pueden ir como "" para borrarse
        if (finalValue !== null && finalValue !== undefined) {
            (payload as Record<string, unknown>)[key] = finalValue;
        }
    });

        await updateProfile(payload);
        onSave();
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <User className="w-5 h-5 text-[#FF6B6B]" /> Datos personales
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
          <select
            name="gender"
            value={form.gender ?? ''}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all bg-white"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>
      </div>

      {/* Perfil público */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          name="is_public"
          checked={form.is_public ?? false}
          onChange={handleChange}
          className="w-5 h-5 text-[#FF6B6B] rounded focus:ring-[#FF6B6B]"
        />
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Hacer mi perfil público
        </label>
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