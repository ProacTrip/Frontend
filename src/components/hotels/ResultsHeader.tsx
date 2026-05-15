'use client';

import { SORT_OPTIONS } from '@/lib/constants/filters';

interface ResultsHeaderProps {
  /** Total number of matching properties */
  totalCount: number;
  /** Destination string (e.g., "Madrid") */
  destination: string;
  /** Current sort_by value (null = "Recomendados") */
  sortBy: number | null;
  /** Called when user selects a different sort option */
  onSortChange: (value: number | null) => void;
}

export default function ResultsHeader({
  totalCount,
  destination,
  sortBy,
  onSortChange,
}: ResultsHeaderProps) {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
      {/* Count + destination */}
      <p className="text-sm text-ink-muted">
        {totalCount > 0 ? (
          <>
            <span className="font-semibold text-ink">Mostrando {totalCount}</span>
            {' '}alojamientos{destination ? ` en ${destination}` : ''}
          </>
        ) : (
          <span className="text-ink-faint">Sin resultados</span>
        )}
      </p>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="text-xs text-ink-muted whitespace-nowrap">
          Ordenar por
        </label>
        <select
          id="sort-select"
          value={sortBy ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onSortChange(val ? Number(val) : null);
          }}
          className="min-w-[140px] rounded-lg border border-paper-outline bg-paper px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-coral/30 transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5954' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            paddingRight: '2rem',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
