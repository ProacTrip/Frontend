'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──

export interface SSEEvent {
  type: string;
  data: string;
  id?: string;
}

export interface UseSSEReturn {
  events: SSEEvent[];
  isConnected: boolean;
  lastEvent: SSEEvent | null;
  reconnect: () => void;
}

// ── Backoff config ──

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const BACKOFF_MULTIPLIER = 2;

// ── Hook ──

/**
 * SSE (Server-Sent Events) client hook with exponential backoff reconnection.
 *
 * @param url — The SSE endpoint URL. Pass `null` to disable.
 * @returns events array, connection status, and last received event.
 */
export function useSSE(url: string | null): UseSSEReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const eventsRef = useRef<SSEEvent[]>([]);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── Connect function ──

  const connect = useCallback(() => {
    if (!url) return;

    // Clean up previous connection
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(url, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        if (!mountedRef.current) return;

        setIsConnected(true);
        backoffRef.current = INITIAL_BACKOFF_MS;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!mountedRef.current) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent: Partial<SSEEvent> = {};

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent.type = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              currentEvent.data = line.slice(5).trim();
            } else if (line.startsWith('id:')) {
              currentEvent.id = line.slice(3).trim();
            } else if (line === '') {
              // Empty line = dispatch event
              if (currentEvent.data !== undefined) {
                const event: SSEEvent = {
                  type: currentEvent.type || 'message',
                  data: currentEvent.data,
                  id: currentEvent.id,
                };
                setLastEvent(event);
                eventsRef.current = [...eventsRef.current, event];
                setEvents([...eventsRef.current]);
              }
              currentEvent = {};
            }
          }
        }
      })
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        if (!mountedRef.current) return;
        setIsConnected(false);
      })
      .finally(() => {
        if (mountedRef.current && abortRef.current === controller) {
          setIsConnected(false);
        }
      });
  }, [url]);

  // ── Reconnect with exponential backoff ──

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || !url) return;

    const delay = backoffRef.current;
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      backoffRef.current = Math.min(
        backoffRef.current * BACKOFF_MULTIPLIER,
        MAX_BACKOFF_MS
      );
      connect();
    }, delay);
  }, [url, connect]);

  // ── Main effect ──

  useEffect(() => {
    mountedRef.current = true;

    if (!url) {
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [url, connect]);

  // ── Reconnect on disconnect ──

  useEffect(() => {
    if (!isConnected && url && mountedRef.current) {
      scheduleReconnect();
    }
  }, [isConnected, url, scheduleReconnect]);

  // ── Manual reconnect ──

  const reconnect = useCallback(() => {
    backoffRef.current = INITIAL_BACKOFF_MS;
    eventsRef.current = [];
    setEvents([]);
    setLastEvent(null);
    connect();
  }, [connect]);

  return {
    events,
    isConnected,
    lastEvent,
    reconnect,
  };
}
