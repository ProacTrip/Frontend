// ==========================================
// Proxy fetch helper — server-side Next.js API routes
// Forwards browser cookies to the backend via Cookie header
// ==========================================

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

interface ProxyOptions {
  method?: string;
  body?: unknown;
  /** Passthrough extra request headers from the client */
  passthroughHeaders?: string[];
}

/**
 * Forwards a client request to the backend, preserving all cookies.
 * The browser sends auth cookies (PASETO tokens) via the Cookie header
 * — we forward them as-is to the backend.
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

  return fetch(`${BACKEND_URL}${endpoint}`, fetchOpts);
}
