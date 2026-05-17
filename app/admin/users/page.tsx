// app/admin/users/page.tsx
// Lista usuarios con paginación por cursor y filtros combinables (Dashboard API)

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Shield, UserCheck, UserX, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { listUsers } from '@/app/lib/api';
import type { UserAdmin, UserListMeta } from '@/app/lib/types/admin';
import DataTable, { Column } from '@/components/admin/DataTable';

type UserStatus = 'active' | 'disabled' | 'suspended' | 'pending_verification' | '';
type UserRole = 'user' | 'staff' | 'admin' | 'client' | '';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('');
  const [limit] = useState(20);

  // Cursor stack: index 0 = primera página (cursor vacío), cada push es la siguiente
  const [cursorStack, setCursorStack] = useState<string[]>(['']);
  const [currentPage, setCurrentPage] = useState(0);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = useCallback(async (cursor: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit };
      if (cursor) params.cursor = cursor;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await listUsers(params);
      setUsers(response.users || []);
      setMeta(response.meta ?? null);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [limit, statusFilter, roleFilter, searchQuery]);

  // Cargar la página actual al montar o cuando cambian filtros/búsqueda
  useEffect(() => {
    loadUsers(cursorStack[currentPage] ?? '');
  }, [loadUsers, currentPage, cursorStack]);

  // Debounce búsqueda — resetea a primera página
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCursorStack(['']);
      setCurrentPage(0);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Resetear paginación al cambiar filtros
  useEffect(() => {
    setCursorStack(['']);
    setCurrentPage(0);
  }, [statusFilter, roleFilter]);

  const handleNextPage = () => {
    if (!meta?.next_cursor) return;
    const nextStack = [...cursorStack.slice(0, currentPage + 1), meta.next_cursor];
    setCursorStack(nextStack);
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage === 0) return;
    setCurrentPage(currentPage - 1);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      active: {
        text: 'Activo',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: <UserCheck className="w-3 h-3" />,
      },
      pending_verification: {
        text: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className="w-3 h-3" />,
      },
      suspended: {
        text: 'Suspendido',
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <UserX className="w-3 h-3" />,
      },
      disabled: {
        text: 'Deshabilitado',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: <UserX className="w-3 h-3" />,
      },
    };

    const config = configs[status] ?? {
      text: status,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: null,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (roleName: string) => {
    const configs: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      client: 'bg-gray-100 text-gray-600 border-gray-200',
      user: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${configs[roleName] ?? configs.user}`}>
        {roleName === 'admin' && <Shield className="w-3 h-3" />}
        {roleName === 'staff' && <UserCheck className="w-3 h-3" />}
        {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
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
      width: 'w-36',
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'role_name',
      header: 'Rol',
      width: 'w-28',
      sortable: true,
      render: (row) => getRoleBadge(row.role_name),
    },
    {
      key: 'email_verified',
      header: 'Verificado',
      width: 'w-24',
      render: (row) => (
        <span className={row.email_verified ? 'text-green-600 text-sm' : 'text-yellow-600 text-sm'}>
          {row.email_verified ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
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
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
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

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] focus:border-transparent appearance-none bg-white min-w-[170px]"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="disabled">Deshabilitado</option>
              <option value="pending_verification">Pendiente</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>

          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] focus:border-transparent appearance-none bg-white min-w-[140px]"
            >
              <option value="">Todos los roles</option>
              <option value="client">Cliente</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        total={users.length}
        loading={loading}
        limit={limit}
        offset={0}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        emptyMessage={
          searchQuery.trim()
            ? `No se encontraron usuarios con email "${searchQuery}"`
            : 'No hay usuarios disponibles'
        }
      />

      {/* Cursor pagination controls */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          Página {currentPage + 1}
          {meta && ` · ${users.length} resultado${users.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0 || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <button
            onClick={handleNextPage}
            disabled={!meta?.has_next || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
