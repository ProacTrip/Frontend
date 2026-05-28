"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Sparkles, Plane } from "lucide-react";

const TABS = [
  { id: "hoteles" as const, icon: Building2, label: "Hoteles" },
  { id: "ia" as const, icon: Sparkles, label: "IA" },
  { id: "vuelos" as const, icon: Plane, label: "Vuelos" },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: number;
  onTabChange: (index: number) => void;
  children: ReactNode;
  onClear: () => void;
  onSearch: () => void;
  searchLabel?: string;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  children,
  onClear,
  onSearch,
  searchLabel = "Buscar",
}: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer sheet — slides from top, fullscreen */}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[1010] flex flex-col bg-[#F7F7F9] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Buscador"
          >
            {/* ── HEADER: Close + Category tabs ── */}
            <header className="shrink-0 pt-6 pb-4 px-4 bg-[#F7F7F9] z-10">
              {/* Close button — aligned right */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category navigation — centered icon tabs */}
              <nav aria-label="Categorías" className="flex justify-center gap-8 mt-2">
                {TABS.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = idx === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(idx)}
                      className={`flex flex-col items-center pb-2 transition-colors cursor-pointer ${
                        isActive
                          ? "border-b-2 border-black text-black"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </button>
                  );
                })}
              </nav>
            </header>

            {/* ── BODY: Scrollable content area ── */}
            <main className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
              {children}
            </main>

            {/* ── FOOTER: Fixed bottom action bar ── */}
            <footer className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center z-20">
              <button
                onClick={onClear}
                className="text-[15px] font-semibold text-gray-900 underline decoration-gray-900 underline-offset-2 hover:text-gray-600 cursor-pointer"
              >
                Limpiar
              </button>
              <button
                onClick={onSearch}
                className="bg-[#222222] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-black transition-colors font-semibold text-base shadow-md active:scale-[0.98]"
              >
                <SearchIcon />
                {searchLabel}
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
