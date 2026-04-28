// app/home/vuelos/components/MultiCityLegs.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowRight, Calendar, MapPin, ChevronDown, Clock } from 'lucide-react';
import TimeRangeFilter, { TimeRange } from './TimeRangeFilter';
import { MultiCityLeg } from '@/app/lib/types/flight';

interface MultiCityLegsProps {
  legs: MultiCityLeg[];
  onLegsChange: (legs: MultiCityLeg[]) => void;
  errors?: Record<number, string[]>;
}

const MAX_LEGS = 6;
const MIN_LEGS = 2;

const getTodayString = (): string => {
  return new Date().toLocaleDateString('sv-SE');
};

export default function MultiCityLegs({ legs, onLegsChange, errors = {} }: MultiCityLegsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLegChange = (index: number, field: keyof MultiCityLeg, value: string | TimeRange | undefined) => {
    const newLegs = [...legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    onLegsChange(newLegs);
  };

  const addLeg = () => {
    if (legs.length >= MAX_LEGS) return;
    onLegsChange([...legs, { departure: '', arrival: '', date: '' }]);
  };

  const removeLeg = (index: number) => {
    if (legs.length <= MIN_LEGS) return;
    onLegsChange(legs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#c54141]" />
        <label className="text-sm font-semibold text-gray-700">Tramos del viaje</label>
        <span className="text-xs text-gray-400 ml-auto">
          {legs.length}/{MAX_LEGS}
        </span>
      </div>

      {legs.map((leg, index) => {
        const legErrors = errors[index] || [];

        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3 relative"
          >
            {/* Leg header with number badge and remove button */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c54141] text-white text-xs font-semibold rounded-full">
                Tramo {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeLeg(index)}
                disabled={legs.length <= MIN_LEGS}
                className={`p-1.5 rounded-full transition-colors ${
                  legs.length <= MIN_LEGS
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                title={legs.length <= MIN_LEGS ? 'Mínimo 2 tramos' : 'Eliminar tramo'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Departure → Arrival row */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Origen
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={leg.departure}
                    onChange={(e) => handleLegChange(index, 'departure', e.target.value.toUpperCase())}
                    placeholder="MAD"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] uppercase font-medium text-sm transition-all ${
                      legErrors.some((e) => e.toLowerCase().includes('origen'))
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center pt-6">
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Destino
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={leg.arrival}
                    onChange={(e) => handleLegChange(index, 'arrival', e.target.value.toUpperCase())}
                    placeholder="LIM"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] uppercase font-medium text-sm transition-all ${
                      legErrors.some((e) => e.toLowerCase().includes('destino'))
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Date row */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={leg.date}
                  onChange={(e) => handleLegChange(index, 'date', e.target.value)}
                  min={mounted ? getTodayString() : '2026-01-01'}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c54141] focus:border-[#c54141] text-sm transition-all ${
                    legErrors.some((e) => e.toLowerCase().includes('fecha'))
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Collapsible time range filter */}
            <details className="group">
              <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-500 hover:text-[#c54141] list-none select-none">
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                <Clock className="w-3.5 h-3.5" />
                Horario de salida
                {leg.times && (leg.times.start !== 0 || leg.times.end !== 23) && (
                  <span className="inline-flex items-center justify-center w-1.5 h-1.5 bg-[#c54141] rounded-full ml-0.5" />
                )}
              </summary>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <TimeRangeFilter
                  label="Salida"
                  value={leg.times || { start: 0, end: 23 }}
                  onChange={(range) => handleLegChange(index, 'times', range)}
                />
              </div>
            </details>
          </div>
        );
      })}

      {/* Add leg button */}
      <button
        type="button"
        onClick={addLeg}
        disabled={legs.length >= MAX_LEGS}
        className={`w-full py-2.5 border-2 border-dashed rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          legs.length >= MAX_LEGS
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-[#c54141]/30 text-[#c54141] hover:border-[#c54141] hover:bg-[#c54141]/5'
        }`}
      >
        <Plus className="w-4 h-4" />
        Añadir tramo{legs.length >= MAX_LEGS ? ` (máx. ${MAX_LEGS})` : ''}
      </button>
    </div>
  );
}
