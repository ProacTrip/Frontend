'use client';

import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/lib/api/notifications';
import type { UserNotification, UserNotificationListParams } from '@/app/lib/types/notification';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import { NOTIFICATIONS_STALE_TIME } from '@/app/lib/queries/staleTimes';

export function useNotifications(params: UserNotificationListParams = {}) {
  const queryClient = useQueryClient();
  const limit = params.limit ?? 20;
  const queryKey = queryKeys.notifications.list(params);

  // ── INFINITE QUERY ──────────────────────────────────
  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isPending,
    isLoading: isQueryLoading,
    isFetchingNextPage,
    error: queryError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return listUserNotifications({
        ...params,
        offset: pageParam,
        limit,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.length * limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    staleTime: NOTIFICATIONS_STALE_TIME,
  });

  const notifications: UserNotification[] = (
    pagesData?.pages ?? []
  ).flatMap((page) => page.notifications);

  const queryErrorMsg =
    queryError instanceof Error ? queryError.message : null;

  // ── MARK ONE (mutation) ─────────────────────────────
  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead({ notification_id: notificationId }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // ── MARK ALL (mutation) ─────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // ── DERIVED ─────────────────────────────────────────
  const isLoading = isPending || isQueryLoading;

  const markOne = useCallback(
    (notificationId: string) => markOneMutation.mutateAsync(notificationId),
    [markOneMutation],
  );

  const markAll = useCallback(
    () => markAllMutation.mutateAsync(),
    [markAllMutation],
  );

  return {
    data: notifications,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error: queryErrorMsg,
    markOne,
    markAll,
  };
}
