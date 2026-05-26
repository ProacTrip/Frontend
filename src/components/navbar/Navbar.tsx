"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const { environment } = useEnvironment();
  const urlParams = useSearchParams();

  // ─── STATE ──────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // ─── HYDRATION-SAFE validation state ───────────
  // Server renders disabled={false} (enabled) to match initial client render
  // before environment pre-fills hotelDest. After hydration, compute real validity.
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);

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

  // ─── PRE-FILL STATE/REGION FROM ENVIRONMENT ──────
  useEffect(() => {
    if (!environment?.location?.state) return;
    setHotelDest((prev) => prev || environment.location.state);
    setFlightOrigin((prev) => prev || environment.location.state);
  }, [environment?.location?.state]);

  // ─── DERIVED (MUST be declared BEFORE useCallback that references them) ──
  const isLandingPage = pathname === "/";
  const isHotelesRoute = pathname === "/hoteles" || pathname.startsWith("/hoteles?");
  const isVuelosRoute = pathname === "/vuelos" || pathname.startsWith("/vuelos?");
  const isHero = isLandingPage && !isScrolled && !expanded;

  // ─── Pre-select tab based on route ──
  useEffect(() => {
    if (isVuelosRoute) setTabIndex(2);
    else if (isHotelesRoute) setTabIndex(0);
  }, [isVuelosRoute, isHotelesRoute]);

  // ─── TAB HANDLER ───────────────────────────────
  const handleTabChange = useCallback((index: number) => {
    setTabIndex(index);
    setExpanded(true);
  }, []);

  const handleTabClick = useCallback(
    (idx: number) => {
      const isVuelosTab = TABS[idx]?.id === "vuelos";
      const isHotelesTab = TABS[idx]?.id === "hoteles";

      // Clicking the tab that matches current route => toggle the main search panel
      const matchesCurrentRoute =
        (isVuelosTab && isVuelosRoute) || (isHotelesTab && isHotelesRoute);

      if (matchesCurrentRoute) {
        setExpanded((prev) => !prev);
      } else {
        // Different search type: switch tab and open the panel
        setTabIndex(idx);
        setExpanded(true);
      }
    },
    [isVuelosRoute, isHotelesRoute],
  );

  const guestTotal = adults + childCount;

  // ─── SEARCH VALIDATION ───────────────────────
  // Hydration-safe: default to true (enabled) on server/first render,
  // only compute real validity after client hydration when environment data is loaded.
  const isSearchValid = isHydrated
    ? (hotelDest.trim() !== '' && hotelDateRange.start !== null && hotelDateRange.end !== null)
    : true;

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

  // ─── SYNC NAVBAR STATE FROM URL (hoteles route) ──
  useEffect(() => {
    if (!isHotelesRoute) return;
    const q = urlParams.get('query');
    const ci = urlParams.get('check_in_date');
    const co = urlParams.get('check_out_date');
    const ad = urlParams.get('adults');
    const ch = urlParams.get('children');

    if (q) setHotelDest(q);
    if (ci) {
      setHotelDateRange({
        start: new Date(ci + 'T00:00:00'),
        end: co ? new Date(co + 'T00:00:00') : null,
      });
    }
    if (ad) setAdults(parseInt(ad, 10));
    if (ch) setChildren(parseInt(ch, 10));
  }, [isHotelesRoute, urlParams.toString()]);

  // ─── SYNC NAVBAR STATE FROM URL (vuelos route) ──
  useEffect(() => {
    if (!isVuelosRoute) return;
    const orig = urlParams.get('origen');
    const dest = urlParams.get('destino');
    const fi = urlParams.get('fecha_ida');
    const fv = urlParams.get('fecha_vuelta');
    const ad = urlParams.get('adults');
    const ch = urlParams.get('children');

    if (orig) setFlightOrigin(orig);
    if (dest) setFlightDest(dest);
    if (ad) setAdults(parseInt(ad, 10));
    if (ch) setChildren(parseInt(ch, 10));
    if (fi) {
      setFlightDateRange({
        start: new Date(fi + 'T00:00:00'),
        end: fv ? new Date(fv + 'T00:00:00') : null,
      });
    }
  }, [isVuelosRoute, urlParams.toString()]);

  // ─── SEARCH ACTIONS ────────────────────────────
  const handleHotelSearch = useCallback(() => {
    const dest = hotelDest.trim();
    
    // Guard: show validation message instead of silent return
    if (!dest) {
      setValidationMessage('Ingresá un destino');
      return;
    }

    // Guard: show validation message for missing dates
    if (!hotelDateRange.start || !hotelDateRange.end) {
      setValidationMessage('Seleccioná las fechas de tu viaje');
      return;
    }

    setValidationMessage(null);

    const params = new URLSearchParams();
    params.set("query", dest);
    params.set("check_in_date", hotelDateRange.start.toISOString().split("T")[0]);
    params.set("check_out_date", hotelDateRange.end.toISOString().split("T")[0]);
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
        className="fixed top-0 left-0 right-0 z-[950]"
      >
        <TabGroup selectedIndex={tabIndex} onChange={handleTabChange}>
          {/* NAVBAR STRIP */}
          <div
            className={`relative z-20 h-[72px] flex items-center justify-between px-6 lg:px-8 transition-colors duration-300 ${
              isHero ? "bg-transparent" : "bg-white shadow-sm border-b border-neutral-100"
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

            {/* CENTER — TABS (desktop, all routes) */}
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
              {/* Validation banner */}
              {validationMessage && (
                <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <span>{validationMessage}</span>
                  <button
                    onClick={() => setValidationMessage(null)}
                    className="ml-3 text-amber-600 hover:text-amber-800"
                    aria-label="Cerrar aviso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                    isValid={isSearchValid}
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
