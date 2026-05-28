// app/lib/api/search-ai.ts
//
// Raw fetch client for AI-powered conversational search.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Canonical pattern: direct fetch, typed errors, rate limit extraction,
// AbortController (30s — AI backend is slow).

import type { AIResponse, AIErrorCode, SearchAIRequest } from '@/app/lib/types/search-ai';
import { SearchAIError } from '@/app/lib/types/search-ai';
import { rateLimitStore } from './rate-limit';

// ==========================================
// SINGLE env var
// ==========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// TIMEOUT — AI backend is slow
// ==========================================
const AI_SEARCH_TIMEOUT_MS = 30_000;

// ==========================================
// HELPERS
// ==========================================

/**
 * Extract rate limit headers from ANY response (success or error)
 * and update the global rateLimitStore.
 */
function extractRateLimitHeaders(response: Response, endpoint: string): void {
  const limit = response.headers.get('RateLimit-Limit');
  const remaining = response.headers.get('RateLimit-Remaining');
  const reset = response.headers.get('RateLimit-Reset');

  if (limit !== null && remaining !== null && reset !== null) {
    rateLimitStore.update({
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      endpoint,
      timestamp: Date.now(),
    });
  }
}

/**
 * Parse a non-ok Response into a typed SearchAIError.
 * Maps RFC 9457 type URI → AIErrorCode.
 * On 429, also calls rateLimitStore.block() with Retry-After (REQ-C3).
 * Handles AI_PARSE_FAILURE / ai_parse_failure (REQ-W6).
 *
 * EXPORTED so BusquedaAIContent can reuse it for SSE error parsing
 * instead of the buggy inline version (REQ-C3, REQ-W6).
 */
export async function parseAIError(response: Response, endpoint: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  const type: string = body?.type || '';
  const status = response.status;

  let code: AIErrorCode;

  if (status === 429 || type.includes('rate_limit') || type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (type.includes('turn-limit') || type.includes('turn_limit')) {
    code = 'TURN_LIMIT_EXCEEDED';
  } else if (type.includes('conversation-not-found') || type.includes('conversation_not_found')) {
    code = 'CONVERSATION_NOT_FOUND';
  } else if (type.includes('ai-parse-failure') || type.includes('ai_parse_failure') || type.includes('AI_PARSE_FAILURE')) {
    code = 'AI_PARSE_FAILURE';
  } else if (type.includes('ai-unavailable') || type.includes('ai_unavailable') || type.includes('service-unavailable')) {
    code = 'AI_UNAVAILABLE';
  } else if (type.includes('provider-unavailable') || type.includes('provider_unavailable')) {
    code = 'PROVIDER_UNAVAILABLE';
  } else if (type.includes('validation')) {
    code = 'VALIDATION_ERROR';
  } else if (status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (status === 503) {
    code = 'AI_UNAVAILABLE';
  } else {
    code = 'INTERNAL_ERROR';
  }

  const retryAfterHeader = response.headers.get('Retry-After');

  if (code === 'RATE_LIMIT_EXCEEDED' && retryAfterHeader) {
    rateLimitStore.block(parseInt(retryAfterHeader, 10));
  }

  extractRateLimitHeaders(response, endpoint);

  throw new SearchAIError(
    code,
    status,
    body?.detail || body?.title || `Error ${status}`,
    body?.trace_id || undefined,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

/** Headers helper — DRY with BusquedaAIContent */
function sseHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (process.env.NEXT_PUBLIC_SIMULATE_IP) {
    h['X-Real-IP'] = process.env.NEXT_PUBLIC_SIMULATE_IP;
  }
  return h;
}

// ==========================================
// AI SEARCH
// ==========================================

/**
 * Send a natural language message to the AI search endpoint.
 *
 * Cookie-based auth: credentials:"include" — cookies auto-sent if present.
 * Anon users get 5 turns, auth users get 10 turns.
 * 30s timeout via AbortController.
 *
 * @param message — Natural language travel query (required)
 * @param conversationId — Existing conversation UUID (omit for first message)
 * @returns AIResponse — discriminated union on intent field
 */
export async function searchAI(
  message: string,
  conversationId?: string,
): Promise<AIResponse> {
  const endpoint = '/v1/search/ai';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_SEARCH_TIMEOUT_MS);

  const body: SearchAIRequest = {
    message,
    ...(conversationId && { conversation_id: conversationId }),
  };

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.NEXT_PUBLIC_SIMULATE_IP) {
      headers['X-Real-IP'] = process.env.NEXT_PUBLIC_SIMULATE_IP;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseAIError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw SearchAIError as-is
    if (error instanceof SearchAIError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La consulta está tardando más de lo esperado. Intentá de nuevo.');
    }

    throw error;
  }
}

// ==========================================
// SSE STREAMING CONNECTION (REQ-C3, REQ-W9, REQ-W10)
// ==========================================

/**
 * Connect to the AI search SSE stream.
 *
 * Primary: opens a fetch + ReadableStream for SSE events.
 * Fallback: if the fetch itself fails (network error), falls back to non-streaming
 * `searchAI()` and synthesizes equivalent events via the same `onEvent` callback (REQ-W9).
 *
 * REQ-W10: 30s timeout via AbortController — the caller's `signal` is combined
 * with a 30s built-in timeout. If the stream ends without a `done` or `result` or
 * `error` event, an `error` event is synthesized.
 *
 * REQ-C3: on 429, rateLimitStore.block(retryAfter) is called via parseAIError.
 *
 * @param message — user's natural language query
 * @param conversationId — existing conversation UUID or null for new
 * @param signal — AbortSignal from the component (cancelling sets stream state to IDLE)
 * @param onEvent — callback receiving (eventType, data) for each SSE event
 *   Types: "status" | "chunk" | "search" | "weather" | "alert" | "done" | "result" | "error"
 */
export async function connectSSE(
  message: string,
  conversationId: string | null,
  signal: AbortSignal,
  onEvent: (eventType: string, data: string) => void,
  currency?: string,
): Promise<void> {
  const endpoint = '/v1/search/ai';

  // REQ-W10: 30s timeout — combined with caller's AbortSignal
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), AI_SEARCH_TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeoutController.signal]);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: sseHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify({
        message,
        ...(conversationId && { conversation_id: conversationId }),
        ...(currency && { currency }),
        stream: true,
      }),
      credentials: 'include',
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await parseAIError(response, endpoint);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedResultOrDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7);
          else if (line.startsWith('data: ')) data += line.slice(6);
        }

        if (data) {
          if (eventType === 'done' || eventType === 'result') {
            receivedResultOrDone = true;
          }
          onEvent(eventType, data);
        }
      }
    }

    // REQ-W10: Stream ended without result/done/error → stream dropped
    if (!receivedResultOrDone) {
      onEvent('error', JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Conexión perdida. La respuesta se interrumpió.' }));
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Don't fall back if the request was explicitly aborted
    if (err instanceof DOMException && err.name === 'AbortError') {
      // If our timeout triggered, signal to the consumer
      if (timeoutController.signal.aborted && !signal.aborted) {
        onEvent('error', JSON.stringify({ code: 'INTERNAL_ERROR', message: 'La consulta está tardando más de lo esperado. Intentá de nuevo.' }));
      }
      throw err;
    }

    // If it's already a SearchAIError, re-throw — error codes are already correct
    if (err instanceof SearchAIError) {
      throw err;
    }

    // REQ-W9: Non-streaming fallback — SSE fetch failed, try POST without stream
    if (err instanceof TypeError && err.message.includes('fetch')) {
      // Network error — can't fall back either, re-throw
      throw err;
    }

    try {
      const fallbackResponse = await searchAI(message, conversationId ?? undefined);
      // Synthesize a "result" event from the non-streaming response
      onEvent('result', JSON.stringify(fallbackResponse));
      // Also synthesize "search" event if the response has results
      if ('flights' in fallbackResponse || 'hotels' in fallbackResponse) {
        const searchPayload: Record<string, unknown> = {};
        if ('flights' in fallbackResponse) searchPayload.flights = (fallbackResponse as unknown as Record<string, unknown>).flights;
        if ('hotels' in fallbackResponse) searchPayload.hotels = (fallbackResponse as unknown as Record<string, unknown>).hotels;
        onEvent('search', JSON.stringify(searchPayload));
      }
    } catch (fallbackErr: unknown) {
      if (fallbackErr instanceof SearchAIError) {
        onEvent('error', JSON.stringify({ code: fallbackErr.code, message: fallbackErr.detail }));
      } else if (fallbackErr instanceof Error) {
        throw fallbackErr;
      }
      throw err;
    }
  }
}

// ==========================================
// CONVERSATION RECOVERY (REQ-C4)
// ==========================================

/** Conversation state returned by GET /conversations/{id} */
export interface RecoveredConversation {
  messages: import('@/app/lib/types/search-ai').ChatMessage[];
  conversation_id: string;
  turn_count: number;
  max_turns: number;
  results?: Record<string, unknown>;
}

/**
 * Fetch full conversation state from the backend (REQ-C4).
 * Backend is authoritative — use this for F5 recovery before localStorage fallback.
 *
 * @param conversationId — UUID of the conversation to recover
 * @returns RecoveredConversation on success
 * @throws Error('CONVERSATION_NOT_FOUND') on 404
 */
export async function recoverConversation(conversationId: string): Promise<RecoveredConversation> {
  const response = await fetch(`${API_URL}/v1/search/ai/conversations/${conversationId}`, {
    credentials: 'include',
    headers: sseHeaders({ Accept: 'application/json' }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }
    // Try to parse error body
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.detail || body?.title || `Recovery failed: ${response.status}`);
  }

  const data = await response.json();

  // Backend returns { messages: [{ role, content, timestamp }], search_cache: {...}, ... }
  // Filter out system and tool messages — they're internal AI context and must
  // never be shown to the user. Tool messages contain raw JSON search results
  // that are displayed in the results panel, not the chat.
  const rawMessages = (data.messages || data.turns || []).filter(
    (msg: { role: string }) => msg.role !== 'system' && msg.role !== 'tool',
  );
  const messages: import('@/app/lib/types/search-ai').ChatMessage[] = rawMessages.map(
    (msg: { role: string; content?: string; message?: string; timestamp?: string }, idx: number) => ({
      id: `restored-${idx}`,
      role: (msg.role === 'assistant' ? 'ai' : 'user') as 'user' | 'ai',
      text: msg.content || msg.message || '',
      timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
    }),
  );

  // Extract results from search_cache (keyed by tool call ID)
  let results: Record<string, unknown> | undefined;
  const cache = data.search_cache;
  if (cache) {
    for (const entry of Object.values(cache) as Array<{ type: string; response: unknown }>) {
      if (entry?.type === 'flights' && entry.response) {
        results = { ...results, flights: entry.response };
      } else if (entry?.type === 'hotels' && entry.response) {
        results = { ...results, hotels: entry.response };
      }
    }
  }

  return {
    messages,
    conversation_id: data.id || data.conversation_id,
    turn_count: data.turn_count || 0,
    max_turns: data.max_turns || 5,
    results,
  };
}

// ==========================================
// CONVERSATIONS LIST
// ==========================================

/** Lightweight conversation preview from GET /conversations */
export interface ConversationPreview {
  id: string;
  preview: string;
  turn_count: number;
  updated_at: string;
}

/**
 * Fetch the user's active conversations list.
 * Returns empty array on failure or for anonymous users.
 */
export async function listConversations(): Promise<ConversationPreview[]> {
  const response = await fetch(`${API_URL}/v1/search/ai/conversations`, {
    credentials: 'include',
    headers: sseHeaders({ Accept: 'application/json' }),
  });
  if (!response.ok) return [];
  return response.json();
}
