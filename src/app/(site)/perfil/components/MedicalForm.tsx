'use client';

import { useState, useEffect, useCallback } from 'react';
import { listMedicalConflicts, resolveMedicalConflict } from '@/app/lib/api';
import { useUpdateMedicalProfile } from '@/hooks/useUpdateMedicalProfile';
import type {
  BloodType,
  UpdateMedicalProfileBody,
  MedicalConflict,
  ConflictAction,
  Medication,
  Vaccination,
  EmergencyContact,
  InsuranceInfo,
} from '@/app/lib/types/user';
import { UserApiError } from '@/app/lib/api/user';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import {
  Save,
  AlertCircle,
  HeartPulse,
  Droplets,
  Pill,
  Stethoscope,
  Syringe,
  Phone,
  Shield,
  Loader,
  Info,
  AlertTriangle,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import Button from "@/components/ui/Button";

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

const MED_STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'discontinued', label: 'Descontinuado' },
  { value: 'as_needed', label: 'Según necesidad' },
];

const VACC_STATUS_OPTIONS = [
  { value: 'completed', label: 'Completa' },
  { value: 'partial', label: 'Parcial' },
  { value: 'scheduled', label: 'Programada' },
];

const EMPTY_MEDICATION: Medication = { name: '', dosage: '', frequency: '', duration: '', status: 'active' };
const EMPTY_VACCINATION: Vaccination = { name: '', doses_received: 0, status: 'completed' };
const EMPTY_EMERGENCY: EmergencyContact = { name: '', phone: '', relationship: null };
const EMPTY_INSURANCE: InsuranceInfo = { company: '', policy_number: '', plan_type: null, expiration_date: null };

export function MedicalForm({ onSave }: Props) {
  const { medicalProfile, hasPendingConflicts, pendingConflictCount, isLoading, error: loadError, updateMutation } = useUpdateMedicalProfile();

  // ── Simple string fields ──
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');

  // ── Structured fields ──
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({ ...EMPTY_EMERGENCY });
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo>({ ...EMPTY_INSURANCE });

  const [saveError, setSaveError] = useState('');

  // ── Conflict states ──
  const [conflicts, setConflicts] = useState<MedicalConflict[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customActive, setCustomActive] = useState<Record<string, boolean>>({});

  // ── Populate form from adapted medical profile ──
  useEffect(() => {
    if (medicalProfile) {
      // Blood type
      const bt = (medicalProfile.blood_type as string) ?? '';
      if (BLOOD_TYPES.includes(bt as BloodType)) {
        setBloodType(bt as BloodType);
      } else {
        setBloodType('');
      }

      // Allergies (string array → comma-separated)
      const allergies = medicalProfile.allergies;
      if (Array.isArray(allergies)) {
        setAllergiesInput((allergies as string[]).join(', '));
      } else {
        setAllergiesInput(typeof allergies === 'string' ? allergies : '');
      }

      // Conditions (string array → comma-separated)
      const conditions = medicalProfile.conditions;
      if (Array.isArray(conditions)) {
        setConditionsInput((conditions as string[]).join(', '));
      } else {
        setConditionsInput(typeof conditions === 'string' ? conditions : '');
      }

      // Medications (Medication[] → structured array)
      const meds = medicalProfile.medications;
      if (Array.isArray(meds)) {
        setMedications(meds as Medication[]);
      } else {
        setMedications([]);
      }

      // Vaccinations (Vaccination[] → structured array)
      const vaccs = medicalProfile.vaccinations;
      if (Array.isArray(vaccs)) {
        setVaccinations(vaccs as Vaccination[]);
      } else {
        setVaccinations([]);
      }

      // Emergency contact (EmergencyContact | null → structured object)
      const ec = medicalProfile.emergency_contact;
      if (ec && typeof ec === 'object' && !Array.isArray(ec)) {
        const e = ec as Record<string, unknown>;
        setEmergencyContact({
          name: (e.name as string) ?? '',
          phone: (e.phone as string) ?? '',
          relationship: (e.relationship as string | null) ?? null,
        });
      } else {
        setEmergencyContact({ ...EMPTY_EMERGENCY });
      }

      // Insurance info (InsuranceInfo | null → structured object)
      const ii = medicalProfile.insurance_info;
      if (ii && typeof ii === 'object' && !Array.isArray(ii)) {
        const i = ii as Record<string, unknown>;
        setInsuranceInfo({
          company: (i.company as string) ?? '',
          policy_number: (i.policy_number as string) ?? '',
          plan_type: (i.plan_type as string | null) ?? null,
          expiration_date: (i.expiration_date as string | null) ?? null,
        });
      } else {
        setInsuranceInfo({ ...EMPTY_INSURANCE });
      }
    }
  }, [medicalProfile]);

  // ── Load conflicts ──
  const loadConflicts = useCallback(async () => {
    setLoadingConflicts(true);
    try {
      const data = await listMedicalConflicts('pending');
      setConflicts(data.conflicts || []);
    } catch (err) {
      console.error('Error loading conflicts:', err);
    } finally {
      setLoadingConflicts(false);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  // ── Sub-form helpers: medications ──
  const addMedication = () => setMedications(prev => [...prev, { ...EMPTY_MEDICATION }]);
  const removeMedication = (index: number) => setMedications(prev => prev.filter((_, i) => i !== index));
  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  // ── Sub-form helpers: vaccinations ──
  const addVaccination = () => setVaccinations(prev => [...prev, { ...EMPTY_VACCINATION }]);
  const removeVaccination = (index: number) => setVaccinations(prev => prev.filter((_, i) => i !== index));
  const updateVaccination = (index: number, field: keyof Vaccination, value: string | number) => {
    setVaccinations(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  // ── Emergency contact helpers ──
  const updateEmergencyContact = (field: keyof EmergencyContact, value: string | null) => {
    setEmergencyContact(prev => ({ ...prev, [field]: value }));
  };

  // ── Insurance info helpers ──
  const updateInsuranceInfo = (field: keyof InsuranceInfo, value: string | null) => {
    setInsuranceInfo(prev => ({ ...prev, [field]: value }));
  };

  // ── Form submission ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    try {
      const payload: UpdateMedicalProfileBody = {};

      // Blood type
      if (bloodType) payload.blood_type = bloodType;

      // Allergies: comma-separated → string[]
      const allergiesArr = allergiesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (allergiesArr.length > 0) payload.allergies = allergiesArr;

      // Conditions: comma-separated → string[]
      const conditionsArr = conditionsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (conditionsArr.length > 0) payload.conditions = conditionsArr;

      // Medications: structured array
      const validMeds = medications.filter(m => m.name.trim() !== '');
      if (validMeds.length > 0) payload.medications = validMeds;

      // Vaccinations: structured array
      const validVaccs = vaccinations.filter(v => v.name.trim() !== '');
      if (validVaccs.length > 0) payload.vaccinations = validVaccs;

      // Emergency contact: send if at least name or phone is filled
      if (emergencyContact.name.trim() || emergencyContact.phone.trim()) {
        payload.emergency_contact = {
          name: emergencyContact.name,
          phone: emergencyContact.phone,
          relationship: emergencyContact.relationship || null,
        };
      }

      // Insurance info: send if at least company or policy_number is filled
      if (insuranceInfo.company.trim() || insuranceInfo.policy_number.trim()) {
        payload.insurance_info = {
          company: insuranceInfo.company,
          policy_number: insuranceInfo.policy_number,
          plan_type: insuranceInfo.plan_type || null,
          expiration_date: insuranceInfo.expiration_date || null,
        };
      }

      await updateMutation.mutateAsync(payload);
      onSave();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar perfil médico');
    }
  };

  // ── Conflict resolution ──
  const handleResolve = async (conflict: MedicalConflict, action: ConflictAction, customValue?: string) => {
    setResolvingId(conflict.id);
    setResolveError(prev => ({ ...prev, [conflict.id]: '' }));

    try {
      await resolveMedicalConflict(conflict.id, { action, ...(action === 'custom' && { value: customValue }) });
      setConflicts(prev => prev.filter(c => c.id !== conflict.id));
      onSave();
    } catch (err) {
      const message = err instanceof UserApiError
        ? err.code === 'PENDING_UPDATE_EXPIRED' ? 'Este conflicto expiró.' : err.message
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
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Expirado</span>
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
              Documento: {conflict.source.file_name} • Expira: {new Date(conflict.expires_at).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => handleResolve(conflict, 'accept')} disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
              Aceptar
            </button>
            <button type="button" onClick={() => handleResolve(conflict, 'reject')} disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50">
              Rechazar
            </button>
            <button type="button" onClick={() => setCustomActive(prev => ({ ...prev, [conflict.id]: !prev[conflict.id] }))}
              disabled={isResolving || isExpired}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
              Custom
            </button>
          </div>
        </div>
        {showCustom && (
          <div className="mt-2 flex items-center gap-2">
            <input type="text" value={customValue}
              onChange={(e) => setCustomValues(prev => ({ ...prev, [conflict.id]: e.target.value }))}
              placeholder="Ingresá un valor personalizado..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[--color-brand-500]" />
            <button type="button" onClick={() => handleResolve(conflict, 'custom', customValue)}
              disabled={isResolving || !customValue.trim()}
              className="px-3 py-1 text-xs font-medium text-white bg-[--color-brand-500] rounded hover:bg-[--color-brand-600] disabled:opacity-50">
              Guardar
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {isResolving && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Loader className="w-3 h-3 animate-spin" /> Resolviendo...
          </div>
        )}
      </div>
    );
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-[--color-brand-500]" />
        <span className="ml-2 text-gray-500">Cargando perfil médico...</span>
      </div>
    );
  }

  // ── Error state ──
  if (loadError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-medium">Error al cargar el perfil médico</p>
        <p className="text-gray-500 text-sm mt-1">{loadError}</p>
      </div>
    );
  }

  // ── Render ──
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

      {/* ── Pending Conflicts Badge ── */}
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

      {/* ── Conflict List ── */}
      {(conflicts.length > 0 || loadingConflicts) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          {!hasPendingConflicts && (
            <h3 className="text-lg font-semibold text-amber-800 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Conflictos Pendientes ({conflicts.length})
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

      {/* ═══════════════════════════════════════════
          FORM FIELDS
          ═══════════════════════════════════════════ */}

      {/* ── Blood Type (Headless UI Listbox) ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Droplets className="w-4 h-4" /> Tipo de sangre
        </label>
        <Listbox value={bloodType} onChange={(v) => setBloodType(v as BloodType | '')}>
          <div className="relative">
            <ListboxButton className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all bg-white text-left text-gray-900">
              <span className={bloodType ? '' : 'text-gray-400'}>
                {bloodType || 'Desconocido'}
              </span>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none">
              <ListboxOption value="" className="cursor-pointer px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
                Desconocido
              </ListboxOption>
              {BLOOD_TYPES.map((bt) => (
                <ListboxOption key={bt} value={bt}
                  className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-brand-50 data-[focus]:bg-brand-50">
                  {bt}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>

      {/* ── Allergies (comma-separated input → string[]) ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> Alergias
        </label>
        <textarea
          value={allergiesInput}
          onChange={(e) => setAllergiesInput(e.target.value)}
          rows={2}
          placeholder="Penicilina, cacahuetes, marisco..."
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">Separá las alergias con comas</p>
      </div>

      {/* ── Conditions (comma-separated input → string[]) ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Stethoscope className="w-4 h-4" /> Condiciones médicas
        </label>
        <textarea
          value={conditionsInput}
          onChange={(e) => setConditionsInput(e.target.value)}
          rows={2}
          placeholder="Hipertensión, diabetes, asma..."
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent outline-none transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">Separá las condiciones con comas</p>
      </div>

      {/* ── Medications (structured sub-form) ── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
          <Pill className="w-4 h-4" /> Medicamentos
        </label>

        {medications.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No hay medicamentos registrados.</p>
        )}

        <div className="space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 relative">
              <button type="button" onClick={() => removeMedication(index)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Eliminar medicamento">
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input type="text" value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="Lisinopril"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dosis</label>
                  <input type="text" value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="10mg"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
                  <input type="text" value={med.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    placeholder="Diaria"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duración</label>
                  <input type="text" value={med.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    placeholder="Continuo"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={med.status}
                    onChange={(e) => updateMedication(index, 'status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white">
                    {MED_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addMedication}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[--color-brand-500] hover:text-[--color-brand-600] transition-colors">
          <Plus className="w-4 h-4" /> Agregar medicamento
        </button>
      </div>

      {/* ── Vaccinations (structured sub-form) ── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
          <Syringe className="w-4 h-4" /> Vacunas
        </label>

        {vaccinations.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No hay vacunas registradas.</p>
        )}

        <div className="space-y-4">
          {vaccinations.map((vacc, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 relative">
              <button type="button" onClick={() => removeVaccination(index)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Eliminar vacuna">
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input type="text" value={vacc.name}
                    onChange={(e) => updateVaccination(index, 'name', e.target.value)}
                    placeholder="Fiebre amarilla"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dosis recibidas</label>
                  <input type="number" min={0} value={vacc.doses_received}
                    onChange={(e) => updateVaccination(index, 'doses_received', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={vacc.status}
                    onChange={(e) => updateVaccination(index, 'status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white">
                    {VACC_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addVaccination}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[--color-brand-500] hover:text-[--color-brand-600] transition-colors">
          <Plus className="w-4 h-4" /> Agregar vacuna
        </button>
      </div>

      {/* ── Emergency Contact (3 fields) ── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
          <Phone className="w-4 h-4" /> Contacto de emergencia
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" value={emergencyContact.name}
              onChange={(e) => updateEmergencyContact('name', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
            <input type="tel" value={emergencyContact.phone}
              onChange={(e) => updateEmergencyContact('phone', e.target.value)}
              placeholder="+5491123456789"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relación</label>
            <input type="text" value={emergencyContact.relationship ?? ''}
              onChange={(e) => updateEmergencyContact('relationship', e.target.value || null)}
              placeholder="Hermano/a"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
        </div>
      </div>

      {/* ── Insurance Info (4 fields) ── */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
          <Shield className="w-4 h-4" /> Información del seguro
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
            <input type="text" value={insuranceInfo.company}
              onChange={(e) => updateInsuranceInfo('company', e.target.value)}
              placeholder="OSDE"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nº de póliza</label>
            <input type="text" value={insuranceInfo.policy_number}
              onChange={(e) => updateInsuranceInfo('policy_number', e.target.value)}
              placeholder="12345"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
            <input type="text" value={insuranceInfo.plan_type ?? ''}
              onChange={(e) => updateInsuranceInfo('plan_type', e.target.value || null)}
              placeholder="Premium"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
            <input type="date" value={insuranceInfo.expiration_date ?? ''}
              onChange={(e) => updateInsuranceInfo('expiration_date', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[--color-brand-500] focus:border-transparent outline-none bg-white" />
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="border-t border-gray-100 pt-6 mt-8 flex justify-end">
        <Button type="submit" variant="brand" isLoading={updateMutation.isPending} className="w-full sm:w-auto">
          <Save className="w-5 h-5" /> Guardar cambios
        </Button>
      </div>
    </form>
  );
}
