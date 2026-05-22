'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDocuments,
  deleteDocument,
  downloadDocument,
  listDocumentTypes,
} from '@/app/lib/api/documents';
import { UserApiError } from '@/app/lib/api/user';
import { useDocumentSSE } from '@/hooks/useDocumentSSE';
import DocumentCard from './components/DocumentCard';
import DocumentUpload from './components/DocumentUpload';
import DocumentFilters, { type DocumentFiltersValues } from './components/DocumentFilters';
import DocumentDeleteDialog from './components/DocumentDeleteDialog';
import DocumentDetailModal from './components/DocumentDetailModal';
import type {
  DocumentListItem,
  DocumentUploadResponse,
  DocumentEvent,
} from '@/app/lib/types/document';

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function DocumentosPage() {
  const queryClient = useQueryClient();

  // --- Filters (UI state — triggers query refetch on change) ---
  const [filters, setFilters] = useState<DocumentFiltersValues>({
    status: null,
    document_type: null,
  });

  // --- Delete state ---
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentListItem | null>(null);

  // --- Detail modal state ---
  const [selectedDoc, setSelectedDoc] = useState<DocumentListItem | null>(null);

  // --- Processing docs (for SSE auto-subscription) ---
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ==========================================
  // LOAD DOCUMENT TYPES
  // ==========================================
  const { data: types = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: listDocumentTypes,
    staleTime: 60 * 60 * 1000, // 1h cache — types rarely change
  });

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================
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

  // Derive processing IDs from documents when data arrives
  useEffect(() => {
    if (!documentListData) return;
    const processing = new Set<string>();
    for (const doc of documentListData.documents) {
      if (doc.ocr_status === 'processing') {
        processing.add(doc.id);
      }
    }
    setProcessingIds(processing);
  }, [documentListData]);

  // ==========================================
  // DELETE MUTATION
  // ==========================================
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData(
        ['user-documents', filters.status, filters.document_type],
        (old: typeof documentListData) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.filter((d) => d.id !== id),
          };
        },
      );
      setDocToDelete(null);
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleUploadSuccess = useCallback(
    (_response: DocumentUploadResponse) => {
      // Invalidate the documents query to refresh the list
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
    try {
      await downloadDocument(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar el documento.';
      // Download errors are transient — show as query error banner
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: DocumentFiltersValues) => {
    setFilters(newFilters);
  }, []);

  const handleCardClick = useCallback((doc: DocumentListItem) => {
    setSelectedDoc(doc);
  }, []);

  const handleStatusUpdate = useCallback(
    (event: DocumentEvent, docId: string) => {
      // Update document in cache optimistically
      queryClient.setQueryData(
        ['user-documents', filters.status, filters.document_type],
        (old: typeof documentListData) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.map((d) => {
              if (d.id === docId) {
                const updated: DocumentListItem = {
                  ...d,
                  ocr_status: event.status,
                };
                if (event.ocr_confidence !== undefined) {
                  updated.ocr_confidence = event.ocr_confidence;
                }
                return updated;
              }
              return d;
            }),
          };
        },
      );

      // If the doc reached a terminal state, refetch to get full updated data
      if (event.status === 'completed' || event.status === 'rejected' || event.status === 'failed') {
        refetch();
      }
    },
    [queryClient, filters, refetch],
  );

  // ==========================================
  // SSE TRACKING for processing documents (3.8)
  // ==========================================
  //
  // For each document in 'processing' state, subscribe to SSE events.
  // The useDocumentSSE hook handles reconnection and cleanup.
  function ProcessingTracker({ docId }: { docId: string }) {
    useDocumentSSE({
      documentId: docId,
      onEvent: (event: DocumentEvent) => {
        // Update document in cache optimistically
        queryClient.setQueryData(
          ['user-documents', filters.status, filters.document_type],
          (old: typeof documentListData) => {
            if (!old) return old;
            return {
              ...old,
              documents: old.documents.map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      ocr_status: event.status,
                      ocr_confidence:
                        event.ocr_confidence !== undefined
                          ? event.ocr_confidence
                          : d.ocr_confidence,
                    }
                  : d,
              ),
            };
          },
        );

        // Refresh the full list on terminal status
        if (
          event.status === 'completed' ||
          event.status === 'rejected' ||
          event.status === 'failed'
        ) {
          setProcessingIds((prev) => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
        }
      },
    });

    return null; // This component renders nothing — it only wires SSE
  }

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (isLoading && documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#FF6B6B]" />
          Mis Documentos
        </h1>
        <p className="text-gray-500 mb-8">Cargando tus documentos...</p>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 animate-pulse"
            >
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
      </div>
    );
  }

  // ==========================================
  // ERROR STATE (no documents loaded)
  // ==========================================
  if (queryError && documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#FF6B6B]" />
          Mis Documentos
        </h1>

        <div className="mt-12 flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-1">Error al cargar los documentos</p>
            <p className="text-sm text-gray-500 mb-4">{queryError}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (!isLoading && documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#FF6B6B]" />
          Mis Documentos
        </h1>

        <div className="mt-12 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No tenés documentos cargados todavía
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Subí tu pasaporte, visa, seguro de viaje y otros documentos para tenerlos siempre a mano.
            </p>
            <DocumentUpload onSuccess={handleUploadSuccess} />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN CONTENT
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#FF6B6B]" />
            Mis Documentos
          </h1>
          <p className="text-gray-500">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <DocumentUpload onSuccess={handleUploadSuccess} />
      </div>

      {/* Error banner (non-fatal — documents are shown behind it) */}
      {queryError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-800 text-sm">Error</p>
            <p className="text-sm text-red-600">{queryError}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <DocumentFilters onFilterChange={handleFilterChange} />
      </div>

      {/* Document Grid */}
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

      {/* SSE Trackers — invisible components that wire up EventSource for processing docs */}
      {Array.from(processingIds).map((docId) => (
        <ProcessingTracker key={docId} docId={docId} />
      ))}

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <DocumentDeleteDialog
          documentName={docToDelete.file_name}
          isDeleting={deletingId === docToDelete.id}
          onConfirm={handleDelete}
          onCancel={() => setDocToDelete(null)}
        />
      )}

      {/* Detail Modal */}
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
