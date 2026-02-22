'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DotLottiePlayer } from '@dotlottie/react-player';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Precargamos la ruta de home
    router.prefetch('/home');
    
    // Timer de 15 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => router.push('/home'), 800);
    }, 11000); 

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AnimatePresence mode="wait">
      {showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] bg-[#ffffff] overflow-hidden"
        >
          {/* Contenedor principal con 3 secciones */}
          <div className="absolute inset-0 w-full h-full flex items-center">
            
            {/* Columna IZQUIERDA - Texto, Logo y animación loader */}
            <div className="w-1/4 h-full flex flex-col items-center justify-center gap-6 px-8">
              
              {/* Texto encima del logo */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-2xl font-bold text-[#d4542a] text-center"
              >
                ProacTrip
                <span className="block text-lg font-medium text-gray-700 mt-1">
                  viaja contigo
                </span>
              </motion.h1>

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Image 
                  src="/logoMostrar.png" 
                  alt="Logo" 
                  width={150} 
                  height={150}
                  className="object-contain"
                  priority
                />
              </motion.div>

              {/* Animación loader - ARCHIVO LOCAL */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-32 h-32"
              >
                <DotLottiePlayer
                  src="/animations/loader.lottie"
                  background="transparent"
                  speed={1}
                  loop
                  autoplay
                />
              </motion.div>
            </div>

            {/* Columna CENTRAL - Animación principal (lupa) MÁS GRANDE */}
            <div className="w-1/2 h-full flex items-center justify-center">
              <div className="w-full max-w-4xl aspect-square">
                <DotLottiePlayer
                  src="/animations/lupa.lottie"
                  background="transparent"
                  speed={1}
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Columna DERECHA - Vacía */}
            <div className="w-1/4 h-full"></div>
          </div>
          
          {/* Texto flotante */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[#d4542a] text-sm font-medium tracking-widest animate-pulse z-10"
          >
            PREPARANDO TU VIAJE...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}