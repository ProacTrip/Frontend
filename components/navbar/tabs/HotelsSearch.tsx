"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import LocationDropdown from "../dropdowns/LocationDropdown";
import DateRangePicker from "../dropdowns/DateRangePicker";
import GuestsPicker from "../dropdowns/GuestsPicker";

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
  onDateRangeChange: (start: Date, end: Date) => void;
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const guestTotal = adults + childCount + infants;
  const hasRange = dateRange.start && dateRange.end;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-stretch gap-0"
    >
      {/* UBICACIÓN */}
      <div className="flex-[2] relative">
        <button
          onClick={() => { setLocationOpen(!locationOpen); setDateOpen(false); setGuestsOpen(false); }}
          className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] rounded-l-2xl transition-colors group"
        >
          <span className="block text-[13px] font-medium text-[#0A0A0A]">Ubicación</span>
          <span className={`block text-[13px] ${destination ? "text-[#0A0A0A]" : "text-[#6A7282]"}`}>
            {destination || "¿Adónde vas?"}
          </span>
        </button>
        <LocationDropdown
          isOpen={locationOpen}
          value={destination}
          onChange={(v) => { onDestinationChange(v); setLocationOpen(false); }}
          onClose={() => setLocationOpen(false)}
        />
      </div>

      <div className="w-px bg-[#F5F5F5]" />

      {/* FECHAS */}
      <div className="flex-[2] relative">
        <button
          onClick={() => { setDateOpen(!dateOpen); setLocationOpen(false); setGuestsOpen(false); }}
          className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors group"
        >
          <span className="block text-[13px] font-medium text-[#0A0A0A] flex items-center gap-1">
            {hasRange ? (
              <>
                {formatDate(dateRange.start!)} - {formatDate(dateRange.end!)}
                <span
                  onClick={(e) => { e.stopPropagation(); onDateRangeChange(new Date(), new Date()); }}
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
            {hasRange ? `${guestTotal} huésped${guestTotal !== 1 ? "es" : ""}` : "Fechas de viaje"}
          </span>
        </button>
        <DateRangePicker
          isOpen={dateOpen}
          range={dateRange}
          onChange={onDateRangeChange}
          onClose={() => setDateOpen(false)}
        />
      </div>

      <div className="w-px bg-[#F5F5F5]" />

      {/* HUÉSPEDES */}
      <div className="flex-[1.5] relative">
        <button
          onClick={() => { setGuestsOpen(!guestsOpen); setLocationOpen(false); setDateOpen(false); }}
          className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="block text-[13px] font-medium text-[#0A0A0A]">
            {guestTotal} {guestTotal === 1 ? "huésped" : "huéspedes"}
          </span>
          <span className="block text-[13px] text-[#6A7282]">Huéspedes</span>
        </button>
        <GuestsPicker
          isOpen={guestsOpen}
          adults={adults}
          childCount={childCount}
          infants={infants}
          onChange={onGuestsChange}
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
