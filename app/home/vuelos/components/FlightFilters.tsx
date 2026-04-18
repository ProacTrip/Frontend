// app/home/vuelos/components/FlightFilters.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { 
  Filter, 
  X, 
  Plane, 
  Clock, 
  Briefcase, 
  Leaf, 
  CreditCard,
  ChevronDown,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import { COMMON_AIRLINES, SORT_OPTIONS } from '@/app/lib/constants/flights';

// ==========================================
// INTERFACES
// ==========================================

export interface FlightFiltersState {
  max_price?: number | null;
  stops?: 'any' | 'nonstop' | 'max_1' | 'max_2';
  include_airlines?: string[];
  max_duration_minutes?: number | null;
  bags?: number;
  emissions_filter?: boolean;
  sort_by?: string; // Añadido según Guía Marco Aurelio
}

interface FlightFiltersProps {
  filters: FlightFiltersState;
  onChange: (filters: FlightFiltersState) => void;
  availableAirlines?: Array<{
    code: string;
    name: string;
    logoUrl?: string;
  }>;
  totalResults?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  currency?: string;
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const STOPS_OPTIONS = [
  { value: 'any' as const, label: 'Cualquiera', description: 'Todos los vuelos' },
  { value: 'nonstop' as const, label: 'Directo', description: 'Sin escalas' },
  { value: 'max_1' as const, label: '1 escala máx.', description: 'Hasta 1 parada' },
  { value: 'max_2' as const, label: '2 escalas máx.', description: 'Hasta 2 paradas' },
];

const DEFAULT_MAX_DURATION = 1440; // 24 horas en minutos

// ==========================================
// COMPONENTE
// ==========================================

export default function FlightFilters({
  filters,
  onChange,
  availableAirlines = [],
  totalResults,
  isOpen = true,
  onToggle,
  currency = 'EUR'
}: FlightFiltersProps) {

  const [localPrice, setLocalPrice] = useState<string>(
    filters.max_price?.toString() || ''
  );

  // Fallback a globales si la búsqueda no devolvió aerolíneas específicas
  const airlinesToShow = availableAirlines.length > 0 ? availableAirlines : COMMON_AIRLINES;

  const updateFilter = useCallback(<K extends keyof FlightFiltersState>(
    key: K,
    value: FlightFiltersState[K]
  ) => {
    onChange({
      ...filters,
      [key]: value
    });
  }, [filters, onChange]);

  const handleReset = useCallback(() => {
    setLocalPrice('');
    onChange({
      stops: 'any',
      emissions_filter: false,
      bags: 0,
      max_price: null,
      max_duration_minutes: null,
      include_airlines: undefined,
      sort_by: 'top', // Reset ordenamiento a defecto
    });
  }, [onChange]);

  const activeFiltersCount = [
    filters.max_price,
    filters.stops && filters.stops !== 'any',
    filters.include_airlines && filters.include_airlines.length > 0,
    filters.max_duration_minutes,
    filters.bags && filters.bags > 0,
    filters.emissions_filter,
    filters.sort_by && filters.sort_by !== 'top',
  ].filter(Boolean).length;

  const toggleAirline = (code: string) => {
    const current = filters.include_airlines || [];
    const updated = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    
    updateFilter('include_airlines', updated.length > 0 ? updated : undefined);
  };

  const commitPrice = () => {
    const num = parseInt(localPrice);
    if (!isNaN(num) && num > 0) {
      updateFilter('max_price', num);
    } else {
      updateFilter('max_price', null);
      setLocalPrice('');
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all ${
      isOpen ? 'p-5' : 'p-4'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          )}
          {onToggle && (
            <button 
              onClick={onToggle} 
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
              aria-expanded={isOpen}
              aria-controls="filters-content"
            >
              {isOpen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {totalResults !== undefined && (
        <p className="text-sm text-gray-500 mb-4">
          {`${totalResults} vuelo${totalResults === 1 ? '' : 's'} encontrado${totalResults === 1 ? '' : 's'}`}
        </p>
      )}

      {!isOpen ? null : (
        <div id="filters-content" className="space-y-6">
          
          {/* 0. Ordenar (Nuevo - Según Guía Marco) */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              Ordenar por
            </label>
            <div className="relative">
              <select
                value={filters.sort_by || 'top'}
                onChange={(e) => updateFilter('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 1. Precio Máximo */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CreditCard className="w-4 h-4 text-gray-400" />
              Precio máximo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => e.key === 'Enter' && commitPrice()}
                placeholder="Ej: 500"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500 font-medium">{currency}</span>
            </div>
            {filters.max_price && (
              <p className="text-xs text-blue-600">
                Hasta {filters.max_price} {currency}
              </p>
            )}
          </div>

          {/* 2. Escalas */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Plane className="w-4 h-4 text-gray-400" />
              Escalas
            </label>
            <div className="space-y-2">
              {STOPS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    filters.stops === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="stops"
                      value={option.value}
                      checked={filters.stops === option.value || (option.value === 'any' && !filters.stops)}
                      onChange={() => updateFilter('stops', option.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Duración Máxima */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" />
              Duración máxima
            </label>
            <input
              type="range"
              min="60"
              max={DEFAULT_MAX_DURATION}
              step="30"
              value={filters.max_duration_minutes || DEFAULT_MAX_DURATION}
              onChange={(e) => updateFilter('max_duration_minutes', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1h</span>
              <span className="font-medium text-blue-600">
                {filters.max_duration_minutes 
                  ? `${Math.floor(filters.max_duration_minutes / 60)}h ${filters.max_duration_minutes % 60}m`
                  : 'Sin límite'
                }
              </span>
              <span>24h</span>
            </div>
            {filters.max_duration_minutes && (
              <button
                onClick={() => updateFilter('max_duration_minutes', null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Quitar límite
              </button>
            )}
          </div>

          {/* 4. Aerolíneas */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Plane className="w-4 h-4 text-gray-400" />
              Aerolíneas
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {airlinesToShow.map((airline) => (
                <label
                  key={airline.code}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(filters.include_airlines || []).includes(airline.code)}
                    onChange={() => toggleAirline(airline.code)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  {airline.logoUrl && (
                    <img 
                      src={airline.logoUrl} 
                      alt="" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <span className="text-sm text-gray-700 flex-1 truncate">{airline.name}</span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{airline.code}</span>
                </label>
              ))}
            </div>
            {(filters.include_airlines?.length || 0) > 0 && (
              <button
                onClick={() => updateFilter('include_airlines', undefined)}
                className="text-xs text-blue-600 hover:underline"
              >
                Limpiar selección ({filters.include_airlines?.length})
              </button>
            )}
          </div>

          {/* 5. Equipaje de Mano */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Briefcase className="w-4 h-4 text-gray-400" />
              Equipaje
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="checkbox"
                checked={(filters.bags || 0) > 0}
                onChange={(e) => updateFilter('bags', e.target.checked ? 1 : 0)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900">Equipaje de mano incluido</span>
                <p className="text-xs text-gray-500">Mínimo 1 bolso de mano</p>
              </div>
            </label>
          </div>

          {/* 6. Emisiones CO₂ */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Leaf className="w-4 h-4 text-green-500" />
              Sostenibilidad
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                checked={filters.emissions_filter || false}
                onChange={(e) => updateFilter('emissions_filter', e.target.checked || undefined)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900">Vuelos eco-friendly</span>
                <p className="text-xs text-gray-500">Emisiones inferiores a la media</p>
              </div>
            </label>
          </div>

        </div>
      )}
    </div>
  );
}