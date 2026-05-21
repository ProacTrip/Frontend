// app/lib/api/documents-admin.ts
// Document Verification API — Dashboard Module
// Endpoints: GET /v1/dashboard/documents/:id/verification
//            PATCH /v1/dashboard/documents/:id/verification
//            POST /v1/dashboard/documents/:id/reprocess
// Cookie-Based Authorization — requiere users:read (grupo base)

import { API_URL, extractRateLimitHeaders } from './user';
import { ERROR_MAP } from '@/app/lib/utils/errors';
import { parseProblemDetails } from '@/app/lib/utils/problem-details';
import type { DashboardApiErrorCode } from '@/app/lib/types/auth';
import { rateLimitStore } from './rate-limit';
import type {
  DocumentVerification,
  UpdateVerificationBody,
  UpdateVerificationResponse,
  ReprocessResponse,
} from '@/app/lib/types/admin';

export class DashboardApiError extends Error {
  constructor(
    public readonly code: DashboardApiErrorCode,
    public readonly status: number,
    public readonly detail: string,
    public readonly traceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(`[${code}] ${detail}`);
    this.name = 'DashboardApiError';
  }
}

function extractDashboardErrorCode(type: string, status: number): DashboardApiErrorCode {
  if (!type) return status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR';
  if (type.includes('not-authenticated')) return 'NOT_AUTHENTICATED';
  if (type.includes('token-version-stale')) return 'TOKEN_VERSION_STALE';
  if (type.includes('account-disabled')) return 'ACCOUNT_DISABLED';
  if (type.includes('missing-permission')) return 'MISSING_PERMISSION';
  if (type.includes('user-not-found')) return 'USER_NOT_FOUND';
  if (type.includes('cannot-disable-self')) return 'CANNOT_DISABLE_SELF';
  if (type.includes('forbidden')) return 'FORBIDDEN';
  if (type.includes('document-not-found')) return 'DOCUMENT_NOT_FOUND';
  if (type.includes('validation-error')) return 'INVALID_INPUT';
  if (type.includes('not-implemented')) return 'INTERNAL_ERROR';
  if (status === 403) return 'FORBIDDEN';
  return 'INTERNAL_ERROR';
}

async function parseDashboardError(response: Response, endpoint: string): Promise<never> {
  const problem = await parseProblemDetails(response);
  const status = problem.status;

  let code: DashboardApiErrorCode;
  if (status === 429 || problem.type.includes('rate-limit')) {
    code = 'RATE_LIMIT_EXCEEDED';
  } else {
    code = extractDashboardErrorCode(problem.type, status);
  }

  const retryAfterHeader = response.headers.get('Retry-After');
  if (code === 'RATE_LIMIT_EXCEEDED' && retryAfterHeader) {
    rateLimitStore.block(parseInt(retryAfterHeader, 10));
  }

  extractRateLimitHeaders(response, endpoint);

  let message: string;
  if (code in ERROR_MAP) {
    message = ERROR_MAP[code];
  } else {
    const kebabKey = code.toLowerCase().replace(/_/g, '-');
    message = kebabKey in ERROR_MAP ? ERROR_MAP[kebabKey] : (problem.detail || problem.title || `Error ${status}`);
  }

  throw new DashboardApiError(
    code,
    status,
    message,
    problem.trace_id,
    retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined,
  );
}

// ==========================================
// GET /v1/dashboard/documents/:id/verification
// ==========================================

export async function getDocumentVerification(
  documentId: string,
): Promise<DocumentVerification> {
  const endpoint = `/v1/dashboard/documents/${documentId}/verification`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DashboardApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }
    throw error;
  }
}

// ==========================================
// PATCH /v1/dashboard/documents/:id/verification
// ==========================================

export async function updateDocumentVerification(
  documentId: string,
  body: UpdateVerificationBody,
): Promise<UpdateVerificationResponse> {
  const endpoint = `/v1/dashboard/documents/${documentId}/verification`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DashboardApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }
    throw error;
  }
}

// ==========================================
// POST /v1/dashboard/documents/:id/reprocess
// ==========================================

export async function reprocessDocument(
  documentId: string,
): Promise<ReprocessResponse> {
  const endpoint = `/v1/dashboard/documents/${documentId}/reprocess`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    extractRateLimitHeaders(response, endpoint);

    if (!response.ok) {
      await parseDashboardError(response, endpoint);
    }

    return await response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DashboardApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La petición ha excedido el tiempo de espera.');
    }
    throw error;
  }
}
