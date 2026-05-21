"use client";

import { Globe, Sparkles, Search } from "lucide-react";

interface CompactSearchPillProps {
  onClick: () => void;
}

export default function CompactSearchPill({ onClick }: CompactSearchPillProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-2.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.25)",
      }}
    >
      <div className="flex items-center gap-2 pr-4 border-r border-white/20">
        <Globe className="w-4 h-4 text-white/90" />
        <span className="text-sm font-medium text-white/90">En cualquier lugar</span>
      </div>
      <div className="flex items-center gap-2 pr-3">
        <Sparkles className="w-4 h-4 text-white/80" />
        <span className="text-sm text-white/80">Recomendación</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center">
        <Search className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}
