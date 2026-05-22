'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listUsers } from '@/app/lib/api';
import type { UserAdmin, UserListParams, UserListMeta } from '@/app/lib/types/admin';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ADMIN_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useAdminUsers(params: UserListParams = {}) {
  const [cursor, setCursor] = useState<string>('');

  const queryKey = queryKeys.admin.users({ ...params, cursor: cursor || undefined });

  const {
    data,
    isPending,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => listUsers({ ...params, cursor: cursor || undefined }, signal),
    staleTime: ADMIN_STALE_TIME,
  });

  const users: UserAdmin[] = data?.users ?? [];
  const meta: UserListMeta | null = data?.meta ?? null;

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  const goToPage = useCallback((newCursor: string) => {
    setCursor(newCursor);
  }, []);

  return {
    data: users,
    meta,
    isLoading: isPending || isQueryLoading,
    error: queryErrorMsg,
    refetch,
    goToPage,
    // Keep these for backwards compatibility during transition
    hasNextPage: !!meta?.has_next,
    hasPrevPage: !!meta?.prev_cursor,
  };
}
