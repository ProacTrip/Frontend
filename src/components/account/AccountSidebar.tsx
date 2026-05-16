'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Globe, HeartPulse, FileText, Shield, Heart, Search } from 'lucide-react';

const navItems = [
  { href: '/account', label: 'Mi Perfil', icon: User },
  { href: '/account/favorites', label: 'Favoritos', icon: Heart },
  { href: '/account/preferences', label: 'Preferencias', icon: Globe },
  { href: '/account/searches', label: 'Búsquedas', icon: Search },
  { href: '/account/medical', label: 'Médico', icon: HeartPulse },
  { href: '/account/documents', label: 'Documentos', icon: FileText },
  { href: '/account/security', label: 'Seguridad', icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/account') return pathname === '/account';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Mobile: horizontal scroll tabs ── */}
      <nav
        className="md:hidden sticky top-16 z-40 bg-paper border-b border-paper-outline overflow-x-auto"
        aria-label="Navegación de cuenta"
      >
        <div className="flex gap-1 px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-coral bg-coral/5'
                    : 'text-ink-muted hover:text-ink hover:bg-paper-container'
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop: vertical sidebar ── */}
      <aside
        className="hidden md:flex md:w-56 shrink-0 flex-col border-r border-paper-outline bg-paper-dim"
        aria-label="Navegación de cuenta"
      >
        <div className="px-4 py-6 border-b border-paper-outline">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Mi Cuenta
          </h2>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-coral bg-coral/5'
                    : 'text-ink-muted hover:text-ink hover:bg-paper-container'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
