import { describe, it, expect, vi } from 'vitest';
import { parseProblemDetails } from '../problem-details';

function createMockResponse(
  status: number,
  options: {
    contentType?: string;
    body?: unknown;
    statusText?: string;
    traceparent?: string;
    xTraceId?: string;
  } = {}
): Response {
  const {
    contentType = 'application/json',
    body = { type: 'test-error', title: 'Test Error', detail: 'Something went wrong' },
    statusText = 'Error',
    traceparent,
    xTraceId,
  } = options;

  const headers = new Headers();
  headers.set('content-type', contentType);
  if (traceparent) headers.set('traceparent', traceparent);
  if (xTraceId) headers.set('X-Trace-Id', xTraceId);

  return {
    status,
    statusText,
    headers,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(
      contentType.includes('json') ? JSON.stringify(body) : '<html>502 Bad Gateway</html>'
    ),
  } as unknown as Response;
}

describe('parseProblemDetails', () => {
  it('parses JSON error body normally with application/json content-type', async () => {
    const response = createMockResponse(500, {
      body: { type: 'SERVER_ERROR', title: 'Server Error', detail: 'boom' },
    });

    const result = await parseProblemDetails(response);

    expect(result.type).toBe('SERVER_ERROR');
    expect(result.title).toBe('Server Error');
    expect(result.detail).toBe('boom');
    expect(response.json).toHaveBeenCalled();
  });

  it('handles application/problem+json content-type', async () => {
    const response = createMockResponse(400, {
      contentType: 'application/problem+json',
      body: { type: 'VALIDATION_ERROR', title: 'Bad Input', detail: 'missing field' },
    });

    const result = await parseProblemDetails(response);

    expect(result.type).toBe('VALIDATION_ERROR');
    expect(response.json).toHaveBeenCalled();
  });

  it('falls back to text on non-JSON content-type (text/html)', async () => {
    const response = createMockResponse(502, {
      contentType: 'text/html',
      statusText: 'Bad Gateway',
    });

    const result = await parseProblemDetails(response);

    expect(result.type).toBe('INTERNAL_ERROR');
    expect(result.title).toBe('Error 502');
    // Should contain body excerpt from text()
    expect(result.detail).toContain('502 Bad Gateway');
    expect(response.text).toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('captures traceparent header', async () => {
    const response = createMockResponse(500, {
      body: { type: 'ERROR', title: 'Err', detail: 'x' },
      traceparent: '00-abc123-def456-01',
    });

    const result = await parseProblemDetails(response);

    expect(result.traceparent).toBe('00-abc123-def456-01');
  });

  it('captures X-Trace-Id header', async () => {
    const response = createMockResponse(500, {
      body: { type: 'ERROR', title: 'Err', detail: 'x' },
      xTraceId: 'xyz-789',
    });

    const result = await parseProblemDetails(response);

    expect(result.trace_id).toBe('xyz-789');
  });

  it('captures both traceparent and X-Trace-Id', async () => {
    const response = createMockResponse(500, {
      body: { type: 'ERROR', title: 'Err', detail: 'x' },
      traceparent: '00-abc-def-01',
      xTraceId: 'legacy-id',
    });

    const result = await parseProblemDetails(response);

    expect(result.traceparent).toBe('00-abc-def-01');
    expect(result.trace_id).toBe('legacy-id');
  });

  it('returns INTERNAL_ERROR when JSON parse fails despite content-type claim', async () => {
    const response = createMockResponse(500, {
      contentType: 'application/json',
      body: undefined,
    });
    // Override json to throw
    (response.json as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Unexpected token')
    );
    // Override text to return diagnostc text
    (response.text as ReturnType<typeof vi.fn>).mockResolvedValue(
      'not-json-body'
    );

    const result = await parseProblemDetails(response);

    expect(result.type).toBe('INTERNAL_ERROR');
    expect(result.title).toBe('Error 500');
  });

  it('handles missing content-type header (backward compat)', async () => {
    const response = createMockResponse(500, {
      contentType: '',
      body: { type: 'ERROR', title: 'Err', detail: 'x' },
    });

    const result = await parseProblemDetails(response);

    // Without application/json, falls through to text path
    expect(result.type).toBe('INTERNAL_ERROR');
    expect(result.title).toBe('Error 500');
  });
});
