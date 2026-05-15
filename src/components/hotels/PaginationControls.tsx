'use client';

import { useEffect, useState } from 'react';
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
  /** Timestamp (ms) until which the user is rate-limited. When active, shows countdown instead of "Cargar más". */
  rateLimitedUntil: number | null;
}

/**
 * Token-based pagination controls.
 *
 * Shows a "Cargar más resultados" button when more pages are available.
 * When rate-limited, shows a countdown ("Esperá Xs...") instead.
 * Button is disabled and shows a spinner during loading.
 * Completely hidden when hasMore is false.
 */
export default function PaginationControls({
  hasMore,
  onLoadMore,
  isLoading,
  remainingCount,
  rateLimitedUntil,
}: PaginationControlsProps) {
  // ── Rate-limit countdown ──
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (rateLimitedUntil === null) {
      setCountdown(0);
      return;
    }

    function tick() {
      const remaining = Math.max(0, Math.ceil((rateLimitedUntil! - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) return;
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  const isRateLimited = rateLimitedUntil !== null && countdown > 0;

  // ── Hide when no more results ──
  if (!hasMore) return null;

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center gap-2 py-6">
      {isRateLimited ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-warning-container bg-warning-container px-6 py-3 text-sm font-medium text-warning opacity-80 cursor-not-allowed min-h-[44px]"
        >
          <Loader2 size={16} className="animate-spin" />
          Esperá {countdown} segundos...
        </button>
      ) : (
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
      )}

      {!isRateLimited && remainingCount !== undefined && remainingCount > 0 && (
        <p className="text-xs text-ink-faint">
          {remainingCount} alojamientos más disponibles
        </p>
      )}
    </div>
  );
}
