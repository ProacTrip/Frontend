'use client';

import type { TracedField } from '@/lib/api/types';

interface MedicalInfoCardProps {
  label: string;
  fieldKey: string;
  data: TracedField<string | null>;
  editing: boolean;
  value: string;
  onChange: (field: string, value: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function sourceLabel(source: string): { label: string; type: 'manual' | 'ocr' } {
  if (source === 'manual') return { label: 'Manual', type: 'manual' };
  if (source.startsWith('ocr:')) {
    const docId = source.slice(4);
    return { label: `OCR: ${docId.slice(0, 8)}...`, type: 'ocr' };
  }
  return { label: source, type: 'manual' };
}

export function MedicalInfoCard({
  label,
  fieldKey,
  data,
  editing,
  value,
  onChange,
}: MedicalInfoCardProps) {
  const src = sourceLabel(data.source);

  return (
    <div className="rounded-lg border border-paper-outline bg-paper p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 suppressHydrationWarning className="text-sm font-semibold text-ink">
          {label}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            src.type === 'ocr'
              ? 'bg-coral-container text-coral-on-container'
              : 'bg-olive-container text-olive'
          }`}
        >
          {src.label}
        </span>
      </div>

      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-paper-outline bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
          placeholder={`Ingresar ${label.toLowerCase()}`}
        />
      ) : (
        <p className={`text-sm ${data.value ? 'text-ink' : 'text-ink-faint italic'}`}>
          {data.value ?? 'No especificado'}
        </p>
      )}

      <p className="text-[11px] text-ink-faint">
        Actualizado: {formatDate(data.updated_at)}
      </p>
    </div>
  );
}
