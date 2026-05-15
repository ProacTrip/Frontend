'use client';

import { Check } from 'lucide-react';

interface CheckboxFilterOption {
  value: number;
  label: string;
}

interface CheckboxFilterGroupProps {
  /** Title shown above checkboxes */
  title: string;
  /** Available options */
  options: readonly CheckboxFilterOption[];
  /** Currently selected values */
  selected: number[];
  /** Called when a value is toggled */
  onChange: (value: number) => void;
}

export default function CheckboxFilterGroup({
  title,
  options,
  selected,
  onChange,
}: CheckboxFilterGroupProps) {
  return (
    <div className="flex flex-col gap-2 font-[family-name:var(--font-geist-sans)]">
      <span className="text-sm font-semibold text-ink">{title}</span>
      <div className="flex flex-col gap-0.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? 'bg-olive-container text-ink'
                  : 'text-ink-muted hover:bg-paper-dim'
              }`}
            >
              {/* Hidden native checkbox for accessibility */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {/* Custom styled checkbox */}
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                  isSelected
                    ? 'border-olive bg-olive'
                    : 'border-paper-outline'
                }`}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </span>
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
