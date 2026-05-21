"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type SearchTab } from "./SearchTabs";
import HotelsSearch from "./tabs/HotelsSearch";
import FlightsSearch from "./tabs/FlightsSearch";
import AISearch from "./tabs/AISearch";

interface SearchPanelProps {
  isVisible: boolean;
  activeTab: SearchTab;
  // Hotels
  hotelDest: string;
  onHotelDestChange: (v: string) => void;
  hotelDateRange: { start: Date | null; end: Date | null };
  onHotelDateRangeChange: (start: Date, end: Date) => void;
  adults: number;
  childCount: number;
  infants: number;
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void;
  onHotelSearch: () => void;
  // Flights
  flightOrigin: string;
  onFlightOriginChange: (v: string) => void;
  flightDest: string;
  onFlightDestChange: (v: string) => void;
  onFlightSearch: () => void;
  // AI
  aiMessage: string;
  onAiMessageChange: (v: string) => void;
  aiChat: { role: "user" | "assistant"; text: string }[];
  onAiSend: () => void;
}

export default function SearchPanel({
  isVisible,
  activeTab,
  hotelDest,
  onHotelDestChange,
  hotelDateRange,
  onHotelDateRangeChange,
  adults,
  childCount,
  infants,
  onGuestsChange,
  onHotelSearch,
  flightOrigin,
  onFlightOriginChange,
  flightDest,
  onFlightDestChange,
  onFlightSearch,
  aiMessage,
  onAiMessageChange,
  aiChat,
  onAiSend,
}: SearchPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-full left-0 right-0 z-40"
        >
          <div className="mx-auto max-w-3xl px-4">
            <div className="bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] p-6">
              {/* CONTENT */}
              <AnimatePresence mode="wait">
                {activeTab === "hoteles" && (
                  <HotelsSearch
                    key="hoteles"
                    destination={hotelDest}
                    onDestinationChange={onHotelDestChange}
                    dateRange={hotelDateRange}
                    onDateRangeChange={onHotelDateRangeChange}
                    adults={adults}
                    childCount={childCount}
                    infants={infants}
                    onGuestsChange={onGuestsChange}
                    onSearch={onHotelSearch}
                  />
                )}
                {activeTab === "vuelos" && (
                  <FlightsSearch
                    key="vuelos"
                    origin={flightOrigin}
                    onOriginChange={onFlightOriginChange}
                    dest={flightDest}
                    onDestChange={onFlightDestChange}
                    adults={adults}
                    childCount={childCount}
                    infants={infants}
                    onGuestsChange={onGuestsChange}
                    onSearch={onFlightSearch}
                  />
                )}
                {activeTab === "ia" && (
                  <AISearch
                    key="ia"
                    message={aiMessage}
                    onMessageChange={onAiMessageChange}
                    chat={aiChat}
                    onSend={onAiSend}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
