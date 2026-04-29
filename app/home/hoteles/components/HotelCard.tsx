// app/home/hoteles/components/HotelCard.tsx (CORREGIDO)

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FrontendHotel } from '@/app/lib/types/hotel';

interface HotelCardProps {
  hotel: FrontendHotel;
  isFavorite?: boolean;
  onToggleFavorite?: (hotelId: string) => void;
}

export default function HotelCard({ hotel, isFavorite = false, onToggleFavorite }: HotelCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setImageError(false);
  }, [currentImageIndex]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(hotel.id);
    }
  };

  // ✅ CORRECCIÓN 7: URL segura con encodeURIComponent
  const handleViewDetails = () => {
    router.push(`/home/hoteles?hotel=${encodeURIComponent(hotel.id)}`, { scroll: false });
  };

  return (
    // ✅ CORRECCIÓN 2: Eliminado cursor-pointer del div principal (solo el botón navega)
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="grid grid-cols-12 gap-4 p-4">
        
        {/* COLUMNA IZQUIERDA: Imagen */}
        <div 
          className="col-span-4 relative"
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            {hotel.images.length > 0 && !imageError ? (
              <img 
                src={hotel.images[currentImageIndex]} 
                alt={hotel.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-full h-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-white/50" />
              </div>
            )}

            {/* Botón favorito - ✅ CORRECCIÓN 6: z-30 explícito */}
            <button
              onClick={handleToggleFavorite}
              className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-30"
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-[#FF6B6B] text-[#FF6B6B]' : 'text-gray-600'}`}
              />
            </button>

            {/* Flechas navegación - ✅ CORRECCIÓN 5: aria-label y z-40 */}
            {hotel.images.length > 1 && isHoveringImage && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Imagen anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-40"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Siguiente imagen"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-40"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Indicador de imágenes - ✅ CORRECCIÓN 6: z-30 */}
            {hotel.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                {hotel.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA CENTRAL: Información */}
        <div className="col-span-5">
          {/* ✅ CORRECCIÓN 1: Eliminado onClick del título (no navega a ruta inexistente) */}
          <h3 className="text-lg font-bold text-[#FF6B6B] mb-1">
            {hotel.name}
          </h3>

          {/* ✅ CORRECCIÓN 3: Math.round para estrellas decimales */}
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: Math.round(hotel.stars || 0) }).map((_, i) => (
              <span key={i} className="text-yellow-500">⭐</span>
            ))}
            {hotel.stars === 0 && <span className="text-gray-400 text-sm">Sin categoría</span>}
          </div>

          {/* Ubicación */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              {hotel.location.city}
              {hotel.location.district && `, ${hotel.location.district}`}
            </span>
            {hotel.location.distanceFromCenter !== undefined && (
              <>
                <span className="text-gray-400">•</span>
                <span>a {hotel.location.distanceFromCenter} km del centro</span>
              </>
            )}
          </div>

          {/* Tipo */}
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
              {hotel.type}
            </span>
          </div>

          {/* Especificaciones */}
          {hotel.specifications && hotel.specifications.length > 0 && (
            <div className="text-sm text-gray-700 mb-2">
              {hotel.specifications.join(' · ')}
            </div>
          )}

          {/* Camas */}
          {hotel.beds && (
            <div className="text-sm text-gray-600">
              {hotel.beds}
            </div>
          )}

          {/* Amenities destacados */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Precio y Acción */}
        <div className="col-span-3 flex flex-col items-end justify-between">
          
          {/* Rating */}
          {hotel.rating && hotel.rating.score > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{hotel.rating.label}</p>
                <p className="text-xs text-gray-500">{hotel.rating.reviews} comentarios</p>
              </div>
              <div className="bg-[#FF6B6B] text-white px-2 py-1 rounded font-bold text-lg">
                {hotel.rating.score.toFixed(1)}
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Precio */}
          <div className="text-right mb-4">
            <p className="text-xs text-gray-600 mb-1">
              {hotel.price.nights} noche{hotel.price.nights > 1 ? 's' : ''}, {hotel.price.adults} adulto{hotel.price.adults > 1 ? 's' : ''}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {hotel.price.currency}{hotel.price.amount}
            </p>
            {hotel.price.includesTaxes && (
              <p className="text-xs text-gray-500">Incluye impuestos y cargos</p>
            )}
          </div>

          {/* ✅ CORRECCIÓN 7: Botón con URL segura */}
          <button
            onClick={handleViewDetails}
            className="w-full bg-[#FF6B6B] text-white py-3 px-4 rounded hover:bg-[#ff5252] transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            Ver disponibilidad
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}