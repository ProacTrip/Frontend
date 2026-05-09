'use client';

import { useState, useEffect } from 'react';
import { getMedicalProfile, updateMedicalProfile } from '@/app/lib/api';
import { MedicalProfile, BloodType, UpdateMedicalProfileBody } from '@/app/lib/types/user';
import { Save, AlertCircle, HeartPulse, Droplets, Pill, Stethoscope, Syringe, Phone, Shield, Share2, Loader, Info } from 'lucide-react';

interface Props {
  onSave: () => void;
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function MedicalForm({ onSave }: Props) {
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    blood_type: '',
    allergies: '',
    medications: '',
    conditions: '',
    vaccinations: '',
    emergency_contact: '',
    insurance_info: '',
    is_shared: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getMedicalProfile();
        if (data) {
          setProfile(data);
          setForm({
            blood_type: data.blood_type ?? '',
            allergies: data.allergies ?? '',
            medications: data.medications ?? '',
            conditions: data.conditions ?? '',
            vaccinations: data.vaccinations ?? '',
            emergency_contact: data.emergency_contact ?? '',
            insurance_info: data.insurance_info ?? '',
            is_shared: data.is_shared ?? false,
          });
        }
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

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
    setSaveError('');

    try {
      // ✅ FIX: Usar Partial<UpdateMedicalProfileBody> en vez de Record<string, any>
      const payload: Partial<UpdateMedicalProfileBody> = {};

      // Blood type: si está vacío, enviar null
      payload.blood_type = form.blood_type ? (form.blood_type as BloodType) : null;

      // Strings: permitir "" para borrar (intencional según diseño)
      payload.allergies = form.allergies || null;
      payload.medications = form.medications || null;
      payload.conditions = form.conditions || null;
      payload.vaccinations = form.vaccinations || null;
      payload.emergency_contact = form.emergency_contact || null;
      payload.insurance_info = form.insurance_info || null;
      payload.is_shared = form.is_shared;

      await updateMedicalProfile(payload as UpdateMedicalProfileBody);
      onSave();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-[#FF6B6B]" />
        <span className="ml-2 text-gray-500">Cargando perfil médico...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-medium">Error al cargar el perfil médico</p>
        <p className="text-gray-500 text-sm mt-1">{loadError}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <HeartPulse className="w-5 h-5 text-[#FF6B6B]" />
        <h2 className="text-xl font-bold text-gray-800">Perfil médico</h2>
      </div>
      <p className="text-sm text-gray-500 -mt-4 mb-4">
        Esta información se almacena de forma segura y encriptada. Solo se comparte con proveedores de viaje si activas la opción de compartir.
      </p>

      {saveError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {saveError}
        </div>
      )}

      {!profile && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Aún no tienes perfil médico</p>
            <p className="text-sm text-blue-600 mt-1">
              Completa el formulario a continuación para crearlo. Los campos son opcionales.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de sangre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Droplets className="w-4 h-4" /> Tipo de sangre
          </label>
          <select
            name="blood_type"
            value={form.blood_type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">Desconocido</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>
        </div>

        {/* Contacto de emergencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Phone className="w-4 h-4" /> Contacto de emergencia
          </label>
          <input
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={handleChange}
            placeholder="Nombre y teléfono"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Alergias */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Alergias
          </label>
          <textarea
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            rows={2}
            placeholder="Penicilina, cacahuetes, marisco..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Medicamentos */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Pill className="w-4 h-4" /> Medicamentos
          </label>
          <textarea
            name="medications"
            value={form.medications}
            onChange={handleChange}
            rows={2}
            placeholder="Lisinopril 10mg diario, Insulina..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Condiciones médicas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Stethoscope className="w-4 h-4" /> Condiciones médicas
          </label>
          <textarea
            name="conditions"
            value={form.conditions}
            onChange={handleChange}
            rows={2}
            placeholder="Hipertensión, diabetes, asma..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Vacunaciones */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Syringe className="w-4 h-4" /> Vacunaciones
          </label>
          <textarea
            name="vaccinations"
            value={form.vaccinations}
            onChange={handleChange}
            rows={2}
            placeholder="Fiebre amarilla, Hepatitis A, COVID-19..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Seguro médico */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Shield className="w-4 h-4" /> Información del seguro
          </label>
          <input
            name="insurance_info"
            value={form.insurance_info}
            onChange={handleChange}
            placeholder="Póliza #12345 - OSDE"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Compartir con proveedores */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          name="is_shared"
          checked={form.is_shared}
          onChange={handleChange}
          className="w-5 h-5 text-[#FF6B6B] rounded focus:ring-[#FF6B6B]"
        />
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Compartir información médica con proveedores de viaje
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