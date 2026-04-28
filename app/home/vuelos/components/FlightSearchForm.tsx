// app/home/vuelos/components/FlightSearchForm.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plane, Calendar, MapPin, Search, ArrowRightLeft, ChevronDown, AlertCircle, Clock, TimerOff } from 'lucide-react';

import PassengersDropdown, { PassengerCounts } from './PassengersDropdown';
import TimeRangeFilter, { TimeRange } from './TimeRangeFilter';
import MultiCityLegs from './MultiCityLegs';
import { TripType, TravelClass, FlightSearchRequest, FlightSearchResponse, MultiCityLeg } from '@/app/lib/types/flight';
import { searchFlights } from '@/app/lib/api/flights';
import { RateLimitError } from '@/app/lib/api/auth';
import { formatRateLimitError } from '@/app/lib/utils/errors';

interface FlightSearchFormProps {
  initialValues?: Partial<FlightSearchFormState>;
  onSearch?: (results: FlightSearchResponse, request: FlightSearchRequest) => void;
}

interface FlightSearchFormState {
  tripType: TripType;
  departure: string;
  arrival: string;
  outboundDate: string;
  returnDate: string;
  passengers: PassengerCounts;
  travelClass: TravelClass;
  outboundTimeRange: TimeRange;
  returnTimeRange: TimeRange;
  emissionsFilter: boolean;
  maxDurationMinutes: number | null;
  legs: MultiCityLeg[];
}

const getLocalISOString = (date: Date): string => {
  return date.toLocaleDateString('sv-SE');
};

const getTodayString = (): string => getLocalISOString(new Date());

const DEFAULT_STATE: FlightSearchFormState = {
  tripType: 'round_trip',
  departure: '',
  arrival: '',
  outboundDate: '', // Fecha vacía por defecto
  returnDate: '',   // Fecha vacía por defecto
  passengers: {
    adults: 1,
    children: 0,
    infantsInSeat: 0,
    infantsOnLap: 0,
  },
  travelClass: 'economy',
  outboundTimeRange: { start: 0, end: 23 },
  returnTimeRange: { start: 0, end: 23 },
  emissionsFilter: false,
  maxDurationMinutes: null,
  legs: [],
};

export default function FlightSearchForm({ 
  initialValues, 
  onSearch 
}: FlightSearchFormProps) {
  
  const [formState, setFormState] = useState<FlightSearchFormState>({
    ...DEFAULT_STATE,
    ...initialValues,
  });

  const [isPassengersOpen, setIsPassengersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const passengerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) {
      setIsRateLimited(false);
      return;
    }
    const timer = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setIsPassengersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize 2 empty legs when user switches to multi_city
  useEffect(() => {
    if (formState.tripType === 'multi_city') {
      setFormState(prev => {
        if (prev.legs.length === 0) {
          return {
            ...prev,
            legs: [
              { departure: '', arrival: '', date: '' },
              { departure: '', arrival: '', date: '' },
            ],
          };
        }
        return prev;
      });
    }
  }, [formState.tripType]);

  const updateField = useCallback(<K extends keyof FlightSearchFormState>(
    field: K, 
    value: FlightSearchFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setError(null); 
  }, []);

  const swapLocations = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      departure: prev.arrival,
      arrival: prev.departure,
    }));
  }, []);

  const updateLegs = useCallback((legs: MultiCityLeg[]) => {
    setFormState(prev => ({ ...prev, legs }));
    setError(null);
  }, []);

  const validateForm = (): string | null => {
    const { departure, arrival, outboundDate, returnDate, tripType, legs } = formState;

    if (tripType === 'multi_city') {
      if (legs.length < 2) return 'Añade al menos 2 tramos';
      if (legs.length > 6) return 'Máximo 6 tramos permitidos';

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const tramo = `Tramo ${i + 1}`;

        if (!leg.departure.trim()) return `${tramo}: Ingresa el aeropuerto de origen`;
        if (!leg.arrival.trim()) return `${tramo}: Ingresa el aeropuerto de destino`;
        if (leg.departure.toLowerCase() === leg.arrival.toLowerCase()) {
          return `${tramo}: El origen y destino no pueden ser iguales`;
        }
        if (!leg.date) return `${tramo}: Selecciona la fecha`;

        const today = getTodayString();
        if (leg.date < today) return `${tramo}: La fecha no puede ser en el pasado`;

        // Sequential dates: each leg must be on or after the previous
        if (i > 0) {
          const prevLeg = legs[i - 1];
          if (prevLeg.date && leg.date && leg.date < prevLeg.date) {
            return `${tramo}: La fecha debe ser posterior al Tramo ${i}`;
          }
        }
      }

      return null;
    }

    if (!departure.trim()) return 'Ingresa el aeropuerto de origen';
    if (!arrival.trim()) return 'Ingresa el aeropuerto de destino';
    if (departure.toLowerCase() === arrival.toLowerCase()) {
      return 'El origen y destino no pueden ser iguales';
    }

    if (!outboundDate) return 'Selecciona la fecha de salida';
    
    const today = getTodayString();
    if (outboundDate < today) return 'La fecha de salida no puede ser en el pasado';

    if (tripType === 'round_trip') {
      if (!returnDate) return 'Selecciona la fecha de regreso';
      if (returnDate < outboundDate) {
        return 'La fecha de regreso debe ser posterior a la de salida';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isMultiCity = formState.tripType === 'multi_city';

      const searchRequest: FlightSearchRequest = isMultiCity
        ? {
            trip_type: 'multi_city',
            legs: formState.legs.map(leg => ({
              departure: leg.departure.toUpperCase().trim(),
              arrival: leg.arrival.toUpperCase().trim(),
              date: leg.date,
              ...(leg.times && (leg.times.start !== 0 || leg.times.end !== 23) && {
                times: {
                  departure_from: leg.times.start,
                  departure_to: leg.times.end,
                },
              }),
            })),
            adults: formState.passengers.adults,
            children: formState.passengers.children,
            infants_in_seat: formState.passengers.infantsInSeat,
            infants_on_lap: formState.passengers.infantsOnLap,
            travel_class: formState.travelClass,
            currency: 'EUR',
            hl: 'es',
            gl: 'ES',
            ...(formState.emissionsFilter) && {
              emissions_filter: true,
            },
            ...(formState.maxDurationMinutes) && {
              max_duration_minutes: formState.maxDurationMinutes,
            },
          }
        : {
            trip_type: formState.tripType,
            departure: formState.departure,
            arrival: formState.arrival,
            outbound_date: formState.outboundDate,
            return_date: formState.tripType === 'round_trip' ? formState.returnDate : undefined,
            adults: formState.passengers.adults,
            children: formState.passengers.children,
            infants_in_seat: formState.passengers.infantsInSeat,
            infants_on_lap: formState.passengers.infantsOnLap,
            travel_class: formState.travelClass,
            currency: 'EUR',
            hl: 'es',
            gl: 'ES',
            
            ...(formState.outboundTimeRange.start !== 0 || formState.outboundTimeRange.end !== 23) && {
              outbound_times: {
                departure_from: formState.outboundTimeRange.start,
                departure_to: formState.outboundTimeRange.end,
              },
            },
            ...(formState.tripType === 'round_trip' && 
               (formState.returnTimeRange.start !== 0 || formState.returnTimeRange.end !== 23)) && {
              return_times: {
                departure_from: formState.returnTimeRange.start,
                departure_to: formState.returnTimeRange.end,
              },
            },
            ...(formState.emissionsFilter) && {
              emissions_filter: true,
            },
            ...(formState.maxDurationMinutes) && {
              max_duration_minutes: formState.maxDurationMinutes,
            },
          };

      const response = await searchFlights(searchRequest);

      if (response.results_state === 'empty') {
        return;
      }

      if (onSearch) {
        onSearch(response, searchRequest);
      }

    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setIsRateLimited(true);
        if (err.retryAfter > 0) {
          setRateLimitCountdown(err.retryAfter);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Error al buscar vuelos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalPassengers = formState.passengers.adults + 
                          formState.passengers.children + 
                          formState.passengers.infantsInSeat + 
                          formState.passengers.infantsOnLap;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-100 relative">
      
      <div className="flex items-center gap-2 text-[#c54141] mb-2">
        <Plane className="w-6 h-6" />
        <h2 className="text-xl font-bold">Buscar vuelos</h2>
      </div>

      {error && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          isRateLimited
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {isRateLimited ? (
            <TimerOff className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{error}</span>
          {isRateLimited && rateLimitCountdown > 0 && (
            <span className="ml-auto font-mono font-bold text-amber-800 whitespace-nowrap">
              {Math.floor(rateLimitCountdown / 60)}:{String(rateLimitCountdown % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      {/* Tipo de Viaje */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'round_trip' as TripType, label: 'Ida y vuelta' },
          { id: 'one_way' as TripType, label: 'Solo ida' },
          { id: 'multi_city' as TripType, label: 'Multi-destino' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => updateField('tripType', option.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              formState.tripType === option.id
                ? 'bg-white text-[#c54141] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {formState.tripType === 'multi_city' ? (
        <MultiCityLegs
          legs={formState.legs}
          onLegsChange={updateLegs}
        />
      ) : (
        <>
          {/* Origen y Destino */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Origen
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formState.departure}
                  onChange={(e) => updateField('departure', e.target.value.toUpperCase())}
                  placeholder="MAD (Madrid)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] uppercase font-medium transition-all"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={swapLocations}
                className="p-2 rounded-full hover:bg-[#c54141]/10 text-gray-400 hover:text-[#c54141] transition-colors"
                title="Intercambiar origen y destino"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Destino
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formState.arrival}
                  onChange={(e) => updateField('arrival', e.target.value.toUpperCase())}
                  placeholder="LIM (Lima)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] uppercase font-medium transition-all"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Fecha Ida
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formState.outboundDate}
                  onChange={(e) => updateField('outboundDate', e.target.value)}
                  min={mounted ? getTodayString() : '2026-01-01'}
                  placeholder="dd-mm-aaaa"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] text-sm placeholder:text-gray-400"
                />
              </div>
            </div>

            {formState.tripType === 'round_trip' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Fecha Vuelta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formState.returnDate}
                    onChange={(e) => updateField('returnDate', e.target.value)}
                    min={formState.outboundDate || (mounted ? getTodayString() : '2026-01-01')}
                    placeholder="dd-mm-aaaa"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] text-sm placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pasajeros y Clase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="relative space-y-1" ref={passengerRef}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Viajeros
          </label>
          <button
            type="button"
            onClick={() => setIsPassengersOpen(!isPassengersOpen)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] bg-white hover:border-gray-400 transition-all"
          >
            <span className="text-gray-900 font-medium">
              {totalPassengers} pasajero{totalPassengers !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-500 text-sm ml-2 block truncate">
              {formState.passengers.adults} Adultos
              {formState.passengers.children > 0 && `, ${formState.passengers.children} Niños`}
              {(formState.passengers.infantsInSeat + formState.passengers.infantsOnLap) > 0 && `, ${formState.passengers.infantsInSeat + formState.passengers.infantsOnLap} Bebés`}
            </span>
          </button>

          {isPassengersOpen && (
            <div className="absolute z-50 w-full mt-1">
              <PassengersDropdown
                value={formState.passengers}
                onChange={(newPassengers) => updateField('passengers', newPassengers)}
                isOpen={isPassengersOpen}
                onToggle={() => setIsPassengersOpen(false)}
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Clase
          </label>
          <div className="relative">
            <select
              value={formState.travelClass}
              onChange={(e) => updateField('travelClass', e.target.value as TravelClass)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] bg-white appearance-none cursor-pointer"
            >
              <option value="economy">Turista</option>
              <option value="premium_economy">Turista Premium</option>
              <option value="business">Business</option>
              <option value="first">Primera</option>
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="border-t border-gray-100 pt-4">
        <details className="group" open>
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-[#c54141] list-none">
            <span className="transition-transform group-open:rotate-90 mr-1">▶</span>
            <span>Filtros avanzados</span>
          </summary>
          
          <div className="mt-4 space-y-4 pl-6">
            {formState.tripType !== 'multi_city' && (
              <>
                <TimeRangeFilter
                  label="Salida (Ida)"
                  value={formState.outboundTimeRange}
                  onChange={(range) => updateField('outboundTimeRange', range)}
                />
                
                {formState.tripType === 'round_trip' && (
                  <TimeRangeFilter
                    label="Salida (Vuelta)"
                    value={formState.returnTimeRange}
                    onChange={(range) => updateField('returnTimeRange', range)}
                  />
                )}
              </>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                Duracion maxima
              </label>
              <input
                type="range"
                min="60"
                max="1440"
                step="30"
                value={formState.maxDurationMinutes || 1440}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateField('maxDurationMinutes', val < 1440 ? val : null);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#c54141]"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1h</span>
                <span className="font-medium text-[#c54141]">
                  {formState.maxDurationMinutes 
                    ? `${Math.floor(formState.maxDurationMinutes / 60)}h ${formState.maxDurationMinutes % 60}m`
                    : 'Sin limite'
                  }
                </span>
                <span>24h</span>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                checked={formState.emissionsFilter}
                onChange={(e) => updateField('emissionsFilter', e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900">Solo vuelos eco-friendly</span>
                <p className="text-xs text-gray-500">Emisiones inferiores a la media</p>
              </div>
            </label>
          </div>
        </details>
      </div>

      <button
        type="submit"
        disabled={isLoading || isRateLimited}
        className="w-full py-3.5 bg-[#c54141] text-white font-bold rounded-lg hover:bg-[#a03535] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Buscar Vuelos
          </>
        )}
      </button>
    </form>
  );
}