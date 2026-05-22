// app/admin/page.tsx
// Dashboard admin: estadísticas rápidas — alcance DASHBOARD_API.md
// Solo secciones documentadas: usuarios, feature limits, documentos.

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { listUsers } from '@/app/lib/api';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ADMIN_STALE_TIME } from '@/app/lib/queries/staleTimes';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // ---- useQuery for dashboard stats ----
  const {
    data: stats,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => listUsers({ limit: 100 }),
    staleTime: ADMIN_STALE_TIME,
    select: (response): Stats => {
      const users = response.users || [];
      return {
        totalUsers: response.total || users.length,
        activeUsers: users.filter((u) => u.status === 'active').length,
        blockedUsers: users.filter((u) => u.status === 'disabled').length,
        adminUsers: users.filter((u) => u.role_name === 'admin').length,
      };
    },
  });

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5 text-neutral-500" />,
      href: '/admin/users',
    },
    {
      title: 'Usuarios Activos',
      value: stats?.activeUsers ?? 0,
      icon: <UserCheck className="w-5 h-5 text-neutral-500" />,
      href: '/admin/users?status=active',
    },
    {
      title: 'Bloqueados',
      value: stats?.blockedUsers ?? 0,
      icon: <UserX className="w-5 h-5 text-neutral-500" />,
      href: '/admin/users?status=disabled',
    },
    {
      title: 'Administradores',
      value: stats?.adminUsers ?? 0,
      icon: <ShieldAlert className="w-5 h-5 text-neutral-500" />,
      href: '/admin/users?role=admin',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 font-display tracking-tight">
          Dashboard
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Bienvenido,{' '}
          <span className="font-medium text-neutral-700">
            {user?.email || 'admin'}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {card.title}
              </p>
              <div className="p-2 bg-neutral-50 rounded-xl group-hover:bg-neutral-100 transition-colors">
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-semibold text-neutral-900 font-display tracking-tight">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-5">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all"
          >
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="font-medium text-neutral-700 text-sm">
              Gestionar Usuarios
            </span>
          </Link>
          <Link
            href="/admin/documentos"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all"
          >
            <FileCheck className="w-4 h-4 text-neutral-500" />
            <span className="font-medium text-neutral-700 text-sm">
              Verificar Documentos
            </span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-neutral-500" />
            <span className="font-medium text-neutral-700 text-sm">
              Feature Limits
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
