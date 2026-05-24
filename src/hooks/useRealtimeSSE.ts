'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, userKeys } from '@/app/lib/queries/queryKeys';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Maintains a single SSE connection to GET /v1/realtime/events while the user
 * is authenticated. Automatically closes on logout and reconnects on login.
 *
 * Event → cache invalidation mapping:
 *   user.avatar.updated / user.profile.updated → invalidate profile caches
 *   document.processing.completed / document.verification.updated → invalidate userKeys.documents()
 *   medical.conflict.* → invalidate profile caches
 *
 * NOTE: Per-document SSE (useDocumentSSE) is deprecated — all document events
 * now flow through this centralized hook. The old per-document EventSource
 * endpoints are going away.
 */
export function useRealtimeSSE() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    const es = new EventSource(`${API_URL}/v1/realtime/events`, {
      withCredentials: true,
    });

    eventSourceRef.current = es;

    const handleEvent = (eventName: string) => {
      switch (eventName) {
        case 'user.avatar.updated':
        case 'user.profile.updated':
          queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
          break;
        case 'document.processing.completed':
        case 'document.verification.updated':
          queryClient.invalidateQueries({ queryKey: userKeys.documents() });
          break;
        case 'medical.conflict.created':
        case 'medical.conflict.resolved':
          queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
          break;
      }
    };

    const eventNames = [
      'user.avatar.updated',
      'user.profile.updated',
      'document.processing.completed',
      'document.verification.updated',
      'medical.conflict.created',
      'medical.conflict.resolved',
    ];

    eventNames.forEach(name => {
      es.addEventListener(name, () => handleEvent(name));
    });

    es.onerror = () => {
      // EventSource auto-reconnects by default — no manual intervention needed
    };

    return () => {
      es.close();
    };
  }, [isAuthenticated, queryClient]);
}
