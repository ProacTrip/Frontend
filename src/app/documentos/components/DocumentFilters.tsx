'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import type { DocumentType } from '@/app/lib/types/document';

// ==========================================
// COMPONENT
// ==========================================

export interface DocumentFiltersValues {
  status: string | null; // null = "Todos"
  document_type: string | null; // null = "Todos los tipos"
}

interface DocumentFiltersProps {
  /** Document types loaded by the parent page (already cached via useQuery) */
  types: DocumentType[];
  onFilterChange: (filters: DocumentFiltersValues) => void;
}

const STATUS_TABS = [
  { value: null, label: 'Todos' },
  { value: 'queued', label: 'En cola' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'failed', label: 'Fallidos' },
] as const;

export default function DocumentFilters({ types, onFilterChange }: DocumentFiltersProps) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

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

      {/* Type Dropdown — types loaded by parent via useQuery */}
      <div className="relative flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={activeType || ''}
          onChange={(e) => handleTypeChange(e.target.value || null)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[--color-brand-500] focus:border-transparent"
          aria-label="Filtrar por tipo de documento"
        >
          <option value="">Todos los tipos</option>
          {types.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
