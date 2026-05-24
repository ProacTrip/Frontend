'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmAvatarUpload } from '@/app/lib/api';
import { queryKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for confirming an avatar upload after the R2 PUT completes.
 *
 * Usage:
 *   // Step 1: useUploadAvatar to get presigned URL and storage_key
 *   // Step 2: upload directly to R2 via presigned URL
 *   // Step 3: confirm with this hook
 *   const confirm = useConfirmAvatar();
 *   await confirm.mutateAsync(storage_key);
 *
 * On success, invalidates `queryKeys.profile.all` so the profile refetches
 * with the updated avatar_url (including processed variants).
 */
export function useConfirmAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storageKey: string) => confirmAvatarUpload(storageKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
