"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Menu, X, Building2, Sparkles, Plane } from "lucide-react";
import NavActions from "./NavActions";
import HotelsSearch from "./tabs/HotelsSearch";
import AISearch from "./tabs/AISearch";
import FlightsSearch from "./tabs/FlightsSearch";
import Backdrop from "./Backdrop";
import { useEnvironment } from "@/hooks/useEnvironment";
import { getUserPreferences } from "@/app/lib/utils/location";

const TABS = [
  { id: "hoteles" as const, icon: Building2, label: "Hoteles" },
  { id: "ia" as const, icon: Sparkles, label: "IA" },
  { id: "vuelos" as const, icon: Plane, label: "Vuelos" },
];

export default function Navbar() {
  const router = useRouter();
  const { environment } = useEnvironment();

  // ─── STATE ──────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Hotels
  const [hotelDest, setHotelDest] = useState("");
  const [hotelDateRange, setHotelDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [adults, setAdults] = useState(2);
  const [childCount, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Flights
  const [flightOrigin, setFlightOrigin] = useState("");
  const [flightDest, setFlightDest] = useState("");
  const [flightDateRange, setFlightDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  // AI
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  // ─── SCROLL ─────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── CLICK OUTSIDE (mobile) ────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── KEYBOARD ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ─── BODY SCROLL ───────────────────────────────
  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  // ─── PRE-FILL CITY FROM ENVIRONMENT ────────────
  useEffect(() => {
    if (!environment?.location?.city) return;
    setHotelDest((prev) => prev || environment.location.city);
    setFlightOrigin((prev) => prev || environment.location.city);
  }, [environment?.location?.city]);

  // ─── TAB HANDLER ───────────────────────────────
  const handleTabChange = useCallback((index: number) => {
    setTabIndex(index);
    setExpanded(true);
  }, []);

  const handleTabClick = useCallback(
    (idx: number) => {
      if (idx === tabIndex) {
        setExpanded((prev) => !prev);
      }
    },
    [tabIndex],
  );

  // ─── DERIVED ────────────────────────────────────
  const isHero = !isScrolled && !expanded;

  // ─── GUESTS HANDLER ────────────────────────────
  const handleGuestsChange = useCallback(
    (type: "adults" | "children" | "infants", value: number) => {
      if (type === "adults") setAdults(value);
      else if (type === "children") setChildren(value);
      else setInfants(value);
    },
    [],
  );

  // ─── DATE RANGE ────────────────────────────────
  const handleDateRangeChange = useCallback(
    (start: Date | null, end: Date | null) => setHotelDateRange({ start, end }),
    [],
  );

  const handleFlightDateRangeChange = useCallback(
    (start: Date | null, end: Date | null) => setFlightDateRange({ start, end }),
    [],
  );

  // ─── SEARCH ACTIONS ────────────────────────────
  const handleHotelSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (hotelDest) params.set("query", hotelDest);
    if (hotelDateRange.start && hotelDateRange.end) {
      params.set("check_in_date", hotelDateRange.start.toISOString().split("T")[0]);
      params.set("check_out_date", hotelDateRange.end.toISOString().split("T")[0]);
    }
    if (adults > 0) params.set("adults", String(adults));
    if (childCount > 0) params.set("children", String(childCount));
    const prefs = getUserPreferences();
    if (prefs.currency) params.set("currency", prefs.currency);
    if (prefs.hl) params.set("hl", prefs.hl);
    if (prefs.gl) params.set("gl", prefs.gl);
    setExpanded(false);
    router.push(`/hoteles?${params.toString()}`);
  }, [hotelDest, hotelDateRange, adults, childCount, router]);

  const handleFlightSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (flightOrigin) params.set("origen", flightOrigin);
    if (flightDest) params.set("destino", flightDest);
    if (flightDateRange.start) params.set("fecha_ida", flightDateRange.start.toISOString().split("T")[0]);
    if (flightDateRange.end) params.set("fecha_vuelta", flightDateRange.end.toISOString().split("T")[0]);
    const prefs = getUserPreferences();
    if (prefs.currency) params.set("currency", prefs.currency);
    if (prefs.hl) params.set("hl", prefs.hl);
    if (prefs.gl) params.set("gl", prefs.gl);
    setExpanded(false);
    router.push(`/vuelos?${params.toString()}`);
  }, [flightOrigin, flightDest, flightDateRange, router]);

  const handleAiSend = useCallback(() => {
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage.trim();
    setAiChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiMessage("");
    setTimeout(() => {
      setAiChat((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            `¡Claro! Basado en "${userMsg}", te recomiendo explorar destinos ` +
            "como Santorini, Tokio o las Islas Lofoten. ¿Querés que busque vuelos u hoteles para alguno de estos destinos?",
        },
      ]);
    }, 1200);
  }, [aiMessage]);

  // ─── RENDER ─────────────────────────────────────
  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <TabGroup selectedIndex={tabIndex} onChange={handleTabChange}>
          {/* NAVBAR STRIP */}
          <div
            className={`navbar-glass relative z-20 h-[72px] flex items-center justify-between px-6 lg:px-8 ${
              expanded ? "is-expanded" : ""
            }`}
          >
            {/* LEFT — LOGO */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
            >
              <Image
                src="/logoMostrar.png"
                alt="ProacTrip"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              <span
                className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
                  isHero ? "text-white" : "text-[#0A0A0A]"
                }`}
              >
                ProacTrip
              </span>
            </Link>

            {/* CENTER — TABS (desktop) */}
            <TabList className="hidden lg:flex items-center gap-1.5">
              {TABS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <Tab
                    key={tab.id}
                    onClick={() => handleTabClick(idx)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 outline-none cursor-pointer ${
                      isHero
                        ? `text-white/80 data-[hover]:bg-white/15 data-[hover]:text-white data-[focus]:ring-2 data-[focus]:ring-white/30 ${expanded ? 'data-[selected]:bg-[#111] data-[selected]:text-white' : ''}`
                        : `text-[#888] data-[hover]:bg-[#f5f5f5] data-[hover]:text-[#111] data-[focus]:ring-2 data-[focus]:ring-[#e5e5e5] ${expanded ? 'data-[selected]:bg-[#111] data-[selected]:text-white' : ''}`
                    }`}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                    {tab.label}
                  </Tab>
                );
              })}
            </TabList>

            {/* RIGHT */}
            <div className="hidden lg:flex items-center gap-2">
              <NavActions isLanding={isHero} />
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                isHero
                  ? "text-white hover:bg-white/10"
                  : "text-[#0A0A0A] hover:bg-[#F5F5F5]"
              }`}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* SEARCH PANEL — slides down from behind navbar */}
          <div
            className={`search-panel ${expanded ? "is-open" : ""}`}
          >
            <div className="max-w-4xl mx-auto search-panel-content">
              <TabPanels>
                {/* HOTELS */}
                <TabPanel>
                  <HotelsSearch
                    destination={hotelDest}
                    onDestinationChange={setHotelDest}
                    dateRange={hotelDateRange}
                    onDateRangeChange={handleDateRangeChange}
                    adults={adults}
                    childCount={childCount}
                    infants={infants}
                    onGuestsChange={handleGuestsChange}
                    onSearch={handleHotelSearch}
                  />
                </TabPanel>

                {/* AI */}
                <TabPanel>
                  <AISearch
                    message={aiMessage}
                    onMessageChange={setAiMessage}
                    chat={aiChat}
                    onSend={handleAiSend}
                  />
                </TabPanel>

                {/* FLIGHTS */}
                <TabPanel>
                  <FlightsSearch
                    origin={flightOrigin}
                    onOriginChange={setFlightOrigin}
                    dest={flightDest}
                    onDestChange={setFlightDest}
                    adults={adults}
                    childCount={childCount}
                    infants={infants}
                    onGuestsChange={handleGuestsChange}
                    onSearch={handleFlightSearch}
                    dateRange={flightDateRange}
                    onDateRangeChange={handleFlightDateRangeChange}
                  />
                </TabPanel>
              </TabPanels>
            </div>
          </div>
        </TabGroup>
      </header>

      {/* BACKDROP — behind panel */}
      <Backdrop
        isVisible={expanded}
        onClick={() => setExpanded(false)}
      />

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] z-40 bg-white overflow-y-auto border-t border-[#F5F5F5]">
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-[#A1A1A1] uppercase tracking-wider">
              Buscar
            </p>
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTabIndex(idx);
                    setExpanded(true);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    idx === tabIndex
                      ? "bg-[#111] text-white"
                      : "text-[#0A0A0A] hover:bg-[#F5F5F5]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}

            <div className="border-t border-[#F5F5F5] pt-3 mt-3">
              <NavActions isLanding={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
