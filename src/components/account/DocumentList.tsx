'use client';

import { useState, useMemo } from 'react';
import { SearchX } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import type { Document, DocumentType } from '@/lib/api/types';

interface DocumentListProps {
  documents: Document[];
  documentTypes: DocumentType[];
  onDelete: (id: string) => Promise<void>;
}

type StatusFilter = 'all' | 'uploaded' | 'processing' | 'completed' | 'rejected' | 'failed';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'uploaded', label: 'Recibidos' },
  { value: 'processing', label: 'En proceso' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'failed', label: 'Fallidos' },
];

export function DocumentList({ documents, documentTypes, onDelete }: DocumentListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Status filter
      if (statusFilter !== 'all') {
        // Map processing sub-states (validating, sanitizing, ocr_processing) to "processing"
        const normalizedStatus = ['validating', 'sanitizing', 'ocr_processing'].includes(doc.ocr_status)
          ? 'processing'
          : doc.ocr_status;
        if (normalizedStatus !== statusFilter) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [documents, statusFilter, typeFilter]);

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-paper-outline bg-paper-dim p-8 text-center space-y-3">
        <SearchX size={40} className="mx-auto text-ink-faint" />
        <div>
          <p className="text-ink font-medium">No tenés documentos cargados</p>
          <p className="text-ink-muted text-sm mt-1">
            Subí tu pasaporte, visas, certificados de vacunación y más para tenerlos siempre a mano.
          </p>
        </div>
      </div>
    );
  }

  // Get unique document types from catalog (only those present in documents)
  const usedTypeCodes = [...new Set(documents.map((d) => d.document_type).filter(Boolean))];
  const typeOptions = usedTypeCodes.map((code) => {
    const found = documentTypes.find((t) => t.code === code);
    return { value: code!, label: found?.name ?? code! };
  });

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === opt.value
                  ? 'bg-coral text-white'
                  : 'bg-paper-container text-ink-muted hover:bg-paper-outline'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Type dropdown */}
        {typeOptions.length > 0 && (
          <div className="sm:ml-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-medium rounded-full px-3 py-1.5 bg-paper-container text-ink-muted border-0 outline-none focus:ring-2 focus:ring-coral/30 cursor-pointer appearance-none"
            >
              <option value="all">Todos los tipos</option>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      {filteredDocuments.length !== documents.length && (
        <p className="text-xs text-ink-faint">
          Mostrando {filteredDocuments.length} de {documents.length} documento{documents.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Grid ── */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 text-center">
          <p className="text-ink-muted text-sm">No hay documentos que coincidan con los filtros.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="mt-2 text-xs font-medium text-coral hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={onDelete}
              documents={documents}
              documentTypes={documentTypes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
