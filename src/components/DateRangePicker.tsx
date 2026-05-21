'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
  startLabel?: string;
  endLabel?: string;
}

export default function DateRangePicker({ 
  checkIn, 
  checkOut, 
  onDateChange,
  onClose,
  // CAMBIO APLICADO: Defaults a Hoteles para no romper compatibilidad
  startLabel = "Check-in",        
  endLabel = "Check-out"
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(checkIn);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(checkOut);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDayClick = (date: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(date);
      setSelectedEnd(null);
    } else {
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
      setTimeout(() => {
        onDateChange(
          date < selectedStart ? date : selectedStart,
          date < selectedStart ? selectedStart : date
        );
        onClose();
      }, 200);
    }
  };

  const isInRange = (date: Date) => {
    if (!selectedStart) return false;
    
    const endDate = selectedEnd || hoveredDate;
    if (!endDate) return false;

    const start = selectedStart < endDate ? selectedStart : endDate;
    const end = selectedStart < endDate ? endDate : selectedStart;

    return date >= start && date <= end;
  };

  const isRangeStart = (date: Date) => {
    if (!selectedStart) return false;
    return date.toDateString() === selectedStart.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    const endDate = selectedEnd || (selectedStart && hoveredDate);
    if (!endDate) return false;
    return date.toDateString() === endDate.toDateString();
  };

  const isDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const renderCalendar = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
      <div className="flex-1">
        <div className="text-center mb-4">
          <h3 className="text-base font-semibold capitalize">{monthName}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

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
      <div className="flex border-b border-gray-200 mb-6">
        <button type="button" className="px-4 py-2 text-sm font-medium text-[#FF6B6B] border-b-2 border-[#FF6B6B]">
          Fechas
        </button> 
      </div>

      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-8">
        {renderCalendar(currentMonth)}
        {renderCalendar(nextMonthDate)}
      </div>

      {selectedStart && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 text-center">
          {selectedEnd ? (
            <span>
              <strong>{startLabel}:</strong> {selectedStart.toLocaleDateString('es-ES')} 
              {' → '}
              <strong>{endLabel}:</strong> {selectedEnd.toLocaleDateString('es-ES')}
            </span>
          ) : (
            <span>Selecciona la fecha de {endLabel.toLowerCase()}</span>
          )}
        </div>
      )}
    </div>
  );
}