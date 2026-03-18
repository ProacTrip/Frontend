'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Offer {
  id: string;
  type: 'hotel' | 'flight';
  title: string;
  description: string;
  discount: string;
  created_at: string;
  hotel_id?: string;  // ID del hotel (si es oferta de hotel)
  flight_token?: string;  // Token del vuelo (si es oferta de vuelo)
}

export default function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hoveredOfferId, setHoveredOfferId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TODO: En el futuro, aquí llamarás al endpoint del backend para obtener ofertas
  // useEffect(() => {
  //   async function fetchOffers() {
  //     const response = await apiFetch('/v1/offers/notifications');
  //     const data = await response.json();
  //     setOffers(data.offers.slice(0, 3)); // Máximo 3 ofertas
  //   }
  //   fetchOffers();
  // }, []);

  // Limitar a máximo 3 ofertas
  const displayedOffers = offers.slice(0, 3);
  const unreadCount = displayedOffers.length;

  // Eliminar oferta
  const handleDeleteOffer = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el click de la oferta
    
    // TODO: Llamar al backend para marcar como eliminada
    // await apiFetch(`/v1/offers/notifications/${offerId}`, { method: 'DELETE' });
    
    setOffers(prev => prev.filter(offer => offer.id !== offerId));
  };

  // Ir a la oferta (hotel o vuelo)
  const handleOfferClick = (offer: Offer) => {
    setIsOpen(false);
    
    if (offer.type === 'hotel' && offer.hotel_id) {
      // Redirigir a hoteles con el ID del hotel
      router.push(`/home/hoteles?hotel_id=${offer.hotel_id}`);
    } else if (offer.type === 'flight' && offer.flight_token) {
      // Redirigir a vuelos con el token del vuelo
      router.push(`/home/vuelos?flight_token=${offer.flight_token}`);
    }
  };

  return (
    <div className="fixed top-20 right-6 z-40" ref={dropdownRef}>
      {/* Botón circular */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-[#FF6B6B] text-white rounded-full shadow-lg hover:bg-[#ff5252] transition-all duration-300 hover:scale-110 flex items-center justify-center"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge con número de notificaciones */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-slideIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF6B6B] to-[#ff8a80] px-4 py-3">
            <h3 className="text-white font-semibold text-lg">Ofertas Especiales</h3>
            {unreadCount > 0 && (
              <p className="text-white/80 text-xs mt-1">
                Máximo 3 ofertas · {unreadCount} disponible{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Contenido */}
          <div className="max-h-96 overflow-y-auto">
            {displayedOffers.length === 0 ? (
              // Sin ofertas
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No tienes nuevas ofertas</p>
                <p className="text-gray-400 text-sm mt-2">
                  Te avisaremos cuando haya ofertas disponibles
                </p>
              </div>
            ) : (
              // Lista de ofertas
              <div className="divide-y divide-gray-100">
                {displayedOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="relative p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleOfferClick(offer)}
                    onMouseEnter={() => setHoveredOfferId(offer.id)}
                    onMouseLeave={() => setHoveredOfferId(null)}
                  >
                    {/* Botón X para eliminar (solo visible al hacer hover) */}
                    {hoveredOfferId === offer.id && (
                      <button
                        onClick={(e) => handleDeleteOffer(offer.id, e)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-md z-10"
                        title="Eliminar oferta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Icono según tipo */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        offer.type === 'hotel' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {offer.type === 'hotel' ? '🏨' : '✈️'}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        {/* Título */}
                        <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate">
                          {offer.title}
                        </h4>

                        {/* Descripción */}
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                          {offer.description}
                        </p>

                        {/* Descuento y fecha */}
                        <div className="flex items-center justify-between">
                          <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                            {offer.discount}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(offer.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (si hay ofertas) */}
          {displayedOffers.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <p className="text-center text-gray-500 text-xs">
                Click en una oferta para ver detalles
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}