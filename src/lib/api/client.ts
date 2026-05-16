/**
 * Cookie-based API client — no Authorization headers.
 * Auth via HttpOnly cookies (credentials: 'include').
 *
 * Error format: RFC 9457 Problem Details.
 */

// ── Types ──

export interface ApiError {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
  traceId?: string;
  detail?: string;
}

/** RFC 9457 Problem Details shape from backend */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  trace_id?: string;
}

// ── Base URL ──

const BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── apiFetch ──

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let body: ProblemDetails | null = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON response
    }

    const code =
      body?.type?.split('/').pop()?.toUpperCase() || `HTTP_${response.status}`;
    const message =
      body?.detail || body?.title || `Error HTTP ${response.status}`;
    const error: ApiError = {
      code,
      message,
      status: response.status,
      traceId: body?.trace_id,
    };

    // Extract Retry-After header if present
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      error.retryAfter = parseInt(retryAfter, 10);
      // If Retry-After is a date string, convert to seconds
      if (isNaN(error.retryAfter)) {
        const date = new Date(retryAfter);
        if (!isNaN(date.getTime())) {
          error.retryAfter = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
        }
      }
    }

    // Log trace_id for support reference
    if (error.traceId) {
      console.error(
        `[apiFetch] Error ${error.code} (${error.status}) — trace: ${error.traceId}`
      );
    }

    // Attach detail for components that check .detail
    (error as ApiError & { detail: string }).detail = message;

    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ── Convenience methods ──

export const api = {
  get<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
