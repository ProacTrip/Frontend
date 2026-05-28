'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Timer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatBubble from './ChatBubble';
import AITypingIndicator from './AITypingIndicator';
import FollowUpPrompt from './FollowUpPrompt';
import ChatInput from './ChatInput';
import type { ChatMessage } from '@/app/lib/types/search-ai';

const EXAMPLE_PROMPTS = [
  'Vuelos baratos a Barcelona en julio',
  'Hotel en Madrid centro, 4 estrellas',
  'Vuelo y hotel en Cancún para 2 personas',
  '¿A dónde puedo viajar con 500€?',
];

interface AIChatSidebarProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  turnInfo: { current: number; max: number } | null;
  turnLimitReached: boolean;
  isAuthenticated: boolean;
  inputDisabled: boolean;
  error: string | null;
  isBlocked: boolean;
  secondsLeft: number;
  hasResults: boolean;
  onSend: (text: string) => void;
  onNewConversation: () => void;
  onDismissError: () => void;
  onRetry: () => void;
  onFieldSelect: (field: string) => void;
  onSelectConversation: (id: string) => void;
  conversationsList: Array<{ id: string; preview: string; turn_count: number; updated_at: string }>;
  chatInputRef: React.RefObject<{ focus: () => void } | null>;
  /** Pre-fill the chat input without auto-sending (from homepage cards) */
  prefillText?: string;
}

export default function AIChatSidebar({
  messages,
  isStreaming,
  turnInfo,
  turnLimitReached,
  isAuthenticated,
  inputDisabled,
  error,
  isBlocked,
  secondsLeft,
  hasResults,
  onSend,
  onNewConversation,
  onDismissError,
  onRetry,
  onFieldSelect,
  onSelectConversation,
  conversationsList,
  chatInputRef,
  prefillText,
}: AIChatSidebarProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages — container-scoped to avoid page scroll on mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleExampleClick = useCallback(
    (prompt: string) => {
      if (!inputDisabled) onSend(prompt);
    },
    [inputDisabled, onSend],
  );

  return (
    <aside className={`lg:border-r border-[#e8e8e8] bg-[#F5F5F5] flex flex-col lg:h-[calc(100vh-72px)] lg:sticky lg:top-[72px] max-lg:relative max-lg:z-10 ${!hasResults ? 'max-lg:min-h-[calc(100vh-72px)]' : 'max-lg:h-auto'}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
              Buscar con IA
            </h1>
            <p className="text-[10px] text-[#6A7282]">Asistente conversacional</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {turnInfo && turnInfo.current > 0 && (
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                turnLimitReached
                  ? 'bg-red-50 text-red-600'
                  : 'bg-[#e8e8e8] text-[#6A7282]'
              }`}
              title={!isAuthenticated ? 'Conversación anónima' : undefined}
            >
              {turnInfo.current}/{turnInfo.max}
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={onNewConversation}
              className="text-[10px] text-[#6A7282] hover:text-[#0A0A0A] transition-colors flex items-center gap-1"
              aria-label="Nueva conversación"
            >
              <RefreshCw className="w-3 h-3" />
              Nueva
            </button>
          )}
        </div>
      </div>

      {/* ── Chat Scroll Area ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4"
        role="log"
        aria-live="polite"
        aria-label="Historial de conversación"
      >
        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-full bg-[#e8e8e8] flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-[#0A0A0A]" />
            </div>
            <h2 className="text-base font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A] mb-1.5">
              Buscá viajes con lenguaje natural
            </h2>
            <p className="text-xs text-[#6A7282] mb-5 max-w-[280px]">
              Decime qué necesitás y yo busco vuelos y hoteles por vos.
            </p>

            {/* Example prompts */}
            <div className="flex flex-col gap-2 w-full">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleExampleClick(prompt)}
                  disabled={inputDisabled}
                  className="text-left px-3 py-2.5 rounded-xl border border-[#e8e8e8] bg-white text-xs text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Recent conversations */}
            {conversationsList.length > 0 && (
              <div className="w-full mt-6 text-left">
                <p className="text-[10px] font-semibold text-[#767676] uppercase tracking-wider mb-2">
                  Conversaciones recientes
                </p>
                <div className="flex flex-col gap-1">
                  {conversationsList.slice(0, 5).map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className="text-left px-3 py-2 rounded-lg hover:bg-[#e8e8e8] transition-colors"
                    >
                      <p className="text-xs text-[#0A0A0A] truncate">{conv.preview}</p>
                      <p className="text-[10px] text-[#767676]">
                        {conv.turn_count} turno{conv.turn_count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages with AnimatePresence */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            // Find missing fields for this AI message
            const hasMissingFields =
              msg.role === 'ai' && msg.missingFields && msg.missingFields.length > 0;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                }}
              >
                <ChatBubble
                  role={msg.role}
                  text={msg.text}
                  timestamp={msg.timestamp}
                >
                  {msg.role === 'ai' && (msg.flightsError || msg.hotelsError) && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        {msg.flightsError && `Vuelos: ${msg.flightsError}`}
                        {msg.flightsError && msg.hotelsError && ' · '}
                        {msg.hotelsError && `Hoteles: ${msg.hotelsError}`}
                      </span>
                    </div>
                  )}
                </ChatBubble>

                {hasMissingFields && (
                  <FollowUpPrompt
                    missingFields={msg.missingFields!}
                    onSelect={onFieldSelect}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isStreaming && <AITypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* ── Error Banner ── */}
      {error && !turnLimitReached && !isBlocked && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-red-700 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={onRetry}
              className="text-[10px] text-red-700 hover:text-red-900 underline font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={onDismissError}
              className="text-[10px] text-red-600 hover:text-red-800 underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Rate Limit Banner ── */}
      {isBlocked && secondsLeft > 0 && (
        <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-1.5 text-xs text-amber-800">
          <Timer className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Límite de consultas. Reintentá en{' '}
            {Math.floor(secondsLeft / 60)}:
            {String(secondsLeft % 60).padStart(2, '0')}.
          </span>
        </div>
      )}

      {/* ── Turn Limit Banner ── */}
      {turnLimitReached && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {isAuthenticated
                ? 'Límite de 10 turnos alcanzado.'
                : 'Límite de 5 turnos (anónimo) alcanzado.'}
            </span>
          </div>
          <button
            onClick={onNewConversation}
            className="text-[10px] text-red-600 hover:text-red-800 underline font-medium flex-shrink-0 ml-2"
          >
            Nueva conversación
          </button>
        </div>
      )}

      {/* ── Chat Input ── */}
      <ChatInput
        ref={chatInputRef}
        onSend={onSend}
        disabled={inputDisabled}
        initialValue={prefillText}
        placeholder={
          turnLimitReached
            ? 'Límite de turnos alcanzado — iniciá nueva conversación'
            : isBlocked
              ? 'Esperá antes de enviar otra consulta...'
              : undefined
        }
      />
      {hasResults && <div className="lg:hidden border-b border-[#e8e8e8]" />}
    </aside>
  );
}
