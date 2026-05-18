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
  status: number;
}

/**
 * Parses an HTTP error response into a typed ProblemDetails object.
 *
 * Tries to parse the body as RFC 9457 JSON (`type`, `title`, `detail`,
 * `trace_id`, `instance`). Also captures `X-Trace-Id` from response headers
 * (preferred over body `trace_id` per canonical header convention).
 * If the body is not valid JSON, falls back to an INTERNAL_ERROR with the
 * HTTP status text as detail.
 *
 * IMPORTANT: This function consumes the response body. Pass a cloned
 * response if the caller needs to read the body later.
 */
export async function parseProblemDetails(response: Response): Promise<ProblemDetails> {
  const status = response.status;
  const headerTraceId = response.headers.get('X-Trace-Id') || undefined;

  try {
    const body = await response.json();
    return {
      type: body?.type || 'INTERNAL_ERROR',
      title: body?.title || `Error ${status}`,
      detail: body?.detail || response.statusText || `HTTP ${status}`,
      instance: body?.instance || undefined,
      trace_id: headerTraceId || body?.trace_id || undefined,
      status,
    };
  } catch {
    // Non-JSON body — fall back to generic error
    return {
      type: 'INTERNAL_ERROR',
      title: `Error ${status}`,
      detail: response.statusText || `HTTP ${status}`,
      trace_id: headerTraceId || undefined,
      status,
    };
  }
}
