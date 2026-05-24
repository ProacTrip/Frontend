'use client';

import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';
import { PROFILE_STALE_TIME } from '@/app/lib/queries/staleTimes';
import type { DocumentListItem } from '@/app/lib/types/document';

/**
 * Query hook for listing user documents with optional filters.
 *
 * Usage:
 *   const { data, isPending, isFetching, error } = useDocuments({ status: 'pending', documentType: 'passport' });
 *
 * Backed by centralized query key `userKeys.documents()`.
 * Stale time: PROFILE_STALE_TIME (30s).
 */
export function useDocuments(filters?: { status?: string; documentType?: string }) {
  const apiParams = filters
    ? { status: filters.status, document_type: filters.documentType }
    : undefined;

  const {
    data: response,
    isPending,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: userKeys.documents(apiParams),
    queryFn: () => listDocuments(apiParams),
    staleTime: PROFILE_STALE_TIME,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    data: response?.documents as DocumentListItem[] | undefined,
    isPending,
    isFetching,
    error,
  };
}
