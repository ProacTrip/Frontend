'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Check,
  X,
  FileText,
  Loader2,
  Pencil,
} from 'lucide-react';
import {
  listMedicalPending,
  resolveMedicalConflict,
} from '@/app/lib/api';
import type { MedicalConflict, ResolveConflictBody } from '@/app/lib/types/user';

interface Props {
  onResolved?: () => void;
}

export function MedicalConflictsCard({ onResolved }: Props) {
  const [conflicts, setConflicts] = useState<MedicalConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [showCustomFor, setShowCustomFor] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await listMedicalPending();
        setConflicts(res.conflicts);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleResolve = useCallback(
    async (conflictId: string, action: ResolveConflictBody['action'], customValue?: string) => {
      setResolvingId(conflictId);
      try {
        const body: ResolveConflictBody = {
          pending_update_id: conflictId,
          action,
        };
        if (action === 'custom' && customValue) {
          body.custom_value = customValue;
        }
        await resolveMedicalConflict(body);
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
        setShowCustomFor(null);
        onResolved?.();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setResolvingId(null);
      }
    },
    [onResolved]
  );

  const formatDate = (date: string): string =>
    new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });

  const fieldLabels: Record<string, string> = {
    blood_type: 'Tipo de sangre',
    allergies: 'Alergias',
    medications: 'Medicamentos',
    conditions: 'Condiciones médicas',
    vaccinations: 'Vacunaciones',
    emergency_contact: 'Contacto de emergencia',
    insurance_info: 'Seguro médico',
  };

  if (isLoading) {
    return (
      <div className="bg-paper-dim rounded-xl border border-paper-outline p-5 animate-pulse">
        <div className="h-5 w-48 bg-paper-outline rounded mb-3" />
        <div className="h-12 bg-paper-outline rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container rounded-xl p-4 flex items-center gap-2 text-error text-sm">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    );
  }

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="bg-paper-dim rounded-xl border border-paper-outline p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-mustard" />
        <h3 className="font-bold text-ink">
          Conflictos por resolver ({conflicts.length})
        </h3>
      </div>

      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="bg-paper rounded-lg border border-paper-outline p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">
                {fieldLabels[conflict.field] ?? conflict.field}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-faint">Valor actual</p>
                  <p className="text-ink-muted font-medium line-through">
                    {conflict.current_value || '(vacío)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Valor propuesto</p>
                  <p className="text-olive font-medium">
                    {conflict.proposed_value || '(vacío)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-faint">
                <FileText className="w-3.5 h-3.5" />
                <span>
                  Documento: {conflict.source.file_name} ·{' '}
                  {formatDate(conflict.suggested_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-paper-outline">
            <button
              onClick={() => handleResolve(conflict.id, 'accept')}
              disabled={resolvingId === conflict.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {resolvingId === conflict.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Aceptar
            </button>

            <button
              onClick={() => handleResolve(conflict.id, 'reject')}
              disabled={resolvingId === conflict.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {resolvingId === conflict.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Rechazar
            </button>

            {showCustomFor === conflict.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={customValues[conflict.id] ?? ''}
                  onChange={(e) =>
                    setCustomValues((prev) => ({
                      ...prev,
                      [conflict.id]: e.target.value,
                    }))
                  }
                  placeholder="Valor personalizado"
                  className="flex-1 p-1.5 border border-paper-outline rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-coral focus:border-transparent outline-none"
                  autoFocus
                />
                <button
                  onClick={() =>
                    handleResolve(conflict.id, 'custom', customValues[conflict.id])
                  }
                  disabled={
                    resolvingId === conflict.id ||
                    !(customValues[conflict.id] ?? '').trim()
                  }
                  className="px-2 py-1.5 rounded-lg bg-coral text-white text-xs font-medium hover:bg-coral-hover disabled:opacity-50 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowCustomFor(null)}
                  className="text-ink-faint hover:text-ink text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomFor(conflict.id)}
                disabled={resolvingId === conflict.id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-paper-outline text-ink-muted text-xs font-medium hover:bg-paper-container transition-colors disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Personalizado
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
