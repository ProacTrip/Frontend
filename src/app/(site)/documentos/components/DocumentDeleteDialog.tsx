'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Loader, AlertTriangle } from 'lucide-react';

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
    <Dialog open={true} onClose={onCancel} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-neutral-900">¿Eliminar este documento?</DialogTitle>
              <p className="text-sm text-neutral-500 mt-0.5">{documentName}</p>
            </div>
          </div>

          <p className="text-neutral-600 text-sm mb-6">
            Esta acción no se puede deshacer. El documento será eliminado permanentemente.
          </p>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
        </DialogPanel>
      </div>
    </Dialog>
  );
}
