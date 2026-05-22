'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { listUsers } from '@/app/lib/api';
import type { UserAdmin, UserListParams, UserListResponse } from '@/app/lib/types/admin';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { ADMIN_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useAdminUsers(params: UserListParams = {}) {
  const queryKey = queryKeys.admin.users(params);

  // ── INFINITE QUERY ──────────────────────────────────
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isPending,
    isLoading: isQueryLoading,
    isFetchingNextPage,
    error: queryError,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      listUsers({ ...params, cursor: pageParam }, signal),
    initialPageParam: '',
    getNextPageParam: (lastPage: UserListResponse) =>
      lastPage.meta?.next_cursor ?? undefined,
    staleTime: ADMIN_STALE_TIME,
  });

  const users: UserAdmin[] = (pagesData?.pages ?? []).flatMap(
    (page) => page.users,
  );

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  return {
    data: users,
    fetchNextPage,
    hasNextPage,
    isLoading: isPending || isQueryLoading,
    isFetchingNextPage,
    error: queryErrorMsg,
    refetch,
  };
}
