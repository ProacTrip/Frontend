"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Calendar, Search, ChevronDown, X } from "lucide-react";
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

type TripType = "roundtrip" | "oneway";
type CabinClass = "economy" | "business" | "first";

interface FlightsSearchProps {
  origin: string;
  onOriginChange: (v: string) => void;
  dest: string;
  onDestChange: (v: string) => void;
  adults: number;
  childCount: number;
  infants: number;
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void;
  onSearch: () => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export default function FlightsSearch({
  origin,
  onOriginChange,
  dest,
  onDestChange,
  adults,
  childCount,
  infants,
  onGuestsChange,
  onSearch,
  dateRange,
  onDateRangeChange,
}: FlightsSearchProps) {
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const guestTotal = adults + childCount + infants;
  const cabinLabels: Record<CabinClass, string> = {
    economy: "Económica",
    business: "Business",
    first: "Primera clase",
  };

  const hasDate = tripType === "oneway"
    ? !!dateRange.start
    : !!(dateRange.start && dateRange.end);

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
    >
      {/* FILA 1 — FILTROS */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTripType("roundtrip")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            tripType === "roundtrip"
              ? "bg-[#0A0A0A] text-white"
              : "text-[#0A0A0A] border border-transparent hover:border-[#E5E7EB]"
          }`}
        >
          Ida y vuelta
        </button>
        <button
          onClick={() => {
            setTripType("oneway");
            setDateOpen(false);
            onDateRangeChange(dateRange.start, null);
          }}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            tripType === "oneway"
              ? "bg-[#0A0A0A] text-white"
              : "text-[#0A0A0A] border border-transparent hover:border-[#E5E7EB]"
          }`}
        >
          Solo ida
        </button>

        {/* CABIN CLASS — Headless UI Menu */}
        <Menu>
          <MenuButton className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E7EB] text-[13px] text-[#0A0A0A] hover:border-[#A1A1A1] transition-colors data-[open]:border-[#0A0A0A]">
            {cabinLabels[cabinClass]}
            <ChevronDown className="w-3.5 h-3.5 text-[#6A7282]" />
          </MenuButton>
          <MenuItems
            anchor={{ to: "bottom start", gap: 4 }}
            transition
            className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#E5E7EB] py-1 z-[1000] min-w-[160px] origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {(["economy", "business", "first"] as CabinClass[]).map((cls) => (
              <MenuItem key={cls}>
                {({ focus }) => (
                  <button
                    onClick={() => setCabinClass(cls)}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
                      focus ? "bg-[#FAFAFA]" : ""
                    } ${cls === cabinClass ? "font-medium text-[#0A0A0A]" : "text-[#6A7282]"}`}
                  >
                    {cabinLabels[cls]}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>

        {/* GUESTS */}
        <div className="relative">
          <button
            onClick={() => { setGuestsOpen(!guestsOpen); setDateOpen(false); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E7EB] text-[13px] text-[#0A0A0A] hover:border-[#A1A1A1] transition-colors"
          >
            {guestTotal} {guestTotal === 1 ? "pasajero" : "pasajeros"}
            <ChevronDown className="w-3.5 h-3.5 text-[#6A7282]" />
          </button>
          <div className="absolute top-full right-0">
          <GuestCounter
            isOpen={guestsOpen}
            guests={guests}
            onClose={() => setGuestsOpen(false)}
          />
          </div>
        </div>
      </div>

      {/* FILA 2 — CAMPOS */}
      <div className="flex items-stretch gap-0 border border-[#E5E7EB] rounded-xl">
        <div className="flex-[2]">
          <LocationCombobox
            value={origin}
            onChange={onOriginChange}
            label="Vuelo desde"
            placeholder="¿Desde dónde vuelas?"
            className="rounded-l-2xl"
          />
        </div>
        <div className="w-px bg-[#F5F5F5]" />
        <div className="flex-[2]">
          <LocationCombobox
            value={dest}
            onChange={onDestChange}
            label="Vuelo a"
            placeholder="¿Adónde vuelas?"
          />
        </div>
        <div className="w-px bg-[#F5F5F5]" />
        <div className="flex-[2] relative">
          <button
            onClick={() => { setDateOpen(!dateOpen); setGuestsOpen(false); }}
            className="w-full h-full px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors rounded-r-2xl"
          >
            <span className="block text-[13px] font-medium text-[#0A0A0A] flex items-center gap-1">
              {hasDate ? (
                <>
                  {tripType === "oneway"
                    ? formatDate(dateRange.start!)
                    : `${formatDate(dateRange.start!)} - ${formatDate(dateRange.end!)}`}
                  <span
                    onClick={(e) => { e.stopPropagation(); onDateRangeChange(null, null); }}
                    className="ml-1 text-[#6A7282] hover:text-[#0A0A0A]"
                  >
                    <X className="w-3 h-3 inline" />
                  </span>
                </>
              ) : (
                "Fechas"
              )}
            </span>
            <span className="block text-[13px] text-[#6A7282]">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {hasDate ? "Fechas de vuelo" : "Fechas de vuelo"}
            </span>
          </button>
          <DateRangePicker
            mode={tripType === "oneway" ? "single" : "range"}
            isOpen={dateOpen}
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => {
              onDateRangeChange(start, end);
            }}
            onClose={() => setDateOpen(false)}
            startLabel="Ida"
            endLabel="Vuelta"
          />
        </div>
        <div className="flex items-center pr-1">
          <button
            onClick={onSearch}
            className="w-12 h-12 rounded-full bg-[#0A0A0A] hover:bg-[#262626] transition-colors flex items-center justify-center shrink-0"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}