'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  uploadAvatarToR2,
} from '@/app/lib/api';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useConfirmAvatar } from '@/hooks/useConfirmAvatar';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Button from "@/components/ui/Button";

interface Props {
  currentUrl: string | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function AvatarForm({ currentUrl }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadAvatarMutation = useUploadAvatar();
  const confirmMutation = useConfirmAvatar();

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
      const { upload_url, storage_key } = await uploadAvatarMutation.mutateAsync(file);
      await uploadAvatarToR2(upload_url, file);
      await confirmMutation.mutateAsync(storage_key);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setFile(null);
      setPreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir avatar');
    } finally {
      setIsUploading(false);
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
        <ImageIcon className="w-5 h-5 text-[--color-brand-500]" />
        <h2 className="text-xl font-bold text-gray-800">Avatar</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Guardado ✓
        </div>
      )}

      {/* Avatar actual */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt="Avatar actual"
              width={96}
              height={96}
              className="rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[--color-brand-500] to-[--color-brand-400] flex items-center justify-center border-4 border-white shadow-lg">
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
            <Image
              src={preview}
              alt="Preview"
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-[--color-brand-500]"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="brand"
                isLoading={isUploading}
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg w-auto"
              >
                <Upload className="w-4 h-4" /> Subir
              </Button>
              <Button
                type="button"
                variant="google"
                disabled={isUploading}
                onClick={handleRemovePreview}
                className="px-4 py-2 rounded-lg w-auto"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[--color-brand-500] hover:bg-white transition-colors flex flex-col items-center gap-2 text-gray-500 hover:text-[--color-brand-500] cursor-pointer"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Haz click para seleccionar una imagen</span>
          </button>
        )}
      </div>
    </div>
  );
}