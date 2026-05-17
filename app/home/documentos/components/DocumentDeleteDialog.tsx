'use client';

import { Loader, AlertTriangle } from 'lucide-react';

// ==========================================
// COMPONENT
// ==========================================

interface DocumentDeleteDialogProps {
  documentName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DocumentDeleteDialog({
  documentName,
  isDeleting,
  onConfirm,
  onCancel,
}: DocumentDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar este documento?</h3>
            <p className="text-sm text-gray-500 mt-0.5">{documentName}</p>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          Esta acción no se puede deshacer. El documento será eliminado permanentemente.
        </p>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
