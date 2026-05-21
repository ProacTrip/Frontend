"use client";

import { motion } from "framer-motion";
import { Destination } from "@/app/lib/types/destination";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="relative w-36 h-48 sm:w-40 sm:h-52 lg:w-44 lg:h-56 rounded-3xl overflow-hidden shadow-lg cursor-pointer group shrink-0"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${destination.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
        <p className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
          {destination.name}
        </p>
        <p className="text-white font-semibold text-sm sm:text-base tracking-tight">
          {destination.place}
        </p>
      </div>
    </motion.div>
  );
}
