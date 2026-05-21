"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface GuestsPickerProps {
  isOpen: boolean;
  adults: number;
  childCount: number;
  infants: number;
  onChange: (type: "adults" | "children" | "infants", value: number) => void;
  onClose: () => void;
}

export default function GuestsPicker({
  isOpen,
  adults,
  childCount,
  infants,
  onChange,
  onClose,
}: GuestsPickerProps) {
  if (!isOpen) return null;

  const total = adults + childCount + infants;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-6 z-50 w-[300px]"
      >
        <div className="space-y-6">
          {[
            { key: "adults" as const, label: "Adultos", sub: "13 años o más", value: adults, min: 1 },
            { key: "children" as const, label: "Niños", sub: "2–12 años", value: childCount, min: 0 },
            { key: "infants" as const, label: "Bebés", sub: "0–2 años", value: infants, min: 0 },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">{row.label}</p>
                <p className="text-xs text-[#6A7282]">{row.sub}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChange(row.key, Math.max(row.min, row.value - 1))}
                  disabled={row.value <= row.min}
                  className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:border-[#0A0A0A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 text-[#0A0A0A]" />
                </button>
                <span className="w-6 text-center text-lg font-medium text-[#0A0A0A] tabular-nums">
                  {row.value}
                </span>
                <button
                  onClick={() => onChange(row.key, row.value + 1)}
                  className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:border-[#0A0A0A] transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#0A0A0A]" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[#A1A1A1]">
          {total} {total === 1 ? "huésped" : "huéspedes"} en total
        </p>
      </motion.div>
    </>
  );
}
