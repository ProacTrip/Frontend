// app/vuelos/components/TimeRangeFilter.tsx
'use client';

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

  return (
    <div className="bg-white border border-vuelos-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-vuelos-black">
        <Clock className="w-4 h-4 text-vuelos-accent" />
        <span className="font-semibold text-sm">{label}</span>
        {isOvernight && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            Nocturno
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-vuelos-muted w-10 font-mono">Inicio</span>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={value.start}
          onChange={(e) => handleChange('start', parseInt(e.target.value))}
          className="w-full h-2 bg-vuelos-skeleton rounded-lg appearance-none cursor-pointer accent-vuelos-accent"
        />
        <span className="text-xs text-vuelos-muted w-10 text-right font-mono">{formatTime(value.start)}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-vuelos-muted w-10 font-mono">Fin</span>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={value.end}
          onChange={(e) => handleChange('end', parseInt(e.target.value))}
          className="w-full h-2 bg-vuelos-skeleton rounded-lg appearance-none cursor-pointer accent-vuelos-accent"
        />
        <span className="text-xs text-vuelos-muted w-10 text-right font-mono">{formatTime(value.end)}</span>
      </div>
      
      {isOvernight && (
        <p className="text-xs text-vuelos-muted mt-2 italic">
          Rango nocturno: {formatTime(value.start)} a {formatTime(value.end)} (cruza medianoche)
        </p>
      )}
    </div>
  );
}