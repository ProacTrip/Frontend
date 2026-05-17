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
 * On 429, also calls rateLimitStore.block() with Retry-After.
 */
async function parseAIError(response: Response, endpoint: string): Promise<never> {
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
  } else if (type.includes('ai-parse-failure') || type.includes('ai_parse_failure')) {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
