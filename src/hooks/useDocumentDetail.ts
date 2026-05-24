'use client';

import { useQuery } from '@tanstack/react-query';
import { getDocument } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { DocumentDetail } from '@/app/lib/types/document';

/**
 * Query hook for fetching a single document by ID.
 *
 * Usage:
 *   const { data, isPending, isFetching, error } = useDocumentDetail('doc_abc123');
 *
 * With polling:
 *   const { data } = useDocumentDetail('doc_abc123', {
 *     refetchInterval: (query) => query.state.data?.ocr_status === 'processing' ? 5000 : false,
 *   });
 *
 * Disabled when `documentId` is empty — no request is sent.
 * Backed by centralized query key `userKeys.document(id)`.
 * Stale time: PROFILE_STALE_TIME (30s).
 */
export function useDocumentDetail(
  documentId: string,
  options?: {
    /** Polling interval in ms, or a function returning number | false to stop polling. */
    refetchInterval?: number | false | (() => number | false);
  },
) {
  const {
    data,
    isPending,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: userKeys.document(documentId),
    queryFn: () => getDocument(documentId),
    staleTime: PROFILE_STALE_TIME,
    enabled: !!documentId,
    refetchInterval: options?.refetchInterval,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    data: data as DocumentDetail | undefined,
    isPending,
    isFetching,
    error,
  };
}
