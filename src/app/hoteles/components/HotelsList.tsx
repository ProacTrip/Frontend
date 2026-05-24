'use client';

import HotelCard from './HotelCard';
import type { FrontendHotel } from '@/app/lib/types/hotel';

interface HotelsListProps {
  hotels: FrontendHotel[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function HotelsList({ hotels, isLoading, hasMore, onLoadMore }: HotelsListProps) {
  return (
    <div className="space-y-6">
      {/* Results grid — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hotels.map((hotel, idx) => (
          <div
            key={hotel.id}
            className="animate-card-enter"
            style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
          >
            <HotelCard hotel={hotel} />
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full border-2 border-[#0A0A0A] text-[#0A0A0A] text-sm font-semibold hover:bg-[#0A0A0A] hover:text-white transition-all disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : 'Cargar más resultados'}
          </button>
        </div>
      )}

      {!hasMore && hotels.length > 0 && (
        <p className="text-center text-[#6A7282] text-sm py-8">
          No hay más resultados para esta búsqueda.
        </p>
      )}
    </div>
  );
}
