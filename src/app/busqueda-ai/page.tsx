// app/busqueda-ai/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, Timer } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { searchAI } from '@/app/lib/api/search-ai';
import { SearchAIError } from '@/app/lib/types/search-ai';
import type { AIErrorCode } from '@/app/lib/types/search-ai';
import type { AIResponse, ChatMessage } from '@/app/lib/types/search-ai';
import { rateLimitStore } from '@/app/lib/api/rate-limit';

import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import AITypingIndicator from './components/AITypingIndicator';
import SearchResultsEmbed from './components/SearchResultsEmbed';
import FollowUpPrompt from './components/FollowUpPrompt';

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================
const LS_CONVERSATION_ID = 'ai_search_conversation_id';
const LS_TURN_COUNT = 'ai_search_turn_count';
const LS_MAX_TURNS = 'ai_search_max_turns';

// ==========================================
// EXAMPLE PROMPTS (empty state)
// ==========================================
const EXAMPLE_PROMPTS = [
  'Vuelos baratos a Barcelona en julio',
  'Hotel en Madrid centro, 4 estrellas',
  'Vuelo y hotel en Cancún para 2 personas',
  '¿A dónde puedo viajar con 500€?',
];

// ==========================================
// ERROR MESSAGES
// ==========================================
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

export default function AISearchPage() {
  const { isAuthenticated } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_CONVERSATION_ID);
    }
    return null;
  });
  const [turnInfo, setTurnInfo] = useState<{ current: number; max: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem(LS_TURN_COUNT);
      const max = localStorage.getItem(LS_MAX_TURNS);
      if (current && max) return { current: parseInt(current), max: parseInt(max) };
    }
    return null;
  });

  // --- Rate limit state ---
  const [rateLimitBlocked, setRateLimitBlocked] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    const unsubscribe = rateLimitStore.subscribe(() => {
      // Just trigger re-render
    });
    const interval = setInterval(() => {
      setRateLimitBlocked(rateLimitStore.isBlocked);
      setRateLimitCountdown(rateLimitStore.secondsUntilUnblock);
    }, 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing rate limit state from external store
    setRateLimitBlocked(rateLimitStore.isBlocked);
    setRateLimitCountdown(rateLimitStore.secondsUntilUnblock);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // --- Scroll to bottom on new messages ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- AI Search mutation ---
  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      cid,
    }: {
      text: string;
      cid: string | null;
    }): Promise<AIResponse> => {
      return searchAI(text, cid || undefined);
    },
    onMutate: ({ text }) => {
      // Append user message immediately for instant feedback
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setError(null);
    },
    onSuccess: (response: AIResponse) => {
      // Update conversation state
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
      }
      setTurnInfo({
        current: response.turn_count,
        max: response.max_turns,
      });

      // Build AI message
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: response.message || '',
        intent: response.intent,
        timestamp: Date.now(),
      };

      // Attach results based on intent
      if (response.intent === 'flights') {
        aiMsg.flights = response.flights;
      } else if (response.intent === 'hotels') {
        aiMsg.hotels = response.hotels;
      } else if (response.intent === 'both') {
        aiMsg.flights = response.flights;
        aiMsg.hotels = response.hotels;
        aiMsg.flightsError = response.flights_error;
        aiMsg.hotelsError = response.hotels_error;
      } else if (response.intent === 'incomplete' || response.intent === 'ambiguous') {
        aiMsg.missingFields = response.missing_fields;
      }

      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: (err: unknown) => {
      let errorText: string;

      if (err instanceof SearchAIError) {
        errorText = ERROR_MESSAGES[err.code] || err.detail;

        if (err.code === 'CONVERSATION_NOT_FOUND') {
          setConversationId(null);
          setTurnInfo(null);
          setMessages([]);
        }

        if (err.code === 'TURN_LIMIT_EXCEEDED') {
          setTurnInfo((prev) =>
            prev ? { ...prev, current: prev.max } : null,
          );
        }
      } else if (err instanceof Error) {
        errorText = err.message;
      } else {
        errorText = 'Error inesperado al procesar tu consulta.';
      }

      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: errorText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setError(errorText);
    },
  });

  // --- Persist conversation state ---
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(LS_CONVERSATION_ID, conversationId);
    } else {
      localStorage.removeItem(LS_CONVERSATION_ID);
    }
  }, [conversationId]);

  useEffect(() => {
    if (turnInfo) {
      localStorage.setItem(LS_TURN_COUNT, String(turnInfo.current));
      localStorage.setItem(LS_MAX_TURNS, String(turnInfo.max));
    } else {
      localStorage.removeItem(LS_TURN_COUNT);
      localStorage.removeItem(LS_MAX_TURNS);
    }
  }, [turnInfo]);

  // --- Check if input should be disabled ---
  const turnLimitReached = turnInfo !== null && turnInfo.current >= turnInfo.max;
  const inputDisabled = sendMutation.isPending || turnLimitReached || rateLimitBlocked;

  // --- Handle send ---
  const handleSend = useCallback(
    (text: string) => {
      if (inputDisabled) return;
      sendMutation.mutate({ text, cid: conversationId });
    },
    [inputDisabled, conversationId, sendMutation],
  );

  // --- Handle missing field chip click ---
  const handleFieldSelect = useCallback(() => {
    // Focus the input — the user types the value
    // We could pre-fill, but keeping it simple: user sees the field name and types
  }, []);

  // --- New conversation ---
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setTurnInfo(null);
    setError(null);
    localStorage.removeItem(LS_CONVERSATION_ID);
    localStorage.removeItem(LS_TURN_COUNT);
    localStorage.removeItem(LS_MAX_TURNS);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* ==========================================
            HEADER
        ========================================== */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Buscar con IA</h1>
              <p className="text-xs text-gray-500">Asistente conversacional de viajes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Turn counter */}
            {turnInfo && (
              <span
                className={`
                  text-xs px-2.5 py-1 rounded-full font-medium
                  ${turnLimitReached
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                Turno {Math.min(turnInfo.current, turnInfo.max)} de {turnInfo.max}
                {!isAuthenticated && ' (anónimo)'}
              </span>
            )}

            {/* New conversation */}
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="text-xs text-gray-500 hover:text-[#c54141] underline transition-colors"
              >
                Nueva conversación
              </button>
            )}
          </div>
        </header>

        {/* ==========================================
            CHAT AREA
        ========================================== */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
          {/* Empty state */}
          {messages.length === 0 && !sendMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Buscá viajes con lenguaje natural
              </h2>
              <p className="text-sm text-gray-600 mb-6 max-w-md">
                Decime qué necesitás y yo busco vuelos y hoteles por vos.
                Cuanto más detalles me des, mejores resultados.
              </p>

              {/* Example prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={sendMutation.isPending || rateLimitBlocked}
                    className="
                      text-left px-4 py-3 rounded-xl border border-gray-200
                      bg-white text-sm text-gray-700 hover:border-[#c54141]/30
                      hover:bg-purple-50/30 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatBubble
                role={msg.role}
                text={msg.text}
                timestamp={msg.timestamp}
              >
                {/* Embed search results for AI messages */}
                {msg.role === 'ai' && (msg.flights || msg.hotels || msg.flightsError || msg.hotelsError) && (
                  <SearchResultsEmbed
                    flights={msg.flights}
                    hotels={msg.hotels}
                    flightsError={msg.flightsError}
                    hotelsError={msg.hotelsError}
                  />
                )}
              </ChatBubble>

              {/* Follow-up prompt chips for incomplete/ambiguous */}
              {msg.role === 'ai' && msg.missingFields && msg.missingFields.length > 0 && (
                <FollowUpPrompt
                  missingFields={msg.missingFields}
                  onSelect={handleFieldSelect}
                />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {sendMutation.isPending && <AITypingIndicator />}

          {/* Scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* ==========================================
            ERRORS & RATE LIMIT BANNERS
        ========================================== */}
        {/* Turn limit reached banner */}
        {turnLimitReached && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {isAuthenticated
                  ? 'Límite de 10 turnos alcanzado.'
                  : 'Límite de 5 turnos (anónimo) alcanzado.'}
              </span>
            </div>
            <button
              onClick={handleNewConversation}
              className="text-xs text-red-600 hover:text-red-800 underline font-medium"
            >
              Nueva conversación
            </button>
          </div>
        )}

        {/* Rate limit blocked banner */}
        {rateLimitBlocked && rateLimitCountdown > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-sm text-amber-800">
            <Timer className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>
              Límite de consultas alcanzado. Reintentá en{' '}
              {Math.floor(rateLimitCountdown / 60)}:
              {String(rateLimitCountdown % 60).padStart(2, '0')}.
            </span>
          </div>
        )}

        {/* Generic error banner */}
        {error && !turnLimitReached && !rateLimitBlocked && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 underline ml-2 flex-shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ==========================================
            INPUT BAR
        ========================================== */}
        <ChatInput
          onSend={handleSend}
          disabled={inputDisabled}
          placeholder={
            turnLimitReached
              ? 'Límite de turnos alcanzado — iniciá nueva conversación'
              : rateLimitBlocked
                ? 'Esperá antes de enviar otra consulta...'
                : undefined
          }
        />
      </div>
    </div>
  );
}
