// app/home/vuelos/components/FlightList.tsx
'use client';

import React from 'react';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import FlightCard from './FlightCard';
import type { FlightOfferUI } from '@/app/lib/types/flight';

interface FlightListProps {
  offers: FlightOfferUI[]; 
  selectedOfferId?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect: (offer: FlightOfferUI) => void;
  onShowDetails?: (offer: FlightOfferUI) => void;
  showAuthError?: boolean; // NUEVA PROP
  hasNext?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export default function FlightList({
  offers,
  selectedOfferId,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
  onShowDetails,
  showAuthError = false,
  hasNext = false,
  onLoadMore,
  isLoadingMore = false,
}: FlightListProps) {

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-100">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error en la búsqueda</h3>
        <p className="text-gray-500 text-center max-w-md px-4 mb-6">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-[#c54141] text-white font-medium rounded-lg hover:bg-[#a03535] transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Intentar de nuevo
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#c54141] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Buscando los mejores precios...</p>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="bg-orange-50 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron vuelos</h3>
        <p className="text-gray-500 text-center max-w-md px-4">
          Intenta ajustar las fechas, los filtros o los aeropuertos para ver más resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Resultados ({offers.length})
        </h2>
      </div>

      {offers.map((offer, index) => {
        const showOtherHeader = index > 0 && !offer.isRecommended && offers[index - 1].isRecommended;

        return (
          <React.Fragment key={offer.id}>
            
            {showOtherHeader && (
              <div className="flex items-center gap-2 my-2">
                <div className="h-px bg-gray-300 flex-1" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Otras opciones
                </span>
                <div className="h-px bg-gray-300 flex-1" />
              </div>
            )}

            <FlightCard
              offer={offer}
              onSelect={onSelect}
              onShowDetails={onShowDetails}
              isSelected={offer.id === selectedOfferId}
              showAuthError={showAuthError} // PASAR A FLIGHTCARD
            />
          </React.Fragment>
        );
      })}

      {hasNext && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-white border-2 border-[#c54141] text-[#c54141] font-medium rounded-lg hover:bg-[#fff5f5] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Cargar más resultados'
            )}
          </button>
        </div>
      )}
    </div>
  );
}