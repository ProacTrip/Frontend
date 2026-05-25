'use client';

import { useState, useCallback } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDocuments,
  deleteDocument,
  downloadDocument,
  listDocumentTypes,
} from '@/app/lib/api/documents';
import { UserApiError } from '@/app/lib/api/user';
import DocumentCard from './components/DocumentCard';
import DocumentUpload from './components/DocumentUpload';
import DocumentFilters, { type DocumentFiltersValues } from './components/DocumentFilters';
import DocumentDeleteDialog from './components/DocumentDeleteDialog';
import DocumentDetailModal from './components/DocumentDetailModal';
import type {
  DocumentListItem,
  DocumentEvent,
} from '@/app/lib/types/document';

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function DocumentosPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<DocumentFiltersValues>({
    status: null,
    document_type: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentListItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentListItem | null>(null);

  const { data: types = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: listDocumentTypes,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: documentListData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-documents', filters.status, filters.document_type],
    queryFn: () =>
      listDocuments({
        status: filters.status || undefined,
        document_type: filters.document_type || undefined,
      }),
  });

  const documents = documentListData?.documents ?? [];
  const queryError =
    error instanceof UserApiError
      ? error.detail
      : error instanceof Error
        ? error.message
        : error
          ? 'Error al cargar los documentos.'
          : null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(
        ['user-documents', filters.status, filters.document_type],
        (old: typeof documentListData) => {
          if (!old) return old;
          return { ...old, documents: old.documents.filter((d) => d.id !== id) };
        },
      );
      setDocToDelete(null);
    },
    onSettled: () => setDeletingId(null),
  });

  const handleUploadSuccess = useCallback(
    (_response: { document_id: string; status: string }) => {
      queryClient.invalidateQueries({
        queryKey: ['user-documents', filters.status, filters.document_type],
      });
    },
    [queryClient, filters],
  );

  const handleDelete = useCallback(() => {
    if (!docToDelete) return;
    deleteMutation.mutate(docToDelete.id);
  }, [docToDelete, deleteMutation]);

  const handleDownload = useCallback(async (id: string) => {
    try { await downloadDocument(id); } catch { /* transient */ }
  }, []);

  const handleFilterChange = useCallback((newFilters: DocumentFiltersValues) => {
    setFilters(newFilters);
  }, []);

  const handleCardClick = useCallback((doc: DocumentListItem) => {
    setSelectedDoc(doc);
  }, []);

  const handleStatusUpdate = useCallback(
    (event: DocumentEvent, docId: string) => {
      queryClient.setQueryData(
        ['user-documents', filters.status, filters.document_type],
        (old: typeof documentListData) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.map((d) => {
              if (d.id === docId) {
                const updated: DocumentListItem = { ...d, ocr_status: event.status };
                if (event.ocr_confidence !== undefined) updated.ocr_confidence = event.ocr_confidence;
                return updated;
              }
              return d;
            }),
          };
        },
      );
      if (event.status === 'completed' || event.status === 'rejected' || event.status === 'failed') {
        refetch();
      }
    },
    [queryClient, filters, refetch],
  );

  // ── RENDER: Siempre header + upload + filters, varía solo el contenido ──

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header — siempre visible */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-3" suppressHydrationWarning>
            <FileText className="w-8 h-8 text-[--color-brand-500]" />
            Mis Documentos
          </h1>
          <p className="text-gray-500">
            {isLoading ? 'Cargando...' : `${documents.length} documento${documents.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <DocumentUpload onSuccess={handleUploadSuccess} />
      </div>

      {/* Filters — siempre visible */}
      <div className="mb-6">
        <DocumentFilters onFilterChange={handleFilterChange} types={types} />
      </div>

      {/* Error banner (no bloquea los filtros) */}
      {queryError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{queryError}</p>
          <button onClick={() => refetch()} className="ml-auto text-xs text-red-500 hover:text-red-700 underline">
            Reintentar
          </button>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      {isLoading && documents.length === 0 ? (
        /* Loading skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty state — con filtros visibles arriba */
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {filters.status || filters.document_type
                ? 'No hay documentos con esos filtros'
                : 'No tenés documentos cargados todavía'}
            </h2>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              {filters.status || filters.document_type
                ? 'Probá con otros filtros o subí un documento nuevo.'
                : 'Subí tu pasaporte, visa, seguro de viaje y otros documentos para tenerlos siempre a mano.'}
            </p>
          </div>
        </div>
      ) : (
        /* Document Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              types={types}
              deletingId={deletingId}
              onDelete={(id) => {
                const found = documents.find((d) => d.id === id);
                if (found) setDocToDelete(found);
              }}
              onDownload={handleDownload}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {docToDelete && (
        <DocumentDeleteDialog
          documentName={docToDelete.file_name}
          isDeleting={deletingId === docToDelete.id}
          onConfirm={handleDelete}
          onCancel={() => setDocToDelete(null)}
        />
      )}
      {selectedDoc && (
        <DocumentDetailModal
          documentId={selectedDoc.id}
          types={types}
          onClose={() => setSelectedDoc(null)}
          onDownload={handleDownload}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
