'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  File,
} from 'lucide-react';
import type { Document, DocumentType } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function handleDownload(docId: string, fileName: string) {
  try {
    const res = await fetch(`${API_URL}/v1/user/documents/${docId}/download`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Silent fail — user can retry
  }
}

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
  documents: Document[];
  documentTypes: DocumentType[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof File; className: string }> = {
  uploaded: { label: 'Recibido', icon: File, className: 'bg-paper-container text-ink-muted' },
  validating: { label: 'Validando', icon: Loader, className: 'bg-olive-container text-olive' },
  sanitizing: { label: 'Limpiando', icon: Loader, className: 'bg-olive-container text-olive' },
  ocr_processing: { label: 'Procesando', icon: Loader, className: 'bg-olive-container text-olive' },
  completed: { label: 'Completado', icon: CheckCircle, className: 'bg-success-container text-success' },
  rejected: { label: 'Rechazado', icon: XCircle, className: 'bg-error-container text-error' },
  failed: { label: 'Fallido', icon: AlertTriangle, className: 'bg-error-container text-error' },
};

function getStatusKey(ocrStatus: string): string {
  // Map sub-states under "processing" to specific keys
  if (ocrStatus === 'processing') return 'ocr_processing';
  // Map old-style "validating"/"sanitizing" as standalone states
  return ocrStatus in STATUS_CONFIG ? ocrStatus : 'uploaded';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDocumentTypeLabel(docType: string | null, catalog: DocumentType[]): string {
  if (!docType) return 'Sin clasificar';
  const found = catalog.find((t) => t.code === docType);
  return found?.name ?? docType;
}

function StatusBadgeIcon({ statusKey, spinning }: { statusKey: string; spinning: boolean }) {
  const cls = spinning ? 'animate-spin' : '';
  switch (statusKey) {
    case 'completed':
      return <CheckCircle size={12} className={cls} />;
    case 'rejected':
      return <XCircle size={12} className={cls} />;
    case 'failed':
      return <AlertTriangle size={12} className={cls} />;
    case 'uploaded':
      return <File size={12} className={cls} />;
    default:
      return <Loader size={12} className={cls} />;
  }
}

export function DocumentCard({ document: doc, onDelete, documentTypes }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusKey = getStatusKey(doc.ocr_status);
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.uploaded;
  const canDownload = doc.ocr_status === 'completed' || doc.ocr_status === 'rejected';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(doc.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-xl border border-paper-outline bg-paper-dim overflow-hidden">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-paper-container/50 transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-lg bg-paper-container flex items-center justify-center">
            <FileText size={20} className="text-ink-muted" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{doc.file_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            {getDocumentTypeLabel(doc.document_type, documentTypes)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
            >
              <StatusBadgeIcon statusKey={statusKey} spinning={['validating', 'sanitizing', 'ocr_processing'].includes(statusKey)} />
              {status.label}
            </span>
            {doc.ocr_confidence != null && doc.ocr_status === 'completed' && (
              <span className="text-xs text-ink-faint">
                {Math.round(doc.ocr_confidence * 100)}% confianza
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-ink-faint">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-paper-outline pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {doc.mime_type && (
              <div>
                <span className="text-ink-faint">Tipo:</span>{' '}
                <span className="text-ink-muted">{doc.mime_type}</span>
              </div>
            )}
            {doc.file_size != null && (
              <div>
                <span className="text-ink-faint">Tamaño:</span>{' '}
                <span className="text-ink-muted">
                  {doc.file_size > 1024 * 1024
                    ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.round(doc.file_size / 1024)} KB`}
                </span>
              </div>
            )}
            <div>
              <span className="text-ink-faint">Creado:</span>{' '}
              <span className="text-ink-muted">{formatDate(doc.created_at)}</span>
            </div>
            {doc.updated_at && (
              <div>
                <span className="text-ink-faint">Actualizado:</span>{' '}
                <span className="text-ink-muted">{formatDate(doc.updated_at)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {canDownload && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(doc.id, doc.file_name);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-olive-container text-olive hover:bg-olive-container/80 transition-colors cursor-pointer"
              >
                <Download size={14} />
                Descargar
              </button>
            )}

            {!confirmDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-error-container text-error hover:bg-error-container/80 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-error text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Eliminando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-paper-outline bg-paper text-ink-muted hover:bg-paper-container transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
