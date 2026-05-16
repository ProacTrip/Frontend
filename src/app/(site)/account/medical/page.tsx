'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMedicalProfile, listMedicalPending, updateMedicalProfile } from '@/lib/api/user';
import type { MedicalProfile, ListMedicalPendingResponse } from '@/lib/api/types';
import { MedicalInfoCard } from '@/components/account/MedicalInfoCard';
import { MedicalConflictCard } from '@/components/account/MedicalConflictCard';
import { HeartPulse } from 'lucide-react';

const MEDICAL_FIELDS: { key: keyof Omit<MedicalProfile, 'is_shared' | 'has_pending_conflicts' | 'pending_conflict_count'>; label: string }[] = [
  { key: 'blood_type', label: 'Grupo sanguíneo' },
  { key: 'allergies', label: 'Alergias' },
  { key: 'medications', label: 'Medicamentos' },
  { key: 'conditions', label: 'Condiciones médicas' },
  { key: 'vaccinations', label: 'Vacunas' },
  { key: 'emergency_contact', label: 'Contacto de emergencia' },
  { key: 'insurance_info', label: 'Seguro médico' },
];

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

export default function MedicalPage() {
  const [medical, setMedical] = useState<MedicalProfile | null>(null);
  const [pending, setPending] = useState<ListMedicalPendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shareChecked, setShareChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [med, pend] = await Promise.all([
          getMedicalProfile().catch(() => null),
          listMedicalPending().catch(() => null),
        ]);

        if (cancelled) return;

        if (med) {
          setMedical(med);
          setShareChecked(med.is_shared);
          // Initialize edit values
          const values: Record<string, string> = {};
          for (const field of MEDICAL_FIELDS) {
            const traced = med[field.key] as { value: string | null };
            values[field.key] = traced?.value ?? '';
          }
          setEditValues(values);
        }
        if (pend) setPending(pend);
        if (!med && !pend) {
          // Both returned null (likely 404 — empty medical profile)
          setError(null); // Not an error, just empty
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const detail = (err as { detail?: string; message?: string })?.detail
            || (err as { message?: string })?.message
            || 'Error al cargar el perfil médico.';
          setError(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleEditField = useCallback((field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  }, []);

  const handleSave = async () => {
    if (!medical) return;
    setSaving(true);
    setSaveMessage(null);

    const body: Record<string, string | boolean | null> = {};

    for (const field of MEDICAL_FIELDS) {
      const traced = medical[field.key] as { value: string | null };
      const originalValue = traced?.value ?? '';
      const newValue = editValues[field.key] ?? '';
      if (newValue !== originalValue) {
        body[field.key] = newValue || null;
      }
    }

    if (shareChecked !== medical.is_shared) {
      body.is_shared = shareChecked;
    }

    if (Object.keys(body).length === 0) {
      setSaveMessage({ type: 'success', text: 'No hay cambios para guardar.' });
      setSaving(false);
      setEditing(false);
      return;
    }

    try {
      await updateMedicalProfile(body as Parameters<typeof updateMedicalProfile>[0]);
      // Refresh medical data after save
      const updated = await getMedicalProfile();
      setMedical(updated);
      setShareChecked(updated.is_shared);
      setEditing(false);
      setSaveMessage({ type: 'success', text: 'Perfil médico actualizado.' });
      // Re-init edit values
      const values: Record<string, string> = {};
      for (const field of MEDICAL_FIELDS) {
        const traced = updated[field.key] as { value: string | null };
        values[field.key] = traced?.value ?? '';
      }
      setEditValues(values);
    } catch (err: unknown) {
      const detail = (err as { detail?: string; message?: string })?.detail
        || (err as { message?: string })?.message
        || 'Error al guardar el perfil médico.';
      setSaveMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  const handleResolved = useCallback((conflictId: string) => {
    setPending((prev) => {
      if (!prev) return prev;
      const filtered = prev.conflicts.filter((c) => c.id !== conflictId);
      return { conflicts: filtered };
    });
    // Refresh medical data
    getMedicalProfile().then((updated) => {
      setMedical(updated);
      setShareChecked(updated.is_shared);
      const values: Record<string, string> = {};
      for (const field of MEDICAL_FIELDS) {
        const traced = updated[field.key] as { value: string | null };
        values[field.key] = traced?.value ?? '';
      }
      setEditValues(values);
    }).catch(() => { /* silent */ });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-paper-container animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-paper-container animate-pulse" />
            </div>
          ))}
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
          Perfil Médico
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

  // Empty state: no medical profile at all
  if (!medical) {
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
          Perfil Médico
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-paper-dim p-8 text-center space-y-4"
        >
          <HeartPulse size={48} className="mx-auto text-ink-faint" />
          <div>
            <p className="text-ink font-medium">Aún no cargaste tu perfil médico</p>
            <p className="text-ink-muted text-sm mt-1">
              Completá tus datos médicos para tenerlos disponibles en caso de emergencia durante tus viajes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              // Initialize empty medical for editing
              const empty: Record<string, string> = {};
              for (const f of MEDICAL_FIELDS) empty[f.key] = '';
              setEditValues(empty);
              setMedical({
                blood_type: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                allergies: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                medications: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                conditions: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                vaccinations: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                emergency_contact: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                insurance_info: { value: null, source: 'manual', updated_at: new Date().toISOString() },
                is_shared: false,
                has_pending_conflicts: false,
                pending_conflict_count: 0,
              } as MedicalProfile);
              setShareChecked(false);
              setEditing(true);
            }}
            className="px-5 py-2.5 rounded-lg bg-coral text-white text-sm font-semibold hover:bg-coral-hover transition-colors"
          >
            Completar perfil médico
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const pendingCount = pending?.conflicts.length ?? medical.pending_conflict_count;

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
        Perfil Médico
      </motion.h1>

      {/* ── Conflict banner ── */}
      {medical.has_pending_conflicts && pendingCount > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-mustard/40 bg-mustard-container p-4"
        >
          <p className="text-sm font-medium text-ink">
            Se detectaron {pendingCount} conflicto{pendingCount !== 1 ? 's' : ''} de datos
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            Revisá los datos sugeridos por OCR y aceptá o rechazá los cambios.
          </p>
        </motion.div>
      )}

      {/* ── Medical Info Edit Mode ── */}
      <motion.section
        variants={itemVariants}
        className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
            Información Médica
          </h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-paper-outline bg-paper text-ink-muted hover:bg-paper-container transition-colors"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSaveMessage(null);
                  // Reset edit values
                  if (medical) {
                    const values: Record<string, string> = {};
                    for (const field of MEDICAL_FIELDS) {
                      const traced = medical[field.key] as { value: string | null };
                      values[field.key] = traced?.value ?? '';
                    }
                    setEditValues(values);
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-paper-outline bg-paper text-ink-muted hover:bg-paper-container transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-coral text-white hover:bg-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {saveMessage && (
            <motion.div
              key="save-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                saveMessage.type === 'success'
                  ? 'bg-success-container text-success'
                  : 'bg-error-container text-error'
              }`}
              role="alert"
            >
              {saveMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEDICAL_FIELDS.map((field) => (
            <MedicalInfoCard
              key={field.key}
              label={field.label}
              fieldKey={field.key}
              data={medical[field.key] as { value: string | null; source: string; updated_at: string }}
              editing={editing}
              value={editValues[field.key] ?? ''}
              onChange={handleEditField}
            />
          ))}
        </div>

        {/* ── Share toggle ── */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-paper-outline">
          <div>
            <p className="text-sm font-medium text-ink">Compartir en emergencias</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Permitir que servicios de emergencia accedan a tu perfil médico
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shareChecked}
              onChange={(e) => {
                setShareChecked(e.target.checked);
                setSaveMessage(null);
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-paper-container peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral" />
          </label>
        </div>
      </motion.section>

      {/* ── Pending Conflicts ── */}
      {pending && pending.conflicts.length > 0 && (
        <motion.section
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4"
        >
          <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
            Conflictos Pendientes
          </h2>
          <div className="space-y-3">
            {pending.conflicts.map((conflict) => (
              <MedicalConflictCard
                key={conflict.id}
                conflict={conflict}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
