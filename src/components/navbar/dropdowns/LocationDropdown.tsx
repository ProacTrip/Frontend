"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const SUGGESTED_CITIES = [
  { name: "Bangkok", subtitle: "Tailandia" },
  { name: "Ueno, Taito", subtitle: "Tokio" },
  { name: "Ikebukuro, Toshima", subtitle: "Tokio" },
  { name: "San Diego", subtitle: "CA" },
  { name: "Humboldt Park, Chicago", subtitle: "IL" },
];

interface LocationDropdownProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function LocationDropdown({
  isOpen,
  value,
  onChange,
  onClose,
}: LocationDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-2 z-50"
      >
        <p className="text-xs font-medium text-[#A1A1A1] uppercase tracking-wider px-3 py-2">
          Ubicaciones sugeridas
        </p>
        {value && (
          <button
            onClick={() => onChange(value)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#6A7282]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#0A0A0A]">{value}</p>
              <p className="text-xs text-[#6A7282]">Búsqueda personalizada</p>
            </div>
          </button>
        )}
        {SUGGESTED_CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => onChange(city.name)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#6A7282]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#0A0A0A]">{city.name}</p>
              <p className="text-xs text-[#6A7282]">{city.subtitle}</p>
            </div>
          </button>
        ))}
      </motion.div>
    </>
  );
}
