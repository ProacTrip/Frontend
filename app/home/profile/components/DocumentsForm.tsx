'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Trash2, Loader2, AlertCircle, File } from 'lucide-react';
import {
  listDocuments,
  getDocumentTypes,
  uploadDocument,
  deleteDocument,
} from '@/app/lib/api';
import type { Document, DocumentType_ } from '@/app/lib/types/user';
import { useSSE } from '@/hooks/useSSE';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const STATUS_COLORS: Record<string, string> = {
  uploading: 'bg-paper-outline text-ink-muted',
  uploaded: 'bg-paper-outline text-ink-muted',
  validating: 'bg-olive-container text-olive',
  sanitizing: 'bg-olive-container text-olive',
  ocr_processing: 'bg-olive-container text-olive',
  processing: 'bg-olive-container text-olive',
  completed: 'bg-success-container text-success',
  rejected: 'bg-error-container text-error',
  failed: 'bg-error-container text-error',
};

const STATUS_LABELS: Record<string, string> = {
  uploading: 'Subiendo...',
  uploaded: 'Pendiente',
  validating: 'Validando',
  sanitizing: 'Sanitizando',
  ocr_processing: 'Procesando OCR',
  processing: 'Procesando',
  completed: 'Verificado',
  rejected: 'Rechazado',
  failed: 'Fallido',
};

function getStatusBadgeClass(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-paper-outline text-ink-muted';
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

interface TrackingDoc {
  documentId: string;
  fileName: string;
  eventsUrl: string;
}

export function DocumentsForm() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType_[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trackingDoc, setTrackingDoc] = useState<TrackingDoc | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // SSE tracking for current upload
  const { lastEvent, isConnected } = useSSE({
    url: trackingDoc?.eventsUrl ?? null,
  });

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docsRes, typesRes] = await Promise.all([
        listDocuments(),
        getDocumentTypes(),
      ]);
      setDocuments(docsRes.documents);
      setDocumentTypes(typesRes.document_types);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Track SSE events to update document status
  useEffect(() => {
    if (lastEvent && trackingDoc) {
      const status = lastEvent.type;
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === trackingDoc.documentId
            ? { ...doc, ocr_status: status }
            : doc
        )
      );
      // Stop tracking on terminal events
      if (status === 'completed' || status === 'rejected' || status === 'failed') {
        setTrackingDoc(null);
      }
    }
  }, [lastEvent, trackingDoc]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo no puede superar los 20 MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const res = await uploadDocument(file);
      // Add optimistic document
      const newDoc: Document = {
        id: res.document_id,
        file_name: file.name,
        document_type: null,
        ocr_status: res.status,
        ocr_confidence: null,
        is_verified: false,
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDocuments((prev) => [newDoc, ...prev]);

      // Start SSE tracking if events_url provided
      if (res.events_url) {
        setTrackingDoc({
          documentId: res.document_id,
          fileName: file.name,
          eventsUrl: res.events_url,
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('¿Eliminar este documento? Esta acción no se puede deshacer.'))
      return;
    setDeletingId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/v1/user/documents/${documentId}/download`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getDocumentTypeName = (code: string | null): string => {
    if (!code) return 'Sin clasificar';
    const dt = documentTypes.find((t) => t.code === code);
    return dt?.name ?? code;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-paper-dim rounded-xl p-5 h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-coral" />
        <h2 className="text-xl font-bold text-ink">Documentos</h2>
      </div>

      {error && (
        <div className="bg-error-container text-error p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Upload area */}
      <div className="border-2 border-dashed border-paper-outline rounded-xl p-8 text-center hover:border-coral transition-colors">
        <input
          type="file"
          id="document-upload"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          disabled={isUploading}
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-coral animate-spin" />
              <p className="text-ink-muted font-medium">Subiendo documento...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-coral-container flex items-center justify-center">
                <Upload className="w-7 h-7 text-coral" />
              </div>
              <div>
                <p className="text-ink font-medium">
                  Arrastrá un archivo o hacé click para subir
                </p>
                <p className="text-ink-faint text-sm mt-1">
                  PDF, JPG, PNG, DOC, DOCX — Máx. 20 MB
                </p>
              </div>
            </>
          )}
        </label>
      </div>

      {/* Tracking status */}
      {trackingDoc && (
        <div className="bg-olive-container rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-olive animate-spin" />
          <div>
            <p className="text-olive font-medium text-sm">
              Procesando: {trackingDoc.fileName}
            </p>
            <p className="text-olive/70 text-xs">
              {isConnected ? 'Conectado al servidor' : 'Esperando conexión...'}
            </p>
          </div>
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 && !isUploading ? (
        <div className="text-center py-10">
          <FileText className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-ink-muted">No tenés documentos todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-paper-dim rounded-xl border border-paper-outline p-4 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-paper-container flex items-center justify-center shrink-0 mt-0.5">
                <File className="w-5 h-5 text-ink-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-ink text-sm truncate">
                    {doc.file_name}
                  </p>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium ${getStatusBadgeClass(doc.ocr_status)}`}
                  >
                    {getStatusLabel(doc.ocr_status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-faint">
                  <span>{getDocumentTypeName(doc.document_type)}</span>
                  {doc.file_size && (
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                  )}
                  <span>
                    {new Date(doc.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(doc.ocr_status === 'completed' ||
                  doc.ocr_status === 'rejected') && (
                  <button
                    onClick={() => handleDownload(doc.id, doc.file_name)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-container text-ink-muted hover:text-ink transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container text-ink-muted hover:text-error transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
