// app/admin/audit/page.tsx
// Auditoría: historial completo con filtros + SSE en tiempo real (CORREGIDO)

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ClipboardList, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Shield,
  User,
  Calendar,
  Wifi,
  WifiOff
} from 'lucide-react';
import { queryAuditLogs } from '@/app/lib/api';
import type { AuditLog } from '@/app/lib/types/admin';
import DataTable, { Column } from '@/components/admin/DataTable';

type FilterState = {
  event_type: string;
  event_source: string;
  severity: string;
  outcome: string;
  date_from: string;
  date_to: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    event_type: '',
    event_source: '',
    severity: '',
    outcome: '',
    date_from: '',
    date_to: '',
  });

  // Refs para leer estado actual dentro de callbacks SSE sin stale closure
  const filtersRef = useRef(filters);
  const hasActiveFiltersRef = useRef(false);
  
  useEffect(() => {
    filtersRef.current = filters;
    hasActiveFiltersRef.current = Object.values(filters).some(v => v !== '');
  }, [filters]);

  const sseRef = useRef<EventSource | null>(null);

  // Cargar logs iniciales
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset };
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.event_source) params.event_source = filters.event_source;
      if (filters.severity) params.severity = filters.severity;
      if (filters.outcome) params.outcome = filters.outcome;
      if (filters.date_from) params.date_from = new Date(filters.date_from).toISOString();
      if (filters.date_to) params.date_to = new Date(filters.date_to + 'T23:59:59').toISOString();

      const response = await queryAuditLogs(params);
      setLogs(response.logs || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error cargando audit logs:', error);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // SSE: conexión en tiempo real (CORREGIDO)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const sse = new EventSource(`/api/v1/management/audit-logs/events?token=${token}`);
    sseRef.current = sse;

    sse.onopen = () => setSseConnected(true);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'audit_entry') {
          const currentFilters = filtersRef.current;
          const hasFilters = hasActiveFiltersRef.current;

          // Solo añadir si coincide con filtros activos
          if (hasFilters) {
            if (currentFilters.event_type && data.event_type !== currentFilters.event_type) return;
            if (currentFilters.event_source && data.event_source !== currentFilters.event_source) return;
            if (currentFilters.severity && data.severity !== currentFilters.severity) return;
            if (currentFilters.outcome && data.outcome !== currentFilters.outcome) return;
          }

          setLogs((prev) => [data, ...prev].slice(0, 100));
        }
      } catch (e) {
        // keepalive o heartbeat, ignorar
      }
    };

    sse.onerror = () => {
      setSseConnected(false);
      // EventSource reconecta automáticamente
    };

    return () => {
      sse.close();
      setSseConnected(false);
    };
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const clearFilters = () => {
    setFilters({
      event_type: '',
      event_source: '',
      severity: '',
      outcome: '',
      date_from: '',
      date_to: '',
    });
    setOffset(0);
  };

  const getSeverityBadge = (severity: string) => {
    const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      info: { 
        text: 'Info', 
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Activity className="w-3 h-3" />
      },
      warning: { 
        text: 'Warning', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <AlertTriangle className="w-3 h-3" />
      },
      critical: { 
        text: 'Critical', 
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: <Shield className="w-3 h-3" />
      },
    };
    const config = configs[severity] || configs.info;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getOutcomeBadge = (outcome: string) => {
    return outcome === 'success' ? (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Éxito
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
        <XCircle className="w-3.5 h-3.5" />
        Fallo
      </span>
    );
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      http_request: 'HTTP Request',
      user_registered: 'Registro',
      user_login: 'Login',
      user_logout: 'Logout',
      password_changed: 'Cambio pass',
      mfa_setup: 'MFA Setup',
      mfa_verified: 'MFA OK',
      mfa_disabled: 'MFA Off',
      role_assigned: 'Rol asignado',
      tokens_revoked: 'Tokens revocados',
      user_blocked: 'Bloqueo',
      user_unblocked: 'Desbloqueo',
      permission_granted: 'Permiso +',
      permission_revoked: 'Permiso -',
    };
    return labels[type] || type;
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Fecha',
      width: 'w-40',
      render: (row) => (
        <span className="text-xs text-gray-500 font-mono">
          {new Date(row.created_at).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'event_type',
      header: 'Evento',
      width: 'w-36',
      render: (row) => (
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {getEventTypeLabel(row.event_type)}
        </span>
      ),
    },
    {
      key: 'event_source',
      header: 'Origen',
      width: 'w-32',
      render: (row) => (
        <span className="text-xs text-gray-500 capitalize">{row.event_source.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'actor_id',
      header: 'Actor',
      width: 'w-40',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 font-mono truncate max-w-[120px]">
            {row.actor_id ? row.actor_id.slice(0, 8) + '...' : 'Sistema'}
          </span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severidad',
      width: 'w-28',
      render: (row) => getSeverityBadge(row.severity),
    },
    {
      key: 'outcome',
      header: 'Resultado',
      width: 'w-24',
      render: (row) => getOutcomeBadge(row.outcome),
    },
    {
      key: 'payload',
      header: 'Detalle',
      render: (row) => (
        <span className="text-xs text-gray-500 truncate max-w-[200px] block">
          {row.payload?.action || row.payload?.resource || JSON.stringify(row.payload).slice(0, 40)}
        </span>
      ),
    },
  ];

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#c54141]" />
            Auditoría
          </h1>
          <p className="text-gray-500 text-sm mt-1">Historial de acciones del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {sseConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Wifi className="w-3.5 h-3.5" />
              En vivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              Reconectando...
            </span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#c54141] hover:underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            value={filters.event_type}
            onChange={(e) => handleFilterChange('event_type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
          >
            <option value="">Todos los eventos</option>
            <option value="http_request">HTTP Request</option>
            <option value="user_registered">Registro</option>
            <option value="user_login">Login</option>
            <option value="user_logout">Logout</option>
            <option value="password_changed">Cambio pass</option>
            <option value="mfa_setup">MFA Setup</option>
            <option value="role_assigned">Rol asignado</option>
            <option value="user_blocked">Bloqueo</option>
            <option value="user_unblocked">Desbloqueo</option>
            <option value="permission_granted">Permiso +</option>
            <option value="permission_revoked">Permiso -</option>
          </select>

          <select
            value={filters.event_source}
            onChange={(e) => handleFilterChange('event_source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
          >
            <option value="">Todas las fuentes</option>
            <option value="auth_api">Auth API</option>
            <option value="management_api">Management API</option>
            <option value="domain_event">Domain Event</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
          >
            <option value="">Todas las severidades</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={filters.outcome}
            onChange={(e) => handleFilterChange('outcome', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141] bg-white"
          >
            <option value="">Todos los resultados</option>
            <option value="success">Éxito</option>
            <option value="failure">Fallo</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              placeholder="Desde"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={logs}
        total={total}
        loading={loading}
        limit={limit}
        offset={offset}
        onPageChange={setOffset}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setOffset(0);
        }}
        emptyMessage="No se encontraron registros de auditoría"
      />
    </div>
  );
}