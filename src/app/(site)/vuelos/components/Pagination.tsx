'use client';

import { Loader2, ChevronRight } from 'lucide-react';

interface PaginationProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onNext: () => void;
}

/** Cursor-based pagination: [Anterior] [Siguiente].
 *  Uses TanStack Query's fetchNextPage / hasNextPage.
 *  Only shows navigation when there are more pages.
 */
export default function Pagination({ hasNextPage, isFetchingNextPage, onNext }: PaginationProps) {
  if (!hasNextPage) return null;

  return (
    <nav aria-label="Paginacion de resultados" className="flex items-center justify-center gap-1.5 py-8">
      {/* Next */}
      <button
        onClick={onNext}
        disabled={!hasNextPage || isFetchingNextPage}
        className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-medium text-vuelos-black border border-vuelos-border hover:border-[#aaa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Cargar mas resultados"
      >
        {isFetchingNextPage ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {isFetchingNextPage ? 'Cargando...' : 'Cargar mas'}
      </button>
    </nav>
  );
}
