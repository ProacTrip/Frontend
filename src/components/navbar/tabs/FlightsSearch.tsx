"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Search, ChevronDown } from "lucide-react";
import GuestsPicker from "../dropdowns/GuestsPicker";

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
}: FlightsSearchProps) {
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [classOpen, setClassOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const guestTotal = adults + childCount + infants;
  const cabinLabels: Record<CabinClass, string> = {
    economy: "Económica",
    business: "Business",
    first: "Primera clase",
  };

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
          onClick={() => setTripType("oneway")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            tripType === "oneway"
              ? "bg-[#0A0A0A] text-white"
              : "text-[#0A0A0A] border border-transparent hover:border-[#E5E7EB]"
          }`}
        >
          Solo ida
        </button>

        <div className="relative">
          <button
            onClick={() => { setClassOpen(!classOpen); setGuestsOpen(false); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E7EB] text-[13px] text-[#0A0A0A] hover:border-[#A1A1A1] transition-colors"
          >
            {cabinLabels[cabinClass]}
            <ChevronDown className="w-3.5 h-3.5 text-[#6A7282]" />
          </button>
          <AnimatePresence>
            {classOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setClassOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-[#E5E7EB] py-1 z-50 min-w-[160px]"
                >
                  {(["economy", "business", "first"] as CabinClass[]).map((cls) => (
                    <button
                      key={cls}
                      onClick={() => { setCabinClass(cls); setClassOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#FAFAFA] transition-colors ${
                        cls === cabinClass ? "font-medium text-[#0A0A0A]" : "text-[#6A7282]"
                      }`}
                    >
                      {cabinLabels[cls]}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => { setGuestsOpen(!guestsOpen); setClassOpen(false); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E7EB] text-[13px] text-[#0A0A0A] hover:border-[#A1A1A1] transition-colors"
          >
            {guestTotal} {guestTotal === 1 ? "pasajero" : "pasajeros"}
            <ChevronDown className="w-3.5 h-3.5 text-[#6A7282]" />
          </button>
          <div className="absolute top-full right-0">
            <GuestsPicker
              isOpen={guestsOpen}
              adults={adults}
              childCount={childCount}
              infants={infants}
              onChange={onGuestsChange}
              onClose={() => setGuestsOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* FILA 2 — CAMPOS */}
      <div className="flex items-stretch gap-0">
        <div className="flex-[2] px-4 py-3 hover:bg-[#FAFAFA] rounded-l-2xl transition-colors">
          <span className="block text-[13px] font-medium text-[#0A0A0A]">Vuelo desde</span>
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin className="w-4 h-4 text-[#6A7282] shrink-0" />
            <input
              type="text"
              value={origin}
              onChange={(e) => onOriginChange(e.target.value)}
              placeholder="¿Desde dónde vuelas?"
              className="bg-transparent w-full text-[13px] text-[#0A0A0A] placeholder-[#6A7282] outline-none"
            />
          </div>
        </div>
        <div className="w-px bg-[#F5F5F5]" />
        <div className="flex-[2] px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
          <span className="block text-[13px] font-medium text-[#0A0A0A]">Vuelo a</span>
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin className="w-4 h-4 text-[#6A7282] shrink-0" />
            <input
              type="text"
              value={dest}
              onChange={(e) => onDestChange(e.target.value)}
              placeholder="¿Adónde vuelas?"
              className="bg-transparent w-full text-[13px] text-[#0A0A0A] placeholder-[#6A7282] outline-none"
            />
          </div>
        </div>
        <div className="w-px bg-[#F5F5F5]" />
        <div className="flex-[2] px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
          <span className="block text-[13px] font-medium text-[#0A0A0A]">Fechas</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-4 h-4 text-[#6A7282] shrink-0" />
            <span className="text-[13px] text-[#6A7282]">Fechas de vuelo</span>
          </div>
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
