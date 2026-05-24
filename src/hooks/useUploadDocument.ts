'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument } from '@/app/lib/api';
import { userKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for uploading a document file (PDF, JPEG, PNG).
 *
 * Usage:
 *   const uploadDoc = useUploadDocument();
 *   await uploadDoc.mutateAsync({ file, fileName: 'pasaporte.pdf' });
 *
 * Client-side validation rejects files > 20MB before the request.
 * On success, invalidates `userKeys.documents()` to refresh the list.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, fileName }: { file: File; fileName?: string }) =>
      uploadDocument(file, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.documents() });
    },
  });
}
