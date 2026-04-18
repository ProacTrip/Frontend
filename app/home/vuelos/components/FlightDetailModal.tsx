// app/home/vuelos/components/FlightDetailModal.tsx
'use client';

import React, { useEffect } from 'react';
import { 
  X, 
  Plane, 
  Clock, 
  Luggage, 
  Leaf, 
  AlertCircle,
  Info,
  Check,
  Wifi,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { FlightOfferUI } from '@/app/lib/types/flight';

interface FlightDetailModalProps {
  offer: FlightOfferUI | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (offer: FlightOfferUI) => void;
}

const formatDuration = (minutes: number | undefined): string => {
  if (!minutes || minutes <= 0) return '--h --m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatTime = (datetime: string | undefined): string => {
  if (!datetime) return '--:--';
  const parts = datetime.split(' ');
  if (parts.length === 2) return parts[1].substring(0, 5);
  return datetime.substring(11, 16);
};

const formatDate = (datetime: string | undefined): string => {
  if (!datetime) return '--/--/--';
  const parts = datetime.split(' ')[0]?.split('-');
  if (parts && parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return datetime;
};

const formatPrice = (amount: number | undefined, currency: string = 'EUR'): string => {
  if (amount === undefined || amount === null) return `-- ${currency}`;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function FlightDetailModal({
  offer,
  isOpen,
  onClose,
  onSelect
}: FlightDetailModalProps) {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !offer) return null;

  const segment = offer.segments?.[0];
  if (!segment) return null;

  const legs = segment.legs || [];
  const isDirect = legs.length === 1;
  const layovers = segment.layovers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detalles del vuelo</h2>
            <p className="text-sm text-gray-500">
              {offer.airline?.name} {offer.airline.code && `(${offer.airline.code})`} · {formatDate(legs[0]?.origin?.datetime)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {offer.oftenDelayed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 text-sm">Vuelo con retrasos frecuentes</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Este vuelo suele tener retrasos según datos históricos.
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[#fff5e6] rounded-xl p-6 border border-[#ffe4cc]">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{formatTime(legs[0]?.origin?.datetime)}</div>
                <div className="text-lg font-semibold text-[#c54141] mt-1">{legs[0]?.origin?.code}</div>
                <div className="text-sm text-gray-600 mt-1">{legs[0]?.origin?.city}</div>
              </div>

              <div className="flex-1 px-8 flex flex-col items-center">
                <div className="text-sm text-gray-500 font-medium mb-2">{formatDuration(segment.totalDuration)}</div>
                <div className="w-full flex items-center gap-2">
                  <div className="h-0.5 flex-1 bg-[#c54141]/30"></div>
                  <Plane className="w-6 h-6 text-[#c54141] rotate-90" />
                  <div className="h-0.5 flex-1 bg-[#c54141]/30"></div>
                </div>
                <div className={`text-sm font-semibold mt-2 px-3 py-1 rounded-full ${
                  isDirect ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isDirect ? 'Directo' : `${layovers.length} escala${layovers.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{formatTime(legs[legs.length - 1]?.destination?.datetime)}</div>
                <div className="text-lg font-semibold text-[#c54141] mt-1">{legs[legs.length - 1]?.destination?.code}</div>
                <div className="text-sm text-gray-600 mt-1">{legs[legs.length - 1]?.destination?.city}</div>
              </div>
            </div>
          </div>

          {/* Itinerario */}
          <div className="space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#c54141]" /> Itinerario detallado
            </h3>

            {legs.map((leg, index) => (
              <div key={`leg-${index}`} className="relative">
                {index < legs.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 h-full"></div>
                )}

                <div className="flex gap-4">
                  <div className="flex flex-col items-center w-12 shrink-0">
                    <div className="w-3 h-3 bg-[#c54141] rounded-full ring-4 ring-[#c54141]/20"></div>
                    {index < legs.length - 1 && <div className="flex-1 w-0.5 bg-gray-200 my-2"></div>}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {offer.airline.logoUrl && (
                            <img 
                              src={offer.airline.logoUrl} 
                              alt={offer.airline.name} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{leg.flightNumber}</div>
                            <div className="text-sm text-gray-500">
                              {offer.airline.name}
                              {offer.operatedBy && <span className="text-amber-600"> · Operado por {offer.operatedBy}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatDuration(leg.duration)}</div>
                          <div className="text-xs text-gray-500">{leg.aircraft}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Salida</div>
                          <div className="font-bold text-gray-900">{formatTime(leg.origin?.datetime)}</div>
                          <div className="text-sm text-gray-700">{leg.origin?.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Terminal {leg.origin?.terminal || '--'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Llegada</div>
                          <div className="font-bold text-gray-900">{formatTime(leg.destination?.datetime)}</div>
                          <div className="text-sm text-gray-700">{leg.destination?.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Terminal {leg.destination?.terminal || '--'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                        {leg.features?.wifi === true && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Wifi className="w-4 h-4" /> WiFi Gratis
                          </span>
                        )}
                        {leg.features?.wifi === 'paid' && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Wifi className="w-4 h-4" /> WiFi ($)
                          </span>
                        )}
                        {leg.features?.power && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Check className="w-4 h-4 text-green-500" /> Enchufes
                          </span>
                        )}
                      </div>
                    </div>

                    {index < legs.length - 1 && layovers[index] && (
                      <div className="mt-4 ml-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-amber-900 text-sm">
                            Escala en {layovers[index].airportName} ({layovers[index].airportCode})
                          </div>
                          <div className="text-sm text-amber-700">
                            Duración: {formatDuration(layovers[index].duration)}
                            {layovers[index].overnight && ' · Pernocta'}
                          </div>
                          {layovers[index].changeTerminal && (
                            <div className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Cambio de terminal necesario
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipaje */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Luggage className="w-5 h-5 text-[#c54141]" /> Equipaje incluido
            </h4>
            
            {!offer.baggage ? (
              <div className="text-sm text-gray-500 italic">
                La información detallada de maletas y facturación se confirmará en el paso final de reserva.
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Artículo personal incluido</span>
                </div>
                {offer.baggage.carryOnIncluded && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Equipaje de mano incluido</span>
                  </div>
                )}
                {offer.baggage.checkedIncluded && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>1 pieza de facturación incluida</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CO2 */}
          {offer.carbonEmissions && (
            <div className={`rounded-lg p-4 border ${
              offer.carbonEmissions.differencePercent < 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <Leaf className={`w-5 h-5 shrink-0 ${
                  offer.carbonEmissions.differencePercent < 0 ? 'text-green-600' : 'text-gray-500'
                }`} />
                <div>
                  <h4 className={`font-semibold text-sm ${
                    offer.carbonEmissions.differencePercent < 0 ? 'text-green-900' : 'text-gray-900'
                  }`}>Emisiones de CO₂</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {(offer.carbonEmissions.thisFlight / 1000).toFixed(0)} kg en este viaje
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Políticas */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" /> Política de cambios
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Cambios permitidos según tarifa</p>
              <p>• Cancelación sujeta a penalización</p>
            </div>
          </div>

        </div>

        {/* FOOTER - BOTÓN CON LÓGICA DE AUTH */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(offer.price?.total, offer.price?.currency)}
              </div>
              <div className="text-sm text-gray-500">Precio total</div>
            </div>
            
            {isAuthenticated ? (
              <button
                onClick={() => { onSelect?.(offer); onClose(); }}
                className="px-8 py-3 bg-[#c54141] text-white font-semibold rounded-lg hover:bg-[#a03535] transition-colors shadow-lg shadow-[#c54141]/20"
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={() => { onClose(); window.location.href = '/auth/login'; }}
                className="px-8 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Iniciar sesión para continuar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}