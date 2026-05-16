'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useEnvironment } from '@/lib/environment/EnvironmentProvider';
import {
  Menu,
  X,
  User,
  LogOut,
  ShoppingBag,
  ChevronDown,
  Compass,
  Coins,
} from 'lucide-react';

const navLinks = [
  { href: '/hotels', label: 'Hoteles' },
  { href: '/flights', label: 'Vuelos' },
  { href: '/trips', label: 'ProacTrip AI' },
  { href: '/contact', label: 'Contáctanos' },
];

// Popular currencies — covers most users
const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'ARS', label: 'Peso Argentino', symbol: '$' },
  { code: 'MXN', label: 'Peso Mexicano', symbol: '$' },
  { code: 'COP', label: 'Peso Colombiano', symbol: '$' },
  { code: 'BRL', label: 'Real Brasileño', symbol: 'R$' },
  { code: 'CLP', label: 'Peso Chileno', symbol: '$' },
  { code: 'PEN', label: 'Sol Peruano', symbol: 'S/' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
];

function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { userCurrency, setUserCurrency } = useEnvironment();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ── Scroll detection ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Click outside (user dropdown + currency) ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Derived state ──
  const isHome = pathname === '/';
  const isTransparent = isHome && !scrolled && !menuOpen;

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setUserMenuOpen(false);
    }
  };

  // ── Class helpers ──
  const headerBg = isTransparent
    ? 'bg-transparent'
    : 'bg-white border-b border-paper-outline';

  const logoTextColor = isTransparent ? 'text-white' : 'text-ink';

  const navLinkDefault = isTransparent
    ? 'text-white/80 hover:text-white hover:bg-white/10'
    : 'text-ink-muted hover:text-ink hover:bg-paper-container';

  const navLinkActive = isTransparent
    ? 'text-white bg-white/15'
    : 'text-coral bg-coral/5';

  const hamburgerColor = isTransparent
    ? 'text-white hover:bg-white/10'
    : 'text-ink hover:bg-paper-container';

  const loginLinkClass = isTransparent
    ? 'text-white hover:bg-white/10'
    : 'text-ink-muted hover:text-coral hover:bg-coral/5';

  const registerLinkClass = isTransparent
    ? 'text-white bg-coral hover:bg-coral-hover'
    : 'text-white bg-coral hover:bg-coral-hover';

  const userBtnClass = isTransparent
    ? 'text-white/80 hover:text-white hover:bg-white/10'
    : 'text-ink-muted hover:bg-paper-container';

  const currencyBtnClass = isTransparent
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-ink-muted hover:text-ink hover:bg-paper-container';

  return (
    <header
      className={`w-full h-16 transition-all duration-300 ${headerBg}`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* ── Logo ── */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-black text-xl tracking-tight ${logoTextColor} hover:opacity-90 transition-opacity`}
        >
          <Compass size={22} className="text-coral shrink-0" />
          <span>
            Proac<span className="text-coral">Trip</span>
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active ? navLinkActive : navLinkDefault
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* ── Currency Selector ── */}
          {userCurrency && (
            <div className="relative hidden sm:block" ref={currencyRef}>
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${currencyBtnClass}`}
                aria-label="Cambiar moneda"
              >
                <Coins size={14} />
                <span>{getCurrencySymbol(userCurrency)} {userCurrency}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${currencyOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-paper-dim rounded-xl shadow-lg border border-paper-outline overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-paper-outline">
                    <p className="text-xs text-ink-faint font-medium uppercase tracking-wider">
                      Moneda
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setUserCurrency(c.code);
                          setCurrencyOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          userCurrency === c.code
                            ? 'text-coral bg-coral/5 font-medium'
                            : 'text-ink hover:bg-paper-container'
                        }`}
                      >
                        <span>{c.symbol} {c.code}</span>
                        <span className="text-xs text-ink-faint">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            /* Loading skeleton */
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full animate-pulse ${
                  isTransparent ? 'bg-white/10' : 'bg-paper-container'
                }`}
              />
              <div
                className={`hidden sm:block w-20 h-8 rounded-lg animate-pulse ${
                  isTransparent ? 'bg-white/10' : 'bg-paper-container'
                }`}
              />
            </div>
          ) : isAuthenticated ? (
            /* Authenticated: user icon + dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${userBtnClass}`}
                aria-label="Menú de usuario"
              >
                <User size={16} />
                <ChevronDown
                  size={14}
                  className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-paper-dim rounded-xl shadow-lg border border-paper-outline overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-paper-outline">
                    <p className="text-xs text-ink-faint font-medium uppercase tracking-wider">
                      Mi cuenta
                    </p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-paper-container transition-colors"
                  >
                    <User size={15} className="text-ink-muted" />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-paper-container transition-colors"
                  >
                    <ShoppingBag size={15} className="text-ink-muted" />
                    Mis compras
                  </Link>
                  <div className="border-t border-paper-outline">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-coral hover:bg-coral-container transition-colors cursor-pointer"
                    >
                      <LogOut size={15} />
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not authenticated */
            <>
              <Link
                href="/auth/login"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${loginLinkClass}`}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${registerLinkClass}`}
              >
                Registrarse
              </Link>
            </>
          )}

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${hamburgerColor}`}
            aria-label="Menú"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-paper-dim border-t border-paper-outline shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-coral bg-coral/5'
                      : 'text-ink hover:bg-paper-container'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* ── Mobile Currency Selector ── */}
            {userCurrency && (
              <div className="border-t border-paper-outline pt-2 mt-2">
                <p className="px-3 py-1 text-xs text-ink-faint font-medium uppercase tracking-wider">
                  Moneda
                </p>
                <div className="flex flex-wrap gap-1.5 px-3 py-2">
                  {CURRENCIES.slice(0, 8).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setUserCurrency(c.code);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        userCurrency === c.code
                          ? 'text-coral bg-coral/10 border border-coral/20'
                          : 'text-ink-muted bg-paper-container hover:bg-paper border border-paper-outline'
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-paper-outline pt-3 mt-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper-container rounded-lg transition-colors"
                  >
                    <User size={16} className="text-ink-muted" />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper-container rounded-lg transition-colors"
                  >
                    <ShoppingBag size={16} className="text-ink-muted" />
                    Mis compras
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-coral rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-paper-container transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-coral hover:bg-coral-hover text-center transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
