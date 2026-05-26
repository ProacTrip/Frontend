// app/vuelos/components/FlightSearchForm.tsx
'use client';

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { Plane, Calendar, MapPin, Search, ArrowRightLeft, ChevronDown, AlertCircle, Clock } from 'lucide-react';

import PassengersDropdown, { PassengerCounts } from './PassengersDropdown';
import TimeRangeFilter, { TimeRange } from './TimeRangeFilter';
import { TripType, TravelClass, FlightSearchRequest, FlightSearchResponse } from '@/app/lib/types/flight';
import { searchFlights, FlightApiError } from '@/app/lib/api/flights';
import { getUserPreferences } from '@/app/lib/utils/location';

interface FlightSearchFormProps {
  initialValues?: Partial<FlightSearchFormState>;
  onSearch?: (results: FlightSearchResponse, request: FlightSearchRequest) => void;
  /** External flag: true when the global rate limit store says the user is blocked */
  searchBlocked?: boolean;
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
  gl: string;
  hl: string;
  currency: string;
}

const getLocalISOString = (date: Date): string => {
  return date.toLocaleDateString('sv-SE');
};

const getTodayString = (): string => getLocalISOString(new Date());

const getDefaultPrefs = () => {
  if (typeof window === 'undefined') return { gl: 'ES', hl: 'es', currency: 'EUR' };
  const prefs = getUserPreferences();
  return {
    gl: prefs.gl || 'ES',
    hl: prefs.hl || 'es',
    currency: prefs.currency || 'EUR',
  };
};

const defaultPrefs = getDefaultPrefs();

const DEFAULT_STATE: FlightSearchFormState = {
  tripType: 'round_trip',
  departure: '',
  arrival: '',
  outboundDate: '',
  returnDate: '',
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
  gl: defaultPrefs.gl,
  hl: defaultPrefs.hl,
  currency: defaultPrefs.currency,
};

export default function FlightSearchForm({ 
  initialValues, 
  onSearch,
  searchBlocked = false,
}: FlightSearchFormProps) {
  
  const [formState, setFormState] = useState<FlightSearchFormState>({
    ...DEFAULT_STATE,
    ...initialValues,
  });

  const [isPassengersOpen, setIsPassengersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  
  const passengerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setIsPassengersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trip type change handler
  const handleTripTypeChange = useCallback((tripType: TripType) => {
    setFormState(prev => ({ ...prev, tripType }));
    setError(null);
  }, []);

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

  const validateForm = (): string | null => {
    const { departure, arrival, outboundDate, returnDate, tripType } = formState;

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchRequest: FlightSearchRequest = {
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
        currency: formState.currency,
        hl: formState.hl,
        gl: formState.gl,
        
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

      if (onSearch) {
        onSearch(response, searchRequest);
      }

    } catch (err) {
      if (err instanceof FlightApiError) {
        setError(err.detail || err.message);
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-vuelos-border relative">
      
      <div className="flex items-center gap-2 text-vuelos-black mb-2">
        <Plane className="w-6 h-6" />
        <h2 className="text-xl font-bold font-[family-name:var(--font-syne)]">Buscar vuelos</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tipo de Viaje */}
      <div className="flex gap-2 p-1 bg-vuelos-surface rounded-lg">
        {[
          { id: 'round_trip' as TripType, label: 'Ida y vuelta' },
          { id: 'one_way' as TripType, label: 'Solo ida' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleTripTypeChange(option.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              formState.tripType === option.id
                ? 'bg-white text-vuelos-accent shadow-sm'
                : 'text-vuelos-muted hover:text-vuelos-black'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Origen y Destino */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
            Origen
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-vuelos-muted" />
            <input
              type="text"
              value={formState.departure}
              onChange={(e) => updateField('departure', e.target.value.toUpperCase())}
              placeholder="MAD (Madrid)"
              className="w-full pl-10 pr-4 py-2.5 border border-vuelos-border rounded-lg focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent uppercase font-medium transition-all"
              maxLength={10}
            />
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={swapLocations}
            className="p-2 rounded-full hover:bg-vuelos-accent/10 text-vuelos-muted hover:text-vuelos-accent transition-colors"
            title="Intercambiar origen y destino"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
            Destino
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-vuelos-muted" />
            <input
              type="text"
              value={formState.arrival}
              onChange={(e) => updateField('arrival', e.target.value.toUpperCase())}
              placeholder="LIM (Lima)"
              className="w-full pl-10 pr-4 py-2.5 border border-vuelos-border rounded-lg focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent uppercase font-medium transition-all"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
            Fecha Ida
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-5 h-5 text-vuelos-muted" />
            <input
              type="date"
              value={formState.outboundDate}
              onChange={(e) => updateField('outboundDate', e.target.value)}
              min={getTodayString()}
              suppressHydrationWarning
              placeholder="dd-mm-aaaa"
              className="w-full pl-10 pr-4 py-2.5 border border-vuelos-border rounded-lg focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent text-sm placeholder:text-vuelos-muted"
            />
          </div>
        </div>

        {formState.tripType === 'round_trip' && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
              Fecha Vuelta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-vuelos-muted" />
              <input
                type="date"
                value={formState.returnDate}
                onChange={(e) => updateField('returnDate', e.target.value)}
                min={formState.outboundDate || getTodayString()}
                suppressHydrationWarning
                placeholder="dd-mm-aaaa"
                className="w-full pl-10 pr-4 py-2.5 border border-vuelos-border rounded-lg focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent text-sm placeholder:text-vuelos-muted"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pasajeros y Clase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="relative space-y-1" ref={passengerRef}>
          <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
            Viajeros
          </label>
          <button
            type="button"
            onClick={() => setIsPassengersOpen(!isPassengersOpen)}
            className="w-full px-4 py-2.5 border border-vuelos-border rounded-lg text-left focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent bg-white hover:border-[#aaa] transition-all"
          >
            <span className="text-vuelos-black font-medium">
              {totalPassengers} pasajero{totalPassengers !== 1 ? 's' : ''}
            </span>
            <span className="text-vuelos-muted text-sm ml-2 block truncate">
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
                  onToggle={() => setIsPassengersOpen(false)}
                />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-vuelos-muted uppercase tracking-wide">
            Clase
          </label>
          <div className="relative">
            <select
              value={formState.travelClass}
              onChange={(e) => updateField('travelClass', e.target.value as TravelClass)}
              className="w-full px-4 py-2.5 border border-vuelos-border rounded-lg focus:ring-2 focus:ring-vuelos-accent focus:border-vuelos-accent bg-white appearance-none cursor-pointer"
            >
              <option value="economy">Turista</option>
              <option value="premium_economy">Turista Premium</option>
              <option value="business">Business</option>
              <option value="first">Primera</option>
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-vuelos-muted">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="border-t border-vuelos-border pt-4">
        <details className="group" open={filtersOpen} onToggle={(e) => setFiltersOpen(e.currentTarget.open)}>
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-vuelos-muted hover:text-vuelos-accent list-none">
            <span className="transition-transform group-open:rotate-90 mr-1">▶</span>
            <span>Filtros avanzados</span>
          </summary>
          
          <div className="mt-4 space-y-4 pl-6">
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

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-vuelos-black">
                <Clock className="w-4 h-4 text-vuelos-muted" />
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
                className="w-full h-2 bg-vuelos-surface rounded-lg appearance-none cursor-pointer accent-vuelos-accent"
              />
              <div className="flex justify-between text-xs text-vuelos-muted">
                <span>1h</span>
                <span className="font-medium text-vuelos-accent">
                  {formState.maxDurationMinutes 
                    ? `${Math.floor(formState.maxDurationMinutes / 60)}h ${formState.maxDurationMinutes % 60}m`
                    : 'Sin limite'
                  }
                </span>
                <span>24h</span>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border border-vuelos-border rounded-lg cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                checked={formState.emissionsFilter}
                onChange={(e) => updateField('emissionsFilter', e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-vuelos-border"
              />
              <div className="text-sm">
                <span className="font-medium text-vuelos-black">Solo vuelos eco-friendly</span>
                <p className="text-xs text-vuelos-muted">Emisiones inferiores a la media</p>
              </div>
            </label>
          </div>
        </details>
      </div>

      <button
        type="submit"
        disabled={isLoading || searchBlocked}
        className="w-full py-3.5 bg-vuelos-black text-white font-bold rounded-full hover:bg-[#333] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
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