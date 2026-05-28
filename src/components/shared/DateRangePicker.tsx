'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_HEADERS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

interface DateRangePickerProps {
  mode?: 'single' | 'range';
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date, end: Date) => void;
  onClose: () => void;
  isOpen?: boolean;
  startLabel?: string;
  endLabel?: string;
  className?: string;
  /** Render at full width (mobile drawers) */
  fullWidth?: boolean;
}

export default function DateRangePicker({
  mode = 'range',
  startDate,
  endDate,
  onChange,
  onClose,
  isOpen: controlledOpen,
  startLabel = 'Check-in',
  endLabel = 'Check-out',
  className = '',
  fullWidth = false,
}: DateRangePickerProps) {
  const today = useMemoizedToday();
  const isOpen = controlledOpen !== undefined ? controlledOpen : true;

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Sync from props only when the picker is closed.
  // This catches external changes (mode switch, clear button) without
  // interfering with active range selection where handleDayClick owns local state.
  useEffect(() => {
    if (!isOpen) {
      setSelectedStart(startDate ?? null);
      setSelectedEnd(mode === 'single' ? null : (endDate ?? null));
    }
  }, [isOpen, startDate, endDate, mode]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const leftMonth = viewMonth;
  const leftYear = viewYear;
  const rightMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const rightYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isPastDate = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    const todayCopy = new Date(today);
    todayCopy.setHours(0, 0, 0, 0);
    return date.getTime() < todayCopy.getTime();
  };

  const isInRange = (date: Date) => {
    if (!selectedStart) return false;
    const endValue = selectedEnd || hoverDate;
    if (!endValue) return false;

    const start = selectedStart.getTime() < endValue.getTime() ? selectedStart : endValue;
    const end = selectedStart.getTime() < endValue.getTime() ? endValue : selectedStart;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);

    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
  };

  const isRangeStart = (date: Date) => {
    if (!selectedStart) return false;
    return date.toDateString() === selectedStart.toDateString();
  };

  const isRangeEnd = (date: Date) => {
    const endValue = selectedEnd || (selectedStart && hoverDate);
    if (!endValue) return false;
    return date.toDateString() === endValue.toDateString();
  };

  const handleDayClick = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (isPastDate(d)) return;

    if (mode === 'single') {
      onChange(d, d);
      onClose();
      return;
    }

    // Range mode
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(d);
      setSelectedEnd(null);
    } else {
      if (d.getTime() < selectedStart.getTime()) {
        // Swap: new date is earlier than start
        setSelectedEnd(selectedStart);
        setSelectedStart(d);
        onChange(d, selectedStart);
      } else {
        setSelectedEnd(d);
        onChange(selectedStart, d);
      }
      onClose();
    }
  };

  const renderCalendar = (month: number, year: number) => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjust for Monday-first (Spanish week: Do=Sun, Lu=Mon...)
    // DAY_HEADERS[0] = Do (Sunday), so we shift to match
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const cells: (number | null)[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Split into rows of 7
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return (
      <div className="flex-1 min-w-0 sm:min-w-[280px]">
        <div className="flex items-center justify-between mb-4">
          {/* Prev — only on left calendar */}
          {month === leftMonth && year === leftYear ? (
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#0A0A0A]" />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="text-sm font-medium text-[#0A0A0A] flex-1 text-center">
            {MONTHS_ES[month]} {year}
          </span>
          {/* Next — right calendar or left in single mode */}
          {(month === rightMonth && year === rightYear) || (mode === 'single' && month === leftMonth && year === leftYear) ? (
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#0A0A0A]" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="w-9 h-7 flex items-center justify-center text-xs text-[#A1A1A1]">
              {d}
            </div>
          ))}
        </div>

        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7">
            {row.map((day, di) => {
              if (day === null) return <div key={`empty-${ri}-${di}`} className="w-9 h-9" />;

              const date = new Date(year, month, day);
              const past = isPastDate(new Date(date));
              const inRange = isInRange(new Date(date));
              const isStart = isRangeStart(new Date(date));
              const isEnd = isRangeEnd(new Date(date));
              const isToday = date.toDateString() === today.toDateString();

              let bgClass = '';
              if (isStart || isEnd) bgClass = 'bg-[#0A0A0A] text-white rounded-full';
              else if (inRange) bgClass = 'bg-[#F5F5F5]';
              else if (!past) bgClass = 'hover:bg-[#F5F5F5] rounded-full';

              return (
                <button
                  key={`day-${ri}-${di}`}
                  type="button"
                  onClick={() => handleDayClick(new Date(date))}
                  disabled={past}
                  onMouseEnter={() => {
                    if (!past && mode === 'range' && selectedStart && !selectedEnd) {
                      setHoverDate(new Date(date));
                    }
                  }}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`w-9 h-9 flex items-center justify-center text-sm transition-colors ${
                    past ? 'text-[#E5E7EB] cursor-default' : 'cursor-pointer'
                  } ${bgClass} ${
                    isToday && !isStart && !isEnd ? 'font-bold text-[#0A0A0A]' : ''
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Invisible backdrop for click-outside when not using controlled open */}
      {controlledOpen === undefined && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}
      <motion.div
        ref={calendarRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`${
          fullWidth
            ? 'absolute top-full left-0 right-0 mt-2'
            : 'absolute top-full left-0 mt-2'
        } z-50 bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-4 sm:p-6 ${className}`}
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          {renderCalendar(leftMonth, leftYear)}
          {mode !== 'single' && renderCalendar(rightMonth, rightYear)}
        </div>

        {mode === 'range' && selectedStart && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 text-center">
            {selectedEnd ? (
              <span>
                <strong>{startLabel}:</strong> {selectedStart.toLocaleDateString('es-ES')}{' '}
                {' → '}
                <strong>{endLabel}:</strong> {selectedEnd.toLocaleDateString('es-ES')}
              </span>
            ) : (
              <span>Selecciona la fecha de {endLabel.toLowerCase()}</span>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

function useMemoizedToday(): Date {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  return today;
}
