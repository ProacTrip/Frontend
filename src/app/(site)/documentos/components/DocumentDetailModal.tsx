'use client';

import { useRef } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, FileText, Download, Loader, Calendar, Shield, Hash, Globe } from 'lucide-react';
import { useDocumentDetail } from '@/hooks/useDocumentDetail';
import type { DocumentDetail, DocumentType, DocumentEvent } from '@/app/lib/types/document';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'queued': return 'En cola';                           // ← renamed from 'uploaded'
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
    case 'queued':
    case 'processing': return 'bg-amber-100 text-amber-800';
    case 'failed':
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-neutral-100 text-neutral-600';
  }
}

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
  const detailRef = useRef<DocumentDetail | undefined>(undefined);

  const {
    data: detail,
    isPending: isLoading,
    error,
  } = useDocumentDetail(documentId, {
    // Poll every 5s while the document is still processing (OCR).
    // Uses a ref closure so the callback always reads the latest state.
    refetchInterval: () => detailRef.current?.ocr_status === 'processing' ? 5000 : false,
  });

  // Keep ref in sync so the polling callback above always sees the current data
  detailRef.current = detail;

  const typeName = detail ? types.find((t) => t.code === detail.document_type)?.name || detail.document_type : '';
  const isDownloadDisabled = detail?.ocr_status === 'queued' || detail?.ocr_status === 'processing';
  const ed = detail?.extracted_data;  // valid_from, valid_until, document_number, issuing_country live inside extracted_data now

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-100 rounded-t-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <DialogTitle className="font-semibold text-neutral-900 truncate max-w-[300px]">
                  {detail?.file_name || 'Cargando...'}
                </DialogTitle>
                <p className="text-xs text-neutral-500">{typeName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-neutral-900" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-sm">{error}</p>
                <button onClick={onClose} className="mt-3 text-sm text-neutral-500 hover:text-neutral-700 underline">Cerrar</button>
              </div>
            ) : detail ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(detail.ocr_status)}`}>
                    {detail.ocr_status === 'processing' && <Loader className="w-3 h-3 animate-spin" />}
                    {statusLabel(detail.ocr_status)}
                  </span>
                  {detail.ocr_confidence !== null && (
                    <span className="text-xs text-neutral-500">Precisión: {Math.round(detail.ocr_confidence * 100)}%</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600"><FileText className="w-4 h-4 flex-shrink-0 text-neutral-400" /><span>Tamaño: {formatBytes(detail.file_size)}</span></div>
                  <div className="flex items-center gap-2 text-neutral-600"><Calendar className="w-4 h-4 flex-shrink-0 text-neutral-400" /><span>Creado: {new Date(detail.created_at).toLocaleDateString('es-AR')}</span></div>
                  {ed?.document_number != null && typeof ed.document_number !== 'object' && <div className="flex items-center gap-2 text-neutral-600"><Hash className="w-4 h-4 flex-shrink-0 text-neutral-400" /><span>Nº {String(ed.document_number)}</span></div>}
                  {ed?.issuing_country != null && typeof ed.issuing_country !== 'object' && <div className="flex items-center gap-2 text-neutral-600"><Globe className="w-4 h-4 flex-shrink-0 text-neutral-400" /><span>{String(ed.issuing_country)}</span></div>}
                  {detail.verification_status === 'verified' && <div className="flex items-center gap-2 text-green-600"><Shield className="w-4 h-4 flex-shrink-0" /><span>Verificado</span></div>}
                </div>

                {(ed?.valid_from != null || ed?.valid_until != null) && (
                  <div className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-600">
                    {ed.valid_from != null && typeof ed.valid_from !== 'object' && <p>Válido desde: <span className="font-medium">{new Date(String(ed.valid_from)).toLocaleDateString('es-AR')}</span></p>}
                    {ed.valid_until != null && typeof ed.valid_until !== 'object' && <p>Válido hasta: <span className="font-medium">{new Date(String(ed.valid_until)).toLocaleDateString('es-AR')}</span></p>}
                  </div>
                )}

                {detail.extracted_data && Object.keys(detail.extracted_data).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-800 mb-2">Datos Extraídos</h4>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(detail.extracted_data).map(([key, value]) => (
                            <tr key={key} className="border-b border-blue-100 last:border-0">
                              <td className="py-1.5 pr-3 text-neutral-500 font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                              <td className="py-1.5 text-neutral-800">{typeof value === 'string' ? value : JSON.stringify(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detail.failure_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    <p className="font-medium">Motivo del fallo:</p>
                    <p>{detail.failure_reason}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onDownload(documentId)}
                    disabled={isDownloadDisabled}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloadDisabled ? 'En proceso...' : 'Descargar'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
