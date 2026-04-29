// app/admin/page.tsx
//Utilidad:  Dashboard: números rápidos (total users, bloqueados, logs hoy)

// Dashboard admin: estadísticas rápidas y resumen del sistema

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { listUsers, queryAuditLogs } from '@/app/lib/api';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
  todayLogs: number;
  loading: boolean;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    adminUsers: 0,
    todayLogs: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        // Cargar usuarios (sin filtros para contar totales)
        const usersResponse = await listUsers({ limit: 1000, offset: 0 });
        const users = usersResponse.users || [];
        
        // Contar por estado y rol
        const activeUsers = users.filter(u => u.status === 'active').length;
        const blockedUsers = users.filter(u => u.status === 'blocked' || u.status === 'suspended').length;
        const adminUsers = users.filter(u => u.role === 'admin').length;

        // Cargar logs de hoy (aproximado)
        const today = new Date().toISOString().split('T')[0];
        const logsResponse = await queryAuditLogs({ 
          date_from: `${today}T00:00:00Z`,
          limit: 1 
        });

        setStats({
          totalUsers: usersResponse.total || users.length,
          activeUsers,
          blockedUsers,
          adminUsers,
          todayLogs: logsResponse.total || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error cargando stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/admin/users',
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers,
      icon: <UserCheck className="w-6 h-6 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '/admin/users',
    },
    {
      title: 'Bloqueados',
      value: stats.blockedUsers,
      icon: <UserX className="w-6 h-6 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      href: '/admin/users',
    },
    {
      title: 'Administradores',
      value: stats.adminUsers,
      icon: <ShieldAlert className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '/admin/users',
    },
    {
      title: 'Logs Hoy',
      value: stats.todayLogs,
      icon: <ClipboardList className="w-6 h-6 text-orange-600" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      href: '/admin/audit',
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#c54141] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido, <span className="font-medium text-gray-700">{user?.role_name || 'admin'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href}
            className={`
              ${card.bgColor} ${card.borderColor} border rounded-xl p-6 
              hover:shadow-md transition-all duration-200 cursor-pointer
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#c54141]" />
          <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#c54141] hover:bg-[#c54141]/5 transition-all"
          >
            <Users className="w-5 h-5 text-[#c54141]" />
            <span className="font-medium text-gray-700">Gestionar Usuarios</span>
          </Link>
          <Link 
            href="/admin/audit"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#c54141] hover:bg-[#c54141]/5 transition-all"
          >
            <ClipboardList className="w-5 h-5 text-[#c54141]" />
            <span className="font-medium text-gray-700">Ver Auditoría</span>
          </Link>
          <Link 
            href="/admin/notifications"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#c54141] hover:bg-[#c54141]/5 transition-all"
          >
            <ShieldAlert className="w-5 h-5 text-[#c54141]" />
            <span className="font-medium text-gray-700">Enviar Notificación</span>
          </Link>
        </div>
      </div>
    </div>
  );
}