'use client';

import { useState, useMemo } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { MapPin, X } from 'lucide-react';

interface LocationSuggestion {
  label: string;
  sublabel: string;
}

const DEFAULT_SUGGESTIONS: LocationSuggestion[] = [
  { label: 'Bangkok', sublabel: 'Tailandia' },
  { label: 'Ueno, Taito', sublabel: 'Tokio' },
  { label: 'Ikebukuro, Toshima', sublabel: 'Tokio' },
  { label: 'San Diego', sublabel: 'CA' },
  { label: 'Humboldt Park, Chicago', sublabel: 'IL' },
];

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  suggestions?: LocationSuggestion[];
  className?: string;
  /** Optional icon rendered inside the input area (left side) */
  leftIcon?: React.ReactNode;
}

export default function LocationCombobox({
  value,
  onChange,
  placeholder = '¿Adónde vas?',
  label = 'Ubicación',
  suggestions = DEFAULT_SUGGESTIONS,
  className = '',
  leftIcon,
}: LocationComboboxProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;

    const matches = suggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sublabel.toLowerCase().includes(q),
    );

    return matches;
  }, [query, suggestions]);

  const hasExactTypedMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return suggestions.some(
      (s) => s.label.toLowerCase() === q,
    );
  }, [query, suggestions]);

  const handleSelect = (selectedLabel: string | null) => {
    if (selectedLabel) {
      onChange(selectedLabel);
    }
    setQuery('');
  };

  return (
    <Combobox value={value || null} onChange={handleSelect}>
      <div className={`relative ${className}`}>
        <div className="w-full h-full text-left px-4 py-3 hover:bg-[#FAFAFA] rounded-l-2xl transition-colors group relative">
          <div className="flex items-center gap-2">
            {leftIcon && (
              <span className="text-gray-400 shrink-0 mt-0.5">{leftIcon}</span>
            )}
            <div className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[#0A0A0A]">
                {label}
              </span>
              <ComboboxInput
                className={`w-full bg-transparent outline-none text-[13px] pr-6 ${
                  value ? 'text-[#0A0A0A]' : 'text-[#6A7282]'
                } placeholder:text-[#6A7282]`}
                placeholder={value || placeholder}
                displayValue={() => value}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setQuery('')}
              />
            </div>
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#E5E5E5] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#6A7282]" />
            </button>
          )}
        </div>

        <ComboboxOptions
          anchor={{ to: 'bottom start', gap: 8 }}
          transition
          className="w-[var(--input-width)] bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-2 z-[960] origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 [--anchor-gap:8px]"
        >
          <p className="text-xs font-medium text-[#A1A1A1] uppercase tracking-wider px-3 py-2">
            Ubicaciones sugeridas
          </p>

          {filtered.map((suggestion) => (
            <ComboboxOption
              key={suggestion.label}
              value={suggestion.label}
              className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl data-[focus]:bg-[#FAFAFA] cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#6A7282]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#0A0A0A]">
                  {suggestion.label}
                </p>
                <p className="text-xs text-[#6A7282]">{suggestion.sublabel}</p>
              </div>
            </ComboboxOption>
          ))}

          {/* "Buscar '{query}'" — shown when text typed but no exact match found */}
          {query.trim() && filtered.length === 0 && !hasExactTypedMatch && (
            <ComboboxOption
              value={query.trim()}
              className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl data-[focus]:bg-[#FAFAFA] cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#6A7282]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#0A0A0A]">
                  Buscar &apos;{query.trim()}&apos;
                </p>
                <p className="text-xs text-[#6A7282]">Búsqueda personalizada</p>
              </div>
            </ComboboxOption>
          )}

          {/* Also show "Buscar '{query}'" when query has exact match (user may want custom search) */}
          {query.trim() && hasExactTypedMatch && (
            <ComboboxOption
              value={query.trim()}
              className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl data-[focus]:bg-[#FAFAFA] cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#6A7282]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#0A0A0A]">
                  Buscar &apos;{query.trim()}&apos;
                </p>
                <p className="text-xs text-[#6A7282]">Búsqueda personalizada</p>
              </div>
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

export type { LocationSuggestion, LocationComboboxProps };
