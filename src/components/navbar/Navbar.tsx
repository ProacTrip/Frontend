/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import CompactSearchPill from "./CompactSearchPill";
import SearchTabs, { type SearchTab } from "./SearchTabs";
import SearchPanel from "./SearchPanel";
import NavActions from "./NavActions";
import Backdrop from "./Backdrop";

export default function Navbar() {
  const router = useRouter();

  // ─── STATE ──────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("hoteles");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hotel search
  const [hotelDest, setHotelDest] = useState("");
  const [hotelDateRange, setHotelDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [adults, setAdults] = useState(2);
  const [childCount, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Flight search
  const [flightOrigin, setFlightOrigin] = useState("");
  const [flightDest, setFlightDest] = useState("");

  // AI search
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

  // ─── CLICK OUTSIDE ──────────────────────────────
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── KEYBOARD ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ─── BODY SCROLL LOCK (mobile) ────────────────
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [searchOpen]);

  // ─── GUESTS HANDLER ────────────────────────────
  const handleGuestsChange = useCallback(
    (type: "adults" | "children" | "infants", value: number) => {
      if (type === "adults") setAdults(value);
      else if (type === "children") setChildren(value);
      else setInfants(value);
    },
    [],
  );

  // ─── DATE RANGE HANDLER ────────────────────────
  const handleDateRangeChange = useCallback(
    (start: Date, end: Date) => setHotelDateRange({ start, end }),
    [],
  );

  // ─── SEARCH HANDLERS ───────────────────────────
  const handleHotelSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (hotelDest) params.set("destino", hotelDest);
    if (hotelDateRange.start && hotelDateRange.end) {
      params.set("entrada", hotelDateRange.start.toISOString().split("T")[0]);
      params.set("salida", hotelDateRange.end.toISOString().split("T")[0]);
    }
    if (adults) params.set("adultos", String(adults));
    if (childCount) params.set("ninos", String(childCount));
    if (infants) params.set("bebes", String(infants));
    setSearchOpen(false);
    router.push(`/hoteles?${params.toString()}`);
  }, [hotelDest, hotelDateRange, adults, childCount, infants, router]);

  const handleFlightSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (flightOrigin) params.set("origen", flightOrigin);
    if (flightDest) params.set("destino", flightDest);
    setSearchOpen(false);
    router.push(`/vuelos?${params.toString()}`);
  }, [flightOrigin, flightDest, router]);

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
          text: `¡Claro! Basado en "${userMsg}", te recomiendo explorar destinos como Santorini, Tokio o las Islas Lofoten. ¿Querés que busque vuelos u hoteles para alguno de estos destinos?`,
        },
      ]);
    }, 1200);
  }, [aiMessage]);

  // ─── DERIVED ────────────────────────────────────
  const isLanding = !isScrolled && !searchOpen;

  const navBg = !isLanding
    ? "bg-white shadow-[0_6px_20px_0px_rgba(0,0,0,0.08)]"
    : "bg-transparent";

  // ─── RENDER ─────────────────────────────────────
  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 pt-6 pb-4 transition-all duration-300 ${navBg}`}
      >
        <nav className="flex items-center justify-between px-6 lg:px-8 h-[72px] max-w-7xl mx-auto">
          {/* LEFT — LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logoMostrar.png"
              alt="ProacTrip"
              className="h-8 w-8 object-contain"
            />
            <motion.span
              animate={{ color: isLanding ? "#ffffff" : "#0A0A0A" }}
              transition={{ duration: 0.3 }}
              className="text-lg font-semibold tracking-tight"
            >
              ProacTrip
            </motion.span>
          </Link>

          {/* CENTER — Compact pill (state 1) OR Tab icons (state 2) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <AnimatePresence mode="wait">
              {!searchOpen ? (
                <motion.div
                  key="compact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <CompactSearchPill onClick={() => setSearchOpen(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="tabs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SearchTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — Profile + Currency (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <NavActions isLanding={isLanding} />
          </div>

          {/* MOBILE HAMBURGER */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              isLanding
                ? "text-white hover:bg-white/10"
                : "text-[#0A0A0A] hover:bg-[#F5F5F5]"
            }`}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* SEARCH PANEL — floats below nav when expanded */}
        <SearchPanel
          isVisible={searchOpen}
          activeTab={activeTab}
          hotelDest={hotelDest}
          onHotelDestChange={setHotelDest}
          hotelDateRange={hotelDateRange}
          onHotelDateRangeChange={handleDateRangeChange}
          adults={adults}
          childCount={childCount}
          infants={infants}
          onGuestsChange={handleGuestsChange}
          onHotelSearch={handleHotelSearch}
          flightOrigin={flightOrigin}
          onFlightOriginChange={setFlightOrigin}
          flightDest={flightDest}
          onFlightDestChange={setFlightDest}
          onFlightSearch={handleFlightSearch}
          aiMessage={aiMessage}
          onAiMessageChange={setAiMessage}
          aiChat={aiChat}
          onAiSend={handleAiSend}
        />

        {/* MOBILE MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden overflow-hidden bg-white border-t border-[#F5F5F5]"
            >
              <div className="px-6 py-4 space-y-3">
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] text-sm font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  Buscar destinos, vuelos, hoteles...
                </button>

                <div className="border-t border-[#F5F5F5] pt-3">
                  <NavActions isLanding={false} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* BACKDROP — behind search panel when expanded */}
      <Backdrop
        isVisible={searchOpen}
        onClick={() => setSearchOpen(false)}
      />
    </>
  );
}
