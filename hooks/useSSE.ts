'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SSEMessage {
  type: string;
  data: Record<string, any>;
}

interface UseSSEOptions {
  url: string | null;
  token?: string;
}

interface UseSSEReturn {
  events: SSEMessage[];
  isConnected: boolean;
  lastEvent: SSEMessage | null;
  error: string | null;
}

const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF_FACTOR = 2;

export function useSSE({ url, token }: UseSSEOptions): UseSSEReturn {
  const [events, setEvents] = useState<SSEMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef(INITIAL_DELAY);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!url) return;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    let eventSourceUrl = url;
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      eventSourceUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    try {
      const es = new EventSource(eventSourceUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        retryDelayRef.current = INITIAL_DELAY;
      };

      es.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const message: SSEMessage = {
            type: data.type ?? 'message',
            data: data,
          };
          setEvents((prev) => [...prev, message]);
          setLastEvent(message);
        } catch {
          const message: SSEMessage = {
            type: 'message',
            data: { raw: event.data },
          };
          setEvents((prev) => [...prev, message]);
          setLastEvent(message);
        }
      };

      // Named events: processing, completed, rejected, failed
      const handleNamedEvent = (eventType: string) => (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const message: SSEMessage = { type: eventType, data };
          setEvents((prev) => [...prev, message]);
          setLastEvent(message);

          // Auto-close on terminal events
          if (eventType === 'completed' || eventType === 'rejected' || eventType === 'failed') {
            es.close();
            setIsConnected(false);
          }
        } catch {
          const message: SSEMessage = {
            type: eventType,
            data: { raw: event.data },
          };
          setEvents((prev) => [...prev, message]);
          setLastEvent(message);
        }
      };

      es.addEventListener('processing', handleNamedEvent('processing'));
      es.addEventListener('completed', handleNamedEvent('completed'));
      es.addEventListener('rejected', handleNamedEvent('rejected'));
      es.addEventListener('failed', handleNamedEvent('failed'));

      es.onerror = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        es.close();

        // Exponential backoff
        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * BACKOFF_FACTOR, MAX_DELAY);

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message ?? 'Error al conectar SSE');
      }
    }
  }, [url, token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connect]);

  return { events, isConnected, lastEvent, error };
}
