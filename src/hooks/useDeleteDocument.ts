'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDocument } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for deleting a document by ID.
 *
 * Usage:
 *   const deleteDoc = useDeleteDocument();
 *   await deleteDoc.mutateAsync('doc_abc123');
 *
 * On success, invalidates `userKeys.documents()` to refresh the list.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.documents() });
    },
  });
}
