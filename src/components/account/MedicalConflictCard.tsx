'use client';

import { useState } from 'react';
import type { MedicalPendingUpdate } from '@/lib/api/types';
import { resolveMedicalPending } from '@/lib/api/user';
import { AlertTriangle, Check, X, Pencil } from 'lucide-react';

interface MedicalConflictCardProps {
  conflict: MedicalPendingUpdate;
  onResolved: (id: string) => void;
}

export function MedicalConflictCard({ conflict, onResolved }: MedicalConflictCardProps) {
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (action: 'accept' | 'reject' | 'custom') => {
    setResolving(true);
    setError(null);

    try {
      await resolveMedicalPending(
        conflict.id,
        action,
        action === 'custom' ? customValue : undefined
      );
      onResolved(conflict.id);
    } catch (err: unknown) {
      const detail = (err as { detail?: string; message?: string })?.detail
        || (err as { message?: string })?.message
        || 'Error al resolver el conflicto.';
      setError(detail);
    } finally {
      setResolving(false);
    }
  };

  const fieldLabel =
    conflict.field === 'blood_type' ? 'Grupo sanguíneo'
    : conflict.field === 'allergies' ? 'Alergias'
    : conflict.field === 'medications' ? 'Medicamentos'
    : conflict.field === 'conditions' ? 'Condiciones'
    : conflict.field === 'vaccinations' ? 'Vacunas'
    : conflict.field === 'emergency_contact' ? 'Contacto de emergencia'
    : conflict.field === 'insurance_info' ? 'Seguro médico'
    : conflict.field;

  return (
    <div className="rounded-lg border border-mustard/30 bg-mustard-container/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="text-mustard shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 suppressHydrationWarning className="text-sm font-semibold text-ink">
            Conflicto en {fieldLabel}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Documento: {conflict.source.file_name}
          </p>
        </div>
      </div>

      {/* Values comparison */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-paper p-2.5 border border-paper-outline">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide mb-0.5">Actual</p>
          <p className="text-ink font-medium">{conflict.current_value || '(vacío)'}</p>
        </div>
        <div className="rounded-md bg-paper p-2.5 border border-mustard/20">
          <p className="text-[11px] text-ink-faint uppercase tracking-wide mb-0.5">Sugerido</p>
          <p className="text-ink font-medium">{conflict.proposed_value}</p>
        </div>
      </div>

      {/* Custom value input */}
      {showCustom && (
        <div className="space-y-1.5">
          <label htmlFor={`custom-${conflict.id}`} className="text-xs text-ink-muted">
            Valor personalizado:
          </label>
          <input
            id={`custom-${conflict.id}`}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Ingresar valor..."
            className="w-full px-3 py-2 rounded-lg border border-paper-outline bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors text-sm"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleResolve('accept')}
          disabled={resolving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-coral text-white text-xs font-semibold hover:bg-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check size={14} />
          Aceptar sugerido
        </button>
        <button
          type="button"
          onClick={() => handleResolve('reject')}
          disabled={resolving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-paper-outline bg-paper text-ink-muted text-xs font-medium hover:bg-paper-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X size={14} />
          Rechazar
        </button>
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            disabled={resolving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-paper-outline bg-paper text-ink-muted text-xs font-medium hover:bg-paper-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Pencil size={14} />
            Personalizado
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleResolve('custom')}
            disabled={resolving || !customValue.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-olive text-white text-xs font-semibold hover:bg-olive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={14} />
            Guardar personalizado
          </button>
        )}
      </div>
    </div>
  );
}
