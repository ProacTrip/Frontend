'use client';

import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface GuestType {
  key: string;
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max?: number;
  onChange: (key: string, value: number) => void;
}

interface GuestCounterProps {
  guests: GuestType[];
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  /** Render at full width (mobile drawers) */
  fullWidth?: boolean;
}

export default function GuestCounter({
  guests,
  isOpen: controlledOpen,
  onClose,
  className = '',
  fullWidth = false,
}: GuestCounterProps) {
  const isOpen = controlledOpen !== undefined ? controlledOpen : true;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const total = guests.reduce((sum, g) => sum + g.value, 0);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`${
        fullWidth
          ? 'absolute top-full left-0 right-0 mt-2'
          : 'absolute top-full right-0 mt-2'
      } z-50 bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-6 ${className}`}
    >
        <div className="space-y-6">
          {guests.map((guest) => (
            <div key={guest.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">{guest.label}</p>
                <p className="text-xs text-[#6A7282]">{guest.sublabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    guest.onChange(guest.key, Math.max(guest.min, guest.value - 1))
                  }
                  disabled={guest.value <= guest.min}
                  className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:border-[#0A0A0A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 text-[#0A0A0A]" />
                </button>
                <span className="w-6 text-center text-lg font-medium text-[#0A0A0A] tabular-nums">
                  {guest.value}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (guest.max !== undefined && guest.value >= guest.max) return;
                    guest.onChange(guest.key, guest.value + 1);
                  }}
                  disabled={guest.max !== undefined && guest.value >= guest.max}
                  className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center hover:border-[#0A0A0A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-[#0A0A0A]" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[#A1A1A1]">
          {total} {total === 1 ? 'huésped' : 'huéspedes'} en total
        </p>
      </motion.div>
  );
}

export type { GuestType, GuestCounterProps };
