'use client';

import { MapPin } from 'lucide-react';

interface DestinationInputProps {
  /** Current destination value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Optional label override (defaults to "Destino") */
  label?: string;
  /** Error message to display */
  error?: string;
}

export default function DestinationInput({
  value,
  onChange,
  label = 'Destino',
  error,
}: DestinationInputProps) {
  return (
    <div className="flex flex-col gap-1.5 font-[family-name:var(--font-geist-sans)]">
      <label className="text-xs font-medium text-ink-muted">{label}</label>
      <div
        className={`flex items-center gap-2 rounded-lg border bg-paper px-3 py-2.5 transition-colors ${
          error
            ? 'border-error'
            : 'border-paper-outline focus-within:border-coral focus-within:ring-1 focus-within:ring-coral/30'
        }`}
      >
        <MapPin size={18} className="shrink-0 text-ink-faint" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="¿A dónde vas?"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
          aria-label={label}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
