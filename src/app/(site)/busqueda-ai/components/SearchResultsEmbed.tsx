// app/busqueda-ai/components/SearchResultsEmbed.tsx
'use client';

import { useState, useMemo } from 'react';
import { Plane, Building2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import type { FlightSearchResponse, FlightOffer } from '@/app/lib/types/flight';
import type { SearchHotelsResponse, FrontendHotel, BackendSearchHotel } from '@/app/lib/types/hotel';
import HotelCard from '@/app/(site)/hoteles/components/HotelCard';
import { adaptSearchResults } from '@/app/lib/utils/transformers';

interface SearchResultsEmbedProps {
  flights?: FlightSearchResponse | null;
  hotels?: SearchHotelsResponse | null;
  flightsError?: string;
  hotelsError?: string;
}

export default function SearchResultsEmbed({
  flights,
  hotels,
  flightsError,
  hotelsError,
}: SearchResultsEmbedProps) {
  const [flightsExpanded, setFlightsExpanded] = useState(true);
  const [hotelsExpanded, setHotelsExpanded] = useState(true);

  // Extract flights from raw API response
  const flightOffers: FlightOffer[] = useMemo(() => {
    if (!flights) return [];
    const raw = [...(flights.best_flights || []), ...(flights.other_flights || [])];
    return raw;
  }, [flights]);

  // Transform hotel results using existing utility
  const hotelProperties: FrontendHotel[] = useMemo(() => {
    if (!hotels?.properties) return [];
    try {
      return adaptSearchResults(hotels.properties as BackendSearchHotel[], {
        query: '',
        check_in_date: '',
        check_out_date: '',
        adults: 1,
        children: 0,
        children_ages: [],
        rooms: 1,
      });
    } catch {
      return [];
    }
  }, [hotels]);

  const hasFlights = flights && flightOffers.length > 0;
  const hasHotels = hotels && hotelProperties.length > 0;
  const showBoth = hasFlights && hasHotels;

  if (!hasFlights && !hasHotels && !flightsError && !hotelsError) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Flights section */}
      {(hasFlights || flightsError) && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setFlightsExpanded(!flightsExpanded)}
            className={`
              w-full flex items-center justify-between px-4 py-3 text-sm font-semibold
              ${showBoth ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-800'}
              hover:bg-opacity-80 transition-colors
            `}
          >
            <span className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Vuelos{hasFlights ? ` (${flightOffers.length})` : ''}
            </span>
            {flightsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {flightsExpanded && (
            <div className="p-2 max-h-[400px] overflow-y-auto space-y-2">
              {flightsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>No se pudieron obtener vuelos: {flightsError}</span>
                </div>
              )}
              {hasFlights &&
                flightOffers.slice(0, 5).map((offer, idx) => (
                  <FlightCard
                    key={offer.booking_token || offer.departure_token || `flight-${idx}`}
                    offer={offer}
                    isExpanded={false}
                    onToggle={() => {}}
                  />
                ))}
              {hasFlights && flightOffers.length > 5 && (
                <p className="text-xs text-gray-500 text-center py-1">
                  +{flightOffers.length - 5} vuelos más. Refiná tu búsqueda.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hotels section */}
      {(hasHotels || hotelsError) && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setHotelsExpanded(!hotelsExpanded)}
            className={`
              w-full flex items-center justify-between px-4 py-3 text-sm font-semibold
              ${showBoth ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-800'}
              hover:bg-opacity-80 transition-colors
            `}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Hoteles{hasHotels ? ` (${hotelProperties.length})` : ''}
            </span>
            {hotelsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {hotelsExpanded && (
            <div className="p-2 max-h-[400px] overflow-y-auto space-y-2">
              {hotelsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>No se pudieron obtener hoteles: {hotelsError}</span>
                </div>
              )}
              {hasHotels &&
                hotelProperties.slice(0, 5).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              {hasHotels && hotelProperties.length > 5 && (
                <p className="text-xs text-gray-500 text-center py-1">
                  +{hotelProperties.length - 5} hoteles más. Refiná tu búsqueda.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
