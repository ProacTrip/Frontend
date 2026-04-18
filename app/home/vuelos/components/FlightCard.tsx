// app/home/vuelos/components/FlightCard.tsx
'use client';

import React from 'react';
import { 
  Plane, 
  Clock, 
  AlertTriangle, 
  Leaf, 
  Wifi, 
  Luggage, 
  Star
} from 'lucide-react';
import type { FlightOfferUI } from '@/app/lib/types/flight';

interface FlightCardProps {
  offer: FlightOfferUI;
  onSelect?: (offer: FlightOfferUI) => void;
  onShowDetails?: (offer: FlightOfferUI) => void;
  variant?: 'default' | 'compact';
  isSelected?: boolean;
  showAuthError?: boolean; // NUEVA PROP
}

const formatDuration = (minutes: number | undefined): string => {
  if (!minutes) return '--h --m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatTime = (datetime: string | undefined): string => {
  if (!datetime) return '--:--';
  const parts = datetime.split(' ');
  if (parts.length === 2) {
    return parts[1].substring(0, 5);
  }
  return datetime.substring(11, 16);
};

const formatPrice = (amount: number | undefined, currency: string): string => {
  if (amount === undefined || amount === null) return `-- ${currency}`;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'recommended' | 'warning' | 'eco' | 'default';
}) => {
  const styles = {
    recommended: 'bg-[#c54141]/10 text-[#c54141] border-[#c54141]/20',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    eco: 'bg-green-100 text-green-800 border-green-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};

export default function FlightCard({ 
  offer, 
  onSelect, 
  onShowDetails,
  variant = 'default',
  isSelected = false,
  showAuthError = false
}: FlightCardProps) {
  
  if (!offer.segments || offer.segments.length === 0) {
    return null;
  }

  const segment = offer.segments[0];
  const legs = segment.legs || [];

  if (legs.length === 0) {
    return null;
  }

  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  
  const isDirect = legs.length === 1;
  const layoverCount = segment.layovers?.length || 0;
  
  const hasPower = legs.some(leg => leg.features?.power);
  const hasEntertainment = legs.some(leg => leg.features?.entertainment);

  // Handler para el click en ver datos
  const handleShowDetails = () => {
    if (showAuthError) {
      // Si no está autenticado, igual abrimos detalles pero no dejamos seleccionar
      // La lógica de auth está en el modal/página
      onShowDetails?.(offer);
    } else {
      onShowDetails?.(offer);
    }
  };

  if (variant === 'compact') {
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleShowDetails}
      >
        <div className="flex justify-between items-center">
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
              <div className="font-semibold text-gray-900">
                {formatTime(firstLeg?.origin?.datetime)} - {formatTime(lastLeg?.destination?.datetime)}
              </div>
              <div className="text-xs text-gray-500">
                {isDirect ? 'Directo' : `${layoverCount} escala${layoverCount !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-[#c54141]">
              {formatPrice(offer.price?.total, offer.price?.currency || 'EUR')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border transition-all hover:shadow-lg ${
      isSelected 
        ? 'border-[#c54141] ring-2 ring-[#c54141]/20 shadow-md'  
        : offer.isRecommended 
          ? 'border-[#c54141]/30 ring-1 ring-[#c54141]/10 shadow-md' 
          : 'border-gray-200 shadow-sm'
    }`}>
      
      {/* HEADER: Badges y Precio */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-wrap gap-2">
            {offer.isRecommended && (
              <Badge variant="recommended">
                <Star className="w-3 h-3 fill-current" />
                Recomendado
              </Badge>
            )}
            
            {offer.oftenDelayed && (
              <Badge variant="warning">
                <AlertTriangle className="w-3 h-3" />
                Suele retrasarse
              </Badge>
            )}
            
            {offer.carbonEmissions && offer.carbonEmissions.differencePercent < 0 && (
              <Badge variant="eco">
                <Leaf className="w-3 h-3" />
                {Math.abs(offer.carbonEmissions.differencePercent)}% CO₂
              </Badge>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(offer.price?.total, offer.price?.currency || 'EUR')}
            </div>
            <div className="text-xs text-gray-500">Precio total</div>
          </div>
        </div>
      </div>

      {/* BODY: Timeline del vuelo */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Origen */}
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(firstLeg?.origin?.datetime)}
            </div>
            <div className="text-sm font-medium text-gray-700 mt-1">
              {firstLeg?.origin?.code}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[100px]">
              {firstLeg?.origin?.city}
            </div>
          </div>

          {/* Línea de vuelo */}
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-1">
              {formatDuration(segment?.totalDuration)}
            </div>
            <div className="w-full h-px bg-gray-300 relative flex items-center justify-center">
              <div className="absolute w-full flex justify-between px-2">
                {legs.map((_, idx) => (
                  <div key={`dot-${idx}`} className="w-2 h-2 bg-[#c54141] rounded-full" />
                ))}
              </div>
              <Plane className="w-5 h-5 text-[#c54141] bg-white px-1" />
            </div>
            <div className={`text-xs mt-1 font-medium ${
              isDirect ? 'text-green-600' : 'text-amber-600'
            }`}>
              {isDirect ? 'Directo' : `${layoverCount} escala${layoverCount !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Destino */}
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(lastLeg?.destination?.datetime)}
            </div>
            <div className="text-sm font-medium text-gray-700 mt-1">
              {lastLeg?.destination?.code}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[100px]">
              {lastLeg?.destination?.city}
            </div>
          </div>
        </div>

        {/* Info de escalas */}
        {!isDirect && segment?.layovers && segment.layovers.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <div className="font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Escalas:
            </div>
            {segment.layovers.map((layover, idx) => (
              <div key={`layover-${idx}`} className="flex justify-between text-xs border-b border-gray-200 last:border-0 py-1">
                <span>{layover.airportCode} ({layover.airportName})</span>
                <span className="text-gray-500">
                  {formatDuration(layover.duration)}
                  {layover.overnight && ' - Pernocta'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Aerolínea y Features */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {offer.airline.logoUrl ? (
              <img 
                src={offer.airline.logoUrl} 
                alt={offer.airline.name}
                className="w-10 h-10 object-contain bg-white"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Plane className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{offer.airline.name}</div>
              <div className="text-xs text-gray-500">
                {firstLeg?.flightNumber}
                {offer.operatedBy && ` · Operado por ${offer.operatedBy}`}
              </div>
            </div>
          </div>

          {/* Features Icons */}
          <div className="flex items-center gap-3 text-gray-400">
            {legs.some(leg => leg.features?.wifi === true) && (
              <div title="WiFi Gratis" className="text-green-600">
                <Wifi className="w-4 h-4" />
              </div>
            )}
            {legs.some(leg => leg.features?.wifi === 'paid') && (
              <div title="WiFi de pago" className="relative">
                <Wifi className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 text-[8px] font-bold text-amber-600">$</span>
              </div>
            )}
            
            {hasPower && (
              <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center text-[8px] font-bold" title="Enchufes">
                ⚡
              </div>
            )} 
            
            {hasEntertainment && (
              <div className="w-4 h-4" title="Entretenimiento">🎬</div>
            )}
            
            <div title="Equipaje incluido">
              <Luggage className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Solo Ver datos */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={handleShowDetails}
          className="w-full py-2.5 border border-[#c54141] text-[#c54141] font-medium rounded-lg hover:bg-[#c54141] hover:text-white transition-colors text-sm"
        >
          Ver datos
        </button>
      </div>
    </div>
  );
}