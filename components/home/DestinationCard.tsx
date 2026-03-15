'use client';

import { motion } from 'framer-motion';
import { Destination } from '@/app/lib/types/destination';

interface DestinationCardProps {
  destination: Destination;
}

//cartas del home
export default function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="relative w-36 h-48 sm:w-40 sm:h-56 md:w-48 md:h-64 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${destination.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4">
        <div className="w-8 sm:w-10 md:w-12 h-0.5 bg-white mb-1 md:mb-2"></div>
        <p className="text-white/80 text-[10px] sm:text-xs mb-0.5 md:mb-1">
          {destination.name}
        </p>
        <p className="text-white font-bold text-sm sm:text-base md:text-lg uppercase leading-tight">
          {destination.place}
        </p>
      </div>
    </motion.div>
  );
}