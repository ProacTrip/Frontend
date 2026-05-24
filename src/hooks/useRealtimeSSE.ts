'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, userKeys } from '@/app/lib/queries/queryKeys';
import { API_URL } from '@/app/lib/api/user';

const MAX_BACKOFF = 30000; // 30s cap for exponential backoff

/**
 * SSE protocol parser over fetch ReadableStream.
 *
 * Replaces native EventSource (which ignores `withCredentials` on
 * cross-origin requests in all major browsers) with a manual
 * implementation that sends HttpOnly cookies correctly via
 * `credentials: 'include'`.
 */
async function connectSSE(
  url: string,
  onEvent: (event: string, data: string) => void,
  onOpen: () => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    credentials: 'include',
    signal,
    headers: { Accept: 'text/event-stream' },
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }

  onOpen(); // Late-join trigger — fires after successful response

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || ''; // Keep incomplete chunk for next iteration

    for (const part of parts) {
      const lines = part.split('\n');
      let eventType = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7);
        else if (line.startsWith('data: ')) data += line.slice(6);
      }

      if (data) onEvent(eventType, data);
    }
  }
}

/**
 * Maintains a single SSE connection to GET /v1/realtime/events while the
 * user is authenticated. Uses fetch() + ReadableStream (not EventSource)
 * for correct cross-origin cookie transmission.
 *
 * Features:
 *   - `credentials: 'include'` → HttpOnly cookies sent correctly
 *   - Exponential backoff + jitter on disconnect (1s → 30s cap)
 *   - Late-join refetch on (re)connect
 *   - Medical cache invalidation for conflict events
 *   - Automatic cleanup on logout / unmount
 */
export function useRealtimeSSE(): { isConnected: boolean } {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const backoffRef = useRef(1000); // Start at 1 second
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    backoffRef.current = 1000; // Reset on fresh connection

    const url = `${API_URL}/v1/realtime/events`;

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
          queryClient.invalidateQueries({ queryKey: userKeys.medicalConflicts() });
          queryClient.invalidateQueries({ queryKey: userKeys.medical() });
          break;
      }
    };

    const doConnect = async () => {
      if (controller.signal.aborted) return;

      try {
        await connectSSE(
          url,
          handleEvent,
          () => {
            setIsConnected(true);
            backoffRef.current = 1000; // Reset backoff on successful connection
            // Late-join: refetch active user queries so the UI catches
            // up with any state changes that happened while disconnected.
            queryClient.refetchQueries({ queryKey: userKeys.all, type: 'active' });
            queryClient.refetchQueries({ queryKey: queryKeys.profile.all, type: 'active' });
          },
          controller.signal,
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Network error or non-2xx response — fall through to reconnect
      }

      if (controller.signal.aborted) return;

      setIsConnected(false);

      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF);
      const jitter = delay * (0.8 + Math.random() * 0.4); // ±20% jitter
      setTimeout(doConnect, jitter);
    };

    doConnect();
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated) {
      abortRef.current?.abort();
      abortRef.current = null;
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, connect]);

  return { isConnected };
}
