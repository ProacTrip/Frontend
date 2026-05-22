'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, Loader, Calendar, Shield, Hash, Globe } from 'lucide-react';
import { getDocument } from '@/app/lib/api/documents';
import { useDocumentSSE } from '@/hooks/useDocumentSSE';
import type { DocumentDetail, DocumentType, DocumentEvent } from '@/app/lib/types/document';

// ==========================================
// HELPERS
// ==========================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'uploaded': return 'Subido';
    case 'processing': return 'Procesando';
    case 'completed': return 'Completado';
    case 'rejected': return 'Rechazado';
    case 'failed': return 'Falló';
    default: return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'processing': return 'bg-amber-100 text-amber-800';
    case 'failed':
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// ==========================================
// COMPONENT
// ==========================================

interface DocumentDetailModalProps {
  documentId: string;
  types: DocumentType[];
  onClose: () => void;
  onDownload: (id: string) => void;
  onStatusUpdate?: (event: DocumentEvent, docId: string) => void;
}

export default function DocumentDetailModal({
  documentId,
  types,
  onClose,
  onDownload,
  onStatusUpdate,
}: DocumentDetailModalProps) {
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch document detail on mount
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag set before async fetch
    setIsLoading(true);
    setError(null);

    getDocument(documentId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el documento');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // SSE tracking for live status updates
  useDocumentSSE({
    documentId,
    onEvent: (event) => {
      if (detail) {
        setDetail({
          ...detail,
          ocr_status: event.status,
          ocr_confidence: event.ocr_confidence ?? detail.ocr_confidence,
          failure_reason: event.failure_reason ?? detail.failure_reason,
        });
      }
      if (onStatusUpdate) {
        onStatusUpdate(event, documentId);
      }
    },
  });

  const typeName = detail
    ? types.find((t) => t.code === detail.document_type)?.name || detail.document_type
    : '';

  const isDownloadDisabled =
    detail?.ocr_status === 'uploaded' || detail?.ocr_status === 'processing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 truncate max-w-[300px]">
                {detail?.file_name || 'Cargando...'}
              </h3>
              <p className="text-xs text-gray-500">{typeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#FF6B6B]" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cerrar
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(detail.ocr_status)}`}
                >
                  {detail.ocr_status === 'processing' && (
                    <Loader className="w-3 h-3 animate-spin" />
                  )}
                  {statusLabel(detail.ocr_status)}
                </span>
                {detail.ocr_confidence !== null && (
                  <span className="text-xs text-gray-500">
                    Precisión: {Math.round(detail.ocr_confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>Tamaño: {formatBytes(detail.file_size)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>
                    Creado: {new Date(detail.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                {detail.document_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>Nº {detail.document_number}</span>
                  </div>
                )}
                {detail.issuing_country && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{detail.issuing_country}</span>
                  </div>
                )}
                {detail.is_verified && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>Verificado</span>
                  </div>
                )}
              </div>

              {/* Valid from/until */}
              {(detail.valid_from || detail.valid_until) && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  {detail.valid_from && (
                    <p>
                      Válido desde:{' '}
                      <span className="font-medium">
                        {new Date(detail.valid_from).toLocaleDateString('es-AR')}
                      </span>
                    </p>
                  )}
                  {detail.valid_until && (
                    <p>
                      Válido hasta:{' '}
                      <span className="font-medium">
                        {new Date(detail.valid_until).toLocaleDateString('es-AR')}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Extracted Data (OCR) */}
              {detail.extracted_data && Object.keys(detail.extracted_data).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Datos Extraídos
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(detail.extracted_data).map(([key, value]) => (
                          <tr key={key} className="border-b border-blue-100 last:border-0">
                            <td className="py-1.5 pr-3 text-gray-500 font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td className="py-1.5 text-gray-800">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Failure reason */}
              {detail.failure_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <p className="font-medium">Motivo del fallo:</p>
                  <p>{detail.failure_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onDownload(documentId)}
                  disabled={isDownloadDisabled}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF6B6B] rounded-lg hover:bg-[#ff5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadDisabled ? 'En proceso...' : 'Descargar'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
