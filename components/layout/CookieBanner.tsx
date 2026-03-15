'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    //Verificamos si ya aceptó anteriormente
    const consent = localStorage.getItem('cookies_accepted');
    
    if (!consent) {
      setShowBanner(true);

      //Auto-aceptado tras 9 segundos si está en la pantalla de carga
      const timer = setTimeout(() => {
        acceptCookies();
        console.log("Aceptado automático tras 9 segundos");
      }, 9000); 

      // Limpiar el timer si el componente se desmonta antes, es decir ,
      // si este componente desaparece de la pantalla apaga el cronómetro y olvida la 
      // cuenta atrás (para evitar errores innecesarios q podria haber de la logica)
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShowBanner(false);
  };

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
          
          {/*RESPONSIVE: Botón más pequeño en móvil */}
          <button
            onClick={acceptCookies}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#FF6B6B] text-white text-sm sm:text-base rounded-xl hover:bg-[#ff5252] transition-all font-bold shadow-lg shadow-red-100 hover:scale-105 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}