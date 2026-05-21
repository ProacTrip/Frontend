// components/admin/Sidebar.tsx
// Menú lateral admin — solo secciones documentadas en DASHBOARD_API.md
// Alcance: Gestión de usuarios, feature limits y verificación de documentos.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      icon: <Users className="w-4 h-4" />,
    },
    {
      href: '/admin/documentos',
      label: 'Documentos',
      icon: <FileCheck className="w-4 h-4" />,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-neutral-200 flex flex-col z-50">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900 text-sm tracking-tight">
              ProacTrip
            </h1>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Panel Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-100 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
