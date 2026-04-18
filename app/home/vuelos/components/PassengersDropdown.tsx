// app/home/vuelos/components/PassengersDropdown.tsx
'use client';

import React, { useState } from 'react';
import { Users, Minus, Plus, X, Baby, Armchair } from 'lucide-react';
import { PASSENGER_LIMITS } from '@/app/lib/constants/flights';

// ==========================================
// INTERFACES
// ==========================================

export interface PassengerCounts {
  adults: number;
  children: number;
  infantsInSeat: number;
  infantsOnLap: number;
}

interface PassengersDropdownProps {
  value: PassengerCounts;
  onChange: (counts: PassengerCounts) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PassengersDropdown({ 
  value, 
  onChange, 
  isOpen, 
  onToggle 
}: PassengersDropdownProps) {
  
  const updateCount = (type: keyof PassengerCounts, delta: number) => {
    // 1. Crear objeto de estado propuesto (con el nuevo valor ya aplicado)
    // Esto evita errores de cálculo al usar el valor antiguo en sumas
    const proposedValue = { ...value, [type]: (value[type] || 0) + delta };

    // 2. Validaciones básicas individuales
    if (proposedValue[type] < 0) return;
    if (type === 'adults' && proposedValue.adults < PASSENGER_LIMITS.MIN_ADULTS) return;
    if (type === 'adults' && proposedValue.adults > PASSENGER_LIMITS.MAX_ADULTS) return;
    if (type === 'children' && proposedValue.children > PASSENGER_LIMITS.MAX_CHILDREN) return;

    // 3. ✅ Validación Crítica: Bebés en Regazo (Normativa Marco)
    // Máximo 1 bebé en regazo por adulto.
    if (proposedValue.infantsOnLap > proposedValue.adults) return;

    // 4. ✅ Validación Crítica: Asientos Totales (Límite 9)
    // Sumamos: Adults + Children + InfantsInSeat.
    const totalSeats = proposedValue.adults + proposedValue.children + proposedValue.infantsInSeat;
    if (totalSeats > 9) return;

    // 5. Validación de Infantes Totales (Max 2 por adulto)
    const totalInfants = proposedValue.infantsInSeat + proposedValue.infantsOnLap;
    const maxInfantsAllowed = proposedValue.adults * 2;
    if (totalInfants > maxInfantsAllowed) return;

    // Si pasa todo, actualizamos
    onChange(proposedValue);
  };

  const decrement = (type: keyof PassengerCounts) => updateCount(type, -1);
  const increment = (type: keyof PassengerCounts) => updateCount(type, 1);

  const totalPassengers = value.adults + value.children + value.infantsInSeat + value.infantsOnLap;
  const passengerLabel = totalPassengers === 1 ? '1 pasajero' : `${totalPassengers} pasajeros`;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="font-semibold text-gray-700">Pasajeros</span>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* ADULTOS */}
        <PassengerRow
          label="Adultos"
          sublabel="12 años o más"
          icon={<Users className="w-5 h-5 text-gray-400" />}
          count={value.adults}
          onDecrement={() => decrement('adults')}
          onIncrement={() => increment('adults')}
          min={PASSENGER_LIMITS.MIN_ADULTS}
          max={PASSENGER_LIMITS.MAX_ADULTS}
        />

        {/* NIÑOS */}
        <PassengerRow
          label="Niños"
          sublabel="2 - 11 años"
          icon={<Users className="w-5 h-5 text-gray-400" />}
          count={value.children}
          onDecrement={() => decrement('children')}
          onIncrement={() => increment('children')}
          min={0}
          max={PASSENGER_LIMITS.MAX_CHILDREN}
        />

        <div className="border-t border-dashed border-gray-200 my-2"></div>

        {/* BEBÉS EN ASIENTO */}
        <PassengerRow
          label="Bebés (con asiento)"
          sublabel="Menores de 2 años"
          icon={<Armchair className="w-5 h-5 text-blue-400" />}
          count={value.infantsInSeat}
          onDecrement={() => decrement('infantsInSeat')}
          onIncrement={() => increment('infantsInSeat')}
          min={0}
          warning={(value.infantsInSeat + value.infantsOnLap) >= (value.adults * 2)}
        />

        {/* BEBÉS EN BRAZO */}
        <PassengerRow
          label="Bebés (en regazo)"
          sublabel="Sin asiento propio"
          icon={<Baby className="w-5 h-5 text-purple-400" />}
          count={value.infantsOnLap}
          onDecrement={() => decrement('infantsOnLap')}
          onIncrement={() => increment('infantsOnLap')}
          min={0}
          warning={(value.infantsInSeat + value.infantsOnLap) >= (value.adults * 2)}
        />
      </div>

      <div className="bg-blue-50 px-4 py-2 text-xs text-blue-700 text-center">
        Máximo 2 bebés por adulto (Normativa aérea)
      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENTE (Fila de pasajero)
// ==========================================

interface PassengerRowProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max?: number;
  warning?: boolean;
}

function PassengerRow({ 
  label, 
  sublabel, 
  icon, 
  count, 
  onDecrement, 
  onIncrement, 
  min,
  max,
  warning 
}: PassengerRowProps) {
  
  // UX MEJORADA
  const isMaxReached = max !== undefined && count >= max;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${warning ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{label}</div>
          <div className="text-xs text-gray-500">{sublabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* BOTÓN DECREMENTO (-) */}
        <button
          type="button"
          onClick={onDecrement}
          disabled={count <= min} // ✅ CORREGIDO: Siempre permite bajar, incluso si estás en el máximo.
          aria-label={`Quitar ${label.toLowerCase()}`}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors
            ${count <= min 
              ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
              : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500'
            }`}
        >
          <Minus className="w-3 h-3" />
        </button>
        
        <span className="w-6 text-center font-medium text-gray-900">{count}</span>
        
        {/* BOTÓN DE INCREMENTO (+) */}
        <button
          type="button"
          onClick={onIncrement}
          disabled={isMaxReached} // Solo se deshabilita si llegamos al límite superior
          aria-label={`Añadir ${label.toLowerCase()}`}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors
            ${isMaxReached
              ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
              : 'border-blue-500 text-blue-500 hover:bg-blue-50'
            }`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}