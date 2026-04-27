'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/ui/Loader';
import { User, LogOut, Menu, X, UserCircle, ShoppingBasket, HeartPlus } from 'lucide-react';
import CurrencySelector from '@/components/layout/CurrencySelector';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar(){
    const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  //para ver si el menu desplegable (PC/movil) esta abierto
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuAbiertoMovil, setMenuAbiertoMovil] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Referencia al elemento DOM del menu desplegable para detectar clics fuera de él
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Si el menú está abierto (dropdownRef.current existe) Y el clic NO fue dentro del menú
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) 
      {
        //cerramos el menu
        setMenuAbierto(false);
      }
    };

    //Añadimos el "escuchador" de clics cuando el componente se monta.
    document.addEventListener('mousedown', handleClickOutside);

    // Función de limpieza: quita el "escuchador" cuando el componente se desmonta para evitar problemas de memoria
    return () => document.removeEventListener('mousedown', handleClickOutside);

    // El array vacío significa que este efecto solo se configura una vez al inicio
  }, []);
  
  // Manejamos el cierre de sesión — cookie-based: el backend lee las cookies automáticamente, sin body
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      setIsLoggingOut(false);
      router.push('/auth/login');
    }
  };

  const navLinks = [
    { href: '/home', label: 'Home' },
    { href: '/home/hoteles', label: 'Hoteles' },
    { href: '/home/vuelos', label: 'Vuelos' },
    { href: '/home/contactanos', label: 'Contáctanos' },
  ];

  return (
    /* NAVBAR */
    <nav className="bg-[#c54141] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LOGO */}
            <Link href="/home" className="flex items-center z-50">
              <span className="text-2xl font-bold text-white">ProacTrip</span>
            </Link>

            {/* NAVEGACIÓN DESKTOP */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-white font-medium uppercase text-sm group"
                >
                  {link.label}
                  
                  {/* Línea animada */}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-white transition-all duration-500 ease-out group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* BOTONES DE AUTH - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {isLoading ? (
                /* Usamos Loader pero le pasamos text="" para que solo salga el círculo */
                <Loader text="" size="md" />
                
              ) : isAuthenticated ? (
                // Usuario logueado: mostrar icono de perfil + me gusta con dropdown
                <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                  {/*añadir a favoritos*/}
                  <Link 
                    href="/home/favoritos" 
                    className="relative text-white hover:text-red-800 transition-colors"
                  >
                    <HeartPlus className="w-6 h-6"/>
                  </Link>

                  {/*Campana notificaciones*/}
                  <div className="relative">
                    <NotificationBell />
                  </div>

                  {/*usuario*/}
                  <button
                  //setMenuAbierto(!menuAbierto = !false) = si el menu esta cerrado se abre (menuAbierto el menu empieza estando cerrado(osea false))
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-6 h-6" />
                  </button>

                  <CurrencySelector />

                  {menuAbierto && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* ICONO INFO PERFIL */}
                      <Link
                        href="/home/profile"
                        //setMenuAbierto(false) = al pulsar se cierra el menu (cuando lo pulse el icono se cerrara el menu, es
                        //una tonteria pq pues te va a mandar a otro link y no necesitas ver el menu cerrado pero es por asegurarlo)
                        onClick={() => setMenuAbierto(false)}
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserCircle className="w-5 h-5 text-gray-600" />
                          <span className="font-medium">Información del perfil</span>
                        </div>
                      </Link>

                      <hr className="my-2 border-gray-200" />

                      {/* ICONO MIS COMPRAS REALIZADAS */}
                      <Link
                        href="/home/mis-compras"
                        onClick={() => setMenuAbierto(false)}
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3"> 
                          <ShoppingBasket className="w-5 h-5 text-gray-600" />
                          <span className="font-medium">Mis compras</span>
                        </div>
                      </Link>

                      <hr className="my-2 border-gray-200" />

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          {isLoggingOut ? (
                            // RUEDA GIRANDO = CERRANDO SESION (LOADER PERO EN ROJO)
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <LogOut className="w-5 h-5" />
                          )}
                          <span className="font-medium">
                            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Usuario NO logueado: mostrar botones de login/registro
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-white hover:text-gray-200 transition-colors font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-white text-[#FF6B6B] rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>

            {/* BOTÓN HAMBURGUESA - Móvil */}
            <button
              onClick={() => setMenuAbiertoMovil(!menuAbiertoMovil)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white"
            >
              {menuAbiertoMovil ? (
                <X className="w-6 h-6" /> // Icono X
              ) : (
                <Menu className="w-6 h-6" /> // Icono Hamburguesa
              )}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        {menuAbiertoMovil && (
          <div className="md:hidden bg-[#FF6B6B] border-t border-white/20">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAbiertoMovil(false)}
                  className="block py-2 text-white hover:text-gray-200 transition-colors font-medium uppercase text-sm"
                >
                  {link.label}
                </Link>
              ))}

              <hr className="my-4 border-white/20" />

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader text="" size="sm" />
                </div>
              ) : isAuthenticated ? (
                <>
                  <Link
                    href="/home/profile"
                    onClick={() => setMenuAbiertoMovil(false)}
                    className="block py-2 text-white hover:text-gray-200 transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-5 h-5" />
                      Información del perfil
                    </div>
                  </Link>

                  <Link
                    href="/home/mis-compras"
                    onClick={() => setMenuAbiertoMovil(false)}
                    className="block py-2 text-white hover:text-gray-200 transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBasket className="w-5 h-5" />
                      Mis compras
                    </div>
                  </Link>

                  <Link
                    href="/home/favoritos"
                    onClick={() => setMenuAbiertoMovil(false)}
                    className="block py-2 text-white  hover:text-red-800 transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <HeartPlus className="w-5 h-5" />
                      Me gusta
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left py-2 text-white hover:text-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {isLoggingOut ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        // ICONO CERRAR SESIÓN (LOADER PERO EN ROJO)
                        <LogOut className="w-5 h-5" />
                      )}
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuAbiertoMovil(false)}
                    className="block py-2 text-white hover:text-gray-200 transition-colors font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuAbiertoMovil(false)}
                    className="block py-2 text-white hover:text-gray-200 transition-colors font-medium"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
    </nav>

    
  );
}