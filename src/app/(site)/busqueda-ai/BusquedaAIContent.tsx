'use client';

import { useRef, useEffect, useCallback, useReducer, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useRealtimeSSE } from '@/hooks/useRealtimeSSE';
import { SearchAIError } from '@/app/lib/types/search-ai';
import type { AIErrorCode } from '@/app/lib/types/search-ai';
import type { ChatMessage, AIDiscoveryResponse } from '@/app/lib/types/search-ai';
import type { FlightSearchResponse, FlightOffer } from '@/app/lib/types/flight';
import type { SearchHotelsResponse, FrontendHotel, BackendSearchHotel } from '@/app/lib/types/hotel';
import { adaptSearchResults } from '@/app/lib/utils/transformers';
import { connectSSE, parseAIError, recoverConversation, listConversations } from '@/app/lib/api/search-ai';
import { searchFlights } from '@/app/lib/api/flights';
import { goToCheckout } from '@/app/lib/utils/checkoutUtils';
import { useLocalePreferences } from '@/hooks/useLocalePreferences';
import type { RecoveredConversation, ConversationPreview } from '@/app/lib/api/search-ai';
import AIChatSidebar from './components/AIChatSidebar';
import AIResultsPanel from './components/AIResultsPanel';
import MedicalAlertsModal from './components/MedicalAlertsModal';

// ─── CONSTANTS ────────────────────────────────────────
const LS_CONVERSATION_ID = 'ai_search_conversation_id';
const LS_TURN_COUNT = 'ai_search_turn_count';
const LS_MAX_TURNS = 'ai_search_max_turns';
const LS_MESSAGES = 'ai_search_messages';
const LS_RESULTS = 'ai_search_results';

const ERROR_MESSAGES: Record<AIErrorCode, string> = {
  VALIDATION_ERROR: 'El mensaje no puede estar vacío.',
  TURN_LIMIT_EXCEEDED: 'Límite de turnos alcanzado. Iniciá una nueva conversación.',
  CONVERSATION_NOT_FOUND: 'La conversación expiró. Empecemos de nuevo.',
  RATE_LIMIT_EXCEEDED: 'Demasiadas consultas. Esperá unos segundos.',
  AI_PARSE_FAILURE: 'La IA tuvo un problema interpretando. Probá de nuevo.',
  AI_UNAVAILABLE: 'El servicio de IA no está disponible en este momento.',
  PROVIDER_UNAVAILABLE: 'El servicio de búsqueda no está disponible.',
  INTERNAL_ERROR: 'Error interno del servidor. Intentá más tarde.',
};

// ─── SSE STATE MACHINE ────────────────────────────────
type SSEState = 'IDLE' | 'THINKING' | 'STREAMING' | 'COMPLETE' | 'ERROR';

interface SSEResultPayload {
  flights?: FlightSearchResponse | null;
  hotels?: SearchHotelsResponse | null;
  flights_error?: string;
  hotels_error?: string;
  candidates?: AIDiscoveryResponse['candidates'];
  needs_clarification?: boolean;
  clarification_question?: string;
  weather?: WeatherData;
  alert?: MedicalAlertData;
  /** Original AI-extracted search params (dates, airports, adults, etc.) from the SSE event */
  search_params?: Record<string, unknown> | null;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon?: string;
  location?: string;
  date?: string;
}

interface MedicalAlertData {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
}

interface ChatState {
  messages: ChatMessage[];
  sseState: SSEState;
  conversationId: string | null;
  turnInfo: { current: number; max: number } | null;
  error: string | null;
  results: SSEResultPayload | null;
  weather: WeatherData | null;
  medicalAlert: MedicalAlertData | null;
  // Current streaming AI message (being built incrementally)
  streamingText: string;
  streamingMessageId: string | null;
}

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; message: ChatMessage }
  | { type: 'SET_SSE_STATE'; state: SSEState }
  | { type: 'APPEND_CHUNK'; text: string }
  | { type: 'START_STREAMING_MESSAGE'; id: string }
  | { type: 'FINALIZE_STREAM' }
  | { type: 'SET_RESULTS'; results: SSEResultPayload }
  | { type: 'SET_WEATHER'; weather: WeatherData }
  | { type: 'SET_MEDICAL_ALERT'; alert: MedicalAlertData }
  | { type: 'DISMISS_MEDICAL_ALERT' }
  | { type: 'SET_CONVERSATION_ID'; id: string }
  | { type: 'SET_TURN_INFO'; turnInfo: { current: number; max: number } }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'ADD_AI_MESSAGE'; message: ChatMessage }
  | { type: 'SET_MISSING_FIELDS'; fields: string[] }
  | { type: 'RESTORE_CONVERSATION'; payload: { messages: ChatMessage[]; conversationId: string; turnInfo: { current: number; max: number }; results: SSEResultPayload | null } }
  | { type: 'RESET' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        error: null,
      };
    case 'SET_SSE_STATE':
      // Clear stale search_params when starting a new search
      return {
        ...state,
        sseState: action.state,
        ...(action.state === 'THINKING' && state.results?.search_params
          ? { results: { ...state.results, search_params: undefined } }
          : {}),
      };
    case 'START_STREAMING_MESSAGE':
      return { ...state, streamingMessageId: action.id, streamingText: '' };
    case 'APPEND_CHUNK': {
      // Append text to the streaming AI message
      const streamingId = state.streamingMessageId;
      return {
        ...state,
        streamingText: state.streamingText + action.text,
        messages: state.messages.map((m) =>
          m.id === streamingId ? { ...m, text: state.streamingText + action.text } : m,
        ),
      };
    }
    case 'FINALIZE_STREAM':
      return {
        ...state,
        streamingMessageId: null,
        streamingText: '',
        sseState: 'COMPLETE',
      };
    case 'SET_RESULTS':
      // Merge with existing results — multiple search events may arrive
      // (flights first, then hotels) and we must accumulate them.
      return {
        ...state,
        results: {
          flights: action.results.flights ?? state.results?.flights ?? null,
          hotels: action.results.hotels ?? state.results?.hotels ?? null,
          flights_error: action.results.flights_error ?? state.results?.flights_error,
          hotels_error: action.results.hotels_error ?? state.results?.hotels_error,
          candidates: action.results.candidates ?? state.results?.candidates,
          needs_clarification: action.results.needs_clarification ?? state.results?.needs_clarification,
          clarification_question: action.results.clarification_question ?? state.results?.clarification_question,
          // Preserve AI search params (first arrival wins — subsequent events may not have them)
          search_params: action.results.search_params ?? state.results?.search_params,
        },
      };
    case 'SET_WEATHER':
      return { ...state, weather: action.weather };
    case 'SET_MEDICAL_ALERT':
      return { ...state, medicalAlert: action.alert };
    case 'DISMISS_MEDICAL_ALERT':
      return { ...state, medicalAlert: null };
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.id };
    case 'SET_TURN_INFO':
      return { ...state, turnInfo: action.turnInfo };
    case 'SET_ERROR':
      return { ...state, error: action.error, sseState: 'ERROR' };
    case 'ADD_AI_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_MISSING_FIELDS': {
      // Attach missingFields to the last AI message (streaming or finalized)
      const msgs = [...state.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'ai') {
          msgs[i] = { ...msgs[i], missingFields: action.fields };
          break;
        }
      }
      return { ...state, messages: msgs };
    }
    case 'RESTORE_CONVERSATION':
      return {
        ...state,
        conversationId: action.payload.conversationId,
        turnInfo: action.payload.turnInfo,
        messages: action.payload.messages,
        results: action.payload.results,
      };
    case 'RESET':
      return {
        ...INITIAL_STATE,
        sseState: 'IDLE',
        conversationId: null,
        turnInfo: null,
        error: null,
        results: null,
        weather: null,
        medicalAlert: null,
        streamingText: '',
        streamingMessageId: null,
        messages: [],
      };
    default:
      return state;
  }
}

const INITIAL_STATE: ChatState = {
  messages: [],
  sseState: 'IDLE',
  conversationId: null,
  turnInfo: null,
  error: null,
  results: null,
  weather: null,
  medicalAlert: null,
  streamingText: '',
  streamingMessageId: null,
};

// ─── HELPERS ──────────────────────────────────────────
function adaptHotelsFromResponse(hotels: SearchHotelsResponse): FrontendHotel[] {
  try {
    return adaptSearchResults(hotels.properties as BackendSearchHotel[], {
      query: '',
      check_in_date: '',
      check_out_date: '',
      adults: 1,
      children: 0,
      children_ages: [],
      rooms: 1,
    });
  } catch {
    return [];
  }
}

function extractFlightOffers(flights: FlightSearchResponse): FlightOffer[] {
  if (!flights) return [];
  return [...(flights.best_flights || []), ...(flights.other_flights || [])];
}

// ─── COMPONENT ────────────────────────────────────────
export default function BusquedaAIContent() {
  const { isAuthenticated } = useAuth();
  const { isBlocked, secondsLeft } = useRateLimit();
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  // Real-time SSE for conversation expiry events (works for both auth + anon)
  useRealtimeSSE();

  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE, (init) => ({
    ...init,
    conversationId:
      typeof window !== 'undefined' ? localStorage.getItem(LS_CONVERSATION_ID) : null,
    turnInfo: (() => {
      if (typeof window === 'undefined') return null;
      const current = localStorage.getItem(LS_TURN_COUNT);
      const max = localStorage.getItem(LS_MAX_TURNS);
      if (current && max) return { current: parseInt(current), max: parseInt(max) };
      return null;
    })(),
    // Restore messages from localStorage as immediate fallback
    messages: (() => {
      if (typeof window === 'undefined') return [];
      try {
        const raw = localStorage.getItem(LS_MESSAGES);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })(),
    results: (() => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem(LS_RESULTS);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    })(),
  }));

  const chatInputRef = useRef<{ focus: () => void } | null>(null);
  const { currency: localeCurrency } = useLocalePreferences();

  // ─── F5 Recovery (REQ-C4) ──────────────────────────
  // Backend is authoritative — always attempt recovery when conversationId exists.
  // localStorage is fallback ONLY if backend returns 404.
  // On 404: clear localStorage for that conversation, start fresh.
  const savedConversationId = state.conversationId;
  const recoveryAppliedRef = useRef<string | null>(null);
  // Track conversations completed by the current SSE stream — don't recover these
  // because their results/messages are already fresh in state.
  const streamCompletedRef = useRef<string | null>(null);

  const { data: recoveredData, isError: recoveryFailed } = useQuery({
    queryKey: ['conversation', savedConversationId] as const,
    queryFn: () => recoverConversation(savedConversationId!),
    enabled: !!savedConversationId,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    // Skip recovery for conversations that were just completed by the active SSE stream.
    // Their data is already live in state — recovery would overwrite with stale/null data.
    if (savedConversationId && streamCompletedRef.current === savedConversationId) {
      return;
    }
    if (
      recoveredData &&
      savedConversationId &&
      recoveryAppliedRef.current !== savedConversationId
    ) {
      recoveryAppliedRef.current = savedConversationId;
      dispatch({
        type: 'RESTORE_CONVERSATION',
        payload: {
          messages: recoveredData.messages,
          conversationId: recoveredData.conversation_id,
          turnInfo: { current: recoveredData.turn_count, max: recoveredData.max_turns },
          results: (recoveredData.results as SSEResultPayload) || null,
        },
      });
    }
  }, [recoveredData, savedConversationId]);

  useEffect(() => {
    if (recoveryFailed) {
      // Backend recovery failed (expired/404) — clear all conversation state
      // so user starts fresh (REQ-C4: localStorage is fallback ONLY on 404).
      localStorage.removeItem(LS_CONVERSATION_ID);
      localStorage.removeItem(LS_TURN_COUNT);
      localStorage.removeItem(LS_MAX_TURNS);
      localStorage.removeItem(LS_MESSAGES);
      localStorage.removeItem(LS_RESULTS);
      dispatch({ type: 'SET_SSE_STATE', state: 'IDLE' });
    }
  }, [recoveryFailed]);

  // ─── Conversation history list ──────────────────────
  const { data: conversationsList = [] } = useQuery({
    queryKey: ['ai-conversations'] as const,
    queryFn: listConversations,
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll every 30s to detect expired conversations
  });

  // ─── Auto-search from URL query param (navbar redirect) ─
  const searchParams = useSearchParams();
  const router = useRouter();
  const handleSendRef = useRef<(text: string) => void>(() => {});
  const lastAutoSearchQ = useRef<string | null>(null);
  const [pendingAutoSearch, setPendingAutoSearch] = useState<string | null>(null);

  // ─── Pre-fill from URL prompt param (homepage cards, no auto-send) ─
  const [prefillText, setPrefillText] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== lastAutoSearchQ.current) {
      lastAutoSearchQ.current = q;
      // Clean the URL so this doesn't re-fire
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      const newUrl = params.toString()
        ? `/busqueda-ai?${params.toString()}`
        : '/busqueda-ai';
      router.replace(newUrl, { scroll: false });

      // Navbar search always starts a fresh conversation — reset state first.
      // Safe because pendingAutoSearch effect runs AFTER handleSendRef is synced.
      dispatch({ type: 'RESET' });
      setPendingAutoSearch(q);
    }

    // Read prompt param — pre-fill chat without auto-sending
    const prompt = searchParams.get('prompt');
    if (prompt && prefillText !== prompt) {
      setPrefillText(prompt);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('prompt');
      const newUrl = params.toString()
        ? `/busqueda-ai?${params.toString()}`
        : '/busqueda-ai';
      router.replace(newUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Persist conversation state ─────────────────────
  useEffect(() => {
    if (state.conversationId) {
      localStorage.setItem(LS_CONVERSATION_ID, state.conversationId);
    } else {
      localStorage.removeItem(LS_CONVERSATION_ID);
    }
  }, [state.conversationId]);

  useEffect(() => {
    if (state.turnInfo) {
      localStorage.setItem(LS_TURN_COUNT, String(state.turnInfo.current));
      localStorage.setItem(LS_MAX_TURNS, String(state.turnInfo.max));
    } else {
      localStorage.removeItem(LS_TURN_COUNT);
      localStorage.removeItem(LS_MAX_TURNS);
    }
  }, [state.turnInfo]);

  // Persist messages to localStorage as fallback for anonymous users
  useEffect(() => {
    if (state.messages.length > 0) {
      try {
        localStorage.setItem(LS_MESSAGES, JSON.stringify(state.messages));
      } catch { /* localStorage full — ignore */ }
    }
  }, [state.messages]);

  useEffect(() => {
    if (state.results) {
      try {
        localStorage.setItem(LS_RESULTS, JSON.stringify(state.results));
      } catch { /* ignore */ }
    } else {
      localStorage.removeItem(LS_RESULTS);
    }
  }, [state.results]);

  // ─── Derived state ──────────────────────────────────
  const turnLimitReached =
    state.turnInfo !== null && state.turnInfo.current >= state.turnInfo.max;
  const isStreaming = state.sseState === 'STREAMING' || state.sseState === 'THINKING';
  const inputDisabled = isStreaming || turnLimitReached || isBlocked;

  // ─── Handle send ────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      if (inputDisabled) return;

      // Remember last user message for retry
      lastUserMessageRef.current = text;

      // Abort any existing stream
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      // Create user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg });

      // Create placeholder AI message for streaming
      const aiMsgId = crypto.randomUUID();
      const aiPlaceholder: ChatMessage = {
        id: aiMsgId,
        role: 'ai',
        text: '',
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_USER_MESSAGE', message: aiPlaceholder });
      // Tell the reducer which message to stream text into
      dispatch({ type: 'START_STREAMING_MESSAGE', id: aiMsgId });

      dispatch({ type: 'SET_SSE_STATE', state: 'THINKING' });

      try {
        await connectSSE(
          text,
          state.conversationId,
          controller.signal,
          (eventType, data) => {
            switch (eventType) {
              case 'status': {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.status === 'thinking') {
                    dispatch({ type: 'SET_SSE_STATE', state: 'THINKING' });
                  }
                } catch { /* ignore parse errors */ }
                break;
              }
              case 'chunk': {
                // Incremental text streaming
                dispatch({ type: 'SET_SSE_STATE', state: 'STREAMING' });
                try {
                  const parsed = JSON.parse(data);
                  // Backend sends "content" field, not "text"
                  dispatch({ type: 'APPEND_CHUNK', text: parsed.content || parsed.text || data });
                } catch {
                  dispatch({ type: 'APPEND_CHUNK', text: data });
                }
                break;
              }
              case 'search': {
                try {
                  const parsed = JSON.parse(data);
                  // Backend sends: { destination, type: "flights"|"hotels", data: {...} }
                  // Merge with existing results (flights + hotels arrive separately)
                  dispatch({
                    type: 'SET_RESULTS',
                    results: {
                      flights: parsed.type === 'flights' ? parsed.data : undefined,
                      hotels: parsed.type === 'hotels' ? parsed.data : undefined,
                      flights_error: undefined,
                      hotels_error: undefined,
                      candidates: parsed.candidates,
                      needs_clarification: parsed.needs_clarification,
                      clarification_question: parsed.clarification_question,
                      // Only store flight search_params (hotels have different schema)
                      search_params: parsed.type === 'flights' && parsed.search_params
                        ? parsed.search_params
                        : state.results?.search_params,
                    },
                  });
                } catch { /* ignore */ }
                break;
              }
              case 'weather': {
                try {
                  const parsed = JSON.parse(data);
                  // SSE weather event: { destination, weather: { temp, description, icon, ... } }
                  const w = parsed.weather || parsed;
                  dispatch({
                    type: 'SET_WEATHER',
                    weather: {
                      temperature: w.temp ?? w.temperature ?? 0,
                      description: w.description || '',
                      icon: w.icon,
                      location: parsed.destination || parsed.location,
                    },
                  });
                } catch { /* ignore */ }
                break;
              }
              case 'alert': {
                try {
                  const parsed = JSON.parse(data);
                  // Backend sends: { alerts: [{ level, type, message }] }
                  const alerts = parsed.alerts;
                  if (alerts && Array.isArray(alerts) && alerts.length > 0) {
                    const first = alerts[0];
                    // Build title from alert type
                    const typeLabels: Record<string, string> = {
                      allergy: 'Alergia',
                      medication: 'Medicación',
                      vaccination: 'Vacunación',
                      condition: 'Condición médica',
                      travel: 'Aviso de viaje',
                      document: 'Documentación',
                    };
                    const title = typeLabels[first.type] || 'Alerta';
                    const severityMap: Record<string, MedicalAlertData['severity']> = {
                      info: 'info',
                      warning: 'warning',
                      danger: 'critical',
                    };
                    dispatch({
                      type: 'SET_MEDICAL_ALERT',
                      alert: {
                        title,
                        description: first.message || 'Sin detalles adicionales',
                        severity: severityMap[first.level] || 'info',
                      },
                    });
                  }
                } catch { /* ignore */ }
                break;
              }
              case 'done': {
                // Backend emits 'done' for streaming completion (instead of 'result')
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.conversation_id) {
                    dispatch({ type: 'SET_CONVERSATION_ID', id: parsed.conversation_id });
                    // Mark as stream-completed so recovery doesn't overwrite fresh results
                    streamCompletedRef.current = parsed.conversation_id;
                  }
                  if (parsed.turn_count !== undefined) {
                    dispatch({
                      type: 'SET_TURN_INFO',
                      turnInfo: {
                        current: parsed.turn_count,
                        max: parsed.max_turns || (isAuthenticated ? 10 : 5),
                      },
                    });
                  }
                  if (parsed.missing_fields && Array.isArray(parsed.missing_fields) && parsed.missing_fields.length > 0) {
                    dispatch({ type: 'SET_MISSING_FIELDS', fields: parsed.missing_fields });
                  }
                  dispatch({ type: 'FINALIZE_STREAM' });
                } catch { /* ignore */ }
                break;
              }
              case 'result': {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.conversation_id) {
                    dispatch({ type: 'SET_CONVERSATION_ID', id: parsed.conversation_id });
                    streamCompletedRef.current = parsed.conversation_id;
                  }
                  if (parsed.turn_count !== undefined) {
                    dispatch({
                      type: 'SET_TURN_INFO',
                      turnInfo: {
                        current: parsed.turn_count,
                        max: parsed.max_turns || (isAuthenticated ? 10 : 5),
                      },
                    });
                  }
                  // Attach missingFields from the AI response (incomplete/ambiguous intents)
                  if (parsed.missing_fields && Array.isArray(parsed.missing_fields) && parsed.missing_fields.length > 0) {
                    dispatch({ type: 'SET_MISSING_FIELDS', fields: parsed.missing_fields });
                  }
                  // Update the AI message with final text
                  dispatch({ type: 'FINALIZE_STREAM' });
                } catch { /* ignore */ }
                break;
              }
              case 'error': {
                try {
                  const parsed = JSON.parse(data);
                  const errCode = parsed.code as AIErrorCode;
                  dispatch({
                    type: 'SET_ERROR',
                    error: ERROR_MESSAGES[errCode] || parsed.message || data,
                  });
                  if (errCode === 'CONVERSATION_NOT_FOUND') {
                    dispatch({ type: 'RESET' });
                    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
                  }
                } catch {
                  dispatch({
                    type: 'SET_ERROR',
                    error: typeof data === 'string' ? data : 'Error inesperado.',
                  });
                }
                break;
              }
            }
          },
          localeCurrency,
        );

        // If stream ends without result event, finalize
        if (state.sseState !== 'ERROR') {
          dispatch({ type: 'FINALIZE_STREAM' });
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[busqueda-ai] SSE stream error:', err);
        }
        if (err instanceof Error && err.name === 'AbortError') {
          // Stream was cancelled intentionally — do nothing
          dispatch({ type: 'SET_SSE_STATE', state: 'IDLE' });
          return;
        }

        let errorText: string;
        if (err instanceof SearchAIError) {
          errorText = ERROR_MESSAGES[err.code] || err.detail;

          if (err.code === 'CONVERSATION_NOT_FOUND') {
            dispatch({ type: 'RESET' });
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
          }
          if (err.code === 'TURN_LIMIT_EXCEEDED') {
            dispatch({
              type: 'SET_TURN_INFO',
              turnInfo: {
                current: state.turnInfo?.max || (isAuthenticated ? 10 : 5),
                max: state.turnInfo?.max || (isAuthenticated ? 10 : 5),
              },
            });
          }
        } else if (err instanceof TypeError && err.message.includes('fetch')) {
          errorText = 'Sin conexión. Verificá tu internet e intentá de nuevo.';
        } else if (err instanceof Error) {
          errorText = err.message;
        } else {
          errorText = 'Error inesperado al procesar tu consulta.';
        }

        // Update AI placeholder message with error
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          text: errorText,
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_AI_MESSAGE', message: errorMsg });
        dispatch({ type: 'SET_ERROR', error: errorText });
      }
    },
    [
      inputDisabled,
      state.conversationId,
      state.sseState,
      state.turnInfo,
      isAuthenticated,
      queryClient,
      localeCurrency,
    ],
  );
  // Keep ref in sync for auto-search from URL (must be in effect, not render)
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // ─── Execute pending auto-search once handleSendRef is synced ──
  useEffect(() => {
    if (!pendingAutoSearch) return;
    const query = pendingAutoSearch;
    setPendingAutoSearch(null);
    handleSendRef.current(query);
  }, [pendingAutoSearch]);

  // ─── Handle field select (FollowUpPrompt chip click) ─
  const handleFieldSelect = useCallback(
    () => {
      chatInputRef.current?.focus();
    },
    [], // ref is stable
  );

  // ─── Re-trigger search when currency changes ────────
  const prevCurrencyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevCurrencyRef.current === null) {
      prevCurrencyRef.current = localeCurrency;
      return; // skip initial mount
    }
    if (prevCurrencyRef.current === localeCurrency) return;
    prevCurrencyRef.current = localeCurrency;

    const lastMsg = lastUserMessageRef.current;
    if (!lastMsg) return;

    // Abort any in-flight stream and re-send with new currency
    if (abortRef.current) abortRef.current.abort();
    // Reset state so handleSend doesn't bail out thinking we're still streaming
    abortRef.current = null;
    dispatch({ type: 'SET_SSE_STATE', state: 'IDLE' });
    // Use timeout to let dispatch flush before re-sending
    setTimeout(() => handleSendRef.current?.(lastMsg), 0);
  }, [localeCurrency]);  // eslint-disable-line react-hooks/exhaustive-deps
  const lastUserMessageRef = useRef<string | null>(null);
  const handleRetry = useCallback(() => {
    const lastMsg = lastUserMessageRef.current;
    if (lastMsg && !inputDisabled) {
      dispatch({ type: 'SET_SSE_STATE', state: 'IDLE' });
      handleSend(lastMsg);
    }
  }, [inputDisabled, handleSend]);

  // ─── New conversation ───────────────────────────────
  const handleNewConversation = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    localStorage.removeItem(LS_CONVERSATION_ID);
    localStorage.removeItem(LS_TURN_COUNT);
    localStorage.removeItem(LS_MAX_TURNS);
    localStorage.removeItem(LS_MESSAGES);
    localStorage.removeItem(LS_RESULTS);
    dispatch({ type: 'RESET' });
  }, []);

  // ─── Select conversation from history ───────────────
  const handleSelectConversation = useCallback(async (convId: string) => {
    if (abortRef.current) abortRef.current.abort();
    dispatch({ type: 'RESET' });
    try {
      const recovered = await recoverConversation(convId);
      dispatch({
        type: 'RESTORE_CONVERSATION',
        payload: {
          messages: recovered.messages,
          conversationId: recovered.conversation_id,
          turnInfo: { current: recovered.turn_count, max: recovered.max_turns },
          results: (recovered.results as SSEResultPayload) || null,
        },
      });
      // Refresh conversations list so the selected one shows updated turn count
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch {
      // Conversation expired or not found — start fresh
      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_ERROR', error: 'La conversación expiró o no está disponible.' });
    }
  }, []);

  // ─── Round-trip flight selection ────────────────────
  const [outboundToken, setOutboundToken] = useState<string | null>(null);
  const [outboundOffer, setOutboundOffer] = useState<FlightOffer | null>(null);

  // Fetch return flights when outbound is selected (same flow as /vuelos)
  const returnFlightsQuery = useQuery({
    queryKey: ['ai-return-flights', outboundToken, outboundOffer?.legs?.[0]?.departure?.datetime, state.results?.search_params, localeCurrency] as const,
    queryFn: async () => {
      if (!outboundToken || !state.results?.flights || !outboundOffer) return null;
      const airports = state.results.flights.airports || [];
      const departure = airports.find((a: { role: string }) => a.role === 'departure');
      const arrival = airports.find((a: { role: string }) => a.role === 'arrival');
      // Dates: outbound_date always from the selected flight (never from search_params —
      // AI may hallucinate wrong years). return_date from search_params if available.
      const sp = state.results?.search_params as Record<string, string> | undefined;
      const outboundDate =
        outboundOffer.legs?.[0]?.departure?.datetime?.split(' ')[0] || '';
      const returnDate =
        sp?.return_date ||
        (() => {
          // Fallback: day after outbound arrival, so return flights start after arrival
          const lastLeg = outboundOffer.legs?.[outboundOffer.legs.length - 1];
          const arrival = lastLeg?.arrival?.datetime?.split(' ')[0];
          if (!arrival) return '';
          const d = new Date(arrival);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        })();
      return searchFlights({
        trip_type: 'round_trip',
        departure: sp?.departure || departure?.airport_code || '',
        arrival: sp?.arrival || arrival?.airport_code || '',
        outbound_date: outboundDate,
        return_date: returnDate,
        outbound_selection_token: outboundToken,
        hl: 'es',
        gl: 'es',
        currency: localeCurrency || 'EUR',
        adults: Number(sp?.adults) || 1,
        ...(sp?.travel_class ? { travel_class: sp.travel_class as 'economy' | 'premium_economy' | 'business' | 'first' } : {}),
      });
    },
    enabled: !!outboundToken,
    staleTime: 0,
    // Don't retry on API/provider errors — they won't fix themselves
    // and retrying just burns rate-limit quota (each retry = 1 request).
    retry: (failureCount, error) => {
      if (error instanceof TypeError) return failureCount < 2; // network error → retry up to 2x
      return false; // API/provider error → don't retry
    },
  });

  // Merge return flights into results when they arrive
  const allFlightOffers: FlightOffer[] = useMemo(() => {
    const baseOffers = state.results?.flights
      ? extractFlightOffers(state.results.flights)
      : [];
    const returnOffers = returnFlightsQuery.data
      ? [...(returnFlightsQuery.data.best_flights || []), ...(returnFlightsQuery.data.other_flights || [])]
      : [];
    return outboundToken ? [...baseOffers, ...returnOffers] : baseOffers;
  }, [state.results?.flights, returnFlightsQuery.data, outboundToken]);

  // ─── Booking handlers ──────────────────────────────
  const handleBookFlight = useCallback((offer: FlightOffer) => {
    const firstLeg = offer.legs?.[0];
    const lastLeg = offer.legs?.[offer.legs.length - 1];
    goToCheckout(router, {
      type: 'vuelo',
      item_id: offer.booking_token || offer.departure_token || crypto.randomUUID(),
      item_name: `${firstLeg?.departure?.airport_code || '???'} → ${lastLeg?.arrival?.airport_code || '???'}`,
      check_in: firstLeg?.departure?.datetime?.split(' ')[0] || '',
      check_out: lastLeg?.arrival?.datetime?.split(' ')[0] || '',
      adults: 1,
      departure: firstLeg?.departure?.airport_code || '',
      arrival: lastLeg?.arrival?.airport_code || '',
      outbound_date: firstLeg?.departure?.datetime?.split(' ')[0] || '',
      return_date: lastLeg?.arrival?.datetime?.split(' ')[0] || '',
      airline: firstLeg?.airline || '',
      price_per_unit: offer.price?.amount || 0,
      total_price: offer.price?.amount || 0,
      currency: offer.price?.currency || localeCurrency || 'EUR',
    });
  }, [router, localeCurrency]);

  const handleBookHotel = useCallback((hotel: FrontendHotel) => {
    goToCheckout(router, {
      type: 'hotel',
      item_id: hotel.id,
      item_name: hotel.name,
      adults: 1,
      nights: 1,
      price_per_unit: hotel.price?.amount || 0,
      total_price: hotel.price?.amount || 0,
      currency: hotel.price?.currency || localeCurrency || 'EUR',
    });
  }, [router, localeCurrency]);

  // ─── Derived results for rendering ──────────────────
  const flightOffers: FlightOffer[] = allFlightOffers;

  const hotelProperties: FrontendHotel[] = state.results?.hotels
    ? adaptHotelsFromResponse(state.results.hotels)
    : [];

  const hasResults = flightOffers.length > 0 || hotelProperties.length > 0 || (state.results?.candidates?.length ?? 0) > 0;

  // ─── Scroll anchor for mobile results discovery ─────
  const [showResultsAnchor, setShowResultsAnchor] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Ghost scroll fix: ensure page starts at top on mobile mount
  useEffect(() => {
    if (window.innerWidth < 1024) {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (!hasResults) return;
    let rafId: number;
    const check = () => {
      const el = resultsRef.current;
      if (!el) return;
      const visible = el.getBoundingClientRect().top < window.innerHeight;
      setShowResultsAnchor(!visible);
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasResults]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Dual Panel Grid ── */}
      <div className="grid lg:grid-cols-[380px_1fr] max-lg:grid-cols-1 min-h-[calc(100vh-72px)]">
        {/* Left: Chat Sidebar — sticky on desktop, natural flow on mobile */}
        <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] max-lg:relative max-lg:h-auto">
          <AIChatSidebar
          hasResults={hasResults}
          prefillText={prefillText}
          messages={state.messages}
          isStreaming={isStreaming}
          turnInfo={state.turnInfo}
          turnLimitReached={turnLimitReached}
          isAuthenticated={isAuthenticated}
          inputDisabled={inputDisabled}
          error={state.error}
          isBlocked={isBlocked}
          secondsLeft={secondsLeft}
          onSend={handleSend}
          onNewConversation={handleNewConversation}
          onDismissError={() => dispatch({ type: 'SET_SSE_STATE', state: 'IDLE' })}
          onRetry={handleRetry}
          onFieldSelect={handleFieldSelect}
          onSelectConversation={handleSelectConversation}
          conversationsList={conversationsList}
          chatInputRef={chatInputRef}
        />
        </div>

        {/* Right: Results Panel — scrollable independently */}
        <div className="overflow-y-auto lg:h-[calc(100vh-72px)] max-lg:h-auto">
        <AIResultsPanel
          resultsRef={resultsRef}
          flightOffers={flightOffers}
          hotelProperties={hotelProperties}
          flightsError={state.results?.flights_error}
          hotelsError={state.results?.hotels_error}
          candidates={state.results?.candidates}
          needsClarification={state.results?.needs_clarification}
          clarificationQuestion={state.results?.clarification_question}
          weather={state.weather}
          isLoading={isStreaming}
          isLoadingReturnFlights={returnFlightsQuery.isFetching}
          isEmpty={!isStreaming && !hasResults && !state.results?.candidates}
          hasSearched={state.messages.length > 0}
          onSelectOutbound={(token, offer) => {
            if (!token) {
              // "Cambiar" clicked — clear selection and go back to outbound list
              setOutboundToken(null);
              setOutboundOffer(null);
              return;
            }
            setOutboundToken(token);
            setOutboundOffer(offer);
          }}
          onBookFlight={handleBookFlight}
          onBookHotel={handleBookHotel}
        />
        </div>
      </div>

      {/* ── Mobile Scroll Anchor ── */}
      {showResultsAnchor && hasResults && (
        <button
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#0A0A0A] text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-lg"
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown className="w-4 h-4 inline mr-1" />
          Ver resultados
        </button>
      )}

      {/* ── Medical Alerts Modal ── */}
      {state.medicalAlert && (
        <MedicalAlertsModal
          alert={state.medicalAlert}
          onDismiss={() => dispatch({ type: 'DISMISS_MEDICAL_ALERT' })}
        />
      )}
    </div>
  );
}
