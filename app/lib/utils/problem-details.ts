// app/lib/utils/problem-details.ts
//
// RFC 9457 Problem Details — shared utility for parsing error responses.
// Extracted from auth.ts's parseAuthError so both auth and environment
// endpoints can parse typed backend errors with trace_id.

export interface ProblemDetails {
  type: string;
  title: string;
  detail: string;
  /** RFC 9457 §3.2 — URI reference identifying the specific occurrence */
  instance?: string;
  trace_id?: string;
  /** W3C Trace Context header (traceparent) — preferred over X-Trace-Id for distributed tracing */
  traceparent?: string;
  status: number;
}

/**
 * Parses an HTTP error response into a typed ProblemDetails object.
 *
 * Guards response.json() with a Content-Type check. Non-JSON responses
 * (e.g., reverse proxy 502 HTML) fall through to response.text() for
 * a diagnostic body excerpt instead of crashing on invalid JSON.
 *
 * Captures both `traceparent` (W3C standard) and `X-Trace-Id` (legacy)
 * from response headers. Preference for traceparent in error detail.
 *
 * IMPORTANT: This function consumes the response body. Pass a cloned
 * response if the caller needs to read the body later.
 */
export async function parseProblemDetails(response: Response): Promise<ProblemDetails> {
  const status = response.status;
  const headerTraceId = response.headers.get('X-Trace-Id') || undefined;
  const traceparent = response.headers.get('traceparent') || undefined;

  const contentType = response.headers.get('content-type') || '';

  // Accept application/json, application/problem+json, and any +json suffix
  const isJson = contentType.includes('/json') || contentType.includes('+json');

  if (isJson) {
    try {
      const body = await response.json();
      return {
        type: body?.type || 'INTERNAL_ERROR',
        title: body?.title || `Error ${status}`,
        detail: body?.detail || response.statusText || `HTTP ${status}`,
        instance: body?.instance || undefined,
        trace_id: headerTraceId || body?.trace_id || undefined,
        traceparent: traceparent || body?.traceparent || undefined,
        status,
      };
    } catch {
      // JSON parse failed despite content-type claim — fall through to generic
    }
  }

  // Non-JSON body (or failed JSON parse) — extract diagnostic text excerpt
  let bodyExcerpt = '';
  try {
    const text = await response.text();
    bodyExcerpt = text.slice(0, 500);
  } catch {
    // body already consumed or unavailable
  }

  return {
    type: 'INTERNAL_ERROR',
    title: `Error ${status}`,
    detail: bodyExcerpt || response.statusText || `HTTP ${status}`,
    trace_id: headerTraceId || undefined,
    traceparent: traceparent || undefined,
    status,
  };
}
