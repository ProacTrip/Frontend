'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DESTINATIONS } from '@/app/lib/constants/destinations';
import DestinationCard from '@/components/home/DestinationCard';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const router = useRouter();

  const { isFavorite, toggleFavorite, isToggling } = useFavorites('destination');

  const currentDest = DESTINATIONS[currentIndex - 1];
  const currentDestId = String(currentDest?.id ?? '');
  const favorited = isFavorite(currentDestId);
  const backgroundDestination = currentDest;

  // Lógica compleja para ordenar el carrusel de tarjetas:
  // Filtramos el destino actual (para no repetirlo) y ordenamos el resto
  // de forma que los que tienen un ID mayor vayan primero, creando un bucle infinito.
  const visibleCards = DESTINATIONS
    .filter(d => d.id !== currentIndex)
    .sort((a, b) => {
      const aIsGreater = a.id > currentIndex;
      const bIsGreater = b.id > currentIndex;
      if (aIsGreater === bIsGreater) return a.id - b.id;
      return aIsGreater ? -1 : 1;
    });

  const handleNext = () => {
    setCurrentIndex(prev => (prev === 7 ? 1 : prev + 1)); 
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 1 ? 7 : prev - 1));
  };

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      
      {/* FONDO COMPLETO */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          initial={isFirstRender ? { scale: 1, opacity: 1 } : { scale: 2.0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundDestination.image})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* CONTENIDO */}
      <div className="relative z-10 h-full flex flex-col md:block">
        
        {/* INFORMACIÓN DEL DESTINO */}
        <div className="flex-1 flex items-center px-4 sm:px-6 md:absolute md:top-1/2 md:-translate-y-1/2 md:left-12 md:px-0 max-w-xl pt-6 md:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <div className="w-12 md:w-16 h-0.5 md:h-1 bg-white mb-2 md:mb-3"></div>
              
              <p className="text-white/80 text-xs sm:text-sm mb-2 md:mb-3 font-serif">
                {backgroundDestination.name}
              </p>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl mb-3 md:mb-4 leading-tight uppercase font-serif">
                {backgroundDestination.place}
              </h1>
              
              <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed mb-4 md:mb-6 max-w-lg font-serif line-clamp-3 sm:line-clamp-none">
                {backgroundDestination.description}
              </p>
              
              {/* Botones */}
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() =>
                    toggleFavorite({
                      entity_id: currentDestId,
                      entity_type: 'destination',
                      title: `${currentDest.name} - ${currentDest.place}`,
                    })
                  }
                  disabled={isToggling}
                  className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 ${
                    favorited 
                      ? 'bg-coral/20 border-coral/50 hover:bg-coral/30' 
                      : 'bg-white/10 border-white/30 hover:bg-white/20'
                  } ${isToggling ? 'opacity-50' : ''}`}
                >
                  <Heart 
                    className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${
                      favorited ? 'text-coral' : 'text-white'
                    }`}
                    fill={favorited ? 'currentColor' : 'none'}
                    strokeWidth={favorited ? 0 : 2}
                  />
                </button>
                
                <button 
                  onClick={() => router.push(`/home/vuelos?destino=${backgroundDestination.name.toLowerCase()}`)}
                  className="group relative overflow-hidden px-4 py-2 md:px-6 md:py-3 border-2 border-white rounded-full font-bold text-white text-sm md:text-base hover:text-white transition-colors"
                >
                  <div className="absolute inset-0 bg-[#FF6B6B] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></div>
                  
                  <div className="relative flex items-center gap-2 z-10">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar
                  </div>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CARRUSEL + CONTROLES */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 md:absolute md:bottom-8 md:right-12 md:px-0 md:pb-0 flex flex-col items-center md:items-end gap-3 md:gap-4">
          
          {/* CARDS */}
          {/* CARDS - Scroll horizontal en móvil */}
          <div className="w-full overflow-x-auto hide-scrollbar md:overflow-hidden">
            <div className="flex gap-3 md:gap-4 md:justify-end md:w-[900px]">
              <AnimatePresence mode="sync">
                {visibleCards.slice(0, 4).map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full">
            
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handlePrev}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/30"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
              
              <button
                onClick={handleNext}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/30"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-3 md:gap-4 flex-1">
              <div className="relative flex-1 h-0.5 md:h-1 bg-black/60 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-[#FF6B6B] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentIndex / 7) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FF6B6B] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm md:text-lg">
                  {currentIndex}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CSS para ocultar scrollbar */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}