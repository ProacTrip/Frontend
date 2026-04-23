// app/admin/users/page.tsx
//Utilidad: Lista usuarios: tabla + buscar por email/filtrar por rol y estado

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Shield, UserCheck, UserX, Clock } from 'lucide-react';
import { listUsers } from '@/app/lib/api';
import type { UserAdmin } from '@/app/lib/types/admin';
import DataTable, { Column } from '@/components/admin/DataTable';

type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'blocked' | '';
type UserRole = 'user' | 'staff' | 'admin' | '';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset };
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      // ✅ BÚSQUEDA SERVERSIDE: delegamos al backend el filtro por email
      if (searchQuery.trim()) params.email = searchQuery.trim();

      const response = await listUsers(params);
      setUsers(response.users || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, statusFilter, roleFilter, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounce para la búsqueda: no saturar al backend con cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0); // Reset a página 1 al buscar
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      active: { 
        text: 'Activo', 
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: <UserCheck className="w-3 h-3" />
      },
      pending_verification: { 
        text: 'Pendiente', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
      },
      suspended: { 
        text: 'Suspendido', 
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <UserX className="w-3 h-3" />
      },
      blocked: { 
        text: 'Bloqueado', 
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: <UserX className="w-3 h-3" />
      },
    };

    const config = configs[status] || { 
      text: status, 
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: null 
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${configs[role] || configs.user}`}>
        {role === 'admin' && <Shield className="w-3 h-3" />}
        {role === 'staff' && <UserCheck className="w-3 h-3" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const columns: Column<UserAdmin>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.email}</span>
          <span className="text-xs text-gray-400">{row.id.slice(0, 8)}...</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: 'w-32',
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'role',
      header: 'Rol',
      width: 'w-28',
      sortable: true,
      render: (row) => getRoleBadge(row.role),
    },
    {
      key: 'created_at',
      header: 'Fecha registro',
      sortable: true,
      render: (row) => (
        <span className="text-gray-500">
          {new Date(row.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los usuarios del sistema</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search - ahora con debounce y búsqueda serverside */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus);
                setOffset(0);
              }}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] focus:border-transparent appearance-none bg-white min-w-[160px]"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="pending_verification">Pendiente</option>
              <option value="suspended">Suspendido</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole);
                setOffset(0);
              }}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] focus:border-transparent appearance-none bg-white min-w-[140px]"
            >
              <option value="">Todos los roles</option>
              <option value="user">Usuario</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - ahora usa users directamente, sin filtrado en cliente */}
      <DataTable
        columns={columns}
        data={users}
        total={total}
        loading={loading}
        limit={limit}
        offset={offset}
        onPageChange={setOffset}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setOffset(0);
        }}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        emptyMessage={searchQuery.trim() ? `No se encontraron usuarios con email "${searchQuery}"` : 'No hay usuarios disponibles'}
      />
    </div>
  );
}