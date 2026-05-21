// hooks/useDocumentSSE.ts
//
// React hook that wraps subscribeToDocumentEvents() with:
// - Exponential backoff reconnection (1s → 2s → 4s → max 30s)
// - Auto-stop on terminal statuses (completed, rejected, failed)
// - Cleanup on unmount
// - Late-connection handling (synthetic event from Redis via backend)

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { subscribeToDocumentEvents } from '@/app/lib/api/documents';
import type { DocumentEvent } from '@/app/lib/types/document';

interface UseDocumentSSEOptions {
  /** Document ID to track */
  documentId: string;
  /** Called on every SSE event. The hook auto-stops on terminal statuses. */
  onEvent: (event: DocumentEvent) => void;
  /** Called on connection errors (before reconnecting) */
  onError?: (error: Event) => void;
}

/**
 * Subscribe to SSE events for a document's OCR pipeline.
 *
 * Auto-reconnects with exponential backoff.
 * Auto-stops when the document reaches a terminal state
 * (completed, rejected, or failed).
 */
export function useDocumentSSE({ documentId, onEvent, onError }: UseDocumentSSEOptions) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const backoffRef = useRef<number>(1000);
  const maxBackoffRef = useRef<number>(30000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  // Keep refs updated without re-subscribing
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const terminalStatuses: Array<DocumentEvent['status']> = ['completed', 'rejected', 'failed'];

  const connect = useCallback(() => {
    // Clean up any previous connection
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const wrappedOnEvent = (event: DocumentEvent) => {
      // Reset backoff on successful event
      backoffRef.current = 1000;

      // Call user callback
      onEventRef.current(event);

      // Stop on terminal status
      if (terminalStatuses.includes(event.status)) {
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      }
    };

    const wrappedOnError = (error: Event) => {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }

      // EventSource native reconnect might handle this, but we add
      // exponential backoff as a safety fallback.
      // Schedule reconnect with backoff
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, maxBackoffRef.current);

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    cleanupRef.current = subscribeToDocumentEvents(
      documentId,
      wrappedOnEvent,
      wrappedOnError,
    );
  }, [documentId]);

  useEffect(() => {
    connect();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [connect]);
}
