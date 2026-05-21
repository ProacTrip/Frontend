// app/lib/types/search-ai.ts
//
// Type definitions for POST /v1/search/ai — AI-powered conversational search.
// Discriminated union on `intent` field. Reuses existing flight/hotel types
// for result fields (identical format to direct search endpoints).

import type { FlightSearchResponse } from '@/app/lib/types/flight';
import type { SearchHotelsResponse } from '@/app/lib/types/hotel';

// ==========================================
// REQUEST
// ==========================================

export interface SearchAIRequest {
  /** Mensaje en lenguaje natural. No puede estar vacío ni ser solo espacios. */
  message: string;
  /** UUID v7 de conversación existente. Omitir en el primer mensaje. */
  conversation_id?: string;
  /** true para SSE streaming (MVP: no implementado en frontend). */
  stream?: boolean;
}

// ==========================================
// BASE RESPONSE — campos compartidos
// ==========================================

interface AIBaseResponse {
  conversation_id: string;
  turn_count: number;
  max_turns: number;
  intent: AIIntent;
  confidence: number;
  message: string;
  from_cache: boolean;
}

// ==========================================
// INTENT-SPECIFIC RESPONSES
// ==========================================

export interface AIIncompleteResponse extends AIBaseResponse {
  intent: 'incomplete';
  confidence: 0.0;
  missing_fields: string[];
  flights?: never;
  hotels?: never;
  flights_error?: never;
  hotels_error?: never;
}

export interface AIAmbiguousResponse extends AIBaseResponse {
  intent: 'ambiguous';
  missing_fields: string[];
  flights?: never;
  hotels?: never;
  flights_error?: never;
  hotels_error?: never;
}

export interface AIFlightsResponse extends AIBaseResponse {
  intent: 'flights';
  flights: FlightSearchResponse;
  hotels?: never;
  flights_error?: never;
  hotels_error?: never;
  missing_fields?: never;
}

export interface AIHotelsResponse extends AIBaseResponse {
  intent: 'hotels';
  hotels: SearchHotelsResponse;
  flights?: never;
  flights_error?: never;
  hotels_error?: never;
  missing_fields?: never;
}

export interface AIBothResponse extends AIBaseResponse {
  intent: 'both';
  flights: FlightSearchResponse | null;
  hotels: SearchHotelsResponse | null;
  flights_error?: string;
  hotels_error?: string;
  missing_fields?: never;
}

// Discovery mode — backend supports it, frontend handles gracefully
export interface AIDiscoveryResponse extends AIBaseResponse {
  intent: 'discovery';
  mode: 'discovery';
  candidates?: Array<{
    destination: string;
    country: string;
    region: string;
    tags: string[];
    budget_tier: string;
    best_months: number[];
    score: number;
    reasons: string[];
    source: string;
  }>;
  total_candidates?: number;
  needs_clarification?: boolean;
  clarification_question?: string;
}

// ==========================================
// DISCRIMINATED UNION
// ==========================================

export type AIResponse =
  | AIIncompleteResponse
  | AIAmbiguousResponse
  | AIFlightsResponse
  | AIHotelsResponse
  | AIBothResponse
  | AIDiscoveryResponse;

export type AIIntent = AIResponse['intent'];

// ==========================================
// CHAT MESSAGE (UI state)
// ==========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  intent?: AIIntent;
  flights?: FlightSearchResponse | null;
  hotels?: SearchHotelsResponse | null;
  flightsError?: string;
  hotelsError?: string;
  missingFields?: string[];
  timestamp: number;
}

// ==========================================
// ERROR CODES — RFC 9457 mapping
// ==========================================

export type AIErrorCode =
  | 'VALIDATION_ERROR'        // 400 — message vacío
  | 'TURN_LIMIT_EXCEEDED'     // 400 — se alcanzó max_turns
  | 'CONVERSATION_NOT_FOUND'  // 400 — conversation_id no existe/expiró
  | 'RATE_LIMIT_EXCEEDED'     // 429 — demasiadas peticiones
  | 'AI_PARSE_FAILURE'        // 502 — IA devolvió respuesta inválida
  | 'AI_UNAVAILABLE'          // 503 — IA no configurada o no responde
  | 'PROVIDER_UNAVAILABLE'    // 503 — SerpAPI no disponible
  | 'INTERNAL_ERROR';         // 500

/** Typed error class for AI search API errors. */
export class SearchAIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    public readonly status: number,
    public readonly detail: string,
    public readonly traceId?: string,
    public readonly retryAfter?: number,
  ) {
    super(`[${code}] ${detail}`);
    this.name = 'SearchAIError';
  }
}
