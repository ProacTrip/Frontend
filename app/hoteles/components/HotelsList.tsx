'use client';

import { useState, useEffect, useRef } from 'react';
import HotelCard from './HotelCard';
import { useFavorites } from '@/hooks/useFavorites';

interface HotelsListProps {
  hotels: any[];
  isLoading: boolean;
  hasMore: boolean;
  nextToken: string | null; // 🔧 Token para pedir la siguiente página al backend
  onLoadMore: () => void;
}

export default function HotelsList({ 
  hotels, 
  isLoading, 
  hasMore, 
  nextToken,
  onLoadMore 
}: HotelsListProps) {
  const { isFavorite, toggleFavorite } = useFavorites('hotel');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // ==================== INFINITE SCROLL ====================
  // Detecta cuando el usuario llega al final de la lista
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('🔄 Usuario llegó al final, cargando más...');
          onLoadMore(); // Llama a handleLoadMore() del parent
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // ==================== FAVORITOS ====================
  const handleToggleFavorite = async (hotel: any) => {
    if (togglingId) return; // Ya hay uno procesando
    
    setTogglingId(hotel.id);
    try {
      await toggleFavorite({
        entity_id: hotel.id,
        entity_type: 'hotel',
        title: hotel.name,
      });
    } catch (error) {
      console.error('Error guardando favorito:', error);
    } finally {
      setTogglingId(null);
    }
  };
return (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          isFavorite={isFavorite(hotel.id)}
          onToggleFavorite={() => handleToggleFavorite(hotel)}
          isToggling={togglingId === hotel.id} // ← Solo true para el clickeado
        />
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Cargando más hoteles...</span>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Scroll para cargar más</p>
              {nextToken && (
                <p className="text-xs text-gray-400 mt-1">
                  Total cargados: {hotels.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!hasMore && hotels.length > 0 && (
        <p className="text-center text-gray-500 py-8">
          ✅ No hay más resultados
        </p>
      )}
    </div>
  );
}