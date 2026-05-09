'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getUploadAvatarUrl,
  uploadAvatarToR2,
  confirmAvatarUpload,
  listDefaultAvatars,
  selectDefaultAvatar,
} from '@/app/lib/api';
import { DefaultAvatar } from '@/app/lib/types/user';
import { Upload, Image as ImageIcon, Check, AlertCircle, Loader } from 'lucide-react';

interface Props {
  currentUrl: string | null;
  onSave: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function AvatarForm({ currentUrl, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<DefaultAvatar[]>([]);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectingDefault, setIsSelectingDefault] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDefaults() {
      try {
        const avatars = await listDefaultAvatars();
        setDefaults(avatars);
      } catch (err: any) {
        console.warn('Error cargando avatares por defecto:', err.message);
      } finally {
        setIsLoadingDefaults(false);
      }
    }
    loadDefaults();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError('');

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Formato no válido. Usa JPG, PNG o WebP.');
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError('El archivo supera los 5MB máximo.');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    try {
      const { upload_url, storage_key } = await getUploadAvatarUrl(file);
      await uploadAvatarToR2(upload_url, file);
      await confirmAvatarUpload(storage_key);
      onSave();
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDefault = async (avatarName: string) => {
    setIsSelectingDefault(avatarName);
    setError('');

    try {
      await selectDefaultAvatar(avatarName);
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSelectingDefault(null);
    }
  };

  const handleRemovePreview = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-[#FF6B6B]" />
        <h2 className="text-xl font-bold text-gray-800">Avatar</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Avatar actual */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Avatar actual"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#ff8a80] flex items-center justify-center border-4 border-white shadow-lg">
              <ImageIcon className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">Avatar actual</p>
          <p className="text-sm text-gray-500">
            {currentUrl ? 'Tienes un avatar personalizado' : 'Usando avatar por defecto'}
          </p>
        </div>
      </div>

      {/* Subir archivo */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
        <p className="font-medium text-gray-800">Subir foto propia</p>
        <p className="text-sm text-gray-500">JPG, PNG o WebP. Máximo 5MB.</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="flex items-center gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#FF6B6B]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg font-medium hover:bg-[#ff5252] disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Subir
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRemovePreview}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#FF6B6B] hover:bg-white transition-colors flex flex-col items-center gap-2 text-gray-500 hover:text-[#FF6B6B]"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Haz click para seleccionar una imagen</span>
          </button>
        )}
      </div>

      {/* Avatares por defecto */}
      <div>
        <p className="font-medium text-gray-800 mb-3">Avatares por defecto</p>

        {isLoadingDefaults ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : defaults.length === 0 ? (
          <p className="text-sm text-gray-400">No hay avatares por defecto disponibles.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {defaults.map((avatar) => (
              <button
                key={avatar.name}
                type="button"
                onClick={() => handleSelectDefault(avatar.name)}
                disabled={isSelectingDefault === avatar.name}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  currentUrl === avatar.url
                    ? 'border-[#FF6B6B] ring-2 ring-[#FF6B6B]/20'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  className="w-full aspect-square object-cover"
                />
                {isSelectingDefault === avatar.name && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {currentUrl === avatar.url && (
                  <div className="absolute top-1 right-1 bg-[#FF6B6B] text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center truncate px-1">
                  {avatar.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}