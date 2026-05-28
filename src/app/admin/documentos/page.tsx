// app/admin/documentos/page.tsx
// Verificación de documentos — Dashboard API
// Endpoints: GET /v1/dashboard/documents/:id/verification
//            PATCH /v1/dashboard/documents/:id/verification
//            POST /v1/dashboard/documents/:id/reprocess
//
// Alcance: el admin consulta documentos, cambia su estado de verificación,
// y puede reprocesar OCR.

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  FileCheck,
  FileX,
  FileSearch,
  RotateCw,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  X,
  History,
} from 'lucide-react';
import {
  getDocumentVerification,
  updateDocumentVerification,
  reprocessDocument,
  DashboardApiError,
} from '@/app/lib/api/documents-admin';
import type {
  DocumentVerificationStatus,
  UpdateVerificationBody,
} from '@/app/lib/types/admin';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ADMIN_STALE_TIME } from '@/app/lib/queries/staleTimes';

const STATUS_LABELS: Record<DocumentVerificationStatus, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  rejected: 'Rechazado',
  manual_review: 'Revisión manual',
  suspicious: 'Sospechoso',
};

const STATUS_COLORS: Record<DocumentVerificationStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
  manual_review: 'bg-amber-100 text-amber-700',
  suspicious: 'bg-orange-100 text-orange-700',
};

export default function DocumentVerificationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Cargando...</div>}>
      <DocumentVerificationContent />
    </Suspense>
  );
}

function DocumentVerificationContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const docIdFromUrl = searchParams.get('id') || '';

  const [inputDocId, setInputDocId] = useState(docIdFromUrl);
  const [searchDocId, setSearchDocId] = useState<string | null>(docIdFromUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Exclude<DocumentVerificationStatus, 'pending'> | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Sync URL param → input on mount
  useEffect(() => {
    if (docIdFromUrl) {
      setInputDocId(docIdFromUrl);
      setSearchDocId(docIdFromUrl);
    }
  }, [docIdFromUrl]);

  // ---- useQuery for document verification (lazy) ----
  const {
    data: verification,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: queryKeys.admin.documents(searchDocId || ''),
    queryFn: () => getDocumentVerification(searchDocId!),
    enabled: !!searchDocId,
    staleTime: ADMIN_STALE_TIME,
  });

  // ---- useMutation: status update ----
  const updateStatusMutation = useMutation({
    mutationFn: ({ docId, body }: { docId: string; body: UpdateVerificationBody }) =>
      updateDocumentVerification(docId, body),
    onSuccess: (result) => {
      setSuccessMsg(result.message);
      setShowStatusModal(false);
      setPendingStatus(null);
      setStatusReason('');
      if (searchDocId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.documents(searchDocId),
        });
      }
    },
    onError: (err: unknown) => {
      if (err instanceof DashboardApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al actualizar verificación.');
      }
    },
  });

  // ---- useMutation: reprocess ----
  const reprocessMutation = useMutation({
    mutationFn: (docId: string) => reprocessDocument(docId),
    onSuccess: (result) => {
      setSuccessMsg(result.message);
    },
    onError: (err: unknown) => {
      if (err instanceof DashboardApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al reprocesar documento.');
      }
    },
  });

  const actionLoading = updateStatusMutation.isPending || reprocessMutation.isPending;

  const handleSearch = () => {
    const trimmed = inputDocId.trim();
    if (!trimmed) {
      setError('Ingresa un ID de documento (UUID).');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setSearchDocId(trimmed);
  };

  const handleUpdateStatus = () => {
    if (!pendingStatus || !verification) return;
    updateStatusMutation.mutate({
      docId: verification.document_id,
      body: {
        status: pendingStatus,
        reason: statusReason.trim() || undefined,
      },
    });
  };

  const handleReprocess = () => {
    if (!verification) return;
    reprocessMutation.mutate(verification.document_id);
  };

  const openStatusModal = (status: Exclude<DocumentVerificationStatus, 'pending'>) => {
    setPendingStatus(status);
    setStatusReason('');
    setShowStatusModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 font-display tracking-tight">
          Verificación de Documentos
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Consulta, verifica o rechaza documentos. Reprocesa OCR si es necesario.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-neutral-400" />
          Consultar documento
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputDocId}
            onChange={(e) => setInputDocId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white font-mono"
            placeholder="ID del documento (UUID)..."
          />
          <button
            onClick={handleSearch}
            disabled={queryLoading || !inputDocId.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {queryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar error"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Success */}
      {successMsg && !error && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-emerald-700">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Resultado */}
      {verification && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Estado actual */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-neutral-400" />
                Estado del documento
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <InfoItem
                  icon={<FileCheck className="w-3.5 h-3.5" />}
                  label="ID"
                  value={verification.document_id.slice(0, 20) + '...'}
                />
                <InfoItem
                  icon={<ShieldAlert className="w-3.5 h-3.5" />}
                  label="Estado"
                  value={STATUS_LABELS[verification.status] || verification.status}
                  badge={STATUS_COLORS[verification.status]}
                />
                <InfoItem
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Verificado el"
                  value={
                    verification.verified_at
                      ? new Date(verification.verified_at).toLocaleString('es-ES')
                      : '—'
                  }
                />
                <InfoItem
                  icon={<ShieldAlert className="w-3.5 h-3.5" />}
                  label="Verificado por"
                  value={verification.verified_by ? verification.verified_by.slice(0, 12) + '...' : '—'}
                />
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-400" />
                Historial de cambios
              </h2>

              {verification.history.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  No hay entradas en el historial.
                </p>
              ) : (
                <div className="space-y-3">
                  {verification.history.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          STATUS_COLORS[entry.new_status as DocumentVerificationStatus] || 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {STATUS_LABELS[entry.new_status as DocumentVerificationStatus] || entry.new_status}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700">{entry.reason}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                          <span>
                            {new Date(entry.changed_at).toLocaleString('es-ES')}
                          </span>
                          <span>·</span>
                          <span>Admin: {entry.verified_by.slice(0, 12)}...</span>
                          <span>·</span>
                          <span>{entry.previous_status} → {entry.new_status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-base font-semibold text-neutral-900 mb-4">Acciones</h2>
              <div className="space-y-3">
                <button
                  onClick={() => openStatusModal('verified')}
                  disabled={verification.status === 'verified' || actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar documento
                </button>

                <button
                  onClick={() => openStatusModal('rejected')}
                  disabled={verification.status === 'rejected' || actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40"
                >
                  <FileX className="w-4 h-4" />
                  Rechazar documento
                </button>

                <button
                  onClick={() => openStatusModal('manual_review')}
                  disabled={verification.status === 'manual_review' || actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" />
                  Marcar revisión manual
                </button>

                <button
                  onClick={() => openStatusModal('suspicious')}
                  disabled={verification.status === 'suspicious' || actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 transition-colors disabled:opacity-40"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Marcar sospechoso
                </button>

                <hr className="border-neutral-100" />

                <button
                  onClick={handleReprocess}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4" />
                  )}
                  Reprocesar OCR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambio de estado */}
      {showStatusModal && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Cambiar estado: {STATUS_LABELS[pendingStatus]}
              </h3>
              <button
                onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Motivo <span className="text-neutral-400">(máx. 500 caracteres)</span>
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
                  placeholder={
                    pendingStatus === 'verified'
                      ? 'Ej: MRZ válido, datos coinciden con el perfil'
                      : pendingStatus === 'rejected'
                        ? 'Ej: Documento ilegible, no coincide con el usuario'
                        : pendingStatus === 'manual_review'
                          ? 'Ej: Requiere verificación manual por inconsistencias'
                          : 'Ej: Posible falsificación detectada'
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowStatusModal(false); setPendingStatus(null); }}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors ${
                    pendingStatus === 'verified'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : pendingStatus === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : pendingStatus === 'manual_review'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Confirmar'
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

function InfoItem({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
      <div className="text-neutral-400 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-400 uppercase tracking-wide">{label}</p>
        {badge ? (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${badge}`}>
            {value}
          </span>
        ) : (
          <p className="text-sm font-medium text-neutral-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
