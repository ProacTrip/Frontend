// app/admin/avatars/page.tsx
// Gestión de avatares: ver existentes + subir nuevos con presigned URL

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { listAvatars, uploadAvatar } from '@/app/lib/api';
import type { Avatar } from '@/app/lib/types/admin';

export default function AdminAvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarName, setAvatarName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'requesting' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAvatars = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAvatars();
      setAvatars(response.avatars || []);
    } catch (error) {
      console.error('Error cargando avatares:', error);
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const resetUploadState = () => {
    setSelectedFile(null);
    setAvatarName('');
    setErrorMsg('');
    setUploadProgress('idle');
    // ✅ CORRECCIÓN PUNTO 2: Limpiar valor interno del input para permitir re-seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrorMsg('Solo se permiten imágenes PNG o JPEG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('El archivo no puede superar los 5 MB');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    // Nombre por defecto: default_N (siguiente número disponible)
    const nextNum = avatars.length + 1;
    setAvatarName(`default_${nextNum}`);
  };

  const handleUpload = async () => {
    if (!selectedFile || !avatarName.trim()) return;

    setUploading(true);
    setUploadProgress('requesting');

    try {
      // 1. Pedir presigned URL al backend
      const presigned = await uploadAvatar({
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        avatar_name: avatarName.trim(),
      });

      setUploadProgress('uploading');

      // 2. Subir directamente a R2 con el presigned URL
      const uploadRes = await fetch(presigned.upload_url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Error subiendo archivo al almacenamiento');
      }

      setUploadProgress('success');
      await loadAvatars(); // Recargar lista

      // Cerrar modal tras 1.5s
      setTimeout(() => {
        setShowUploadModal(false);
        resetUploadState();
      }, 1500);
    } catch (error: any) {
      console.error('Error en subida:', error);
      setUploadProgress('error');
      setErrorMsg(error.message || 'Error al subir el avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#c54141]" />
            Avatares
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona los avatares por defecto del sistema
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Subir nuevo avatar
        </button>
      </div>

      {/* Grid de avatares */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#c54141]" />
        </div>
      ) : avatars.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No hay avatares</h3>
          <p className="text-sm text-gray-500 mt-1">
            Sube el primer avatar para los usuarios del sistema
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {avatars.map((avatar) => (
            <div
              key={avatar.name}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-square relative bg-gray-50">
                <img
                  src={avatar.download_url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23ccc"%3E%3Crect width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23999" font-size="12"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{avatar.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {avatar.download_url.split('?')[0].split('.').pop()?.toUpperCase()}
                </p>
                {/* ✅ CORRECCIÓN PUNTO 1: Eliminado botón de borrar porque la API no lo soporta */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Subir Avatar */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Subir nuevo avatar</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadState();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Dropzone / Selector */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-[#c54141] hover:bg-gray-50'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs text-gray-400">PNG o JPEG · Máx 5 MB</p>
                  </div>
                )}
              </div>

              {/* Nombre del avatar */}
              {selectedFile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del avatar
                  </label>
                  <input
                    type="text"
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                    placeholder="ej: default_7"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c54141]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este nombre determina el archivo en el servidor
                  </p>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              {/* Progreso */}
              {uploadProgress !== 'idle' && uploadProgress !== 'error' && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Loader2 className={`w-5 h-5 text-[#c54141] ${uploadProgress !== 'success' ? 'animate-spin' : ''}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadProgress === 'requesting' && 'Solicitando URL de subida...'}
                      {uploadProgress === 'uploading' && 'Subiendo a almacenamiento...'}
                      {uploadProgress === 'success' && '¡Avatar subido correctamente!'}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          uploadProgress === 'success' ? 'bg-green-500 w-full' : 'bg-[#c54141] w-2/3'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadState();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !avatarName.trim() || uploading}
                  className="flex-1 px-4 py-2.5 bg-[#c54141] text-white rounded-lg text-sm font-medium hover:bg-[#a93535] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Subir avatar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}