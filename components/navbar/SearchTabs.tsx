"use client";

import { motion } from "framer-motion";
import { Plane, Building2, Sparkles } from "lucide-react";

export type SearchTab = "hoteles" | "vuelos" | "ia";

const tabs: { id: SearchTab; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: "hoteles", icon: Building2, label: "Hoteles" },
  { id: "vuelos", icon: Plane, label: "Vuelos" },
  { id: "ia", icon: Sparkles, label: "IA" },
];

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

export default function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center gap-1 py-1 transition-colors duration-200"
          >
            <span style={{ color: isActive ? "#0A0A0A" : "#A1A1A1" }}>
              <Icon className="w-5 h-5" />
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? "#0A0A0A" : "#A1A1A1" }}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full"
                style={{ backgroundColor: "#0A0A0A" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
