'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  listDocuments,
  listDocumentTypes,
  deleteDocument as deleteDocumentApi,
} from '@/lib/api/user';
import type { Document, DocumentType } from '@/lib/api/types';
import { DocumentUpload } from '@/components/account/DocumentUpload';
import { DocumentList } from '@/components/account/DocumentList';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [docsRes, typesRes] = await Promise.all([
          listDocuments(),
          listDocumentTypes(),
        ]);
        if (!cancelled) {
          setDocuments(docsRes.documents ?? []);
          setDocumentTypes(typesRes.document_types ?? []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const detail =
            (err as { detail?: string })?.detail ||
            (err as { message?: string })?.message ||
            'Error al cargar los documentos.';
          setError(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Add a new document (from upload)
  const handleDocumentAdded = useCallback((doc: Document) => {
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  // Update document status (from SSE)
  const handleStatusChange = useCallback(
    (docId: string, status: string, confidence?: number, documentType?: string) => {
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== docId) return d;
          return {
            ...d,
            ocr_status: status as Document['ocr_status'],
            ...(confidence != null ? { ocr_confidence: confidence } : {}),
            ...(documentType ? { document_type: documentType } : {}),
          };
        })
      );
    },
    []
  );

  // Delete document
  const handleDelete = useCallback(
    async (id: string) => {
      await deleteDocumentApi(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-8">
          <div className="h-48 w-full rounded-lg bg-paper-container animate-pulse" />
        </div>
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 w-full rounded-lg bg-paper-container animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.h1
          suppressHydrationWarning
          variants={itemVariants}
          className="text-2xl font-bold text-ink"
        >
          Documentos
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-error-container p-6"
        >
          <p className="text-error text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.h1
        suppressHydrationWarning
        variants={itemVariants}
        className="text-2xl font-bold text-ink"
      >
        Documentos
      </motion.h1>

      <motion.div variants={itemVariants}>
        <DocumentUpload
          onDocumentAdded={handleDocumentAdded}
          onStatusChange={handleStatusChange}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DocumentList
          documents={documents}
          documentTypes={documentTypes}
          onDelete={handleDelete}
        />
      </motion.div>
    </motion.div>
  );
}
