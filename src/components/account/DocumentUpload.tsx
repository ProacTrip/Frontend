'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { uploadDocument } from '@/lib/api/user';
import type { Document, UploadDocumentResponse } from '@/lib/api/types';

interface DocumentUploadProps {
  onDocumentAdded: (doc: Document) => void;
  onStatusChange: (docId: string, status: string, confidence?: number, documentType?: string) => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

interface UploadState {
  file: File | null;
  uploading: boolean;
  error: string | null;
  progress: string;
  result: UploadDocumentResponse | null;
  sseStatus: string | null;
  sseSubState: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function DocumentUpload({ onDocumentAdded, onStatusChange }: DocumentUploadProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    uploading: false,
    error: null,
    progress: '',
    result: null,
    sseStatus: null,
    sseSubState: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupSSE();
    };
  }, [cleanupSSE]);

  const startSSE = useCallback(
    (documentId: string, eventsUrl: string) => {
      cleanupSSE();

      // Build full URL if events_url is relative
      const fullUrl = eventsUrl.startsWith('http')
        ? eventsUrl
        : `${API_BASE}${eventsUrl}`;

      // Small delay to allow backend to start processing
      const es = new EventSource(fullUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener('processing', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              sseStatus: 'processing',
              sseSubState: data.sub_state || 'processing',
              progress: data.message || 'Procesando documento...',
            }));
            onStatusChange(documentId, 'processing');
          }
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('completed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              sseStatus: 'completed',
              sseSubState: null,
              progress: data.message || 'Documento procesado.',
              uploading: false,
            }));
            onStatusChange(
              documentId,
              'completed',
              data.ocr_confidence,
              data.document_type
            );
            cleanupSSE();
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('rejected', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              sseStatus: 'rejected',
              sseSubState: null,
              progress: data.detail || 'Documento rechazado.',
              uploading: false,
            }));
            onStatusChange(documentId, 'rejected');
            cleanupSSE();
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('failed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (mountedRef.current) {
            setState((prev) => ({
              ...prev,
              sseStatus: 'failed',
              sseSubState: null,
              progress: data.detail || 'Error al procesar.',
              uploading: false,
            }));
            onStatusChange(documentId, 'failed');
            cleanupSSE();
          }
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        // EventSource will auto-reconnect. If SSE connection is lost
        // permanently, we'll stop after a timeout.
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            progress: 'Reconectando al servidor...',
          }));
        }
      };
    },
    [cleanupSSE, onStatusChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setState((prev) => ({
        ...prev,
        error: 'Formato no soportado. Usá PDF, JPG, PNG, WebP o TIFF.',
        file: null,
      }));
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setState((prev) => ({
        ...prev,
        error: 'El archivo supera los 20 MB máximos.',
        file: null,
      }));
      return;
    }

    setState((prev) => ({ ...prev, file, error: null }));
  };

  const handleUpload = async () => {
    const { file } = state;
    if (!file) return;

    setState((prev) => ({ ...prev, uploading: true, error: null, progress: 'Subiendo archivo...' }));

    try {
      const result = await uploadDocument(file);

      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        uploading: false,
        progress: 'Documento recibido. Procesando...',
        result,
      }));

      // Create initial document entry
      const newDoc: Document = {
        id: result.document_id,
        file_name: file.name,
        ocr_status: 'uploaded',
        ocr_confidence: null,
        is_verified: false,
        document_type: null,
        created_at: new Date().toISOString(),
      };

      onDocumentAdded(newDoc);

      // Start SSE tracking
      startSSE(result.document_id, result.events_url);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const detail =
        (err as { detail?: string })?.detail ||
        (err as { message?: string })?.message ||
        'Error al subir el documento.';
      setState((prev) => ({
        ...prev,
        uploading: false,
        error: detail,
        progress: '',
      }));
    }
  };

  const handleReset = () => {
    cleanupSSE();
    setState({
      file: null,
      uploading: false,
      error: null,
      progress: '',
      result: null,
      sseStatus: null,
      sseSubState: null,
    });
  };

  const { file, uploading, error, progress, sseStatus } = state;

  const isProcessing = sseStatus === 'processing';
  const isDone = sseStatus === 'completed';
  const isRejected = sseStatus === 'rejected';
  const isFailed = sseStatus === 'failed';

  return (
    <div className="rounded-xl border border-paper-outline bg-paper-dim p-4 md:p-6">
      <h2 suppressHydrationWarning className="text-lg font-semibold text-ink mb-4">
        Subir Documento
      </h2>

      {/* ── File input area ── */}
      {!file && (
        <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-paper-outline rounded-xl bg-paper cursor-pointer hover:border-coral/40 hover:bg-coral/5 transition-colors">
          <Upload size={32} className="text-ink-faint" />
          <div className="text-center">
            <p className="text-sm font-medium text-ink-muted">
              Arrastrá un archivo o hacé clic para seleccionar
            </p>
            <p className="text-xs text-ink-faint mt-1">
              PDF, JPG, PNG, WebP o TIFF — Máx. 20 MB
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,image/jpeg,image/png,image/webp,image/tiff,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}

      {/* ── Selected file ── */}
      {file && !uploading && !isProcessing && !isDone && !isRejected && !isFailed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-paper-container">
            <div className="flex items-center gap-2.5 min-w-0">
              <Upload size={18} className="text-ink-muted shrink-0" />
              <span className="text-sm text-ink truncate">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, file: null, error: null }))}
              className="shrink-0 p-1 rounded hover:bg-paper-outline/50 transition-colors"
            >
              <X size={16} className="text-ink-faint" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-coral text-white hover:bg-coral-hover transition-colors"
          >
            Subir documento
          </button>
        </div>
      )}

      {/* ── Upload/progress state ── */}
      {(uploading || isProcessing || progress) && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-paper-container">
            {(uploading || isProcessing) ? (
              <Loader size={18} className="text-olive animate-spin shrink-0" />
            ) : isDone ? (
              <CheckCircle size={18} className="text-success shrink-0" />
            ) : isRejected || isFailed ? (
              <XCircle size={18} className="text-error shrink-0" />
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-muted truncate">
                {file?.name ?? 'Documento'}
              </p>
              <p className="text-xs text-ink-faint mt-0.5">{progress}</p>
            </div>
          </div>

          {isProcessing && (
            <div className="w-full bg-paper-container rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-olive rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}

          {/* Step indicators */}
          {isProcessing && state.sseSubState && (
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${state.sseSubState === 'validating' ? 'bg-olive' : 'bg-paper-outline'}`} />
                Validando
              </span>
              <span className="text-paper-outline">→</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${state.sseSubState === 'sanitizing' ? 'bg-olive' : 'bg-paper-outline'}`} />
                Limpiando
              </span>
              <span className="text-paper-outline">→</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${state.sseSubState === 'ocr_processing' ? 'bg-olive' : 'bg-paper-outline'}`} />
                OCR
              </span>
            </div>
          )}

          {(isDone || isRejected || isFailed) && (
            <div className="flex gap-2">
              {isDone && (
                <div className="flex-1 rounded-lg px-4 py-2.5 bg-success-container text-success text-sm font-medium text-center">
                  ¡Documento procesado correctamente!
                </div>
              )}
              {isRejected && (
                <div className="flex-1 rounded-lg px-4 py-2.5 bg-error-container text-error text-sm font-medium text-center">
                  Documento rechazado: no es un documento reconocible.
                </div>
              )}
              {isFailed && (
                <div className="flex-1 rounded-lg px-4 py-2.5 bg-error-container text-error text-sm font-medium text-center">
                  Error al procesar el documento.
                </div>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-paper-outline bg-paper text-ink-muted hover:bg-paper-container transition-colors shrink-0"
              >
                Subir otro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-error-container">
          <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
