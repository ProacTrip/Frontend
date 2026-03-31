'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
}

export default function DateRangePicker({ 
  checkIn, 
  checkOut, 
  onDateChange,
  onClose 
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(checkIn);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(checkOut);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Referencia al contenedor del calendario
  const calendarRef = useRef<HTMLDivElement>(null);

  // Detectar click fuera del calendario
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Generar días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Manejar click en un día
  const handleDayClick = (date: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Primer click o reiniciar selección
      setSelectedStart(date);
      setSelectedEnd(null);
    } else {
      // Segundo click
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
      // Aplicar cambios y cerrar
      setTimeout(() => {
        onDateChange(
          date < selectedStart ? date : selectedStart,
          date < selectedStart ? selectedStart : date
        );
        onClose();
      }, 200);
    }
  };

  // Verificar si un día está en el rango
  const isInRange = (date: Date) => {
    if (!selectedStart) return false;
    
    const endDate = selectedEnd || hoveredDate;
    if (!endDate) return false;

    const start = selectedStart < endDate ? selectedStart : endDate;
    const end = selectedStart < endDate ? endDate : selectedStart;

    return date >= start && date <= end;
  };

  // Verificar si un día es el inicio o fin
  const isRangeStart = (date: Date) => {
    if (!selectedStart) return false;
    return date.toDateString() === selectedStart.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    const endDate = selectedEnd || (selectedStart && hoveredDate);
    if (!endDate) return false;
    return date.toDateString() === endDate.toDateString();
  };

  // Verificar si un día está deshabilitado (antes de hoy)
  const isDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Navegar meses
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Obtener mes siguiente
  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const renderCalendar = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
      <div className="flex-1">
        {/* Header del mes */}
        <div className="text-center mb-4">
          <h3 className="text-base font-semibold capitalize">{monthName}</h3>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const disabled = isDisabled(date);
            const inRange = isInRange(date);
            const isStart = isRangeStart(date);
            const isEnd = isRangeEnd(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && handleDayClick(date)}
                onMouseEnter={() => !disabled && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg
                  transition-all duration-150
                  ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                  ${inRange && !isStart && !isEnd ? 'bg-red-50 text-red-900' : ''}
                  ${isStart || isEnd ? 'bg-[#FF6B6B] text-white font-semibold' : ''}
                  ${isToday && !isStart && !isEnd ? 'font-bold text-[#FF6B6B]' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={calendarRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-50 w-[700px]"
    >
      
      {/* Pestañas */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-[#FF6B6B] border-b-2 border-[#FF6B6B]"
        >
          Calendario
        </button> 
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1" />
        
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendarios (mes actual + mes siguiente) */}
      <div className="flex gap-8">
        {renderCalendar(currentMonth)}
        {renderCalendar(nextMonthDate)}
      </div>

      {/* Info de selección */}
      {selectedStart && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 text-center">
          {selectedEnd ? (
            <span>
              <strong>Check-in:</strong> {selectedStart.toLocaleDateString('es-ES')} 
              {' → '}
              <strong>Check-out:</strong> {selectedEnd.toLocaleDateString('es-ES')}
            </span>
          ) : (
            <span>Selecciona la fecha de salida</span>
          )}
        </div>
      )}
    </div>
  );
}