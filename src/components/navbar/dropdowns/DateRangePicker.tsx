"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

interface DateRangePickerProps {
  isOpen: boolean;
  range: { start: Date | null; end: Date | null };
  onChange: (start: Date, end: Date) => void;
  onClose: () => void;
}

export default function DateRangePicker({
  isOpen,
  range,
  onChange,
  onClose,
}: DateRangePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selecting, setSelecting] = useState<"start" | "end">("start");

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
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (date: Date) => {
    if (date < today) return;
    if (selecting === "start" || (range.start && range.end)) {
      onChange(date, date);
      setSelecting("end");
    } else if (range.start && date >= range.start) {
      onChange(range.start, date);
      setSelecting("start");
    }
  };

  const renderCalendar = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return weeks.map((w, wi) => (
      <div key={wi} className="grid grid-cols-7">
        {w.map((day, di) => {
          if (day === null) return <div key={di} className="w-9 h-9" />;
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          const isPast = date < today;
          const isStart = range.start && date.getTime() === range.start.getTime();
          const isEnd = range.end && date.getTime() === range.end.getTime();
          const isInRange =
            range.start && range.end && date > range.start && date < range.end;
          const isToday = date.getTime() === today.getTime();

          let bgClass = "";
          if (isStart || isEnd) bgClass = "bg-[#0A0A0A] text-white rounded-full";
          else if (isInRange) bgClass = "bg-[#F5F5F5]";
          else if (!isPast) bgClass = "hover:bg-[#F5F5F5] rounded-full";

          return (
            <button
              key={di}
              onClick={() => handleDayClick(date)}
              disabled={isPast}
              className={`w-9 h-9 flex items-center justify-center text-sm transition-colors ${
                isPast ? "text-[#E5E7EB] cursor-default" : "cursor-pointer"
              } ${bgClass} ${isToday && !isStart && !isEnd ? "font-bold text-[#0A0A0A]" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    ));
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-6 z-50"
      >
        <div className="flex gap-8">
          {[0, 1].map((offset) => {
            const month = offset === 0 ? leftMonth : rightMonth;
            const year = offset === 0 ? leftYear : rightYear;
            return (
              <div key={offset} className="flex-1 min-w-[280px]">
                <div className="flex items-center justify-between mb-4">
                  {offset === 0 && (
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors">
                      <ChevronLeft className="w-4 h-4 text-[#0A0A0A]" />
                    </button>
                  )}
                  <span className="text-sm font-medium text-[#0A0A0A] flex-1 text-center">
                    {MONTHS_ES[month]} {year}
                  </span>
                  {offset === 1 && (
                    <button onClick={handleNextMonth} className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors">
                      <ChevronRight className="w-4 h-4 text-[#0A0A0A]" />
                    </button>
                  )}
                  {offset === 0 && <div className="w-6" />}
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="w-9 h-7 flex items-center justify-center text-xs text-[#A1A1A1]">
                      {d}
                    </div>
                  ))}
                </div>
                {renderCalendar(month, year)}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
