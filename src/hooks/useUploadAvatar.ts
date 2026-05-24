'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUploadAvatarUrl } from '@/app/lib/api';
import { queryKeys } from '@/app/lib/queries/queryKeys';

/**
 * Mutation hook for requesting a presigned R2 upload URL for an avatar.
 *
 * Usage:
 *   const uploadAvatar = useUploadAvatar();
 *   const { upload_url, storage_key } = await uploadAvatar.mutateAsync(file);
 *   // Then: upload directly to R2 with `upload_url`, followed by useConfirmAvatar
 *
 * The API extracts `file.name`, `file.type`, and `file.size` from the File
 * object and sends them as JSON to POST /v1/user/profile/avatar.
 * On success, invalidates `queryKeys.profile.all` so the profile refetches
 * with the updated avatar_url.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => getUploadAvatarUrl(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
