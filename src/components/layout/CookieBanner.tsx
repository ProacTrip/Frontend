'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function CookieBanner() {
  const pathname = usePathname();

  const [showBanner, setShowBanner] = useState(() => {
    try {
      return !localStorage.getItem('cookies_accepted');
    } catch {
      return true;
    }
  });

  const acceptCookies = useCallback(() => {
    try {
      localStorage.setItem('cookies_accepted', 'true');
    } catch {
      // localStorage bloqueado
    }
    setShowBanner(false);
  }, []);

  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => acceptCookies(), 9000);
    return () => clearTimeout(timer);
  }, [showBanner, acceptCookies]);

  // Solo mostramos el banner si estamos en la raíz '/' (en la pantalla de carga)
  if (pathname !== '/' || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              🍪 Aviso de configuración
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Para que <strong>ProacTrip</strong> funcione correctamente, necesitamos guardar tu sesión e idioma en el navegador. 
              Al continuar navegando, entendemos que estás de acuerdo.
            </p>
          </div>
          
          <button
            onClick={acceptCookies}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-neutral-900 text-white text-sm sm:text-base rounded-full hover:bg-neutral-800 transition-all font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}