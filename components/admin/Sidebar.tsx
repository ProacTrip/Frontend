// components/admin/Sidebar.tsx
//Utilidad: Menú lateral para navegar entre secciones del panel admin

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  Bell,
  LogOut,
  Shield
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
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
    },
    // Auditoría: funcionalidad aún no implementada en backend
    // {
    //   href: '/admin/audit',
    //   label: 'Auditoría',
    //   icon: <ClipboardList className="w-5 h-5" />,
    // },
    {
      href: '/admin/avatars',
      label: 'Avatares',
      icon: <ImageIcon className="w-5 h-5" />,
    },
    {
      href: '/admin/notifications',
      label: 'Notificaciones',
      icon: <Bell className="w-5 h-5" />,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c54141] rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">ProacTrip</h1>
            <p className="text-xs text-gray-500">Panel de Administración</p>
          </div>
        </div>
      </div>

      {/* Navegación — scrollable, el footer queda siempre visible */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-[#c54141]/10 text-[#c54141] border-r-2 border-[#c54141]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — siempre visible al fondo del sidebar */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}