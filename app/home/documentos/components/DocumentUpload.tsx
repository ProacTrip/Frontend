'use client';

import { useRef, useState } from 'react';
import { Upload, Loader, AlertCircle } from 'lucide-react';
import { uploadDocument } from '@/app/lib/api/documents';
import { UserApiError } from '@/app/lib/api/user';
import type { DocumentUploadResponse } from '@/app/lib/types/document';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setError(null);
    setIsUploading(true);

    try {
      const response = await uploadDocument(file);
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

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
          transition-all duration-200
          ${
            isUploading
              ? 'bg-gray-300 text-gray-500 cursor-wait'
              : 'bg-[#FF6B6B] text-white hover:bg-[#ff5252] active:scale-[0.97]'
          }
        `}
      >
        {isUploading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Subir Documento
          </>
        )}
      </button>

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
