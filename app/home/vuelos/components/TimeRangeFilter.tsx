// app/home/vuelos/components/TimeRangeFilter.tsx
'use client';

import React from 'react';
import { Clock } from 'lucide-react';

// ==========================================
// INTERFACES
// ==========================================

export interface TimeRange {
  start: number;
  end: number;
}

export interface TimeRangeFilterProps {
  label: string;
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

// Helper para formatear hora a "06:00"
const formatTime = (num: number): string => {
  const safeNum = Math.max(0, Math.min(23, Number(num)));
  return safeNum.toString().padStart(2, '0') + ':00';
};

// ==========================================
// COMPONENTE
// ==========================================

export default function TimeRangeFilter({ 
  label, 
  value, 
  onChange 
}: TimeRangeFilterProps) {
  
  const isOvernight = value.start > value.end;

  const handleChange = (type: 'start' | 'end', newValue: number) => {
    onChange({ ...value, [type]: newValue });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      handleChange(type, val);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-gray-700">
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="font-semibold text-sm">{label}</span>
        {isOvernight && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Nocturno
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-gray-500 w-10 font-mono">Inicio</span>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={value.start}
          onChange={(e) => handleChange('start', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="text-xs text-gray-600 w-10 text-right font-mono">{formatTime(value.start)}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 w-10 font-mono">Fin</span>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={value.end}
          onChange={(e) => handleChange('end', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="text-xs text-gray-600 w-10 text-right font-mono">{formatTime(value.end)}</span>
      </div>
      
      {isOvernight && (
        <p className="text-xs text-gray-500 mt-2 italic">
          Rango nocturno: {formatTime(value.start)} a {formatTime(value.end)} (cruza medianoche)
        </p>
      )}
    </div>
  );
}