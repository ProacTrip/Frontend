"use client";

/**
 * Mobile-optimized search content with Stitch-style accordion cards.
 * Each card expands to show its content; opening one closes others.
 */
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import LocationCombobox from "@/components/shared/LocationCombobox";
import DateRangePicker from "@/components/shared/DateRangePicker";
import GuestCounter, { type GuestType } from "@/components/shared/GuestCounter";

// ─── Format helpers ──────────────────────────
const MONTHS_ES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()]}`;
}

// ─── Constants ───────────────────────────────
const AI_SUGGESTIONS = [
  { emoji: "🌴", text: "Mejores destinos de playa" },
  { emoji: "❄️", text: "Viajes de invierno por menos de 500 €" },
  { emoji: "🎌", text: "Joyas ocultas en Asia" },
];

const POPULAR_DESTINATIONS = [
  "Barcelona", "Madrid", "Roma", "París", "Londres",
  "Nueva York", "Tokio", "Cancún", "Buenos Aires", "Miami",
];

const FLIGHT_DESTINATIONS = [
  "Barcelona", "Madrid", "Roma", "París", "Londres",
  "Nueva York", "Tokio", "Cancún", "Buenos Aires", "Miami",
  "Berlín", "Ámsterdam", "Dubái", "Lisboa", "Sídney",
];

// ─── Types ────────────────────────────────────
type Section = "where" | "when" | "who";

interface MobileHotelsContentProps {
  destination: string;
  onDestinationChange: (v: string) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  adults: number;
  childCount: number;
  infants: number;
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void;
}

interface MobileFlightsContentProps {
  origin: string;
  onOriginChange: (v: string) => void;
  dest: string;
  onDestChange: (v: string) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  adults: number;
  childCount: number;
  infants: number;
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void;
}

interface MobileAIContentProps {
  message: string;
  onMessageChange: (v: string) => void;
}

// ─── Shared helpers ───────────────────────────
function buildGuestTypes(
  adults: number,
  childCount: number,
  infants: number,
  onGuestsChange: (type: "adults" | "children" | "infants", value: number) => void,
): GuestType[] {
  return [
    {
      key: "adults", label: "Adultos", sublabel: "18 años o más",
      value: adults, min: 1, max: 9,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
    {
      key: "children", label: "Niños", sublabel: "2–17 años",
      value: childCount, min: 0, max: 6,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
    {
      key: "infants", label: "Bebés", sublabel: "0–1 años",
      value: infants, min: 0, max: 4,
      onChange: (key, value) => onGuestsChange(key as "adults" | "children" | "infants", value),
    },
  ];
}

function DestinationIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════
//  MOBILE HOTELS — Accordion
// ═══════════════════════════════════════════════
export function MobileHotelsSearch({
  destination,
  onDestinationChange,
  dateRange,
  onDateRangeChange,
  adults,
  childCount,
  infants,
  onGuestsChange,
}: MobileHotelsContentProps) {
  const [expanded, setExpanded] = useState<Section | null>(null);
  const toggle = useCallback((section: Section) => {
    setExpanded((prev) => (prev === section ? null : section));
  }, []);

  const guestTotal = adults + childCount + infants;
  const hasRange = dateRange.start && dateRange.end;
  const nights = hasRange
    ? Math.max(1, Math.ceil((dateRange.end!.getTime() - dateRange.start!.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const guests = buildGuestTypes(adults, childCount, infants, onGuestsChange);

  const hasDest = destination.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* ── WHERE TO? ── */}
      <section
        className={`bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
          expanded === "where" ? "p-6" : "p-4"
        }`}
      >
        {expanded === "where" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold text-gray-900">¿A dónde vas?</h2>
              <button
                onClick={() => setExpanded(null)}
                className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <LocationCombobox
                value={destination}
                onChange={onDestinationChange}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="mt-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Destinos populares</h3>
              <ul className="space-y-3">
                {POPULAR_DESTINATIONS.map((d) => (
                  <li key={d}>
                    <button
                      onClick={() => onDestinationChange(d)}
                      className="flex items-center w-full text-left group cursor-pointer"
                    >
                      <div className="bg-gray-100 p-2 rounded-xl mr-3 group-hover:bg-gray-200 transition-colors">
                        <DestinationIcon />
                      </div>
                      <span className="text-base text-gray-800">{d}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <button
            onClick={() => toggle("where")}
            className="w-full flex justify-between items-center cursor-pointer"
          >
            <span className="text-[15px] font-medium text-gray-500">Dónde</span>
            <span className={`text-[15px] font-bold ${hasDest ? "text-gray-900" : "text-gray-400"}`}>
              {hasDest ? destination : "Elegí un destino"}
            </span>
          </button>
        )}
      </section>

      {/* ── WHEN ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
        <button
          onClick={() => toggle("when")}
          className="w-full p-4 flex justify-between items-center text-left cursor-pointer"
        >
          <span className="text-[15px] font-medium text-gray-500">Cuándo</span>
          <span className={`text-[15px] font-bold ${hasRange ? "text-gray-900" : "text-gray-400"}`}>
            {hasRange
              ? <>{formatDate(dateRange.start!)} – {formatDate(dateRange.end!)} <span className="text-gray-400 font-normal">({nights} {nights === 1 ? "noche" : "noches"})</span></>
              : "Elegí fechas"
            }
          </span>
        </button>
        {expanded === "when" && (
          <DateRangePicker
            isOpen={true}
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => {
              onDateRangeChange(start, end);
            }}
            onClose={() => setExpanded(null)}
            fullWidth
          />
        )}
      </section>

      {/* ── WHO ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
        <button
          onClick={() => toggle("who")}
          className="w-full p-4 flex justify-between items-center text-left cursor-pointer"
        >
          <span className="text-[15px] font-medium text-gray-500">Quién</span>
          <span className={`text-[15px] font-bold ${guestTotal > 0 ? "text-gray-900" : "text-gray-400"}`}>
            {guestTotal > 0
              ? `${guestTotal} ${guestTotal === 1 ? "huésped" : "huéspedes"}`
              : "Agregar huéspedes"
            }
          </span>
        </button>
        {expanded === "who" && (
          <GuestCounter
            isOpen={true}
            guests={guests}
            onClose={() => setExpanded(null)}
            fullWidth
          />
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MOBILE FLIGHTS — Accordion
// ═══════════════════════════════════════════════
type TripType = "roundtrip" | "oneway";
type CabinClass = "economy" | "business" | "first";
type FlightSection = "origin" | "dest" | "when" | "who";

const cabinLabels: Record<CabinClass, string> = {
  economy: "Económica",
  business: "Business",
  first: "Primera clase",
};

export function MobileFlightsSearch({
  origin,
  onOriginChange,
  dest,
  onDestChange,
  dateRange,
  onDateRangeChange,
  adults,
  childCount,
  infants,
  onGuestsChange,
}: MobileFlightsContentProps) {
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [expanded, setExpanded] = useState<FlightSection | null>(null);
  const toggle = useCallback((section: FlightSection) => {
    setExpanded((prev) => (prev === section ? null : section));
  }, []);

  const guestTotal = adults + childCount + infants;
  const hasDate = tripType === "oneway"
    ? !!dateRange.start
    : !!(dateRange.start && dateRange.end);
  const hasOrigin = origin.trim().length > 0;
  const hasDest = dest.trim().length > 0;

  const guests = buildGuestTypes(adults, childCount, infants, onGuestsChange);

  return (
    <div className="space-y-3">
      {/* ── TRIP TYPE + CABIN + GUESTS header ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTripType("roundtrip")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            tripType === "roundtrip" ? "bg-[#222222] text-white" : "bg-white text-gray-700 border border-gray-200 shadow-sm"
          }`}
        >
          Ida y vuelta
        </button>
        <button
          onClick={() => { setTripType("oneway"); onDateRangeChange(dateRange.start, null); }}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            tripType === "oneway" ? "bg-[#222222] text-white" : "bg-white text-gray-700 border border-gray-200 shadow-sm"
          }`}
        >
          Solo ida
        </button>
        <Menu>
          <MenuButton className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm">
            {cabinLabels[cabinClass]}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </MenuButton>
          <MenuItems
            anchor={{ to: "bottom start", gap: 4 }}
            transition
            className="bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-[1100] min-w-[150px]"
          >
            {(["economy", "business", "first"] as CabinClass[]).map((cls) => (
              <MenuItem key={cls}>
                {({ focus }) => (
                  <button
                    onClick={() => setCabinClass(cls)}
                    className={`w-full text-left px-4 py-2.5 text-sm ${focus ? "bg-gray-50" : ""} ${
                      cls === cabinClass ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {cabinLabels[cls]}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>
      </div>

      {/* ── ORIGIN ── */}
      <section
        className={`bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
          expanded === "origin" ? "p-6" : "p-4"
        }`}
      >
        {expanded === "origin" ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[22px] font-bold text-gray-900">¿Desde dónde?</h2>
              <button
                onClick={() => setExpanded(null)}
                className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <LocationCombobox
              value={origin}
              onChange={onOriginChange}
              label="Origen"
              placeholder="Ciudad o aeropuerto"
            />
          </>
        ) : (
          <button onClick={() => toggle("origin")} className="w-full flex justify-between items-center cursor-pointer">
            <span className="text-[15px] font-medium text-gray-500">Desde</span>
            <span className={`text-[15px] font-bold ${hasOrigin ? "text-gray-900" : "text-gray-400"}`}>
              {hasOrigin ? origin : "Elegí origen"}
            </span>
          </button>
        )}
      </section>

      {/* ── DESTINATION ── */}
      <section
        className={`bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
          expanded === "dest" ? "p-6" : "p-4"
        }`}
      >
        {expanded === "dest" ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[22px] font-bold text-gray-900">¿A dónde?</h2>
              <button
                onClick={() => setExpanded(null)}
                className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <LocationCombobox
              value={dest}
              onChange={onDestChange}
              label="Destino"
              placeholder="Ciudad o aeropuerto"
            />
            <div className="mt-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Destinos populares</h3>
              <ul className="space-y-3">
                {FLIGHT_DESTINATIONS.slice(0, 8).map((d) => (
                  <li key={d}>
                    <button
                      onClick={() => onDestChange(d)}
                      className="flex items-center w-full text-left group cursor-pointer"
                    >
                      <div className="bg-gray-100 p-2 rounded-xl mr-3 group-hover:bg-gray-200 transition-colors">
                        <DestinationIcon />
                      </div>
                      <span className="text-base text-gray-800">{d}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <button onClick={() => toggle("dest")} className="w-full flex justify-between items-center cursor-pointer">
            <span className="text-[15px] font-medium text-gray-500">A dónde</span>
            <span className={`text-[15px] font-bold ${hasDest ? "text-gray-900" : "text-gray-400"}`}>
              {hasDest ? dest : "Elegí destino"}
            </span>
          </button>
        )}
      </section>

      {/* ── WHEN ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
        <button
          onClick={() => toggle("when")}
          className="w-full p-4 flex justify-between items-center text-left cursor-pointer"
        >
          <span className="text-[15px] font-medium text-gray-500">
            {tripType === "oneway" ? "Fecha de ida" : "Cuándo"}
          </span>
          <span className={`text-[15px] font-bold ${hasDate ? "text-gray-900" : "text-gray-400"}`}>
            {hasDate
              ? (tripType === "oneway"
                ? formatDate(dateRange.start!)
                : <>{formatDate(dateRange.start!)} – {formatDate(dateRange.end!)}</>)
              : "Elegí fechas"
            }
          </span>
        </button>
        {expanded === "when" && (
          <DateRangePicker
            mode={tripType === "oneway" ? "single" : "range"}
            isOpen={true}
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => onDateRangeChange(start, end)}
            onClose={() => setExpanded(null)}
            startLabel="Ida"
            endLabel="Vuelta"
            fullWidth
          />
        )}
      </section>

      {/* ── WHO ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
        <button
          onClick={() => toggle("who")}
          className="w-full p-4 flex justify-between items-center text-left cursor-pointer"
        >
          <span className="text-[15px] font-medium text-gray-500">Quién</span>
          <span className={`text-[15px] font-bold ${guestTotal > 0 ? "text-gray-900" : "text-gray-400"}`}>
            {guestTotal > 0
              ? `${guestTotal} ${guestTotal === 1 ? "pasajero" : "pasajeros"}`
              : "Agregar pasajeros"
            }
          </span>
        </button>
        {expanded === "who" && (
          <GuestCounter
            isOpen={true}
            guests={guests}
            onClose={() => setExpanded(null)}
            fullWidth
          />
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MOBILE AI SEARCH
// ═══════════════════════════════════════════════
export function MobileAISearch({
  message,
  onMessageChange,
}: MobileAIContentProps) {
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
        <h2 className="text-[22px] font-bold text-gray-900 mb-2">Preguntale a la IA</h2>
        <p className="text-[15px] text-gray-500 mb-5">
          Vuelos, hoteles, itinerarios — solo decime qué necesitás.
        </p>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Ej: Vuelos baratos de Madrid a Tokio en agosto para 2 personas..."
          rows={3}
          className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-[12px] text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {AI_SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onMessageChange(s.emoji + " " + s.text)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
          >
            {s.emoji} {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
