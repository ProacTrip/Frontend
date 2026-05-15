'use client';

import { RATING_OPTIONS } from '@/lib/constants/filters';

interface RatingFilterProps {
  /** Currently selected rating (7|8|9 or null/undefined for any) */
  rating?: number | null;
  /** Called when rating changes */
  onChange: (value: number | null) => void;
}

export default function RatingFilter({ rating, onChange }: RatingFilterProps) {
  return (
    <div className="flex flex-col gap-2 font-[family-name:var(--font-geist-sans)]">
      <span className="text-sm font-semibold text-ink">Valoración</span>
      <div className="flex flex-col gap-1">
        {RATING_OPTIONS.map((option) => {
          const isSelected =
            option.value === null
              ? rating === null || rating === undefined
              : rating === option.value;

          return (
            <label
              key={option.value === null ? 'any' : option.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? 'bg-coral-container text-coral-on-container'
                  : 'text-ink hover:bg-paper-dim'
              }`}
            >
              <input
                type="radio"
                name="rating"
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-coral bg-coral'
                    : 'border-paper-outline'
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
