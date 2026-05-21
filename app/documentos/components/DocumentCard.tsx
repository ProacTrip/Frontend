'use client';

import { useState } from 'react';
import { FileText, Trash2, Download, Loader, Eye } from 'lucide-react';
import type { DocumentListItem, DocumentType } from '@/app/lib/types/document';

// ==========================================
// HELPERS
// ==========================================

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'processing':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'failed':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'Subido';
    case 'processing':
      return 'Procesando';
    case 'completed':
      return 'Completado';
    case 'rejected':
      return 'Rechazado';
    case 'failed':
      return 'Falló';
    default:
      return status;
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  return new Date(dateStr).toLocaleDateString('es-AR');
}

// ==========================================
// COMPONENT
// ==========================================

interface DocumentCardProps {
  doc: DocumentListItem;
  types: DocumentType[];
  deletingId: string | null;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onClick: (doc: DocumentListItem) => void;
}

export default function DocumentCard({
  doc,
  types,
  deletingId,
  onDelete,
  onDownload,
  onClick,
}: DocumentCardProps) {
  const isProcessing = doc.ocr_status === 'processing';
  const isDeleting = deletingId === doc.id;
  const isDownloadDisabled = doc.ocr_status === 'uploaded' || doc.ocr_status === 'processing';

  // Look up the document type name from cached types
  const typeName =
    types.find((t) => t.code === doc.document_type)?.name || doc.document_type;

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-md border border-gray-100 
        hover:shadow-lg transition-shadow cursor-pointer overflow-hidden
        ${isProcessing ? 'animate-pulse' : ''}
      `}
      onClick={() => onClick(doc)}
    >
      {/* Header: file icon + name */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 truncate" title={doc.file_name}>
                {doc.file_name}
              </h3>
              <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {typeName}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick(doc); // detail modal
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(doc.id);
              }}
              disabled={isDownloadDisabled}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isDownloadDisabled ? 'Documento en proceso' : 'Descargar'}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              {isDeleting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer: status badge + confidence + date */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* OCR Status Badge */}
          <span
            className={`
              inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
              ${statusColor(doc.ocr_status)}
            `}
          >
            {isProcessing && <Loader className="w-3 h-3 animate-spin" />}
            {statusLabel(doc.ocr_status)}
          </span>

          {/* Confidence Bar (only when completed with confidence) */}
          {doc.ocr_status === 'completed' && doc.ocr_confidence !== null && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.round(doc.ocr_confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(doc.ocr_confidence * 100)}%
              </span>
            </div>
          )}
        </div>

        <span className="text-xs text-gray-400" title={doc.created_at}>
          {timeAgo(doc.created_at)}
        </span>
      </div>
    </div>
  );
}
