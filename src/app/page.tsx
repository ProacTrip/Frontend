"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { DESTINATIONS } from "@/app/lib/constants/destinations";
import DestinationCard from "@/components/home/DestinationCard";
import Navbar from "@/components/layout/Navbar";

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();

  const backgroundDestination = DESTINATIONS[currentIndex - 1];

  const visibleCards = DESTINATIONS.filter((d) => d.id !== currentIndex).sort(
    (a, b) => {
      const aIsGreater = a.id > currentIndex;
      const bIsGreater = b.id > currentIndex;
      if (aIsGreater === bIsGreater) return a.id - b.id;
      return aIsGreater ? -1 : 1;
    }
  );

  const handleNext = useCallback(() => {
    setHasNavigated(true);
    setCurrentIndex((prev) => (prev === 7 ? 1 : prev + 1));
  }, []);

  const handlePrev = useCallback(() => {
    setHasNavigated(true);
    setCurrentIndex((prev) => (prev === 1 ? 7 : prev - 1));
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950">
      <Navbar />

      {/* FULLSCREEN BACKGROUND */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          initial={hasNavigated ? { scale: 1.1, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          exit={hasNavigated ? { scale: 1.05, opacity: 0 } : undefined}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundDestination.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />
        </motion.div>
      </AnimatePresence>

      {/* CONTENT LAYER */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row">
        {/* LEFT — DESTINATION INFO */}
        <div className="flex-1 flex items-end lg:items-center px-6 pb-8 lg:pb-0 lg:pl-16 xl:pl-24 lg:pr-12">
          <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={hasNavigated ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={hasNavigated ? { opacity: 0, y: -30 } : undefined}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-lg"
              >
              <span className="inline-block text-xs font-medium tracking-widest uppercase text-white/60 mb-4">
                {backgroundDestination.name}
              </span>

              <h1 suppressHydrationWarning className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tight mb-3">
                {backgroundDestination.place}
              </h1>

              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8 max-w-md line-clamp-3 sm:line-clamp-none">
                {backgroundDestination.description}
              </p>

              <button
                onClick={() =>
                  router.push(
                    `/vuelos?destino=${backgroundDestination.name.toLowerCase()}`
                  )
                }
                className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-full text-sm font-medium hover:bg-white/95 transition-all duration-200"
              >
                Descubrir destino
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT — IMAGE CARDS + CONTROLS */}
        <div className="lg:w-[580px] xl:w-[640px] flex flex-col justify-end px-6 pb-6 lg:pb-12 lg:pr-16 xl:pr-24 gap-4">
          {/* DESTINATION CARDS ROW */}
          <div className="w-full overflow-x-auto hide-scrollbar lg:overflow-hidden">
            <div className="flex gap-3 lg:gap-4 lg:justify-end">
              <AnimatePresence mode="sync">
                {visibleCards.slice(0, 4).map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* NAVIGATION CONTROLS */}
          <div className="flex items-center gap-4 lg:justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="flex items-center gap-3 flex-1 lg:flex-none lg:w-48">
              <div className="relative flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(currentIndex / 7) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold tabular-nums">
                  {currentIndex}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
