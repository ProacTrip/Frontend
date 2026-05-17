'use client';

import { useState, useEffect } from 'react';
import { Filter, Loader } from 'lucide-react';
import { listDocumentTypes } from '@/app/lib/api/documents';
import type { DocumentType } from '@/app/lib/types/document';

// ==========================================
// COMPONENT
// ==========================================

export interface DocumentFiltersValues {
  status: string | null; // null = "Todos"
  document_type: string | null; // null = "Todos los tipos"
}

interface DocumentFiltersProps {
  onFilterChange: (filters: DocumentFiltersValues) => void;
}

const STATUS_TABS = [
  { value: null, label: 'Todos' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
] as const;

export default function DocumentFilters({ onFilterChange }: DocumentFiltersProps) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState(false);

  // Load document types on mount
  useEffect(() => {
    let cancelled = false;
    setTypesLoading(true);
    setTypesError(false);

    listDocumentTypes()
      .then((result) => {
        if (!cancelled) {
          setTypes(result);
          setTypesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTypesError(true);
          setTypesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = (status: string | null) => {
    setActiveStatus(status);
    onFilterChange({ status, document_type: activeType });
  };

  const handleTypeChange = (type: string | null) => {
    setActiveType(type);
    onFilterChange({ status: activeStatus, document_type: type });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleStatusChange(tab.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all
              ${
                activeStatus === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type Dropdown */}
      <div className="relative flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {typesLoading ? (
          <Loader className="w-4 h-4 animate-spin text-gray-400" />
        ) : typesError ? (
          <span className="text-xs text-red-500">Error al cargar tipos</span>
        ) : (
          <select
            value={activeType || ''}
            onChange={(e) => handleTypeChange(e.target.value || null)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent"
            aria-label="Filtrar por tipo de documento"
          >
            <option value="">Todos los tipos</option>
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
