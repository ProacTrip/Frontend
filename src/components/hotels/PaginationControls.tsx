'use client';

import { Loader2 } from 'lucide-react';

interface PaginationControlsProps {
  /** Whether more results are available */
  hasMore: boolean;
  /** Callback to load the next page */
  onLoadMore: () => void;
  /** Whether a page load is in progress */
  isLoading: boolean;
  /** Optional count of remaining results, shown as hint text */
  remainingCount?: number;
}

/**
 * Token-based pagination controls.
 *
 * Shows a "Cargar más resultados" button when more pages are available.
 * Button is disabled and shows a spinner during loading.
 * Optionally displays remaining count as helper text.
 */
export default function PaginationControls({
  hasMore,
  onLoadMore,
  isLoading,
  remainingCount,
}: PaginationControlsProps) {
  if (!hasMore) return null;

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center gap-2 py-6">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-paper-outline bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-dim disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Cargando...
          </>
        ) : (
          'Cargar más resultados'
        )}
      </button>

      {remainingCount !== undefined && remainingCount > 0 && (
        <p className="text-xs text-ink-faint">
          {remainingCount} alojamientos más disponibles
        </p>
      )}
    </div>
  );
}
