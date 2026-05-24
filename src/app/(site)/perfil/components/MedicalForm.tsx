'use client';

import { useState, useEffect, useCallback } from 'react';
import { listMedicalConflicts, resolveMedicalConflict } from '@/app/lib/api';
import { useUpdateMedicalProfile } from '@/hooks/useUpdateMedicalProfile';
import type { BloodType, UpdateMedicalProfileBody, MedicalConflict, ConflictAction } from '@/app/lib/types/user';
import { UserApiError } from '@/app/lib/api/user';
import { Save, AlertCircle, HeartPulse, Droplets, Pill, Stethoscope, Syringe, Phone, Shield, Loader, Info, AlertTriangle } from 'lucide-react';

interface Props {
  onSave: () => void;
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FIELD_LABELS: Record<string, string> = {
  blood_type: 'Grupo sanguíneo',
  allergies: 'Alergias',
  medications: 'Medicamentos',
  conditions: 'Condiciones médicas',
  vaccinations: 'Vacunas',
  emergency_contact: 'Contacto de emergencia',
  insurance_info: 'Seguro médico',
};

export function MedicalForm({ onSave }: Props) {
  const { medicalProfile, hasPendingConflicts, pendingConflictCount, isLoading, error: loadError, updateMutation } = useUpdateMedicalProfile();

  const [form, setForm] = useState({
    blood_type: '',
    allergies: '',
    medications: '',
    conditions: '',
    vaccinations: '',
    emergency_contact: '',
    insurance_info: '',
  });
  const [saveError, setSaveError] = useState('');

  // Conflict states
  const [conflicts, setConflicts] = useState<MedicalConflict[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customActive, setCustomActive] = useState<Record<string, boolean>>({});

  // Sync adapted medical profile into form state whenever the query data changes
  useEffect(() => {
    if (medicalProfile) {
      setForm({
        blood_type: (medicalProfile.blood_type as string) ?? '',
        allergies: Array.isArray(medicalProfile.allergies)
          ? (medicalProfile.allergies as string[]).join(', ')
          : (medicalProfile.allergies as string) ?? '',
        medications: Array.isArray(medicalProfile.medications)
          ? JSON.stringify(medicalProfile.medications)
          : (medicalProfile.medications as string) ?? '',
        conditions: Array.isArray(medicalProfile.conditions)
          ? (medicalProfile.conditions as string[]).join(', ')
          : (medicalProfile.conditions as string) ?? '',
        vaccinations: Array.isArray(medicalProfile.vaccinations)
          ? JSON.stringify(medicalProfile.vaccinations)
          : (medicalProfile.vaccinations as string) ?? '',
        emergency_contact: typeof medicalProfile.emergency_contact === 'object' && medicalProfile.emergency_contact !== null
          ? JSON.stringify(medicalProfile.emergency_contact)
          : (medicalProfile.emergency_contact as string) ?? '',
        insurance_info: typeof medicalProfile.insurance_info === 'object' && medicalProfile.insurance_info !== null
          ? JSON.stringify(medicalProfile.insurance_info)
          : (medicalProfile.insurance_info as string) ?? '',
      });
    }
  }, [medicalProfile]);

  const loadConflicts = useCallback(async () => {
    setLoadingConflicts(true);
    try {
      const data = await listMedicalConflicts('pending');
      setConflicts(data.conflicts || []);
    } catch (err) {
      // Silently fail — conflicts are optional, medical profile still works
      console.error('Error loading conflicts:', err);
    } finally {
      setLoadingConflicts(false);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

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
    setSaveError('');

    try {
      const payload = {
        blood_type: form.blood_type ? (form.blood_type as BloodType) : null,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
        conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()).filter(Boolean) : null,
      } as UpdateMedicalProfileBody;

      await updateMutation.mutateAsync(payload);
      onSave();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar perfil médico');
    }
  };

  const handleResolve = async (conflict: MedicalConflict, action: ConflictAction, customValue?: string) => {
    setResolvingId(conflict.id);
    setResolveError(prev => ({ ...prev, [conflict.id]: '' }));

    try {
      await resolveMedicalConflict(conflict.id, {
        action,
        ...(action === 'custom' && { value: customValue }),
      });

      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflict.id));

      // Refresh query cache (useUpdateMedicalProfile will refetch)
      onSave();
    } catch (err) {
      const message = err instanceof UserApiError
        ? err.code === 'PENDING_UPDATE_EXPIRED'
          ? 'Este conflicto expiró.'
          : err.message
        : 'Error al resolver el conflicto.';
      setResolveError(prev => ({ ...prev, [conflict.id]: message }));
    } finally {
      setResolvingId(null);
    }
  };

  function renderConflictCard(conflict: MedicalConflict) {
    const fieldLabel = FIELD_LABELS[conflict.field] || conflict.field;
    const isResolving = resolvingId === conflict.id;
    const error = resolveError[conflict.id];
    const showCustom = customActive[conflict.id];
    const customValue = customValues[conflict.id] || '';
    const isExpired = new Date(conflict.expires_at) < new Date();

    return (
      <div key={conflict.id} className="bg-white rounded-lg border border-amber-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-800 text-sm">{fieldLabel}</p>
              {isExpired && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Expirado
                </span>
              )}
            </div>
            <div className="mt-1 text-sm">
              <span className="text-gray-500">Actual: </span>
              <span className="text-gray-700">{conflict.current_value || 'Sin valor actual'}</span>
            </div>
            <div className="text-sm">
              <span className="text-amber-600">Propuesto: </span>
              <span className="text-amber-700 font-medium">{conflict.proposed_value}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Documento: {conflict.source.file_name} •{' '}
              Expira: {new Date(conflict.expires_at).toLocaleDateString('es-AR')}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleResolve(conflict, 'accept')}
              disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleResolve(conflict, 'reject')}
              disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => setCustomActive(prev => ({ ...prev, [conflict.id]: !prev[conflict.id] }))}
              disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Custom
            </button>
          </div>
        </div>

        {/* Custom value input */}
        {showCustom && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValues(prev => ({ ...prev, [conflict.id]: e.target.value }))}
              placeholder="Ingresá un valor personalizado..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[--color-brand-500]"
            />
            <button
              type="button"
              onClick={() => handleResolve(conflict, 'custom', customValue)}
              disabled={isResolving || !customValue.trim()}
              className="px-3 py-1 text-xs font-medium text-white bg-[--color-brand-500] rounded hover:bg-[--color-brand-600] disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}

        {/* Loading spinner */}
        {isResolving && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Loader className="w-3 h-3 animate-spin" />
            Resolviendo...
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-[--color-brand-500]" />
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
        <HeartPulse className="w-5 h-5 text-[--color-brand-500]" />
        <h2 className="text-xl font-bold text-gray-800">Perfil médico</h2>
      </div>
      <p className="text-sm text-gray-500 -mt-4 mb-4">
        Esta información se almacena de forma segura y encriptada.
      </p>

      {saveError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {saveError}
        </div>
      )}

      {!medicalProfile && (
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

      {/* Conflictos Pendientes — badge from medical profile meta */}
      {hasPendingConflicts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-amber-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {pendingConflictCount === 1
              ? 'Hay 1 conflicto pendiente de revisión'
              : `Hay ${pendingConflictCount} conflictos pendientes de revisión`}
          </h3>
          <p className="text-sm text-amber-600">
            El OCR detectó diferencias con tus datos actuales. Revisá cada conflicto y decidí si aceptar, rechazar o ingresar un valor personalizado.
          </p>
        </div>
      )}

      {/* Conflictos — list from API */}
      {(conflicts.length > 0 || loadingConflicts) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          {!hasPendingConflicts && (
            <h3 className="text-lg font-semibold text-amber-800 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Conflictos Pendientes ({conflicts.length})
            </h3>
          )}
          {!hasPendingConflicts && (
            <p className="text-sm text-amber-600 mb-4">
              El OCR detectó diferencias con tus datos actuales. Revisá cada conflicto y decidí si aceptar, rechazar o ingresar un valor personalizado.
            </p>
          )}

          {loadingConflicts ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-amber-600" />
              <span className="ml-2 text-sm text-amber-600">Cargando conflictos...</span>
            </div>
          ) : (
            <div className={hasPendingConflicts ? 'mt-3 space-y-3' : 'space-y-3'}>
              {conflicts.map((conflict) => renderConflictCard(conflict))}
            </div>
          )}
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
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
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mt-8">
      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="px-8 py-3.5 bg-[--color-brand-500] text-white rounded-xl font-bold text-base shadow-sm hover:bg-[--color-brand-600] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
      >
        {updateMutation.isPending ? (
          'Guardando...'
        ) : (
          <>
            <Save className="w-5 h-5" /> Guardar cambios
          </>
        )}
      </button>
      </div>
    </form>
  );
}
