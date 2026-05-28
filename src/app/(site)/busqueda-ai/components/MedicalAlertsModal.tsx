'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

interface MedicalAlertData {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
}

interface MedicalAlertsModalProps {
  alert: MedicalAlertData;
  onDismiss: () => void;
}

const severityStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-[#F5F5F5]',
    border: 'border-[#e8e8e8]',
    text: 'text-[#0A0A0A]',
    icon: 'text-[#767676]',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

export default function MedicalAlertsModal({ alert, onDismiss }: MedicalAlertsModalProps) {
  const style = severityStyles[alert.severity || 'info'];

  return (
    <Dialog open onClose={onDismiss} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-sm rounded-2xl ${style.bg} ${style.border} border p-6 shadow-modal`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-5 h-5 ${style.icon}`} />
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className={`text-sm font-semibold ${style.text}`}>
                {alert.title}
              </DialogTitle>
              <p className={`text-xs ${style.text} mt-1 opacity-80`}>
                {alert.description}
              </p>
            </div>

            <button
              onClick={onDismiss}
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white/50 transition-colors ${style.text}`}
              aria-label="Cerrar alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onDismiss}
              className={`px-4 py-2 rounded-full text-xs font-medium bg-white ${style.text} hover:bg-opacity-80 transition-colors`}
            >
              Entendido
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
