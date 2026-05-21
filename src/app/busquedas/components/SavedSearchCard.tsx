'use client';

import { Plane, Building, MapPin, Edit, Trash2, Loader, Bell, BellOff, Clock } from 'lucide-react';
import type { SavedSearch } from '@/app/lib/types/saved-search';

// ==========================================
// HELPERS
// ==========================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parametersSummary(params: Record<string, unknown>): string {
  const parts: string[] = [];

  // Origin → Destination
  if (params.origin || params.destination) {
    const from = params.origin
      ? String(params.origin).toUpperCase()
      : '?';
    const to = params.destination
      ? String(params.destination).toUpperCase()
      : '?';
    parts.push(`${from} → ${to}`);
  }

  // Dates
  if (params.departure_date || params.check_in) {
    const dateStr = (params.departure_date || params.check_in) as string;
    parts.push(new Date(dateStr).toLocaleDateString('es-AR'));
  }

  // PAX
  if (params.adults) {
    const adults = Number(params.adults);
    const children = params.children ? Number(params.children) : 0;
    const infants = params.infants ? Number(params.infants) : 0;
    const pax = adults + children + infants;
    parts.push(`${pax} pax`);
  }

  if (parts.length === 0) {
    // Fallback: show first 3 parameter keys
    parts.push(...Object.keys(params).slice(0, 3).map((k) => `${k}: ${params[k]}`));
  }

  return parts.join(' · ');
}

function inferIcon(params: Record<string, unknown>): React.ReactNode {
  if (params.origin || params.destination) {
    return <Plane className="w-5 h-5 text-[#FF6B6B]" />;
  }
  if (params.check_in || params.check_out) {
    return <Building className="w-5 h-5 text-[#FF6B6B]" />;
  }
  return <MapPin className="w-5 h-5 text-[#FF6B6B]" />;
}

// ==========================================
// COMPONENT
// ==========================================

interface SavedSearchCardProps {
  search: SavedSearch;
  isTogglingAlert: boolean;
  onEdit: (search: SavedSearch) => void;
  onDelete: (search: SavedSearch) => void;
  onToggleAlert: (id: string, enabled: boolean) => void;
}

export default function SavedSearchCard({
  search,
  isTogglingAlert,
  onEdit,
  onDelete,
  onToggleAlert,
}: SavedSearchCardProps) {
  const summary = parametersSummary(search.parameters);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Header: icon + name + actions */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              {inferIcon(search.parameters)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">
                {search.name || 'Búsqueda sin nombre'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate" title={summary}>
                {summary}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(search)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(search)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer: alert toggle + last executed + result count */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Price Alert Toggle */}
          <button
            onClick={() => onToggleAlert(search.id, !search.alert_enabled)}
            disabled={isTogglingAlert}
            className={`
              inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
              ${search.alert_enabled
                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={search.alert_enabled ? 'Alerta activada' : 'Alerta desactivada'}
          >
            {isTogglingAlert ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : search.alert_enabled ? (
              <Bell className="w-3 h-3" />
            ) : (
              <BellOff className="w-3 h-3" />
            )}
            {search.alert_enabled ? 'Alerta ON' : 'Alerta OFF'}
          </button>

          {/* Result count badge */}
          {search.result_count > 0 && (
            <span className="text-xs text-gray-500 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {search.result_count} resultado{search.result_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Last executed */}
        <div
          className="flex items-center gap-1 text-xs text-gray-400"
          title={search.last_executed_at ? formatDate(search.last_executed_at) : 'Nunca ejecutada'}
        >
          <Clock className="w-3 h-3" />
          <span>
            {search.last_executed_at
              ? formatDate(search.last_executed_at)
              : 'Sin ejecutar'}
          </span>
        </div>
      </div>
    </div>
  );
}
