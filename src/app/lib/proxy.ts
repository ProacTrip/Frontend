// ==========================================
// Proxy fetch helper — server-side Next.js API routes
// Forwards browser cookies to the backend via Cookie header
// ==========================================

import { parseProblemDetails } from '@/app/lib/utils/problem-details';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const PROXY_TIMEOUT_MS = 15_000; // 15s timeout for all proxy requests

interface ProxyOptions {
  method?: string;
  body?: unknown;
  /** Passthrough extra request headers from the client */
  passthroughHeaders?: string[];
}

/**
 * Typed error thrown by proxyFetch when the backend returns a non-2xx status,
 * times out, or a network error occurs.
 *
 * Callers (API route handlers) catch this in their existing try/catch blocks
 * and return appropriate NextResponse error payloads.
 */
export class ProxyError extends Error {
  constructor(
    public status: number,
    public type: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}

/**
 * Forwards a client request to the backend, preserving all cookies.
 * The browser sends auth cookies (PASETO tokens) via the Cookie header
 * — we forward them as-is to the backend.
 *
 * Hardened with:
 *   - 15s AbortController timeout (prevents hanging requests)
 *   - RFC 9457 Problem Details parsing on non-2xx responses
 *   - Typed ProxyError with status code on failures
 *   - Contextual wrapping of network errors
 */
export async function proxyFetch(
  clientReq: Request,
  endpoint: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const cookieHeader = clientReq.headers.get('cookie') || '';

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cookieHeader) {
    fetchHeaders['Cookie'] = cookieHeader;
  }

  // Passthrough extra headers (e.g., Idempotency-Key, X-Request-Id)
  const passthrough = options.passthroughHeaders ?? [];
  for (const h of passthrough) {
    const v = clientReq.headers.get(h);
    if (v) fetchHeaders[h] = v;
  }

  const fetchOpts: RequestInit = {
    method: options.method ?? 'GET',
    headers: fetchHeaders,
  };

  if (options.body) {
    fetchOpts.body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOpts,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Clone before parsing — parseProblemDetails consumes the body
      const problem = await parseProblemDetails(response.clone());
      throw new ProxyError(
        response.status,
        problem.type,
        problem.detail || `Backend returned HTTP ${response.status}`,
      );
    }

    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ProxyError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ProxyError(
        504,
        'PROXY_TIMEOUT',
        `El backend no respondió a tiempo (${PROXY_TIMEOUT_MS / 1000}s timeout).`,
      );
    }

    // Wrap unknown network errors with context so they don't leak raw
    // TypeError: fetch failed to the client
    throw new ProxyError(
      502,
      'PROXY_NETWORK_ERROR',
      error instanceof Error ? `Error de red: ${error.message}` : 'Error de red al contactar el backend.',
    );
  }
}
