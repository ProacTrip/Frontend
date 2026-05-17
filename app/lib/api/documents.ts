// app/lib/api/documents.ts
//
// Raw fetch client for user document management.
// Cookie-based auth: credentials:"include", no Authorization header needed.
// Follows canonical user.ts pattern: typed errors, rate limit extraction,
// AbortController timeouts, direct fetch().
//
// 7 endpoints:
//   GET    /v1/user/documents/types         — public, cached 1h
//   POST   /v1/user/documents               — multipart upload
//   GET    /v1/user/documents               — list with filters
//   GET    /v1/user/documents/:id           — detail
//   GET    /v1/user/documents/:id/download   — download blob
//   DELETE /v1/user/documents/:id           — delete
//   GET    /v1/user/documents/:id/events    — SSE events

import type {
  DocumentType,
  DocumentUploadResponse,
  DocumentListItem,
  DocumentDetail,
  DocumentEvent,
  DocumentListResponse,
} from '@/app/lib/types/document';
import { rateLimitStore } from './rate-limit';
import { UserApiError } from './user';

// ==========================================
// SINGLE env var
// ==========================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==========================================
// HELPERS (mirrored from user.ts — private helpers)
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
 * Parse a non-ok Response into a typed UserApiError.
 * Maps RFC 9457 type URI → UserErrorCode (inherits user.ts codes + 3 document codes).
 * On 429, also calls rateLimitStore.block() with Retry-After.
 * Always calls extractRateLimitHeaders before throwing.
 */
async function parseDocumentError(response: Response, endpoint: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  const type: string = body?.type || '';
  const status = response.status;

  let code: import('./user').UserErrorCode;

  // 1. Rate limit — highest priority
  if (status === 429 || type.includes('rate_limit') || type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // 2. Type URI-based mapping (specific error codes)
  else if (type.includes('invalid-file-type')) {
    code = 'INVALID_FILE_TYPE';
  } else if (type.includes('file-too-large')) {
    code = 'FILE_TOO_LARGE';
  } else if (type.includes('document-not-found')) {
    code = 'DOCUMENT_NOT_FOUND';
  } else if (type.includes('document-not-ready')) {
    code = 'DOCUMENT_NOT_READY';
  } else if (type.includes('invalid-enum')) {
    code = 'INVALID_ENUM';
  } else if (type.includes('invalid-mime-type')) {
    code = 'INVALID_MIME_TYPE';
  } else if (type.includes('file-not-found')) {
    code = 'FILE_NOT_FOUND';
  } else if (type.includes('token-invalid')) {
    code = 'TOKEN_INVALID';
  } else if (type.includes('validation')) {
    code = 'VALIDATION_ERROR';
  }
  // 3. Status-based fallback
  else if (status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (status === 401) {
    code = 'TOKEN_INVALID';
  } else if (status === 404) {
    code = 'DOCUMENT_NOT_FOUND';
  } else {
    code = 'INTERNAL_ERROR';
  }

  const retryAfterHeader = response.headers.get('Retry-After');

  // On 429, block the rate limit store for the specified duration
  if (code === 'RATE_LIMIT_EXCEEDED' && retryAfterHeader) {
    rateLimitStore.block(parseInt(retryAfterHeader, 10));
  }

  // Always extract rate limit headers from error responses too
  extractRateLimitHeaders(response, endpoint);

  throw new UserApiError(
    code,
    status,
    body?.detail || body?.title || `Error ${status}`,
    body?.trace_id || undefined,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

// ==========================================
// WRAPPER — standard fetch with timeout + rate limit
// ==========================================

async function fetchWithTimeout(
  endpoint: string,
  init: RequestInit & { timeoutMs: number },
): Promise<Response> {
  const { timeoutMs, ...fetchInit } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchInit,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Always extract rate limit headers
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDocumentError(response, endpoint);
    }

    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Re-throw UserApiError as-is
    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.2 listDocumentTypes() — public endpoint
// ==========================================

/**
 * List all available document types (passport, visa, insurance, etc.).
 * Public endpoint — no auth required, but still sends credentials:include
 * (it doesn't hurt and avoids issues with cookie-based CSRF).
 * Backend returns Cache-Control: public, max-age=3600.
 */
export async function listDocumentTypes(): Promise<DocumentType[]> {
  const response = await fetchWithTimeout(
    '/v1/user/documents/types',
    {
      method: 'GET',
      credentials: 'include',
      timeoutMs: 10000,
    },
  );

  return await response.json();
}

// ==========================================
// 2.3 uploadDocument() — multipart/form-data
// ==========================================

/**
 * Upload a document file (PDF, JPEG, PNG).
 *
 * Client-side validation:
 * - Rejects files > 20MB BEFORE making the network request
 * - Throws with Spanish error message
 *
 * Uses FormData with NO explicit Content-Type header —
 * the browser auto-sets it with the correct multipart boundary.
 *
 * Timeout: 30s (uploads can be large).
 */
export async function uploadDocument(
  file: File,
  fileName?: string,
): Promise<DocumentUploadResponse> {
  // Client-side size validation
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_SIZE) {
    throw new UserApiError(
      'FILE_TOO_LARGE',
      400,
      'El archivo supera los 20MB. Comprimilo o elegí uno más chico.',
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_name', fileName || file.name);

  // IMPORTANT: Do NOT set Content-Type header —
  // the browser sets it with the correct multipart boundary

  const response = await fetchWithTimeout(
    '/v1/user/documents',
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
      timeoutMs: 30000,
    },
  );

  return await response.json();
}

// ==========================================
// 2.4 listDocuments() — filtered list
// ==========================================

/**
 * List user documents, optionally filtered by status and/or document type.
 *
 * Timeout: 10s.
 * Returns: DocumentListItem[] (wrapped in DocumentListResponse).
 */
export async function listDocuments(params?: {
  status?: string;
  document_type?: string;
}): Promise<DocumentListResponse> {
  let url = '/v1/user/documents';

  const queryParts: string[] = [];
  if (params?.status) {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.document_type) {
    queryParts.push(`document_type=${encodeURIComponent(params.document_type)}`);
  }
  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`;
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      credentials: 'include',
      timeoutMs: 10000,
    },
  );

  return await response.json();
}

// ==========================================
// 2.5 getDocument() — detail
// ==========================================

/**
 * Get full document detail including extracted_data.
 *
 * Timeout: 10s.
 * Returns: DocumentDetail with all metadata and OCR results.
 */
export async function getDocument(id: string): Promise<DocumentDetail> {
  const response = await fetchWithTimeout(
    `/v1/user/documents/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      credentials: 'include',
      timeoutMs: 10000,
    },
  );

  return await response.json();
}

// ==========================================
// 2.6 downloadDocument() — blob download
// ==========================================

/**
 * Download a document file.
 *
 * Fetches the file as a blob, creates an ObjectURL, and triggers
 * a download via an anchor click. Extracts filename from the
 * Content-Disposition header when available.
 *
 * Handles DOCUMENT_NOT_READY when the document is still processing.
 * Timeout: 30s (file download can be large).
 */
export async function downloadDocument(id: string): Promise<void> {
  const endpoint = `/v1/user/documents/${encodeURIComponent(id)}/download`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDocumentError(response, endpoint);
    }

    const blob = await response.blob();

    // Extract filename from Content-Disposition header
    let filename = 'documento';
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    // Trigger download via blob URL
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof UserApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La descarga ha excedido el tiempo de espera.');
    }

    throw error;
  }
}

// ==========================================
// 2.7 deleteDocument()
// ==========================================

/**
 * Delete a document by ID.
 *
 * Timeout: 10s.
 * Returns: { message: string }.
 */
export async function deleteDocument(id: string): Promise<{ message: string }> {
  const response = await fetchWithTimeout(
    `/v1/user/documents/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      credentials: 'include',
      timeoutMs: 10000,
    },
  );

  return await response.json();
}

// ==========================================
// 2.8 subscribeToDocumentEvents() — SSE
// ==========================================

/**
 * Subscribe to Server-Sent Events for real-time document pipeline tracking.
 *
 * Creates an EventSource with { withCredentials: true } so cookies are
 * sent automatically. Parses each SSE event as a JSON DocumentEvent.
 *
 * EventSource auto-reconnects on connection errors natively.
 * Returns a cleanup function that closes the connection.
 *
 * @param docId — Document ID to track
 * @param onEvent — Callback for each SSE event (parsed as DocumentEvent)
 * @param onError — Optional callback for EventSource errors
 * @returns Cleanup function (call to close the EventSource)
 */
export function subscribeToDocumentEvents(
  docId: string,
  onEvent: (event: DocumentEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  const eventsUrl = `${API_URL}/v1/user/documents/${encodeURIComponent(docId)}/events`;
  const es = new EventSource(eventsUrl, { withCredentials: true });

  es.onmessage = (e: MessageEvent) => {
    try {
      const parsed: DocumentEvent = JSON.parse(e.data);
      onEvent(parsed);
    } catch {
      // Ignore non-JSON messages (e.g., heartbeats)
    }
  };

  if (onError) {
    es.onerror = onError;
  }

  return () => {
    es.close();
  };
}
