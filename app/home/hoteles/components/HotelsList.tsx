'use client';

import { useState, useEffect, useRef } from 'react';
import HotelCard from './HotelCard';

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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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
  const handleToggleFavorite = (hotelId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(hotelId)) {
        newFavorites.delete(hotelId);
        console.log('💔 Eliminado de favoritos:', hotelId);
      } else {
        newFavorites.add(hotelId);
        console.log('❤️ Añadido a favoritos:', hotelId);
      }
      return newFavorites;
    });

    // 🚧 TODO APARTADO 8-9: Guardar en backend cuando conectemos
    /*
    // ✅ VERSIÓN REAL (cuando tengamos endpoint de favoritos):
    try {
      if (favorites.has(hotelId)) {
        await apiFetch(`/v1/user/favorites/${hotelId}`, { method: 'DELETE' });
      } else {
        await apiFetch('/v1/user/favorites', { 
          method: 'POST', 
          body: JSON.stringify({ hotel_id: hotelId }) 
        });
      }
    } catch (error) {
      console.error('Error guardando favorito:', error);
      // Revertir cambio en caso de error
    }
    */
  };

  return (
    <div className="space-y-4">
      {/* Lista de hoteles */}
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          isFavorite={favorites.has(hotel.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}

      {/* ==================== ELEMENTO DE CARGA INFINITA ==================== */}
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
              
              {/* 🐛 DEBUG - Mostrar info de paginación (QUITAR EN PRODUCCIÓN) */}
              {nextToken && (
                <p className="text-xs text-gray-400 mt-1">
                  Token: {nextToken} | Total cargados: {hotels.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando ya no hay más resultados */}
      {!hasMore && hotels.length > 0 && (
        <p className="text-center text-gray-500 py-8">
          ✅ No hay más resultados
        </p>
      )}
    </div>
  );
}