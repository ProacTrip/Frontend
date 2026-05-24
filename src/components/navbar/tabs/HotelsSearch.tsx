"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import LocationCombobox from "@/components/shared/LocationCombobox";
import DateRangePicker from "@/components/shared/DateRangePicker";
import GuestCounter, { type GuestType } from "@/components/shared/GuestCounter";

const MONTHS_ES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()]}`;
}

interface HotelsSearchProps {
  destination: string;
  onDestinationChange: (v: string) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  adults: number;
  childCount: number;
  infants: number;
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void;
  onSearch: () => void;
}

export default function HotelsSearch({
  destination,
  onDestinationChange,
  dateRange,
  onDateRangeChange,
  adults,
  childCount,
  infants,
  onGuestsChange,
  onSearch,
}: HotelsSearchProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const guestTotal = adults + childCount + infants;
  const hasRange = dateRange.start && dateRange.end;
  const nights = hasRange
    ? Math.max(1, Math.ceil((dateRange.end!.getTime() - dateRange.start!.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const guests: GuestType[] = [
    {
      key: "adults",
      label: "Adultos",
      sublabel: "18 años o más",
      value: adults,
      min: 1,
      max: 9,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
    {
      key: "children",
      label: "Niños",
      sublabel: "2–17 años",
      value: childCount,
      min: 0,
      max: 6,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
    {
      key: "infants",
      label: "Bebés",
      sublabel: "0–1 años",
      value: infants,
      min: 0,
      max: 4,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-stretch gap-0 border border-[#E5E7EB] rounded-xl"
    >
      {/* UBICACIÓN — Headless UI Combobox */}
      <div className="flex-[2]">
        <LocationCombobox
          value={destination}
          onChange={onDestinationChange}
        />
      </div>

      <div className="w-px bg-[#F5F5F5]" />

      {/* FECHAS */}
      <div className="flex-[2] relative">
        <button
          onClick={() => { setDateOpen(!dateOpen); setGuestsOpen(false); }}
          className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors group"
        >
          <span className="block text-[13px] font-medium text-[#0A0A0A] flex items-center gap-1">
            {hasRange ? (
              <>
                {formatDate(dateRange.start!)} - {formatDate(dateRange.end!)}
                    <span
                      onClick={(e) => { e.stopPropagation(); onDateRangeChange(null, null); }}
                      className="ml-1 text-[#6A7282] hover:text-[#0A0A0A]"
                    >
                  <X className="w-3 h-3 inline" />
                </span>
              </>
            ) : (
              "Entrada / Salida"
            )}
          </span>
          <span className={`block text-[13px] ${hasRange ? "text-[#6A7282]" : "text-[#6A7282]"}`}>
            {hasRange ? `${nights} ${nights === 1 ? "noche" : "noches"}` : "Fechas de viaje"}
          </span>
        </button>
        <DateRangePicker
          isOpen={dateOpen}
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={onDateRangeChange}
          onClose={() => setDateOpen(false)}
        />
      </div>

      <div className="w-px bg-[#F5F5F5]" />

      {/* HUÉSPEDES */}
      <div className="flex-[1.5] relative">
        <button
          onClick={() => { setGuestsOpen(!guestsOpen); setDateOpen(false); }}
          className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="block text-[13px] font-medium text-[#0A0A0A]">
            {guestTotal} {guestTotal === 1 ? "huésped" : "huéspedes"}
          </span>
          <span className="block text-[13px] text-[#6A7282]">Huéspedes</span>
        </button>
        <GuestCounter
          isOpen={guestsOpen}
          guests={guests}
          onClose={() => setGuestsOpen(false)}
        />
      </div>

      {/* SEARCH BUTTON */}
      <div className="flex items-center pr-1">
        <button
          onClick={onSearch}
          className="w-12 h-12 rounded-full bg-[#0A0A0A] hover:bg-[#262626] transition-colors flex items-center justify-center shrink-0"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>
    </motion.div>
  );
}
