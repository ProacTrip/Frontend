'use client';

import { useRef, useState } from 'react';
import { Upload, Loader, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { uploadDocument } from '@/app/lib/api/documents';
import { UserApiError } from '@/app/lib/api/user';
import type { DocumentUploadResponse } from '@/app/lib/types/document';

// ==========================================
// HELPERS
// ==========================================

function statusLabel(status: string): string {
  switch (status) {
    case 'queued': return 'En cola';
    case 'processing': return 'Procesando';
    case 'completed': return 'Completado';
    case 'rejected': return 'Rechazado';
    case 'failed': return 'Falló';
    default: return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-300';
    case 'processing':
    case 'queued': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'failed':
    case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

// ==========================================
// COMPONENT
// ==========================================

interface DocumentUploadProps {
  onSuccess: (response: DocumentUploadResponse) => void;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<DocumentUploadResponse | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous states
    setError(null);
    setLastUpload(null);

    // Client-side validation
    if (file.size > MAX_SIZE) {
      setError('El archivo supera los 20MB. Comprimilo o elegí uno más chico.');
      e.target.value = '';
      return;
    }

    // Type check (browser file.type)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no soportado. Usá PDF, JPG o PNG.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadDocument(file);
      setLastUpload(response);
      onSuccess(response);
      // Reset input for re-upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      if (err instanceof UserApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al subir el archivo. Intentá de nuevo.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ── Drop zone helpers ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Manually trigger the file input change handler
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Seleccionar archivo para subir"
      />

      {/* Upload drop zone + button */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isUploading
            ? 'border-gray-300 bg-gray-50 cursor-wait'
            : 'border-gray-300 hover:border-[--color-brand-400] hover:bg-brand-50/20'
          }
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 animate-spin text-[--color-brand-500]" />
            <p className="text-sm font-medium text-gray-600">Subiendo documento...</p>
            <p className="text-xs text-gray-400">Esto puede tomar unos segundos</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[--color-brand-500]" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Arrastrá un archivo o <span className="text-[--color-brand-500] underline">hacé clic para subir</span>
            </p>
            <p className="text-xs text-gray-400">PDF, JPG o PNG • Máximo 20MB</p>
          </div>
        )}
      </div>

      {/* Upload result (success) */}
      {lastUpload && !isUploading && !error && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Documento subido correctamente</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-green-700">
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">ID: {lastUpload.document_id}</span>
              </div>
              <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor(lastUpload.status)}`}>
                {statusLabel(lastUpload.status)}
              </span>
            </div>
            <button
              onClick={() => setLastUpload(null)}
              className="text-xs text-green-600 hover:text-green-800 underline flex-shrink-0"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
