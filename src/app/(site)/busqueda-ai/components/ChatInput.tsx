// app/busqueda-ai/components/ChatInput.tsx
'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  /** Pre-fill the textarea without auto-sending. Used by homepage → /busqueda-ai prompts. */
  initialValue?: string;
}

export interface ChatInputHandle {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput({ onSend, disabled, placeholder, initialValue }, ref) {
    const [value, setValue] = useState(initialValue || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync initialValue when it changes externally
    useEffect(() => {
      if (initialValue) setValue(initialValue);
    }, [initialValue]);

    const defaultPlaceholder =
      'Escribí tu consulta de viaje... (ej: "Vuelos a Madrid en junio")';

    // Expose focus() via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    // Auto-resize textarea
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }, [value]);

    // Re-focus after sending (preventScroll avoids auto-scroll on mount)
    useEffect(() => {
      if (!disabled && textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
    }, [disabled]);

    function handleSubmit() {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }

    return (
      <div className="border-t border-[#e8e8e8] bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            disabled={disabled}
            rows={1}
            maxLength={2000}
            className="
              flex-1 resize-none rounded-xl border border-[#e8e8e8] px-4 py-3 text-sm
              placeholder:text-[#767676] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/20
              focus:border-[#0A0A0A] disabled:bg-[#F5F5F5] disabled:text-[#767676]
              transition-colors min-h-[44px] max-h-[120px]
            "
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="
              w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
              bg-[#0A0A0A] text-white hover:bg-[#333] transition-colors
              disabled:bg-[#e8e8e8] disabled:cursor-not-allowed
            "
            aria-label="Enviar mensaje"
          >
            {disabled && !value.trim() ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    );
  },
);

export default ChatInput;
