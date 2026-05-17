// app/home/busqueda-ai/components/ChatInput.tsx
'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder = 'Escribí tu consulta de viaje... (ej: "Vuelos a Madrid en junio")';

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value]);

  // Re-focus after sending
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3 md:p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
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
            flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c54141]/30
            focus:border-[#c54141] disabled:bg-gray-100 disabled:text-gray-400
            transition-colors min-h-[44px] max-h-[120px]
          "
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            bg-[#c54141] text-white hover:bg-[#a03535] transition-colors
            disabled:bg-gray-300 disabled:cursor-not-allowed
          "
          aria-label="Enviar mensaje"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
