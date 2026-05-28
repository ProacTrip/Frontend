// app/busqueda-ai/components/ChatBubble.tsx
'use client';

import type { ReactNode } from 'react';
import { User, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  children?: ReactNode;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatBubble({ role, text, timestamp, children }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI avatar — monochrome */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        {/* Bubble with asymmetric tail */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm
            ${isUser
              ? 'bg-[#0A0A0A] text-white rounded-br-sm'
              : 'bg-white border border-[#e8e8e8] text-[#0A0A0A] rounded-bl-sm'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
          {children}
        </div>

        {/* Timestamp */}
        <p className={`text-[10px] text-[#6A7282] mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#e8e8e8] flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-[#0A0A0A]" />
        </div>
      )}
    </div>
  );
}
