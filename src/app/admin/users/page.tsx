// app/admin/users/page.tsx
// Lista usuarios con paginación por cursor y filtros combinables
// Dashboard API: GET /v1/dashboard/users

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { listUsers } from '@/app/lib/api';
import type { UserAdmin, UserListMeta } from '@/app/lib/types/admin';
import DataTable, { Column } from '@/components/admin/DataTable';

type UserStatus = 'active' | 'disabled' | 'suspended' | 'pending_verification' | '';
type UserRole = 'user' | 'staff' | 'admin' | 'client' | '';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [meta, setMeta] = useState<UserListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<UserStatus>(
    (searchParams.get('status') as UserStatus) || ''
  );
  const [roleFilter, setRoleFilter] = useState<UserRole>(
    (searchParams.get('role') as UserRole) || ''
  );
  const [createdBefore, setCreatedBefore] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [limit] = useState(10);

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
      if (createdBefore) params.created_before = createdBefore;
      if (createdAfter) params.created_after = createdAfter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

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
  }, [limit, statusFilter, roleFilter, debouncedSearch, createdBefore, createdAfter]);

  useEffect(() => {
    loadUsers(cursorStack[currentPage] ?? '');
  }, [loadUsers, currentPage, cursorStack]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (searchQuery !== debouncedSearch) {
      setSearchLoading(true);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCursorStack(['']);
      setCurrentPage(0);
      setSearchLoading(false);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    setCursorStack(['']);
    setCurrentPage(0);
  }, [statusFilter, roleFilter, createdBefore, createdAfter]);

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
    const configs: Record<string, { text: string; icon: React.ReactNode }> = {
      active: {
        text: 'Activo',
        icon: <UserCheck className="w-3 h-3" />,
      },
      pending_verification: {
        text: 'Pendiente',
        icon: <Clock className="w-3 h-3" />,
      },
      suspended: {
        text: 'Suspendido',
        icon: <UserX className="w-3 h-3" />,
      },
      disabled: {
        text: 'Deshabilitado',
        icon: <UserX className="w-3 h-3" />,
      },
    };

    const config = configs[status] ?? {
      text: status,
      icon: null,
    };

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (roleName: string) => {
    const isAdmin = roleName === 'admin';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isAdmin ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
      }`}>
        {isAdmin && <Shield className="w-3 h-3" />}
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
          <span className="font-medium text-neutral-900">{row.email}</span>
          <span className="text-xs text-neutral-400 font-mono">{row.id.slice(0, 8)}...</span>
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
        <span className={row.email_verified ? 'text-neutral-600 text-sm' : 'text-neutral-400 text-sm'}>
          {row.email_verified ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      sortable: true,
      render: (row) => (
        <span className="text-neutral-400">
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 font-display tracking-tight">
            Usuarios
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
              className="pl-10 pr-8 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent appearance-none bg-white min-w-[170px] text-neutral-600"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="disabled">Deshabilitado</option>
              <option value="pending_verification">Pendiente</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole)}
              className="pl-10 pr-8 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent appearance-none bg-white min-w-[140px] text-neutral-600"
            >
              <option value="">Todos los roles</option>
              <option value="client">Cliente</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Date filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={createdAfter}
                onChange={(e) => setCreatedAfter(e.target.value)}
                title="Usuarios creados después de esta fecha (created_after)"
                className="pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent min-w-[160px] bg-white text-neutral-600"
              />
            </div>
            <span className="text-xs text-neutral-400 hidden xl:inline">—</span>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={createdBefore}
                onChange={(e) => setCreatedBefore(e.target.value)}
                title="Usuarios creados antes de esta fecha (created_before)"
                className="pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent min-w-[160px] bg-white text-neutral-600"
              />
            </div>
            <span
              className="text-xs text-neutral-400 cursor-help hidden 2xl:inline"
              title="Desde = created_after: usuarios creados DESPUÉS de esa fecha | Hasta = created_before: usuarios creados ANTES de esa fecha"
            >
              ?
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        total={users.length}
        loading={loading || searchLoading}
        paginationMode="cursor"
        hasNext={meta?.has_next ?? false}
        hasPrev={currentPage > 0}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        emptyMessage={
          searchQuery.trim()
            ? `No se encontraron usuarios con email "${searchQuery}"`
            : 'No hay usuarios disponibles'
        }
      />
    </div>
  );
}
